import { supabase } from './supabase';

export interface KidProfile {
  uid: string;
  email: string;
  name: string;
  age: number;
  role: 'kid' | 'guardian' | 'admin';
  points: number;
  weeklyPoints: number;
  monthlyPoints: number;
  badges: number;
  gamesRemaining: number;
  level: string;
  createdAt: string;
  updatedAt: string;
}

function mapUser(row: any): KidProfile {
  const dailyGames = row.daily_games_played ?? 0;
  // Calculate games remaining (default 3)
  // Note: accurate calculation requires last_game_date check against today, 
  // but for simple mapping we rely on what DB returns or default.
  // Ideally the DB view or query returns 'games_remaining' or we calculate it.
  // For now, we'll map raw data.
  const limit = 3;
  // Simple client-side check if needed, but better if DB resets it.
  // We'll assume row.daily_games_played is accurate for today if updated recently.
  
  return {
    uid: row.uid,
    email: row.email,
    name: row.name,
    age: row.age,
    role: row.role,
    points: row.points ?? 0,
    weeklyPoints: row.weeklyPoints ?? row.weeklypoints ?? 0,
    monthlyPoints: row.monthlyPoints ?? row.monthlypoints ?? 0,
    badges: row.badges ?? 0,
    gamesRemaining: Math.max(0, limit - dailyGames),
    level: row.level ?? 'Beginner',
    createdAt: row.createdAt ?? row.createdat ?? '',
    updatedAt: row.updatedAt ?? row.updatedat ?? '',
  };
}

/**
 * Fetch user profile from Supabase
 */
export async function getProfile(uid: string): Promise<KidProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('uid,email,name,age,role,points,weeklypoints:weeklyPoints, monthlypoints:monthlyPoints, badges, daily_games_played, level, createdat:createdAt, updatedat:updatedAt')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      console.error('[getProfile] Error fetching profile:', error);
      return null;
    }

    return data ? mapUser(data) : null;
  } catch (err) {
    console.error('[getProfile] Unexpected error:', err);
    return null;
  }
}

/**
 * Create user profile
 */
export async function createProfile(
  uid: string,
  email: string,
  name: string,
  age: number
): Promise<KidProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        uid,
        email,
        name,
        age,
        role: 'kid',
        points: 0,
        weeklypoints: 0,
        monthlypoints: 0,
        badges: 0,
        daily_games_played: 0,
        level: 'Beginner',
      }, { onConflict: 'uid', ignoreDuplicates: true })
      .select('uid,email,name,age,role,points,weeklypoints:weeklyPoints, monthlypoints:monthlyPoints, badges, daily_games_played, level, createdat:createdAt, updatedat:updatedAt')
      .single();

    if (error) {
      console.error('[createProfile] Error creating profile:', error);
      return null;
    }

    console.log('[createProfile] Profile created successfully:', uid);
    return data ? mapUser(data) : null;
  } catch (err) {
    console.error('[createProfile] Unexpected error:', err);
    return null;
  }
}

/**
 * Update points for a user
 */
export async function addPoints(uid: string, pointsToAdd: number): Promise<KidProfile | null> {
  try {
    // Fetch current points
    const profile = await getProfile(uid);
    if (!profile) {
      console.error('[addPoints] Profile not found for uid:', uid);
      return null;
    }

    const newPoints = profile.points + pointsToAdd;
    const newWeekly = (profile.weeklyPoints ?? 0) + pointsToAdd;
    const newMonthly = (profile.monthlyPoints ?? 0) + pointsToAdd;

    // Calculate level based on new points
    const newLevel = calculateLevel(newPoints);

    // Update profile
    const { data, error } = await supabase
      .from('users')
      .update({
        points: newPoints,
        weeklypoints: newWeekly,
        monthlypoints: newMonthly,
        level: newLevel,
        updatedat: new Date().toISOString(),
      })
      .eq('uid', uid)
      .select('uid,email,name,age,role,points,weeklypoints,monthlypoints,badges,daily_games_played,level,createdat,updatedat')
      .maybeSingle();

    if (error) {
      console.error('[addPoints] Error updating points:', error);
      return null;
    }

    console.log('[addPoints] Points updated:', { uid, pointsToAdd, newPoints });
    return data ? mapUser(data) : null;
  } catch (err) {
    console.error('[addPoints] Unexpected error:', err);
    return null;
  }
}

/**
 * Update level based on points
 */
export function calculateLevel(points: number): string {
  if (points >= 1000) return 'Master';
  if (points >= 500) return 'Expert';
  if (points >= 250) return 'Advanced';
  if (points >= 100) return 'Intermediate';
  if (points >= 25) return 'Novice';
  return 'Beginner';
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(period: 'weekly' | 'monthly' | 'all_time' = 'all_time') {
  try {
    let viewName = 'leaderboard_all_time';
    
    if (period === 'weekly') viewName = 'leaderboard_weekly';
    if (period === 'monthly') viewName = 'leaderboard_monthly';

    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .order('rank', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[getLeaderboard] Error fetching leaderboard:', error);
      return [];
    }

    return data;
  } catch (err) {
    console.error('[getLeaderboard] Unexpected error:', err);
    return [];
  }
}

/**
 * Get user rank in leaderboard
 */
export async function getUserRank(
  uid: string,
  period: 'weekly' | 'monthly' | 'all_time' = 'all_time'
): Promise<number | null> {
  try {
    let viewName = 'leaderboard_all_time';
    
    if (period === 'weekly') viewName = 'leaderboard_weekly';
    if (period === 'monthly') viewName = 'leaderboard_monthly';

    const { data, error } = await supabase
      .from(viewName)
      .select('rank')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      console.error('[getUserRank] Error fetching rank:', error);
      return null;
    }

    return data?.rank || null;
  } catch (err) {
    console.error('[getUserRank] Unexpected error:', err);
    return null;
  }
}
