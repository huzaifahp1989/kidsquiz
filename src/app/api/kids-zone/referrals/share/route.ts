import { NextResponse } from 'next/server';
import { claimShareReward } from '@/lib/referral-tokens';
import { getAuthenticatedRequestUser } from '@/lib/request-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const authUser = await getAuthenticatedRequestUser(request);
    if (!authUser || authUser.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await claimShareReward(userId);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
