/**
 * Points Service
 * Handles all points-related operations with the Supabase backend
 */

import { supabase } from './supabase'

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

    if (error) {
      console.error('Error awarding points:', error)
      return {
        success: false,
        message: error.message || 'Failed to award points',
        points_awarded: 0,
      }
    }

    return data as AwardPointsResponse
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
