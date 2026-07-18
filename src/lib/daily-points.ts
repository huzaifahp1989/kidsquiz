type DailyPointsRow = {
  today_points?: unknown;
  last_earned_date?: string | null;
} | null | undefined;

export function getUtcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getEffectiveTodayPoints(
  row: DailyPointsRow,
  now: Date = new Date()
): number {
  const lastEarnedDate = row?.last_earned_date?.slice(0, 10);
  if (lastEarnedDate !== getUtcDateKey(now)) {
    return 0;
  }

  const todayPoints = Number(row?.today_points ?? 0);
  return Number.isFinite(todayPoints) ? Math.max(0, todayPoints) : 0;
}
