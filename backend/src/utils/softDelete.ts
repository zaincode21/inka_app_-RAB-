/** Default list/query filter: only non-archived rows. */
export const notDeleted = { deletedAt: null } as const;

export function isDeleted(record: Record<string, unknown>): boolean {
  return record.deletedAt != null;
}

export function softDeleteData(userId: string) {
  return {
    deletedAt: new Date(),
    deletedByUserId: userId,
  };
}
