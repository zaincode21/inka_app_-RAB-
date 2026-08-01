import type { UserRole } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  farmId: string | null;
  isActive: boolean;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export function isSuperAdmin(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN';
}

export function isFarmOwner(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'FARM_OWNER' || user.role === 'SUPER_ADMIN';
}

export function canManageUsers(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'FARM_OWNER';
}

export function canEditSystemConfig(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'FARM_OWNER';
}

export function canManageFarmSetup(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'FARM_OWNER';
}

/** Cattle create/update (not Worker or Vet). */
export function canWriteCattle(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'FARM_OWNER' || user.role === 'FARM_MANAGER';
}

export function canDeleteCattle(user: Pick<AuthUser, 'role'>): boolean {
  return canWriteCattle(user);
}

/** Milk create/update — Owner, Manager, Worker. */
export function canWriteMilk(user: Pick<AuthUser, 'role'>): boolean {
  return (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'FARM_OWNER' ||
    user.role === 'FARM_MANAGER' ||
    user.role === 'WORKER'
  );
}

export function canDeleteMilk(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'FARM_OWNER' || user.role === 'FARM_MANAGER';
}

/** Events create/update/delete — Owner, Manager, Vet. */
export function canWriteEvents(user: Pick<AuthUser, 'role'>): boolean {
  return (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'FARM_OWNER' ||
    user.role === 'FARM_MANAGER' ||
    user.role === 'VETERINARIAN'
  );
}

export function canDeleteEvents(user: Pick<AuthUser, 'role'>): boolean {
  return canWriteEvents(user);
}

/** Manual income/expense create/update — Owner / Super Admin only. Manager can view. */
export function canWriteFinance(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'FARM_OWNER';
}

export function canViewFinance(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'FARM_OWNER' || user.role === 'FARM_MANAGER';
}

export function canDeleteTransactions(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'FARM_OWNER';
}

/** Farm id for data access: Super Admin may pass override; others use their farm. */
export function resolveFarmIdForUser(
  user: Pick<AuthUser, 'role' | 'farmId'>,
  requestedFarmId?: string | null,
): string | undefined {
  if (isSuperAdmin(user)) {
    return requestedFarmId?.trim() || undefined;
  }
  return user.farmId ?? undefined;
}

export function requireUserFarmId(user: Pick<AuthUser, 'role' | 'farmId'>): string {
  if (isSuperAdmin(user)) {
    if (!user.farmId) {
      throw Object.assign(new Error('farmId is required for this action.'), { statusCode: 400 });
    }
    return user.farmId;
  }
  if (!user.farmId) {
    throw Object.assign(new Error('Your account is not linked to a farm.'), { statusCode: 403 });
  }
  return user.farmId;
}
