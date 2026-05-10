import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = (searchParams.get('userId') || '').trim();
    const email = normalizeEmail(searchParams.get('email') || '');

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
    }

    let query = supabaseAdmin.from('masjid_al_aqsa_quiz_submissions').select('*');
    if (userId) query = query.eq('user_id', userId);
    if (email) query = query.eq('email_normalized', email);

    const { data, error } = await query.maybeSingle();
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ setupRequired: true, exists: false, submission: null, error: 'Masjid Al-Aqsa competition table is not set up yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exists: Boolean(data), submission: data ?? null });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
