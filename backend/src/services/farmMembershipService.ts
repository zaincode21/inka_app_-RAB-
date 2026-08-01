import type { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { isSuperAdmin, type AuthUser } from '../utils/permissions.js';

export type FarmMembershipSummary = {
  farmId: string;
  name: string;
  location: string;
  district: string;
  sector: string;
  role: UserRole;
  isActive: boolean;
};

export async function ensureMembership(
  userId: string,
  farmId: string,
  role: UserRole,
): Promise<void> {
  await prisma.farmMembership.upsert({
    where: {
      userId_farmId: { userId, farmId },
    },
    update: { role },
    create: { userId, farmId, role },
  });
}

export async function listFarmsForUser(auth: AuthUser): Promise<FarmMembershipSummary[]> {
  if (isSuperAdmin(auth)) {
    const farms = await prisma.farm.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        location: true,
        district: true,
        sector: true,
      },
    });
    return farms.map((farm) => ({
      farmId: farm.id,
      name: farm.name,
      location: farm.location,
      district: farm.district,
      sector: farm.sector,
      role: 'SUPER_ADMIN' as UserRole,
      isActive: auth.farmId === farm.id,
    }));
  }

  const memberships = await prisma.farmMembership.findMany({
    where: { userId: auth.id },
    orderBy: { farm: { name: 'asc' } },
    include: {
      farm: {
        select: {
          id: true,
          name: true,
          location: true,
          district: true,
          sector: true,
        },
      },
    },
  });

  return memberships.map((row) => ({
    farmId: row.farm.id,
    name: row.farm.name,
    location: row.farm.location,
    district: row.farm.district,
    sector: row.farm.sector,
    role: row.role,
    isActive: auth.farmId === row.farm.id,
  }));
}

export async function switchActiveFarm(auth: AuthUser, farmId: string) {
  const targetFarmId = farmId.trim();
  if (!targetFarmId) {
    throw new ApiError(400, 'farmId is required.');
  }

  const farm = await prisma.farm.findUnique({
    where: { id: targetFarmId },
    select: { id: true, name: true, location: true, district: true, sector: true },
  });
  if (!farm) {
    throw new ApiError(404, 'Farm not found.');
  }

  let nextRole: UserRole = auth.role;

  if (isSuperAdmin(auth)) {
    nextRole = 'SUPER_ADMIN';
  } else {
    const membership = await prisma.farmMembership.findUnique({
      where: {
        userId_farmId: { userId: auth.id, farmId: targetFarmId },
      },
    });
    if (!membership) {
      throw new ApiError(403, 'You do not have access to this farm.');
    }
    nextRole = membership.role;
  }

  const user = await prisma.user.update({
    where: { id: auth.id },
    data: {
      farmId: farm.id,
      // Keep SUPER_ADMIN global; otherwise mirror membership role for the active farm.
      ...(isSuperAdmin(auth) ? {} : { role: nextRole }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      farmId: true,
    },
  });

  return {
    user,
    farm: {
      id: farm.id,
      name: farm.name,
      location: farm.location,
      district: farm.district,
      sector: farm.sector,
    },
  };
}

export async function getFarmName(farmId: string | null | undefined): Promise<string | null> {
  if (!farmId) {
    return null;
  }
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { name: true },
  });
  return farm?.name ?? null;
}
