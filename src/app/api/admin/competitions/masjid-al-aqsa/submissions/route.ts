import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function isAdmin(req: Request) {
  return req.headers.get('x-admin-auth') === 'true';
}

export async function GET(req: Request) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';

    let query = supabaseAdmin
      .from('masjid_al_aqsa_quiz_submissions')
      .select('id, full_name, email, user_id, status, total_score, main_score, bonus_marks, question_order, answers, bonus_answer, question_marks, admin_notes, reviewed_at, reviewed_by, time_taken_seconds, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ setupRequired: true, submissions: [], stats: { total: 0, submitted: 0, reviewed: 0, approved: 0, rejected: 0 } }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stats = {
      total: data?.length || 0,
      submitted: (data || []).filter((row: any) => row.status === 'submitted').length,
      reviewed: (data || []).filter((row: any) => row.status === 'reviewed').length,
      approved: (data || []).filter((row: any) => row.status === 'approved').length,
      rejected: (data || []).filter((row: any) => row.status === 'rejected').length,
    };

    return NextResponse.json({ submissions: data || [], stats });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
