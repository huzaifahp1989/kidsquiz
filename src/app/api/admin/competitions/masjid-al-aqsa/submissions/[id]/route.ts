import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { awardPointsWithDailyCapByUserId } from '@/lib/server-points';

function isAdmin(req: Request) {
  return req.headers.get('x-admin-auth') === 'true';
}

function normalizeMarks(input: unknown, length: number) {
  if (!Array.isArray(input)) return Array(length).fill(0);
  return Array.from({ length }, (_, index) => (Number(input[index]) > 0 ? 1 : 0));
}

const ADJUSTMENT_TOKEN_REGEX = /\[\[manual_adjustment=(-?\d+)\]\]/;

function clampManualAdjustment(value: number) {
  return Math.max(-15, Math.min(15, Math.trunc(value)));
}

function parseManualAdjustmentFromNotes(notes: string | null | undefined) {
  if (!notes) return 0;
  const match = notes.match(ADJUSTMENT_TOKEN_REGEX);
  if (!match) return 0;
  return clampManualAdjustment(Number(match[1] || 0));
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
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === 'string' ? body.action : 'review';
    const questionMarks = normalizeMarks(body?.questionMarks, Array.isArray(body?.questionOrder) ? body.questionOrder.length : 10);
    const bonusMarks = Math.max(0, Math.min(5, Number(body?.bonusMarks || 0)));
    const adminNotes = typeof body?.adminNotes === 'string' ? body.adminNotes.trim() : '';
    const manualAdjustment = clampManualAdjustment(Number(body?.manualAdjustment || 0));

    const computedMainScore = questionMarks.reduce((sum, mark) => sum + Number(mark || 0), 0);
    const mainScore = Math.max(0, Math.min(10, Number.isFinite(Number(body?.mainScoreOverride)) ? Number(body.mainScoreOverride) : computedMainScore));
    const totalScore = Math.min(15, mainScore + bonusMarks);

    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reviewed';

    const { data: previousSubmission, error: previousSubmissionError } = await supabaseAdmin
      .from('masjid_al_aqsa_quiz_submissions')
      .select('id, status, total_score, user_id, admin_notes')
      .eq('id', id)
      .maybeSingle();

    if (previousSubmissionError) {
      if (previousSubmissionError.code === '42P01') {
        return NextResponse.json({ setupRequired: true, error: 'Masjid Al-Aqsa competition table is not set up yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: previousSubmissionError.message }, { status: 500 });
    }

    if (!previousSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('masjid_al_aqsa_quiz_submissions')
      .update({
        question_marks: questionMarks,
        bonus_marks: bonusMarks,
        main_score: mainScore,
        total_score: totalScore,
        status,
        admin_notes: composeStoredAdminNotes(adminNotes, manualAdjustment),
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ setupRequired: true, error: 'Masjid Al-Aqsa competition table is not set up yet.' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let pointsAwarded = 0;
    let awardMessage: string | null = null;

    if (status === 'approved' && data?.user_id) {
      const previousStatus = String(previousSubmission.status || 'submitted');
      const previousTotal = Math.max(0, Number(previousSubmission.total_score || 0));
      const newTotal = Math.max(0, Number(data.total_score || 0));
      const previousAdjustment = parseManualAdjustmentFromNotes(previousSubmission.admin_notes as string | null | undefined);
      const previousEffective = Math.max(0, previousTotal + previousAdjustment);
      const newEffective = Math.max(0, newTotal + manualAdjustment);
      const pointsToAward = previousStatus === 'approved' ? Math.max(0, newEffective - previousEffective) : newEffective;

      if (pointsToAward > 0) {
        const awardResult = await awardPointsWithDailyCapByUserId(String(data.user_id), pointsToAward, {
          countTowardDailyLimit: false,
          successMessage: `+${pointsToAward} points awarded for Masjid Al-Aqsa quiz approval.`,
        });

        if (!awardResult.success) {
          return NextResponse.json({ error: `Score saved but failed to award points: ${awardResult.message}` }, { status: 500 });
        }

        pointsAwarded = awardResult.pointsAwarded;
        awardMessage = awardResult.message;
      }
    }

    return NextResponse.json({ success: true, submission: data, pointsAwarded, awardMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
