import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import type { AuthUser } from '../utils/permissions.js';
import { canManageUsers, isSuperAdmin } from '../utils/permissions.js';
import { seedFarmCategories } from './farmService.js';
import { ensureMembership } from './farmMembershipService.js';

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  farmId: string | null;
  isActive: boolean;
  createdAt: Date;
};

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  farmId: true,
  isActive: true,
  createdAt: true,
} as const;

function toPublicUser(user: PublicUser): PublicUser {
  return user;
}

export async function registerFarmOwner(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  farmName: string;
  district: string;
  sector: string;
}): Promise<PublicUser & { passwordHash?: never }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const [firstName, ...lastNameParts] = input.fullName.trim().split(/\s+/);
  const lastName = lastNameParts.join(' ') || firstName;
  const passwordHash = await bcrypt.hash(input.password, 12);
  const farmName = input.farmName.trim();
  const district = input.district.trim();
  const sector = input.sector.trim();
  const ownerPhone = input.phone.trim();
  const location = `${district}, ${sector}`;

  const result = await prisma.$transaction(async (tx) => {
    const farm = await tx.farm.create({
      data: {
        name: farmName,
        ownerName: `${firstName} ${lastName}`.trim(),
        ownerPhone,
        location,
        district,
        sector,
        currency: 'RWF',
        weightUnit: 'kg',
        milkUnit: 'L',
        returnHeatDays: 21,
        returnHeatTime: '08:00',
        milkPricePerLiter: 0,
      },
    });

    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        phone: ownerPhone,
        passwordHash,
        role: 'FARM_OWNER',
        farmId: farm.id,
        isActive: true,
      },
      select: publicUserSelect,
    });

    await tx.farmMembership.create({
      data: {
        userId: user.id,
        farmId: farm.id,
        role: 'FARM_OWNER',
      },
    });

    return { farm, user };
  });

  await seedFarmCategories(result.farm.id);
  return toPublicUser(result.user);
}

export async function listUsers(actor: AuthUser, farmIdFilter?: string): Promise<PublicUser[]> {
  if (!canManageUsers(actor)) {
    throw new ApiError(403, 'You do not have permission to manage users.');
  }

  if (isSuperAdmin(actor)) {
    return prisma.user.findMany({
      where: farmIdFilter ? { farmId: farmIdFilter } : {},
      orderBy: { createdAt: 'desc' },
      select: publicUserSelect,
    });
  }

  if (!actor.farmId) {
    throw new ApiError(403, 'Your account is not linked to a farm.');
  }

  return prisma.user.findMany({
    where: {
      OR: [{ farmId: actor.farmId }, { memberships: { some: { farmId: actor.farmId } } }],
    },
    orderBy: { createdAt: 'desc' },
    select: publicUserSelect,
  });
}

const assignableByOwner: UserRole[] = ['FARM_MANAGER', 'VETERINARIAN', 'WORKER'];

export async function createFarmUser(
  actor: AuthUser,
  input: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
    farmId?: string;
  },
): Promise<PublicUser> {
  if (!canManageUsers(actor)) {
    throw new ApiError(403, 'You do not have permission to manage users.');
  }

  let farmId: string;
  let role = input.role;

  if (isSuperAdmin(actor)) {
    farmId = input.farmId?.trim() || '';
    if (role === 'SUPER_ADMIN') {
      farmId = '';
    } else if (!farmId) {
      throw new ApiError(400, 'farmId is required for non–super-admin users.');
    }
  } else {
    if (!actor.farmId) {
      throw new ApiError(403, 'Your account is not linked to a farm.');
    }
    farmId = actor.farmId;
    if (!assignableByOwner.includes(role)) {
      throw new ApiError(400, 'Farm owners can only create Farm Manager, Veterinarian, or Worker accounts.');
    }
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  if ((role === 'FARM_MANAGER' || role === 'FARM_OWNER') && !(input.phone && input.phone.trim().length >= 7)) {
    throw new ApiError(400, 'Phone number is required for farm owner and farm manager.');
  }

  const [firstName, ...lastNameParts] = input.fullName.trim().split(/\s+/);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName: lastNameParts.join(' ') || firstName,
      email: normalizedEmail,
      phone: input.phone?.trim() || null,
      passwordHash,
      role,
      farmId: role === 'SUPER_ADMIN' ? null : farmId,
      isActive: true,
    },
    select: publicUserSelect,
  });

  if (role !== 'SUPER_ADMIN' && farmId) {
    await ensureMembership(user.id, farmId, role);
  }

  return toPublicUser(user);
}

export async function updateFarmUser(
  actor: AuthUser,
  userId: string,
  input: {
    role?: UserRole;
    isActive?: boolean;
    phone?: string;
    fullName?: string;
    password?: string;
  },
): Promise<PublicUser> {
  if (!canManageUsers(actor)) {
    throw new ApiError(403, 'You do not have permission to manage users.');
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new ApiError(404, 'User not found.');
  }

  if (!isSuperAdmin(actor)) {
    if (!actor.farmId) {
      throw new ApiError(403, 'Your account is not linked to a farm.');
    }
    const onFarm =
      existing.farmId === actor.farmId ||
      (await prisma.farmMembership.findUnique({
        where: { userId_farmId: { userId: existing.id, farmId: actor.farmId } },
      }));
    if (!onFarm) {
      throw new ApiError(404, 'User not found.');
    }
    if (existing.role === 'FARM_OWNER' || existing.role === 'SUPER_ADMIN') {
      throw new ApiError(403, 'You cannot modify this account.');
    }
    if (input.role && !assignableByOwner.includes(input.role)) {
      throw new ApiError(400, 'Invalid role for farm staff.');
    }
  }

  if (existing.id === actor.id && input.isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account.');
  }

  const data: {
    role?: UserRole;
    isActive?: boolean;
    phone?: string | null;
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
  } = {};

  if (input.role !== undefined) {
    data.role = input.role;
  }
  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }
  if (input.phone !== undefined) {
    data.phone = input.phone.trim() || null;
  }
  if (input.fullName !== undefined) {
    const [firstName, ...lastNameParts] = input.fullName.trim().split(/\s+/);
    data.firstName = firstName;
    data.lastName = lastNameParts.join(' ') || firstName;
  }
  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 12);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: publicUserSelect,
  });

  const membershipFarmId = user.farmId || actor.farmId;
  if (input.role && membershipFarmId && user.role !== 'SUPER_ADMIN') {
    await ensureMembership(user.id, membershipFarmId, input.role);
  }

  return toPublicUser(user);
}
