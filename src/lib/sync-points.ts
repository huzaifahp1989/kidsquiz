import { supabaseAdmin } from '@/lib/supabase-admin';

export type SyncResult = {
  userId: string;
  name?: string | null;
  email?: string | null;
  action: 'created' | 'synced' | 'unchanged' | 'manual_applied' | 'manual_skipped';
  before?: { total: number; weekly: number; monthly: number; badges: number };
  after?: { total: number; weekly: number; monthly: number; badges: number };
};

const MANUAL_ADJUSTMENTS = [
  { key: 'sara_manual_388', name: 'Sara', points: 388, badges: 3 },
  { key: 'husnain_manual_243', name: 'Husnain', points: 243, badges: 2 },
] as const;

async function ensureAdjustmentsTable() {
  // Best-effort: table may already exist via migration. Ignore create failures
  // when we can still query; callers handle missing-table errors as "not applied".
  try {
    await supabaseAdmin.from('points_manual_adjustments').select('adjustment_key').limit(1);
  } catch {
    // no-op
  }
}

async function wasManualApplied(adjustmentKey: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('points_manual_adjustments')
    .select('id')
    .eq('adjustment_key', adjustmentKey)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // If table missing, treat as not applied so SQL migration remains source of truth.
    console.warn('[syncPoints] adjustments lookup failed:', error.message);
    return false;
  }
  return Boolean(data?.id);
}

async function markManualApplied(adjustmentKey: string, userId: string, points: number, badges: number) {
  const { error } = await supabaseAdmin.from('points_manual_adjustments').upsert(
    {
      adjustment_key: adjustmentKey,
      user_id: userId,
      points_added: points,
      badges_added: badges,
      applied_at: new Date().toISOString(),
    },
    { onConflict: 'adjustment_key,user_id' }
  );
  if (error) {
    console.warn('[syncPoints] could not mark adjustment applied:', error.message);
  }
}

/**
 * Lift users_points up to match users when it is behind/missing.
 * Never decreases points. Safe to run repeatedly.
 */
export async function syncUsersPointsFromUsers(): Promise<{
  synced: SyncResult[];
  created: number;
  updated: number;
  unchanged: number;
}> {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('uid, name, email, points, weeklypoints, monthlypoints, badges');

  if (error) throw error;

  const results: SyncResult[] = [];
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const user of users || []) {
    const userId = user.uid as string;
    const seedTotal = Number(user.points ?? 0) || 0;
    const seedWeekly = Number(user.weeklypoints ?? 0) || 0;
    const seedMonthly = Number(user.monthlypoints ?? 0) || 0;
    const seedBadges = Number(user.badges ?? 0) || 0;

    const { data: pointsRow, error: pointsErr } = await supabaseAdmin
      .from('users_points')
      .select('total_points, weekly_points, monthly_points, badges, level')
      .eq('user_id', userId)
      .maybeSingle();

    if (pointsErr) {
      console.warn('[syncUsersPointsFromUsers] fetch error', userId, pointsErr.message);
      continue;
    }

    if (!pointsRow) {
      const level = 1 + Math.floor(seedBadges / 5);
      const { error: insertErr } = await supabaseAdmin.from('users_points').insert({
        user_id: userId,
        total_points: seedTotal,
        weekly_points: seedWeekly,
        monthly_points: seedMonthly,
        today_points: 0,
        badges: seedBadges,
        level,
        last_earned_date: new Date().toISOString().slice(0, 10),
      });

      if (insertErr) {
        console.warn('[syncUsersPointsFromUsers] insert failed', userId, insertErr.message);
        continue;
      }

      created += 1;
      results.push({
        userId,
        name: user.name,
        email: user.email,
        action: 'created',
        before: { total: 0, weekly: 0, monthly: 0, badges: 0 },
        after: { total: seedTotal, weekly: seedWeekly, monthly: seedMonthly, badges: seedBadges },
      });
      continue;
    }

    const before = {
      total: Number(pointsRow.total_points ?? 0) || 0,
      weekly: Number(pointsRow.weekly_points ?? 0) || 0,
      monthly: Number(pointsRow.monthly_points ?? 0) || 0,
      badges: Number(pointsRow.badges ?? 0) || 0,
    };

    const after = {
      total: Math.max(before.total, seedTotal),
      weekly: Math.max(before.weekly, seedWeekly),
      monthly: Math.max(before.monthly, seedMonthly),
      badges: Math.max(before.badges, seedBadges),
    };

    const needsUpdate =
      after.total > before.total ||
      after.weekly > before.weekly ||
      after.monthly > before.monthly ||
      after.badges > before.badges;

    if (!needsUpdate) {
      unchanged += 1;
      results.push({
        userId,
        name: user.name,
        email: user.email,
        action: 'unchanged',
        before,
        after,
      });
      continue;
    }

    const { error: updateErr } = await supabaseAdmin
      .from('users_points')
      .update({
        total_points: after.total,
        weekly_points: after.weekly,
        monthly_points: after.monthly,
        badges: after.badges,
        level: 1 + Math.floor(after.badges / 5),
      })
      .eq('user_id', userId);

    if (updateErr) {
      console.warn('[syncUsersPointsFromUsers] update failed', userId, updateErr.message);
      continue;
    }

    // Mirror higher users_points values back onto users when users is behind.
    await supabaseAdmin
      .from('users')
      .update({
        points: after.total,
        weeklypoints: after.weekly,
        monthlypoints: after.monthly,
        badges: after.badges,
      })
      .eq('uid', userId);

    updated += 1;
    results.push({
      userId,
      name: user.name,
      email: user.email,
      action: 'synced',
      before,
      after,
    });
  }

  return { synced: results, created, updated, unchanged };
}

