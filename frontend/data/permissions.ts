import type { AuthUser } from './authApi';

type RoleUser = Pick<AuthUser, 'role'> | null | undefined;

export function isSuperAdmin(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN';
}

export function isFarmOwner(user?: RoleUser): boolean {
  return user?.role === 'FARM_OWNER' || user?.role === 'SUPER_ADMIN';
}

export function canManageUsers(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FARM_OWNER';
}

export function canEditSystemConfig(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FARM_OWNER';
}

export function canManageFarmSetup(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FARM_OWNER';
}

export function canWriteCattle(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FARM_OWNER' || user?.role === 'FARM_MANAGER';
}

export function canDeleteCattle(user?: RoleUser): boolean {
  return canWriteCattle(user);
}

export function canWriteMilk(user?: RoleUser): boolean {
  return (
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'FARM_OWNER' ||
    user?.role === 'FARM_MANAGER' ||
    user?.role === 'WORKER'
  );
}

export function canDeleteMilk(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FARM_OWNER' || user?.role === 'FARM_MANAGER';
}

export function canWriteEvents(user?: RoleUser): boolean {
  return (
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'FARM_OWNER' ||
    user?.role === 'FARM_MANAGER' ||
    user?.role === 'VETERINARIAN'
  );
}

export function canDeleteEvents(user?: RoleUser): boolean {
  return canWriteEvents(user);
}

export function canWriteFinance(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FARM_OWNER';
}

export function canViewFinance(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FARM_OWNER' || user?.role === 'FARM_MANAGER';
}

export function canDeleteTransactions(user?: RoleUser): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FARM_OWNER';
}

/** Any role that can soft-delete at least one core resource may open Archived Records. */
export function canViewArchivedRecords(user?: RoleUser): boolean {
  return canDeleteCattle(user) || canDeleteMilk(user) || canDeleteEvents(user) || canDeleteTransactions(user);
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'FARM_OWNER':
      return 'Farm Owner';
    case 'FARM_MANAGER':
      return 'Farm Manager';
    case 'VETERINARIAN':
      return 'Veterinarian';
    case 'WORKER':
      return 'Worker';
    default:
      return role;
  }
}
