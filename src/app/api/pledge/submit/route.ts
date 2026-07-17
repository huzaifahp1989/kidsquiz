import { NextResponse } from 'next/server';
import { getAuthenticatedRequestUser } from '@/lib/request-auth';
import { awardPointsWithDailyCapByUserId } from '@/lib/server-points';
import { supabaseAdmin } from '@/lib/supabase-admin';

const MAX_RECITATIONS_PER_SUBMISSION = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_SUBTYPES = {
  durood: new Set(['short_durood', 'durood_ibrahim', 'jazallah_durood']),
  zikr: new Set([
    'subhanallah',
    'alhamdulillah',
    'allahu_akbar',
    'kalima_tayyiba',
    'astaghfirullah',
    'subhanallah_wb',
  ]),
} as const;

type PledgeType = keyof typeof VALID_SUBTYPES;

function isPledgeType(value: string): value is PledgeType {
  return value === 'durood' || value === 'zikr';
}

function setupRequired(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' || error?.code === 'PGRST204'
    || Boolean(error?.message?.includes('submission_id') || error?.message?.includes('award_status'));
}

async function duplicateResponse(userId: string, submissionId: string) {
  const { data, error } = await supabaseAdmin
    .from('pledges')
    .select('award_status, points_awarded')
    .eq('user_id', userId)
    .eq('submission_id', submissionId)
    .maybeSingle();

  if (setupRequired(error)) {
    return NextResponse.json(
      {
        error: 'Secure pledge submissions are not set up yet.',
        setupRequired: true,
      },
      { status: 503 }
    );
  }
  if (error) throw error;
  if (!data) return null;

  if (data.award_status === 'pending') {
    return NextResponse.json(
      { error: 'This pledge is still being processed. Please try again.' },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    alreadySubmitted: true,
    pointsAwarded: Number(data.points_awarded || 0),
    message: 'This pledge was already recorded.',
  });
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedRequestUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Please sign in to record a pledge.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const submissionId = typeof body?.submissionId === 'string' ? body.submissionId.trim() : '';
    const type = typeof body?.type === 'string' ? body.type.trim() : '';
    const subtype = typeof body?.subtype === 'string' ? body.subtype.trim() : '';
    const count = Number(body?.count);

    if (!UUID_PATTERN.test(submissionId)) {
      return NextResponse.json({ error: 'A valid submissionId is required.' }, { status: 400 });
    }
    if (!isPledgeType(type) || !VALID_SUBTYPES[type].has(subtype)) {
      return NextResponse.json({ error: 'Invalid pledge type or selection.' }, { status: 400 });
    }
    if (!Number.isInteger(count) || count < 1 || count > MAX_RECITATIONS_PER_SUBMISSION) {
      return NextResponse.json(
        { error: `Count must be a whole number from 1 to ${MAX_RECITATIONS_PER_SUBMISSION}.` },
        { status: 400 }
      );
    }

    const existingResponse = await duplicateResponse(authUser.id, submissionId);
    if (existingResponse) return existingResponse;

    const { data: pledge, error: insertError } = await supabaseAdmin
      .from('pledges')
      .insert({
        user_id: authUser.id,
        type,
        subtype,
        count,
        submission_id: submissionId,
        points_awarded: 0,
        award_status: 'pending',
      })
      .select('id')
      .single();

    if (insertError?.code === '23505') {
      const concurrentResponse = await duplicateResponse(authUser.id, submissionId);
      if (concurrentResponse) return concurrentResponse;
    }
    if (setupRequired(insertError)) {
      return NextResponse.json(
        {
          error: 'Secure pledge submissions are not set up yet.',
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    if (insertError || !pledge) throw insertError || new Error('Could not record pledge.');

    const requestedPoints = Math.floor(count * 0.2);
    const award = requestedPoints > 0
      ? await awardPointsWithDailyCapByUserId(authUser.id, requestedPoints, {
          countTowardDailyLimit: false,
          successMessage: `Pledge recorded. +${requestedPoints} points added.`,
        })
      : null;

    if (award && !award.success) {
      const { error: rollbackError } = await supabaseAdmin.from('pledges').delete().eq('id', pledge.id);
      if (rollbackError) {
        console.error('[pledge/submit] Failed to roll back pledge after award failure:', rollbackError.message);
      }
      return NextResponse.json({ error: 'Could not award pledge points. Please try again.' }, { status: 500 });
    }

    const pointsAwarded = award?.pointsAwarded ?? 0;
    const { error: completionError } = await supabaseAdmin
      .from('pledges')
      .update({ award_status: 'completed', points_awarded: pointsAwarded })
      .eq('id', pledge.id);

    if (completionError) {
      // Keep the idempotency row: deleting it after points were awarded would allow a retry to double-award.
      console.error('[pledge/submit] Pledge awarded but completion status update failed:', completionError.message);
    }

    return NextResponse.json({
      success: true,
      pointsAwarded,
      totalPoints: award?.totalPoints,
      weeklyPoints: award?.weeklyPoints,
      monthlyPoints: award?.monthlyPoints,
      todayPoints: award?.todayPoints,
      message: pointsAwarded > 0
        ? `Pledge recorded. +${pointsAwarded} points added.`
        : 'Pledge recorded. Your weekly points limit has already been reached.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not record pledge.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
