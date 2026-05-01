import { NextResponse } from 'next/server';

export async function GET() {
  const url = typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim() : '';
  const anon = typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() : '';
  const service = typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string' ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';

  if (!url || !anon) {
    return NextResponse.json({
      configured: false,
      next_public_supabase_url: Boolean(url),
      next_public_supabase_anon_key: Boolean(anon),
      supabase_service_role_key: Boolean(service),
    });
  }

  const anonHasWhitespace = /\s/.test(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  const urlHasWhitespace = /\s/.test(process.env.NEXT_PUBLIC_SUPABASE_URL || '');

  const authHealth = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    cache: 'no-store',
  }).catch(() => null);
  const authHealthOk = !!authHealth && authHealth.ok;

  const restUsers = await fetch(`${url}/rest/v1/users?select=uid&limit=0`, {
    method: 'GET',
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    cache: 'no-store',
  }).catch(() => null);
  const restUsersBody = restUsers ? await restUsers.text().catch(() => null) : null;
  const restOk = !!restUsers && restUsers.ok;

  return NextResponse.json({
    configured: true,
    next_public_supabase_url: true,
    next_public_supabase_anon_key: true,
    supabase_service_role_key: Boolean(service),
    anon_key_has_whitespace: anonHasWhitespace,
    anon_key_length: anon.length,
    url_has_whitespace: urlHasWhitespace,
    auth_health_ok: authHealthOk,
    auth_health_status: authHealth?.status ?? null,
    rest_health_ok: restOk,
    rest_health_status: restUsers?.status ?? null,
    rest_users_status: restUsers?.status ?? null,
    rest_users_ok: restOk,
    rest_users_body: restUsersBody ? restUsersBody.slice(0, 200) : null,
  });
}
