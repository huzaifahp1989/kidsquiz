import { NextResponse } from 'next/server';
import { getAuthenticatedRequestUser } from '@/lib/request-auth';
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
  return error?.code === '42883' || error?.code === 'PGRST202'
    || Boolean(error?.message?.includes('submit_pledge_award'));
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

    const { data, error } = await supabaseAdmin.rpc('submit_pledge_award', {
      p_user_id: authUser.id,
      p_submission_id: submissionId,
      p_type: type,
      p_subtype: subtype,
      p_count: count,
    });

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
    if (!data || data.success !== true) throw new Error('Could not record pledge.');

    const pointsAwarded = Number(data.points_awarded || 0);
    const alreadySubmitted = data.already_submitted === true;
    const message = alreadySubmitted
      ? 'This pledge was already recorded.'
      : pointsAwarded > 0
        ? `Pledge recorded. +${pointsAwarded} points added.`
        : count < 5
          ? 'Pledge recorded. Five recitations are needed to earn one full point.'
          : 'Pledge recorded. Your weekly points limit has already been reached.';

    return NextResponse.json({
      success: true,
      alreadySubmitted,
      pointsAwarded,
      totalPoints: Number(data.total_points || 0),
      weeklyPoints: Number(data.weekly_points || 0),
      monthlyPoints: Number(data.monthly_points || 0),
      todayPoints: Number(data.today_points || 0),
      message,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not record pledge.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
