import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MASJID_AL_AQSA_COMPETITION_KEY, MASJID_AL_AQSA_MAIN_QUESTION_COUNT, MASJID_AL_AQSA_QUESTIONS, MASJID_AL_AQSA_TIMER_SECONDS } from '@/lib/masjid-al-aqsa-competition';

export const dynamic = 'force-dynamic';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const answers = body?.answers && typeof body.answers === 'object' ? body.answers : {};
    const questionOrder = Array.isArray(body?.questionOrder) ? body.questionOrder.map((id: unknown) => String(id)) : [];
    const bonusAnswer = typeof body?.bonusAnswer === 'string' ? body.bonusAnswer.trim() : '';
    const timeTakenSeconds = Math.max(0, Number(body?.timeTakenSeconds || 0));

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 });
    }

    if (questionOrder.length === 0) {
      return NextResponse.json({ error: 'Question order is required' }, { status: 400 });
    }

    if (questionOrder.length > MASJID_AL_AQSA_QUESTIONS.length) {
      return NextResponse.json({ error: 'Invalid question order' }, { status: 400 });
    }

    const { data: existingByEmail, error: existingByEmailError } = await supabaseAdmin
      .from('masjid_al_aqsa_quiz_submissions')
      .select('id, status')
      .eq('email_normalized', email)
      .maybeSingle();

    if (existingByEmailError?.code === '42P01') {
      return NextResponse.json({ setupRequired: true, error: 'Masjid Al-Aqsa competition table is not set up yet.' }, { status: 503 });
    }

    if (existingByEmail) {
      return NextResponse.json({ error: 'You have already submitted this competition entry' }, { status: 409 });
    }

    if (userId) {
      const { data: existingByUser, error: existingByUserError } = await supabaseAdmin
        .from('masjid_al_aqsa_quiz_submissions')
        .select('id, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingByUserError?.code === '42P01') {
        return NextResponse.json({ setupRequired: true, error: 'Masjid Al-Aqsa competition table is not set up yet.' }, { status: 503 });
      }

      if (existingByUser) {
        return NextResponse.json({ error: 'You have already submitted this competition entry' }, { status: 409 });
      }
    }

    const payload = {
      competition_key: MASJID_AL_AQSA_COMPETITION_KEY,
      user_id: userId || null,
      full_name: fullName,
      email,
      email_normalized: email,
      question_order: questionOrder,
      answers,
      bonus_answer: bonusAnswer,
      time_taken_seconds: Math.min(timeTakenSeconds, MASJID_AL_AQSA_TIMER_SECONDS),
      status: 'submitted',
      question_marks: Array(MASJID_AL_AQSA_MAIN_QUESTION_COUNT).fill(0),
      bonus_marks: 0,
      main_score: 0,
      total_score: 0,
      admin_notes: null,
      reviewed_at: null,
      reviewed_by: null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from('masjid_al_aqsa_quiz_submissions').insert(payload).select('*').maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ setupRequired: true, error: 'Masjid Al-Aqsa competition table is not set up yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      submission: data,
      message: 'Your Masjid Al-Aqsa competition entry has been submitted for admin review.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
