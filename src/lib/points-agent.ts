import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  applyPendingManualPointUpdates,
  syncUsersPointsFromUsers,
  type SyncResult,
} from '@/lib/sync-points';

export type PointsIssue = {
  code:
    | 'missing_users_points'
    | 'desynced_totals'
    | 'null_points'
    | 'missing_profile'
    | 'pending_manual_adjustment';
  severity: 'warning' | 'error';
  userId?: string;
  email?: string | null;
  name?: string | null;
  detail: string;
  autoFixable: boolean;
};

export type PointsAgentReport = {
  ranAt: string;
  healthy: boolean;
  issuesFound: number;
  issuesFixed: number;
  issues: PointsIssue[];
  diagnosis: {
    usersChecked: number;
    missingPointsRows: number;
    desyncedUsers: number;
    nullPointUsers: number;
  };
  repair: {
    created: number;
    updated: number;
    unchanged: number;
    manualApplied: number;
    manualSkipped: number;
    changedUsers: Array<Pick<SyncResult, 'userId' | 'name' | 'email' | 'action' | 'before' | 'after'>>;
  };
  message: string;
};

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Diagnose common points failures without mutating data.
 */
export async function diagnosePointsIssues(): Promise<{
  issues: PointsIssue[];
  usersChecked: number;
  missingPointsRows: number;
  desyncedUsers: number;
  nullPointUsers: number;
}> {
  const issues: PointsIssue[] = [];

  const { data: users, error: usersError } = await supabaseAdmin
    .from('users')
    .select('uid, name, email, points, weeklypoints, monthlypoints, badges');

  if (usersError) {
    throw new Error(`Failed to load users: ${usersError.message}`);
  }

  const { data: pointsRows, error: pointsError } = await supabaseAdmin
    .from('users_points')
    .select('user_id, total_points, weekly_points, monthly_points, badges');

  if (pointsError) {
    throw new Error(`Failed to load users_points: ${pointsError.message}`);
  }

  const pointsByUser = new Map<string, any>();
  for (const row of pointsRows || []) {
    pointsByUser.set(String(row.user_id), row);
  }

  let missingPointsRows = 0;
  let desyncedUsers = 0;
  let nullPointUsers = 0;

  for (const user of users || []) {
    const userId = String(user.uid);
    const pointsRow = pointsByUser.get(userId);

    if (user.points === null || user.weeklypoints === null || user.monthlypoints === null) {
      nullPointUsers += 1;
      issues.push({
        code: 'null_points',
        severity: 'warning',
        userId,
        email: user.email,
        name: user.name,
        detail: 'User has NULL points fields that can block updates',
        autoFixable: true,
      });
    }

    if (!pointsRow) {
      missingPointsRows += 1;
      issues.push({
        code: 'missing_users_points',
        severity: 'error',
        userId,
        email: user.email,
        name: user.name,
        detail: `Missing users_points row while users.points=${num(user.points)}`,
        autoFixable: true,
      });
      continue;
    }

    const userTotal = num(user.points);
    const userWeekly = num(user.weeklypoints);
    const userMonthly = num(user.monthlypoints);
    const userBadges = num(user.badges);
    const pointsTotal = num(pointsRow.total_points);
    const pointsWeekly = num(pointsRow.weekly_points);
    const pointsMonthly = num(pointsRow.monthly_points);
    const pointsBadges = num(pointsRow.badges);

    const desynced =
      userTotal !== pointsTotal ||
      userWeekly !== pointsWeekly ||
      userMonthly !== pointsMonthly ||
      userBadges !== pointsBadges;

    if (desynced) {
      desyncedUsers += 1;
      issues.push({
        code: 'desynced_totals',
        severity: userTotal > 0 && pointsTotal === 0 ? 'error' : 'warning',
        userId,
        email: user.email,
        name: user.name,
        detail: `Desync users(${userTotal}/${userWeekly}/${userMonthly}) vs users_points(${pointsTotal}/${pointsWeekly}/${pointsMonthly})`,
        autoFixable: true,
      });
    }
  }

  // Auth users without public.users profiles (common cause for "points not updating")
  try {
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (!authError) {
      const profileIds = new Set((users || []).map((u) => String(u.uid)));
      for (const authUser of authUsers?.users || []) {
        const id = String((authUser as any).id || '');
        if (!id || profileIds.has(id)) continue;
        issues.push({
          code: 'missing_profile',
          severity: 'error',
          userId: id,
          email: (authUser as any).email ?? null,
          name: null,
          detail: 'Auth user exists without public.users profile — points awards will fail',
          autoFixable: true,
        });
      }
    }
  } catch (err: any) {
    console.warn('[points-agent] auth profile scan skipped:', err?.message || err);
  }

  return {
    issues,
    usersChecked: (users || []).length,
    missingPointsRows,
    desyncedUsers,
    nullPointUsers,
  };
}

