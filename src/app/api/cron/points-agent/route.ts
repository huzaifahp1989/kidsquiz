import { NextResponse } from 'next/server';
import { runPointsAgent } from '@/lib/points-agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  if (isVercelCron) return true;
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  // Allow local/dev without secret so the agent can be exercised quickly.
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
}

/**
 * Points Agent cron — diagnose + auto-fix points desync immediately.
 * Scheduled via vercel.json. Also callable manually with Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await runPointsAgent({ applyManual: true });
    return NextResponse.json({
      success: true,
      agent: 'points-fixer',
      ...report,
    });
  } catch (error: any) {
    console.error('[cron/points-agent] failed:', error);
    return NextResponse.json(
      {
        success: false,
        agent: 'points-fixer',
        error: error?.message || 'Points agent failed',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
