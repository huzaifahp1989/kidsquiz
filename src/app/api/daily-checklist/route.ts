import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isTestModeUserId } from '@/lib/test-mode-server';
import { awardPointsWithDailyCapByUserId } from '@/lib/server-points';

// We use a user client for RLS context usually, but for points updates we might need admin
// However, to keep it secure, we should verify the user's session.
// Since we are in an API route, we should ideally use the auth header to get the user.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      data: data || { 
        user_id: userId, 
        date, 
        completed_items: [], 
        good_deed: '', 
        daily_points: 0 
      } 
    });
  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, date, items, goodDeed } = body;

    if (!userId || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const targetDate = new Date().toISOString().split('T')[0];
    if (date && date !== targetDate) {
      return NextResponse.json(
        { error: 'Daily checklist points can only be updated for today' },
        { status: 400 }
      );
    }

    const isTestMode = await isTestModeUserId(userId);

    // Calculate Points
    // Each item = 2 points
    // Good deed = 2 points (if not empty)
    let newPoints = items.length * 2;
    if (goodDeed && goodDeed.trim().length > 0) {
      newPoints += 2;
    }

    // Cap at 30? User said 20-30.
    // Salah (5*2=10) + Dhikr (4*2=8) + Deed (2) = 20.
    // So 20 is the natural max. Let's cap at 20 just in case.
    if (newPoints > 20) newPoints = 20;

    // 1. Get previous points to calculate delta
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('daily_progress')
      .select('daily_points')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .maybeSingle();

    if (existingError) throw existingError;

    const previousPoints = Math.max(0, Number(existing?.daily_points || 0));
    // Earned checklist points are never revoked. Otherwise, unchecking and
    // rechecking an item would repeatedly award the same points.
    const requestedPoints = Math.max(previousPoints, newPoints);
    const pointDelta = requestedPoints - previousPoints;

    // 2. Upsert Daily Progress
    const { error: upsertError } = await supabaseAdmin
      .from('daily_progress')
      .upsert({
        user_id: userId,
        date: targetDate,
        completed_items: items,
        good_deed: goodDeed,
        daily_points: requestedPoints
      }, { onConflict: 'user_id, date' });

    if (upsertError) throw upsertError;

    let pointsAwarded = 0;

    // 3. Award only newly earned points through the shared daily-cap path.
    if (pointDelta > 0 && !isTestMode) {
      try {
        const awardResult = await awardPointsWithDailyCapByUserId(userId, pointDelta, {
          successMessage: 'Daily checklist points awarded.',
        });

        if (!awardResult.success) {
          throw new Error(awardResult.message);
        }

        pointsAwarded = awardResult.pointsAwarded;
      } catch (awardError) {
        // Restore the claimable amount so a temporary points failure can be retried.
        const { error: rollbackError } = await supabaseAdmin
          .from('daily_progress')
          .update({ daily_points: previousPoints })
          .eq('user_id', userId)
          .eq('date', targetDate);

        if (rollbackError) {
          console.error('Failed to roll back daily checklist points:', rollbackError);
        }

        throw awardError;
      }
    }

    const savedPoints = isTestMode
      ? requestedPoints
      : previousPoints + pointsAwarded;

    // The global daily/weekly cap can make the actual award smaller than the
    // checklist delta. Store only what was really awarded so UI and totals agree.
    if (savedPoints !== requestedPoints) {
      const { error: correctionError } = await supabaseAdmin
        .from('daily_progress')
        .update({ daily_points: savedPoints })
        .eq('user_id', userId)
        .eq('date', targetDate);

      if (correctionError) throw correctionError;
    }

    return NextResponse.json({ 
      success: true, 
      points: savedPoints,
      delta: isTestMode ? 0 : pointsAwarded,
      testMode: isTestMode 
    });

  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
