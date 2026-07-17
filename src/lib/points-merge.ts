/**
 * Helpers for reconciling dual points sources (`users` + `users_points`).
 * Prefer the higher value so a stale/zero `users_points` row does not hide
 * legacy totals still stored on `users`.
 */

export function coalesceNumber(...values: Array<number | null | undefined>): number {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

export function maxPoints(...values: Array<number | null | undefined>): number {
  let max = 0
  for (const value of values) {
    if (value === null || value === undefined) continue
    const n = Number(value)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max
}

export function mergePointsSources(
  pointsRow?: {
    total_points?: number | null
    weekly_points?: number | null
    monthly_points?: number | null
    today_points?: number | null
    badges?: number | null
    level?: number | string | null
  } | null,
  userRow?: {
    points?: number | null
    weeklyPoints?: number | null
    weeklypoints?: number | null
    monthlyPoints?: number | null
    monthlypoints?: number | null
    badges?: number | null
    level?: number | string | null
  } | null
) {
  const total = maxPoints(pointsRow?.total_points, userRow?.points)
  const weekly = maxPoints(
    pointsRow?.weekly_points,
    userRow?.weeklyPoints,
    userRow?.weeklypoints
  )
  const monthly = maxPoints(
    pointsRow?.monthly_points,
    userRow?.monthlyPoints,
    userRow?.monthlypoints
  )
  const today = coalesceNumber(pointsRow?.today_points)
  const badges = maxPoints(pointsRow?.badges, userRow?.badges)

  const pointsLevel = pointsRow?.level
  const userLevel = userRow?.level
  const level =
    typeof pointsLevel === 'number'
      ? `Level ${pointsLevel}`
      : typeof pointsLevel === 'string' && pointsLevel.trim()
        ? pointsLevel
        : typeof userLevel === 'string' && userLevel.trim()
          ? userLevel
          : typeof userLevel === 'number'
            ? `Level ${userLevel}`
            : 'Beginner'

  return { total, weekly, monthly, today, badges, level }
}
