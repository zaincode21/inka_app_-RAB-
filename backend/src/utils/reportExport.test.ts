import { describe, expect, it } from 'vitest';
import { ApiError } from './apiError.js';
import { csvEscape, isoDate, parseDateRange, toCsv, toCsvWithFarmHeader } from './reportExport.js';

describe('reportExport', () => {
  it('parses inclusive date ranges into a half-open window', () => {
    const { from, toExclusive, toInclusive } = parseDateRange('2026-08-01', '2026-08-03', new Date('2026-08-15'));
    expect(isoDate(from)).toBe('2026-08-01');
    expect(isoDate(toInclusive)).toBe('2026-08-03');
    expect(isoDate(toExclusive)).toBe('2026-08-04');
  });

  it('rejects inverted ranges', () => {
    expect(() => parseDateRange('2026-08-10', '2026-08-01')).toThrow(ApiError);
  });

  it('builds CSV with escaped values and a trailing newline', () => {
    const csv = toCsv(['tag', 'notes'], [['C-1', 'ok'], ['C-2', 'say "hi", please']]);
    expect(csv.startsWith('tag,notes\n')).toBe(true);
    expect(csv).toContain('C-1,ok\n');
    expect(csv).toContain('"say ""hi"", please"');
    expect(csv.endsWith('\n')).toBe(true);
    expect(csvEscape('a,b')).toBe('"a,b"');
  });

  it('builds designed CSV with farm information preamble', () => {
    const csv = toCsvWithFarmHeader(
      {
        name: 'Green Hills',
        ownerName: 'Aline',
        ownerPhone: '0788000000',
        location: 'Musanze',
        district: 'Musanze',
        sector: 'Muhoza',
        currency: 'RWF',
      },
      {
        reportTitle: 'Milk Report',
        periodFrom: '2026-08-01',
        periodTo: '2026-08-03',
        generatedAt: new Date('2026-08-03T10:00:00.000Z'),
        generatedBy: 'Aline Owner',
      },
      ['date', 'total'],
      [['2026-08-01', 12]],
    );
    expect(csv).toContain('Farm,Green Hills\n');
    expect(csv).toContain('Owner,Aline\n');
    expect(csv).toContain('District,Musanze\n');
    expect(csv).toContain('Report,Milk Report\n');
    expect(csv).toContain('Period From,2026-08-01\n');
    expect(csv).toContain('\ndate,total\n2026-08-01,12\n');
  });
});
