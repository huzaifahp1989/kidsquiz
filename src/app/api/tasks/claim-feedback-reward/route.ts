import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedRequestUser } from '@/lib/request-auth';

type FeedbackRewardResult = {
  success: boolean;
  already_claimed?: boolean;
  points_awarded?: number;
  total_points?: number;
  weekly_points?: number;
  monthly_points?: number;
  today_points?: number;
  message?: string;
};

function isMissingAtomicClaimRpc(error: { code?: string; message?: string } | null) {
  return error?.code === '42883'
    || error?.code === 'PGRST202'
    || Boolean(error?.message?.includes('claim_feedback_reward'));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, platform } = body || {};

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const authUser = await getAuthenticatedRequestUser(req);
    if (!authUser || authUser.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (platform !== 'ios' && platform !== 'android') {
      return NextResponse.json({ error: 'platform must be "ios" or "android"' }, { status: 400 });
    }

    // Claim marker, cap calculation, dual-table sync, and audit log all commit
    // in one database transaction. This prevents concurrent duplicate awards.
    const { data, error } = await supabaseAdmin.rpc('claim_feedback_reward', {
      p_user_id: authUser.id,
      p_platform: platform,
    });

    if (isMissingAtomicClaimRpc(error)) {
      return NextResponse.json(
        {
          error: 'Secure feedback rewards are not set up yet.',
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    if (error) throw error;

    const result = data as FeedbackRewardResult | null;
    if (result?.already_claimed) {
      return NextResponse.json(
        { error: result.message, alreadyClaimed: true },
        { status: 409 }
      );
    }
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Feedback reward could not be claimed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pointsAwarded: result.points_awarded || 0,
      message: result.message,
      totalPoints: result.total_points,
      weeklyPoints: result.weekly_points,
      monthlyPoints: result.monthly_points,
      todayPoints: result.today_points,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
