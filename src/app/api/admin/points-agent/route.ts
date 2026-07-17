import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { diagnosePointsIssues, runPointsAgent } from '@/lib/points-agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Admin Points Agent
 * - GET  : diagnose only
 * - POST : diagnose + auto-fix immediately
 *
 * Header: x-admin-auth: true
 */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const diagnosis = await diagnosePointsIssues();
    return NextResponse.json({
      success: true,
      agent: 'points-fixer',
      mode: 'diagnose',
      healthy: diagnosis.issues.filter((i) => i.severity === 'error').length === 0,
      ...diagnosis,
      usage: {
        diagnose: 'GET /api/admin/points-agent',
        fixNow: 'POST /api/admin/points-agent',
        cron: 'GET /api/cron/points-agent (Bearer CRON_SECRET)',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Diagnosis failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const report = await runPointsAgent({ applyManual: body?.applyManual !== false });
    return NextResponse.json({
      success: true,
      agent: 'points-fixer',
      mode: 'fix',
      ...report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Points agent failed' },
      { status: 500 }
    );
  }
}
