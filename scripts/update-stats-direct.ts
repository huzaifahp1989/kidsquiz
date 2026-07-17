import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

const logFile = path.resolve(process.cwd(), 'scripts', 'update.log');
function log(msg: string) {
  fs.appendFileSync(logFile, msg + '\n');
  console.log(msg);
}

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MANUAL_ADJUSTMENTS = [
  { key: 'sara_manual_388', name: 'Sara', points: 388, badges: 3 },
  { key: 'husnain_manual_243', name: 'Husnain', points: 243, badges: 2 },
];

async function syncAllUsers() {
  log('Syncing users_points from users where behind/missing...');
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('uid, name, email, points, weeklypoints, monthlypoints, badges');

  if (error) throw error;

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const user of users || []) {
    const seedTotal = Number(user.points ?? 0) || 0;
    const seedWeekly = Number(user.weeklypoints ?? 0) || 0;
    const seedMonthly = Number(user.monthlypoints ?? 0) || 0;
    const seedBadges = Number(user.badges ?? 0) || 0;

    const { data: pointsRow } = await supabaseAdmin
      .from('users_points')
      .select('total_points, weekly_points, monthly_points, badges')
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!pointsRow) {
      const { error: insertErr } = await supabaseAdmin.from('users_points').insert({
        user_id: user.uid,
        total_points: seedTotal,
        weekly_points: seedWeekly,
        monthly_points: seedMonthly,
        today_points: 0,
        badges: seedBadges,
        level: 1 + Math.floor(seedBadges / 5),
        last_earned_date: new Date().toISOString().slice(0, 10),
      });
      if (insertErr) {
        log(`Insert failed for ${user.uid}: ${insertErr.message}`);
        continue;
      }
      created += 1;
      continue;
    }

    const after = {
      total: Math.max(Number(pointsRow.total_points ?? 0) || 0, seedTotal),
      weekly: Math.max(Number(pointsRow.weekly_points ?? 0) || 0, seedWeekly),
      monthly: Math.max(Number(pointsRow.monthly_points ?? 0) || 0, seedMonthly),
      badges: Math.max(Number(pointsRow.badges ?? 0) || 0, seedBadges),
    };

    const beforeTotal = Number(pointsRow.total_points ?? 0) || 0;
    const needsUpdate =
      after.total > beforeTotal ||
      after.weekly > (Number(pointsRow.weekly_points ?? 0) || 0) ||
      after.monthly > (Number(pointsRow.monthly_points ?? 0) || 0) ||
      after.badges > (Number(pointsRow.badges ?? 0) || 0);

    if (!needsUpdate) {
      unchanged += 1;
      continue;
    }

    const { error: upErr } = await supabaseAdmin
      .from('users_points')
      .update({
        total_points: after.total,
        weekly_points: after.weekly,
        monthly_points: after.monthly,
        badges: after.badges,
        level: 1 + Math.floor(after.badges / 5),
      })
      .eq('user_id', user.uid);

    if (upErr) {
      log(`Update failed for ${user.uid}: ${upErr.message}`);
      continue;
    }

    await supabaseAdmin
      .from('users')
      .update({
        points: after.total,
        weeklypoints: after.weekly,
        monthlypoints: after.monthly,
        badges: after.badges,
      })
      .eq('uid', user.uid);

    updated += 1;
  }

  log(`Sync complete. created=${created} updated=${updated} unchanged=${unchanged}`);
}

async function applyManualIfNeeded() {
  log('Applying pending manual adjustments (idempotent)...');

  for (const update of MANUAL_ADJUSTMENTS) {
    const { data: users, error: searchError } = await supabaseAdmin
      .from('users')
      .select('uid, name, points, weeklypoints, badges')
      .ilike('name', `%${update.name}%`)
      .limit(1);

    if (searchError || !users || users.length === 0) {
      log(`User ${update.name} not found or error: ${JSON.stringify(searchError)}`);
      continue;
    }

    const user = users[0];
    const userId = user.uid;

    const { data: already } = await supabaseAdmin
      .from('points_manual_adjustments')
      .select('id')
      .eq('adjustment_key', update.key)
      .eq('user_id', userId)
      .maybeSingle();

    if (already?.id) {
      log(`${update.name}: already applied — skipping`);
      continue;
    }

    log(`Found user ${user.name} (${userId}) — applying +${update.points} points`);

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

    if (updateError1) log(`Error updating users table: ${JSON.stringify(updateError1)}`);
    else log('Updated users table.');

    const { data: userPoints } = await supabaseAdmin
      .from('users_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (userPoints) {
      const newBadgesPoints = Math.max(userPoints.badges || 0, user.badges || 0) + update.badges;
      const newLevel = 1 + Math.floor(newBadgesPoints / 5);

      const { error: upError } = await supabaseAdmin
        .from('users_points')
        .update({
          weekly_points: Math.max(userPoints.weekly_points || 0, user.weeklypoints || 0) + update.points,
          total_points: Math.max(userPoints.total_points || 0, user.points || 0) + update.points,
          badges: newBadgesPoints,
          level: newLevel,
        })
        .eq('user_id', userId);

      if (upError) log(`Error updating users_points: ${JSON.stringify(upError)}`);
      else log('Updated users_points table.');
    } else {
      const newLevel = 1 + Math.floor(newBadges / 5);
      const { error: insError } = await supabaseAdmin.from('users_points').insert({
        user_id: userId,
        weekly_points: newWeekly,
        total_points: newPoints,
        badges: newBadges,
        level: newLevel,
        today_points: 0,
        last_earned_date: new Date().toISOString().slice(0, 10),
      });

      if (insError) log(`Error inserting users_points: ${JSON.stringify(insError)}`);
      else log('Inserted into users_points table.');
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
    log(`${update.name}: marked as applied`);
  }
}

async function main() {
  log('Starting update...');
  try {
    await syncAllUsers();
    await applyManualIfNeeded();
    await syncAllUsers();
    log('Done.');
  } catch (error: any) {
    log(`Script error: ${error.message}`);
  }
}

main();
