import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('masjid_al_aqsa_quiz_submissions')
      .select('id, full_name, total_score, main_score, bonus_marks, reviewed_at, created_at, status')
      .eq('status', 'approved')
      .order('total_score', { ascending: false })
      .order('reviewed_at', { ascending: true })
      .limit(20);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ setupRequired: true, hiddenUntilReviewed: true, entries: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      hiddenUntilReviewed: (data || []).length === 0,
      entries: (data || []).map((row: any, index: number) => ({
        rank: index + 1,
        id: row.id,
        name: row.full_name,
        mainScore: Number(row.main_score || 0),
        bonusScore: Number(row.bonus_marks || 0),
        totalScore: Number(row.total_score || 0),
        reviewedAt: row.reviewed_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
