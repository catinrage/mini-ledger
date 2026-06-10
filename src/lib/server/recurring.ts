import { prisma } from '$lib/prisma';
import { RecurrenceFrequency, type RecurringTransactionRule } from '@prisma/client';

const DEFAULT_GENERATION_MONTHS = 12;

type RuleLike = Pick<
  RecurringTransactionRule,
  | 'id'
  | 'party'
  | 'type'
  | 'amount'
  | 'description'
  | 'frequency'
  | 'interval'
  | 'startDate'
  | 'endDate'
  | 'active'
>;

type JalaliDate = {
  year: number;
  month: number;
  day: number;
};

function div(a: number, b: number) {
  return ~~(a / b);
}

function gregorianToJalali(date: Date): JalaliDate {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const gDMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  let jy = gy <= 1600 ? 0 : 979;
  const gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy3 = gm > 2 ? gy2 + 1 : gy2;
  let days =
    365 * gy2 +
    div(gy3 + 3, 4) -
    div(gy3 + 99, 100) +
    div(gy3 + 399, 400) -
    80 +
    gd +
    gDMonth[gm - 1];

  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;

  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

  return { year: jy, month: jm, day: jd };
}

function jalaliToGregorian({ year, month, day }: JalaliDate) {
  let gy = year <= 979 ? 621 : 1600;
  let jy = year <= 979 ? year : year - 979;
  let days =
    365 * jy +
    div(jy, 33) * 8 +
    div((jy % 33) + 3, 4) +
    78 +
    day +
    (month < 7 ? (month - 1) * 31 : (month - 7) * 30 + 186);

  gy += 400 * div(days, 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * div(days, 1461);
  days %= 1461;

  if (days > 365) {
    gy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  const gd = days + 1;
  const salA = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  let dayOfMonth = gd;

  for (gm = 1; gm <= 12 && dayOfMonth > salA[gm]; gm++) {
    dayOfMonth -= salA[gm];
  }

  return new Date(gy, gm - 1, dayOfMonth);
}

function isJalaliLeapYear(year: number) {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324,
    2394, 2456, 3178,
  ];
  let jp = breaks[0];
  let jump = 0;
  let n = 0;

  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (year < jm) break;
    jp = jm;
  }

  n = year - jp;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = ((((n + 1) % 33) - 1) % 4 + 4) % 4;
  if (leap === -1) leap = 4;
  return leap === 0;
}

function daysInJalaliMonth(year: number, month: number) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return normalizeDate(next);
}

function addJalaliMonths(date: Date, months: number) {
  const jalali = gregorianToJalali(date);
  const monthIndex = jalali.month - 1 + months;
  const year = jalali.year + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12 + 1;
  const day = Math.min(jalali.day, daysInJalaliMonth(year, month));
  return normalizeDate(jalaliToGregorian({ year, month, day }));
}

function nextOccurrence(date: Date, frequency: RecurrenceFrequency, interval: number) {
  if (frequency === RecurrenceFrequency.DAILY) return addDays(date, interval);
  if (frequency === RecurrenceFrequency.WEEKLY) return addDays(date, interval * 7);
  if (frequency === RecurrenceFrequency.MONTHLY) return addJalaliMonths(date, interval);
  return addJalaliMonths(date, interval * 12);
}

function generationThroughDate(rule: RuleLike, fromDate = new Date()) {
  const horizon = addJalaliMonths(normalizeDate(fromDate), DEFAULT_GENERATION_MONTHS);

  if (!rule.endDate) return horizon;

  const endDate = normalizeDate(rule.endDate);
  return endDate < horizon ? endDate : horizon;
}

export async function generateRecurringTransactions(rule: RuleLike, throughDate = generationThroughDate(rule)) {
  if (!rule.active || rule.interval < 1) return 0;

  const startDate = normalizeDate(rule.startDate);
  const endDate = rule.endDate ? normalizeDate(rule.endDate) : undefined;
  const through = normalizeDate(throughDate);
  const transactions = [];
  let occurrenceDate = startDate;
  let guard = 0;

  while (occurrenceDate <= through && (!endDate || occurrenceDate <= endDate) && guard < 500) {
    transactions.push({
      party: rule.party,
      type: rule.type,
      amount: rule.amount,
      description: rule.description ?? undefined,
      date: occurrenceDate,
      recurringRuleId: rule.id,
      recurringOccurrenceDate: occurrenceDate,
    });

    occurrenceDate = nextOccurrence(occurrenceDate, rule.frequency, rule.interval);
    guard += 1;
  }

  if (transactions.length === 0) return 0;

  const result = await prisma.transaction.createMany({
    data: transactions,
    skipDuplicates: true,
  });

  return result.count;
}

export async function generateAllRecurringTransactions() {
  const rules = await prisma.recurringTransactionRule.findMany({
    where: { active: true },
  });

  let count = 0;

  for (const rule of rules) {
    count += await generateRecurringTransactions(rule);
  }

  return count;
}

