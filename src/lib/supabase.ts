import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// CRITICAL: Ensure session persistence for WebView compatibility
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // ALWAYS persist session - critical for mobile WebView
    persistSession: true,
    // Auto-refresh tokens to prevent session expiry
    autoRefreshToken: true,
    // Detect OAuth redirects
    detectSessionInUrl: true,
    // Force localStorage (required for WebView)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Store session in URL for cross-domain support
    storageKey: 'supabase.auth.token',
    // Disable flow for PKCE - simpler for WebView
    flowType: 'implicit',
  },
});

// Debug helper: Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null && session.user !== null;
}

// Debug helper: Get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}
