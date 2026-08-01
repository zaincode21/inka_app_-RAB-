import { describe, expect, it } from 'vitest';
import { isDeleted, notDeleted, onlyDeleted, restoreData, softDeleteData } from './softDelete.js';

describe('softDelete helpers', () => {
  it('exposes list filters for active and archived rows', () => {
    expect(notDeleted).toEqual({ deletedAt: null });
    expect(onlyDeleted).toEqual({ deletedAt: { not: null } });
  });

  it('detects archived records', () => {
    expect(isDeleted({ deletedAt: null })).toBe(false);
    expect(isDeleted({ deletedAt: new Date('2026-08-01') })).toBe(true);
  });

  it('builds soft-delete and restore payloads', () => {
    const archived = softDeleteData('user-1');
    expect(archived.deletedByUserId).toBe('user-1');
    expect(archived.deletedAt).toBeInstanceOf(Date);
    expect(restoreData()).toEqual({ deletedAt: null, deletedByUserId: null });
  });
});
