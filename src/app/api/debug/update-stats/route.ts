import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * One-time Sara/Husnain correction — idempotent via points_manual_adjustments.
 * Prefer POST /api/admin/sync-points for the full repair (sync + manual).
 */
export async function POST() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }
    const supabaseAdmin = createClient(url, key);

    const updates = [
      { key: 'sara_manual_388', name: 'Sara', points: 388, badges: 3 },
      { key: 'husnain_manual_243', name: 'Husnain', points: 243, badges: 2 },
    ];

    const results = [];

    for (const update of updates) {
      const { data: users, error: searchError } = await supabaseAdmin
        .from('users')
        .select('uid, name, points, weeklypoints, badges, level')
        .ilike('name', `%${update.name}%`)
        .limit(1);

      if (searchError || !users || users.length === 0) {
        results.push({ name: update.name, status: 'Not Found', error: searchError });
        continue;
      }

      const user = users[0];
      const userId = user.uid;

      const { data: alreadyApplied } = await supabaseAdmin
        .from('points_manual_adjustments')
        .select('id')
        .eq('adjustment_key', update.key)
        .eq('user_id', userId)
        .maybeSingle();

      if (alreadyApplied?.id) {
        results.push({
          name: update.name,
          status: 'Already Applied',
          userId,
          old: { weekly: user.weeklypoints, badges: user.badges },
        });
        continue;
      }

      const newBadges = (user.badges || 0) + update.badges;
      const newPoints = (user.points || 0) + update.points;
      const newWeekly = (user.weeklypoints || 0) + update.points;

      const { error: updateError1 } = await supabaseAdmin
        .from('users')
        .update({
          weeklypoints: newWeekly,
          points: newPoints,
          badges: newBadges,
        })
        .eq('uid', userId);

      if (updateError1) {
        results.push({ name: update.name, status: 'Failed', error: updateError1.message });
        continue;
      }

      const { data: userPoints, error: pointsError } = await supabaseAdmin
        .from('users_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!pointsError && userPoints) {
        const newBadgesPoints = Math.max(userPoints.badges || 0, user.badges || 0) + update.badges;
        const newLevel = 1 + Math.floor(newBadgesPoints / 5);

        await supabaseAdmin
          .from('users_points')
          .update({
            weekly_points: Math.max(userPoints.weekly_points || 0, user.weeklypoints || 0) + update.points,
            total_points: Math.max(userPoints.total_points || 0, user.points || 0) + update.points,
            badges: newBadgesPoints,
            level: newLevel,
          })
          .eq('user_id', userId);
      } else if (!userPoints) {
        // Create if missing (maybeSingle returns null data with no PGRST116 error)
        const newLevel = 1 + Math.floor(newBadges / 5);
        await supabaseAdmin.from('users_points').insert({
          user_id: userId,
          weekly_points: newWeekly,
          total_points: newPoints,
          badges: newBadges,
          level: newLevel,
          today_points: 0,
          last_earned_date: new Date().toISOString().slice(0, 10),
        });
      }

      await supabaseAdmin.from('points_manual_adjustments').upsert(
        {
          adjustment_key: update.key,
          user_id: userId,
          points_added: update.points,
          badges_added: update.badges,
          applied_at: new Date().toISOString(),
        },
        { onConflict: 'adjustment_key,user_id' }
      );

      results.push({
        name: update.name,
        status: 'Updated',
        old: {
          weekly: user.weeklypoints,
          badges: user.badges,
        },
        added: update,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
