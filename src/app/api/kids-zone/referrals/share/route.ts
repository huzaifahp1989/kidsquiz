import { NextResponse } from 'next/server';
import { claimShareReward } from '@/lib/referral-tokens';
import { getAuthenticatedRequestUser } from '@/lib/request-auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedRequestUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await claimShareReward(authUser.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.message, setupRequired: result.setupRequired === true },
        { status: result.setupRequired ? 503 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
