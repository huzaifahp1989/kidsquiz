import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';
import { MASJID_AL_AQSA_MAIN_QUESTION_COUNT } from '@/lib/masjid-al-aqsa-competition';

function normalizeMarks(input: unknown, length: number) {
  if (!Array.isArray(input)) return Array(length).fill(0);
  return Array.from({ length }, (_, index) => (Number(input[index]) > 0 ? 1 : 0));
}

const ADJUSTMENT_TOKEN_REGEX = /\[\[manual_adjustment=(-?\d+)\]\]/;

function clampManualAdjustment(value: number) {
  return Math.max(-15, Math.min(15, Math.trunc(value)));
}

function stripManualAdjustmentToken(notes: string | null | undefined) {
  if (!notes) return '';
  return notes.replace(ADJUSTMENT_TOKEN_REGEX, '').trim();
}

function composeStoredAdminNotes(notes: string, manualAdjustment: number) {
  const cleanNotes = stripManualAdjustmentToken(notes);
  const token = `[[manual_adjustment=${manualAdjustment}]]`;
  return cleanNotes ? `${cleanNotes}\n\n${token}` : token;
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === 'string' ? body.action : 'review';
    const questionMarks = normalizeMarks(body?.questionMarks, MASJID_AL_AQSA_MAIN_QUESTION_COUNT);
    const bonusMarks = Math.max(0, Math.min(5, Number(body?.bonusMarks || 0)));
    const adminNotes = typeof body?.adminNotes === 'string' ? body.adminNotes.trim() : '';
    const manualAdjustment = clampManualAdjustment(Number(body?.manualAdjustment || 0));

    const computedMainScore = questionMarks.reduce((sum, mark) => sum + Number(mark || 0), 0);
    const mainScore = Math.max(0, Math.min(10, Number.isFinite(Number(body?.mainScoreOverride)) ? Number(body.mainScoreOverride) : computedMainScore));
    const storedAdminNotes = composeStoredAdminNotes(adminNotes, manualAdjustment);

    const { data, error } = await supabaseAdmin.rpc('review_masjid_al_aqsa_submission', {
      p_submission_id: id,
      p_question_marks: questionMarks,
      p_bonus_marks: bonusMarks,
      p_main_score: mainScore,
      p_manual_adjustment: manualAdjustment,
      p_action: action,
      p_admin_notes: storedAdminNotes,
    });

    if (error) {
      if (['42P01', '42703', '42883', 'PGRST202'].includes(error.code || '')) {
        return NextResponse.json({
          setupRequired: true,
          error: 'Masjid Al-Aqsa approval RPC is not set up yet. Run the latest migration.',
        }, { status: 503 });
      }
      if (error.message?.includes('Submission not found')) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data as {
      submission?: unknown;
      points_awarded?: number;
      points_requested?: number;
    } | null;
    const pointsAwarded = Number(result?.points_awarded || 0);
    const pointsRequested = Number(result?.points_requested || 0);
    const awardMessage = pointsAwarded > 0
      ? `+${pointsAwarded} points awarded for Masjid Al-Aqsa quiz approval.`
      : pointsRequested > 0
        ? 'Submission approved, but the weekly points cap left no points available.'
        : null;

    return NextResponse.json({
      success: true,
      submission: result?.submission,
      pointsAwarded,
      pointsRequested,
      awardMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
