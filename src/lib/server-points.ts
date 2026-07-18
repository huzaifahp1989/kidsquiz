import { supabaseAdmin } from '@/lib/supabase-admin';
import { isTestModeUserId } from '@/lib/test-mode-server';

export type ServerAwardReason =
  | 'awarded'
  | 'daily_limit_reached'
  | 'weekly_limit_reached'
  | 'test_mode'
  | 'invalid_points'
  | 'update_failed';

export type ServerAwardPointsResult = {
  success: boolean;
  reason: ServerAwardReason;
  message: string;
  pointsAwarded: number;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  todayPoints: number;
  dailyLimit: number;
  badges: number;
  level: number;
};

type ServerAwardOptions = {
  countTowardDailyLimit?: boolean;
  successMessage?: string;
};

export async function awardPointsWithDailyCapByUserId(
  userId: string,
  requestedPoints: number,
  options: ServerAwardOptions = {}
): Promise<ServerAwardPointsResult> {
  const dailyLimit = 100;
  const countTowardDailyLimit = options.countTowardDailyLimit !== false;

  if (!requestedPoints || requestedPoints <= 0) {
    return {
      success: false,
      reason: 'invalid_points',
      message: 'Points must be greater than 0.',
      pointsAwarded: 0,
      totalPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      todayPoints: 0,
      dailyLimit,
      badges: 0,
      level: 1,
    };
  }

  const isTestMode = await isTestModeUserId(userId);
  if (isTestMode) {
    return {
      success: true,
      reason: 'test_mode',
      message: 'Test mode active for this account. Mission bonus is tracked but no leaderboard points are added.',
      pointsAwarded: 0,
      totalPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      todayPoints: 0,
      dailyLimit,
      badges: 0,
      level: 1,
    };
  }

  const { data, error } = await supabaseAdmin.rpc('award_points_for_user', {
    p_user_id: userId,
    p_points: requestedPoints,
    p_count_toward_daily_limit: countTowardDailyLimit,
  });

  if (error || !data) {
    return {
      success: false,
      reason: 'update_failed',
      message: error?.message || 'The point award did not return a result.',
      pointsAwarded: 0,
      totalPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      todayPoints: 0,
      dailyLimit,
      badges: 0,
      level: 1,
    };
  }

  const rpcResult = data as Record<string, unknown>;
  const reason = rpcResult.reason as ServerAwardReason;
  const pointsAwarded = Number(rpcResult.points_awarded || 0);

  return {
    success: rpcResult.success === true,
    reason: reason || (rpcResult.success === true ? 'awarded' : 'update_failed'),
    message:
      pointsAwarded > 0 && options.successMessage
        ? options.successMessage
        : String(rpcResult.message || 'Point award completed.'),
    pointsAwarded,
    totalPoints: Number(rpcResult.total_points || 0),
    weeklyPoints: Number(rpcResult.weekly_points || 0),
    monthlyPoints: Number(rpcResult.monthly_points || 0),
    todayPoints: Number(rpcResult.today_points || 0),
    dailyLimit: Number(rpcResult.daily_limit || dailyLimit),
    badges: Number(rpcResult.badges || 0),
    level: Number(rpcResult.level || 1),
  };
}