/**
 * Apply one-time Sara/Husnain corrections only if not already applied.
 */
export async function applyPendingManualPointUpdates(): Promise<SyncResult[]> {
  await ensureAdjustmentsTable();
  const results: SyncResult[] = [];

  for (const adjustment of MANUAL_ADJUSTMENTS) {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('uid, name, email, points, weeklypoints, monthlypoints, badges')
      .ilike('name', `%${adjustment.name}%`)
      .limit(1);

    if (error || !users?.length) {
      results.push({
        userId: '',
        name: adjustment.name,
        action: 'manual_skipped',
      });
      continue;
    }

    const user = users[0];
    const userId = user.uid as string;
    const already = await wasManualApplied(adjustment.key, userId);
    if (already) {
      results.push({
        userId,
        name: user.name,
        email: user.email,
        action: 'manual_skipped',
        before: {
          total: Number(user.points ?? 0) || 0,
          weekly: Number(user.weeklypoints ?? 0) || 0,
          monthly: Number(user.monthlypoints ?? 0) || 0,
          badges: Number(user.badges ?? 0) || 0,
        },
      });
      continue;
    }

    const before = {
      total: Number(user.points ?? 0) || 0,
      weekly: Number(user.weeklypoints ?? 0) || 0,
      monthly: Number(user.monthlypoints ?? 0) || 0,
      badges: Number(user.badges ?? 0) || 0,
    };

    const after = {
      total: before.total + adjustment.points,
      weekly: before.weekly + adjustment.points,
      monthly: before.monthly,
      badges: before.badges + adjustment.badges,
    };

    const { error: userUpdateErr } = await supabaseAdmin
      .from('users')
      .update({
        points: after.total,
        weeklypoints: after.weekly,
        badges: after.badges,
      })
      .eq('uid', userId);

    if (userUpdateErr) {
      console.warn('[applyPendingManualPointUpdates] users update failed', userUpdateErr.message);
      continue;
    }

    const { data: pointsRow } = await supabaseAdmin
      .from('users_points')
      .select('total_points, weekly_points, monthly_points, badges')
      .eq('user_id', userId)
      .maybeSingle();

    if (pointsRow) {
      const nextBadges = Math.max(Number(pointsRow.badges ?? 0) || 0, before.badges) + adjustment.badges;
      await supabaseAdmin
        .from('users_points')
        .update({
          total_points: Math.max(Number(pointsRow.total_points ?? 0) || 0, before.total) + adjustment.points,
          weekly_points: Math.max(Number(pointsRow.weekly_points ?? 0) || 0, before.weekly) + adjustment.points,
          badges: nextBadges,
          level: 1 + Math.floor(nextBadges / 5),
        })
        .eq('user_id', userId);
    } else {
      await supabaseAdmin.from('users_points').insert({
        user_id: userId,
        total_points: after.total,
        weekly_points: after.weekly,
        monthly_points: after.monthly,
        today_points: 0,
        badges: after.badges,
        level: 1 + Math.floor(after.badges / 5),
        last_earned_date: new Date().toISOString().slice(0, 10),
      });
    }

    await markManualApplied(adjustment.key, userId, adjustment.points, adjustment.badges);

    results.push({
      userId,
      name: user.name,
      email: user.email,
      action: 'manual_applied',
      before,
      after,
    });
  }

  return results;
}
