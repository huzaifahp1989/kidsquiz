import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isManualRun = searchParams.get('manual') === '1';

  // Auto-reset is disabled. Keep this endpoint available only for explicit manual runs.
  if (!isManualRun) {
    return NextResponse.json({
      success: true,
      skipped: true,
      message: 'Automatic weekly reset is disabled. Use ?manual=1 to run this endpoint manually.',
    });
  }

  // Vercel cron requests use this bearer token too. Do not trust the
  // x-vercel-cron header because callers can set it themselves.
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (
    process.env.NODE_ENV === 'production' &&
    (!cronSecret || authHeader !== `Bearer ${cronSecret}`)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Archive the winner (Optional: You might want to do this before resetting)
    // For now, we assume the winner has already been picked/notified via the 'generate_weekly_winner' function
    // which runs on Fridays. This reset happens on Saturday.

    // 2. Call the reset RPC function
    const { error: rpcError } = await supabaseAdmin.rpc('reset_weekly_leaderboard');
    let resetMethod: 'rpc' | 'direct-fallback' = 'rpc';

    if (rpcError) {
      // Keep manual recovery available when the RPC is missing or an older,
      // broken definition is still deployed.
      console.warn(
        'RPC reset_weekly_leaderboard failed. Attempting direct update fallback:',
        rpcError.message,
      );

      const [pointsResult, usersResult] = await Promise.all([
        supabaseAdmin
          .from('users_points')
          .update({ weekly_points: 0 })
          .or('weekly_points.neq.0,weekly_points.is.null'),
        supabaseAdmin
          .from('users')
          .update({ weeklypoints: 0 })
          .or('weeklypoints.neq.0,weeklypoints.is.null'),
      ]);

      if (pointsResult.error || usersResult.error) {
        const fallbackMessages = [
          pointsResult.error && `users_points: ${pointsResult.error.message}`,
          usersResult.error && `users: ${usersResult.error.message}`,
        ].filter(Boolean);

        throw new Error(
          `Weekly reset RPC failed (${rpcError.message}); direct fallback failed (${fallbackMessages.join('; ')})`,
        );
      }

      resetMethod = 'direct-fallback';
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly leaderboard reset successfully',
      method: resetMethod,
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown reset error',
    }, { status: 500 });
  }
}
