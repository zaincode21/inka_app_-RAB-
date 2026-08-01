/** Default list/query filter: only non-archived rows. */
export const notDeleted = { deletedAt: null } as const;

/** List only soft-archived rows (`?archived=true`). */
export const onlyDeleted = { deletedAt: { not: null } } as const;

export function isDeleted(record: Record<string, unknown>): boolean {
  return record.deletedAt != null;
}

export function softDeleteData(userId: string) {
  return {
    deletedAt: new Date(),
    deletedByUserId: userId,
  };
}

export function restoreData() {
  return {
    deletedAt: null,
    deletedByUserId: null,
  };
}
