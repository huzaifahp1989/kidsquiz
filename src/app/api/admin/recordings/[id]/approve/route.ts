import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';
import { awardPointsWithDailyCapByUserId } from '@/lib/server-points';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { points, publish, feedback } = body;

    const pointsToAward = Number(points || 0);
    if (!Number.isFinite(pointsToAward) || pointsToAward < 0) {
      return NextResponse.json({ error: 'Points must be a non-negative number.' }, { status: 400 });
    }

    const { data: recording, error: recordingError } = await supabaseAdmin
      .from('recordings')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (recordingError || !recording) {
      return NextResponse.json({ error: 'Recording not found.' }, { status: 404 });
    }

    if (recording.status === 'approved') {
      return NextResponse.json({ error: 'Recording was already approved.' }, { status: 409 });
    }

    // Claim the pending recording before awarding so concurrent requests cannot
    // add the same points twice.
    const { data: updatedRecording, error: updateError } = await supabaseAdmin
      .from('recordings')
      .update({
        status: 'approved',
        points_awarded: pointsToAward,
        admin_notes: feedback,
        is_published: publish,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', recording.status)
      .select('id')
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!updatedRecording) {
      return NextResponse.json({ error: 'Recording was already approved.' }, { status: 409 });
    }

    let pointsAwarded = 0;
    if (pointsToAward > 0) {
      const result = await awardPointsWithDailyCapByUserId(recording.user_id, pointsToAward, {
        countTowardDailyLimit: false,
        successMessage: `Recording approved. +${pointsToAward} points added.`,
      });

      if (!result.success) {
        await supabaseAdmin
          .from('recordings')
          .update({
            status: recording.status,
            points_awarded: 0,
            reviewed_at: null,
          })
          .eq('id', id)
          .eq('status', 'approved');
        return NextResponse.json({ error: result.message }, { status: 500 });
      }
      pointsAwarded = result.pointsAwarded;
    }

    return NextResponse.json({ success: true, pointsAwarded });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
