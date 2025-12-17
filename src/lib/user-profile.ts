import { supabase } from './supabase';

/**
 * Ensure user profile exists in Supabase. 
 * Creates a profile if missing. For clients, email comes from the insert itself.
 */
export async function ensureUserProfile(uid: string): Promise<boolean> {
  try {
    console.log('[ensureUserProfile] Ensure for UID:', uid);

    // Avoid resetting points: only insert if missing
    const { data: existing, error: readErr } = await supabase
      .from('users')
      .select('uid')
      .eq('uid', uid)
      .maybeSingle();

    if (readErr) {
      console.error('[ensureUserProfile] Read failed:', readErr.code, readErr.message);
      return false;
    }

    if (existing?.uid) {
      return true;
    }

    const { error: insertErr } = await supabase
      .from('users')
      .upsert({
        uid,
        role: 'kid',
        name: `Learner ${uid.slice(0, 8)}`,
        age: 10,
        email: `user-${uid.slice(0, 8)}@local`,
        points: 0,
        weeklypoints: 0,
        monthlypoints: 0,
        level: 'Beginner',
      }, { onConflict: 'uid', ignoreDuplicates: true });

    if (insertErr) {
      console.error('[ensureUserProfile] Insert failed:', insertErr.code, insertErr.message, insertErr.details);
      return false;
    }

    console.log('[ensureUserProfile] Profile created:', uid);
    return true;
  } catch (err) {
    console.error('[ensureUserProfile] Exception:', err);
    return false;
  }
}
