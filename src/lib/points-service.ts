/**
 * Points Service
 * Handles all points-related operations with the Supabase backend
 */

import { supabase } from './supabase'

async function syncUserSnapshot(userId: string, totals: {
  total_points?: number
  weekly_points?: number
  monthly_points?: number
}) {
  const total_points = totals.total_points ?? null
  const weekly_points = totals.weekly_points ?? null
  const monthly_points = totals.monthly_points ?? null

  if (total_points === null && weekly_points === null && monthly_points === null) {
    return
  }

  const updates: Record<string, number> = {}
  if (total_points !== null) updates.points = total_points
  if (weekly_points !== null) updates.weeklypoints = weekly_points
  if (monthly_points !== null) updates.monthlypoints = monthly_points

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('uid', userId)

  if (error) {
    console.warn('[syncUserSnapshot] failed', error.message)
  }
}

export interface AwardPointsResponse {
  success: boolean
  message: string
  points_awarded: number
  total_points?: number
  today_points?: number
  weekly_points?: number
  monthly_points?: number
  daily_limit?: number
}

export interface UserPoints {
  user_id: string
  total_points: number
  weekly_points: number
  monthly_points: number
  today_points: number
  last_earned_date: string
}

/**
 * Award points to the current user
 * Respects 100 points per day limit
 * Increments: total_points, weekly_points, monthly_points, today_points
 *
 * @param points - Number of points to award (must be > 0)
 * @returns Response with success status and updated points
 */
export async function awardPoints(
  points: number
): Promise<AwardPointsResponse> {
  try {
    // Validate user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'User not authenticated',
        points_awarded: 0,
      }
    }

    // Validate points
    if (!points || points <= 0) {
      return {
        success: false,
        message: 'Points must be greater than 0',
        points_awarded: 0,
      }
    }

    // Call the RPC function
    const { data, error } = await supabase.rpc('award_points', {
      p_points: points,
    })

    if (!error && data) {
      await syncUserSnapshot(user.id, {
        total_points: data.total_points,
        weekly_points: data.weekly_points,
        monthly_points: data.monthly_points,
      })
      return data as AwardPointsResponse
    }

    // Fallback: direct upsert with daily cap enforcement
    console.warn('[awardPoints] RPC failed, using fallback upsert', error?.message)

    const todayStr = new Date().toISOString().slice(0, 10)
    const dailyLimit = 100

    // Ensure row exists
    const { data: existingRow, error: fetchErr } = await supabase
      .from('users_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchErr) {
      console.error('[awardPoints] fallback fetch error', fetchErr)
      return {
        success: false,
        message: fetchErr.message || 'Failed to award points',
        points_awarded: 0,
      }
    }

    const isNewDay = !existingRow?.last_earned_date || existingRow.last_earned_date !== todayStr
    const todayPoints = isNewDay ? 0 : existingRow?.today_points ?? 0
    const newDailyTotal = todayPoints + points

    if (newDailyTotal > dailyLimit) {
      return {
        success: false,
        message: 'Daily limit of 100 points reached',
        points_awarded: 0,
        today_points: todayPoints,
        daily_limit: dailyLimit,
      }
    }

    const total = (existingRow?.total_points ?? 0) + points
    const weekly = (existingRow?.weekly_points ?? 0) + points
    const monthly = (existingRow?.monthly_points ?? 0) + points

    const { error: upsertErr } = await supabase
      .from('users_points')
      .upsert({
        user_id: user.id,
        total_points: total,
        weekly_points: weekly,
        monthly_points: monthly,
        today_points: newDailyTotal,
        last_earned_date: todayStr,
      })

    if (upsertErr) {
      console.error('[awardPoints] fallback upsert error', upsertErr)
      return {
        success: false,
        message: upsertErr.message || 'Failed to award points',
        points_awarded: 0,
      }
    }

    await syncUserSnapshot(user.id, {
      total_points: total,
      weekly_points: weekly,
      monthly_points: monthly,
    })

    return {
      success: true,
      message: 'Points awarded successfully (fallback)',
      points_awarded: points,
      total_points: total,
      today_points: newDailyTotal,
      weekly_points: weekly,
      monthly_points: monthly,
      daily_limit: dailyLimit,
    }
  } catch (error) {
    console.error('Error in awardPoints:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      points_awarded: 0,
    }
  }
}

/**
 * Get current user's points
 * @returns User's points data or null if not found
 */
export async function getUserPoints(): Promise<UserPoints | null> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data, error } = await supabase
      .from('users_points')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user points:', error)
      return null
    }

    return data as UserPoints
  } catch (error) {
    console.error('Error in getUserPoints:', error)
    return null
  }
}

/**
 * Get points by user ID (for leaderboard or admin view)
 * Note: RLS will only allow viewing own points or public data
 * @param userId - The user ID to fetch points for
 * @returns User's points data or null if not found/allowed
 */
export async function getUserPointsById(
  userId: string
): Promise<UserPoints | null> {
  try {
    const { data, error } = await supabase
      .from('users_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user points:', error)
      return null
    }

    return data as UserPoints
  } catch (error) {
    console.error('Error in getUserPointsById:', error)
    return null
  }
}

/**
 * Check if user has daily allowance remaining
 * @returns Object with today_points and daily_limit
 */
export async function checkDailyAllowance(): Promise<{
  today_points: number
  remaining: number
  daily_limit: number
}> {
  const userPoints = await getUserPoints()

  if (!userPoints) {
    return {
      today_points: 0,
      remaining: 100,
      daily_limit: 100,
    }
  }

  return {
    today_points: userPoints.today_points,
    remaining: Math.max(0, 100 - userPoints.today_points),
    daily_limit: 100,
  }
}

/**
 * Award points and handle the response
 * Returns a human-readable message for the UI
 *
 * @param points - Points to award
 * @returns Object with success status and message
 */
export async function awardPointsWithMessage(
  points: number
): Promise<{ success: boolean; message: string; data?: AwardPointsResponse }> {
  const response = await awardPoints(points)

  if (!response.success) {
    return {
      success: false,
      message: response.message,
      data: response,
    }
  }

  return {
    success: true,
    message: `🎉 +${response.points_awarded} points! Total: ${response.total_points}`,
    data: response,
  }
}
