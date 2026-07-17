import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedRequestUser } from '@/lib/request-auth';
import { awardPointsWithDailyCapByUserId } from '@/lib/server-points';

const POINTS_PER_RECORDING = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const storyId = typeof body?.storyId === 'string' ? body.storyId.trim() : '';

    if (!userId || !storyId) {
      return NextResponse.json({ error: 'userId and storyId are required' }, { status: 400 });
    }

    const authUser = await getAuthenticatedRequestUser(req);
    if (!authUser || authUser.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingSameWeek, error: existingError } = await supabaseAdmin
      .from('recordings')
      .select('id')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .gte('created_at', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (existingError) {
      throw existingError;
    }

    if (Array.isArray(existingSameWeek) && existingSameWeek.length > 0) {
      return NextResponse.json({ ok: true, alreadyRecorded: true, pointsAwarded: 0 });
    }

    const { data: recording, error: recordingError } = await supabaseAdmin
      .from('recordings')
      .insert({
        user_id: userId,
        story_id: storyId,
        audio_path: `external/${userId}/${Date.now()}`,
        duration: 0,
        status: 'approved',
      })
      .select('id')
      .single();

    if (recordingError) {
      throw recordingError;
    }

    const awardResult = await awardPointsWithDailyCapByUserId(userId, POINTS_PER_RECORDING, {
      successMessage: `Story recording completed. +${POINTS_PER_RECORDING} points added.`,
    });

    if (!awardResult.success && awardResult.reason === 'update_failed') {
      // Let the user retry if the points write failed after recording creation.
      await supabaseAdmin.from('recordings').delete().eq('id', recording.id);
      throw new Error(awardResult.message);
    }

    return NextResponse.json({
      ok: true,
      pointsAwarded: awardResult.pointsAwarded,
      totalPoints: awardResult.totalPoints,
      weeklyPoints: awardResult.weeklyPoints,
      monthlyPoints: awardResult.monthlyPoints,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}