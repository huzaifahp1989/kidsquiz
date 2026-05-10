import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function getWeekStartUtcDateString() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const daysSinceMonday = (utcDay + 6) % 7;
  const weekStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysSinceMonday,
    0,
    0,
    0,
    0
  ));
  return weekStart.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = (searchParams.get('userId') || '').trim();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const weekStart = getWeekStartUtcDateString();

    const { data: row, error } = await supabaseAdmin
      .from('weekly_competition_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'weekly_competition_progress table missing. Run the Supabase migration 20260510_create_weekly_competition_progress.sql.',
            setupRequired: true,
          },
          { status: 503 }
        );
      }
      throw error;
    }

    const didQuiz = Boolean((row as any)?.did_quiz);
    const didGame = Boolean((row as any)?.did_game);
    const didPledge = Boolean((row as any)?.did_pledge);
    const completedCount = (didQuiz ? 1 : 0) + (didGame ? 1 : 0) + (didPledge ? 1 : 0);

    return NextResponse.json({
      success: true,
      weekStart,
      didQuiz,
      didGame,
      didPledge,
      completedCount,
      remainingCount: 3 - completedCount,
      entered: didQuiz && didGame && didPledge,
      completedAt: (row as any)?.completed_at ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}

