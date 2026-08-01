import { ApiError } from './apiError.js';

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateQuery(value: unknown, fallback: Date): Date {
  if (typeof value !== 'string' || !value.trim()) {
    return startOfDay(fallback);
  }
  const parsed = new Date(`${value.trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, 'Invalid date. Use YYYY-MM-DD.');
  }
  return startOfDay(parsed);
}

/** Inclusive calendar `from`/`to` → half-open `[from, toExclusive)`. */
export function parseDateRange(fromRaw: unknown, toRaw: unknown, now = new Date()) {
  const today = startOfDay(now);
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const from = parseDateQuery(fromRaw, defaultFrom);
  const toInclusive = parseDateQuery(toRaw, today);
  if (toInclusive < from) {
    throw new ApiError(400, '`to` must be on or after `from`.');
  }
  const toExclusive = addDays(toInclusive, 1);
  return { from, toExclusive, toInclusive };
}

export function csvEscape(value: string | number) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}
