/** [month 1-12, day] of Easter Sunday (anonymous Gregorian algorithm). */
export function easterSunday(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Czech public holidays (státní svátky + ostatní svátky) as YYYY-MM-DD. */
export function czechHolidays(year: number): string[] {
  const [em, ed] = easterSunday(year);
  const easter = Date.UTC(year, em - 1, ed);
  const day = 86400000;
  const fixed = ["01-01", "05-01", "05-08", "07-05", "07-06", "09-28", "10-28", "11-17", "12-24", "12-25", "12-26"];
  return [...fixed.map((md) => `${year}-${md}`), iso(new Date(easter - 2 * day)), iso(new Date(easter + day))].sort();
}

/** Mon-Fri days in a month that are not public holidays. Month is 1-12. */
export function workingDays(year: number, month: number): number {
  const holidays = new Set(czechHolidays(year));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    const dow = date.getUTCDay();
    if (dow !== 0 && dow !== 6 && !holidays.has(iso(date))) count++;
  }
  return count;
}

export const HOURS_PER_DAY = 8;