async function repairNullPoints(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      points: 0,
      weeklypoints: 0,
      monthlypoints: 0,
      badges: 0,
    } as any)
    .or('points.is.null,weeklypoints.is.null,monthlypoints.is.null,badges.is.null')
    .select('uid');

  if (error) {
    // Some schemas may reject this filter; ignore and let sync path handle.
    console.warn('[points-agent] null points repair warning:', error.message);
    return 0;
  }
  return data?.length || 0;
}

async function repairMissingProfiles(): Promise<number> {
  let created = 0;
  try {
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authError) return 0;

    const { data: users } = await supabaseAdmin.from('users').select('uid');
    const existing = new Set((users || []).map((u) => String(u.uid)));

    for (const authUser of authUsers?.users || []) {
      const id = String((authUser as any).id || '');
      if (!id || existing.has(id)) continue;

      const email = (authUser as any).email || `user-${id.slice(0, 8)}@local`;
      const meta = ((authUser as any).user_metadata || {}) as Record<string, unknown>;
      const name =
        (typeof meta.name === 'string' && meta.name) ||
        (typeof meta.full_name === 'string' && meta.full_name) ||
        email.split('@')[0] ||
        'Friend';

      const { error: insertErr } = await supabaseAdmin.from('users').upsert(
        {
          uid: id,
          email,
          name,
          age: 10,
          role: 'kid',
          points: 0,
          weeklypoints: 0,
          monthlypoints: 0,
          badges: 0,
          level: 'Beginner',
        },
        { onConflict: 'uid', ignoreDuplicates: true }
      );

      if (!insertErr) {
        await supabaseAdmin.from('users_points').upsert(
          {
            user_id: id,
            total_points: 0,
            weekly_points: 0,
            monthly_points: 0,
            today_points: 0,
            badges: 0,
            level: 1,
            last_earned_date: new Date().toISOString().slice(0, 10),
          },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );
        created += 1;
      }
    }
  } catch (err: any) {
    console.warn('[points-agent] missing profile repair skipped:', err?.message || err);
  }
  return created;
}

/**
 * Diagnose points issues and immediately auto-repair anything safe to fix.
 * Safe to run repeatedly (idempotent).
 */
export async function runPointsAgent(options: { applyManual?: boolean } = {}): Promise<PointsAgentReport> {
  const applyManual = options.applyManual !== false;
  const ranAt = new Date().toISOString();

  const before = await diagnosePointsIssues();
  const nullRepaired = await repairNullPoints();
  const profilesCreated = await repairMissingProfiles();

  const sync = await syncUsersPointsFromUsers();
  const manual = applyManual ? await applyPendingManualPointUpdates() : [];
  const postSync = applyManual ? await syncUsersPointsFromUsers() : sync;

  const after = await diagnosePointsIssues();
  const issuesFixed = Math.max(0, before.issues.length - after.issues.length) + nullRepaired + profilesCreated;

  const changedUsers = [
    ...sync.synced.filter((r) => r.action === 'created' || r.action === 'synced'),
    ...manual.filter((r) => r.action === 'manual_applied'),
    ...postSync.synced.filter((r) => r.action === 'created' || r.action === 'synced'),
  ];

  // Dedupe by userId+action
  const seen = new Set<string>();
  const uniqueChanged = changedUsers.filter((row) => {
    const key = `${row.userId}:${row.action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const healthy = after.issues.filter((i) => i.severity === 'error').length === 0;
  const message = healthy
    ? `Points agent healthy. Checked ${after.usersChecked} users; fixed ${issuesFixed} issue(s).`
    : `Points agent repaired what it could. ${after.issues.filter((i) => i.severity === 'error').length} error(s) remain.`;

  return {
    ranAt,
    healthy,
    issuesFound: before.issues.length,
    issuesFixed,
    issues: after.issues.slice(0, 50),
    diagnosis: {
      usersChecked: after.usersChecked,
      missingPointsRows: after.missingPointsRows,
      desyncedUsers: after.desyncedUsers,
      nullPointUsers: after.nullPointUsers,
    },
    repair: {
      created: sync.created + postSync.created + profilesCreated,
      updated: sync.updated + postSync.updated + nullRepaired,
      unchanged: postSync.unchanged,
      manualApplied: manual.filter((r) => r.action === 'manual_applied').length,
      manualSkipped: manual.filter((r) => r.action === 'manual_skipped').length,
      changedUsers: uniqueChanged.map(({ userId, name, email, action, before: b, after: a }) => ({
        userId,
        name,
        email,
        action,
        before: b,
        after: a,
      })),
    },
    message,
  };
}
