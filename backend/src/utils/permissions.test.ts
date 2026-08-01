import { describe, expect, it } from 'vitest';
import {
  canDeleteMilk,
  canDeleteTransactions,
  canViewFinance,
  canWriteCattle,
  canWriteEvents,
  canWriteFinance,
  canWriteMilk,
  resolveFarmIdForUser,
} from './permissions.js';

const role = (r: string) => ({ role: r as never });

describe('permissions', () => {
  it('lets workers write milk but not cattle or finance', () => {
    const worker = role('WORKER');
    expect(canWriteMilk(worker)).toBe(true);
    expect(canDeleteMilk(worker)).toBe(false);
    expect(canWriteCattle(worker)).toBe(false);
    expect(canWriteFinance(worker)).toBe(false);
    expect(canViewFinance(worker)).toBe(false);
  });

  it('lets veterinarians write events but not milk', () => {
    const vet = role('VETERINARIAN');
    expect(canWriteEvents(vet)).toBe(true);
    expect(canWriteMilk(vet)).toBe(false);
    expect(canWriteCattle(vet)).toBe(false);
  });

  it('lets managers view finance but not write or delete transactions', () => {
    const manager = role('FARM_MANAGER');
    expect(canViewFinance(manager)).toBe(true);
    expect(canWriteFinance(manager)).toBe(false);
    expect(canDeleteTransactions(manager)).toBe(false);
    expect(canWriteCattle(manager)).toBe(true);
  });

  it('lets owners manage finance deletes', () => {
    const owner = role('FARM_OWNER');
    expect(canWriteFinance(owner)).toBe(true);
    expect(canDeleteTransactions(owner)).toBe(true);
  });

  it('resolves farm id for members and allows super admin override', () => {
    expect(resolveFarmIdForUser({ role: 'FARM_OWNER' as never, farmId: 'farm-a' }, 'farm-b')).toBe('farm-a');
    expect(resolveFarmIdForUser({ role: 'SUPER_ADMIN' as never, farmId: 'farm-a' }, 'farm-b')).toBe('farm-b');
    expect(resolveFarmIdForUser({ role: 'SUPER_ADMIN' as never, farmId: null }, null)).toBeUndefined();
  });
});
