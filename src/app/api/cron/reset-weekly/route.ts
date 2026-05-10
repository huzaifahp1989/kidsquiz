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

  // Verify authorization (simple key check)
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Archive the winner (Optional: You might want to do this before resetting)
    // For now, we assume the winner has already been picked/notified via the 'generate_weekly_winner' function
    // which runs on Fridays. This reset happens on Saturday.

    // 2. Call the reset RPC function
    const { error } = await supabaseAdmin.rpc('reset_weekly_leaderboard');

    if (error) {
      // If RPC fails (e.g. function not found), try direct update fallback
      if (error.code === 'PGRST202') {
         console.warn('RPC reset_weekly_leaderboard not found. Attempting direct update...');
         
         const { error: updateError } = await supabaseAdmin
            .from('users_points')
            .update({ weekly_points: 0 } as any)
            .neq('weekly_points', 0); // Only update rows that have points
            
         if (updateError) throw updateError;
         
         // Also update users table
         await supabaseAdmin
            .from('users')
            .update({ weeklypoints: 0 } as any)
            .neq('weeklypoints', 0);
      } else {
        throw error;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Weekly leaderboard reset successfully' 
    });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
