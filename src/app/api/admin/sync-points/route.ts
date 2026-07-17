import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import {
  applyPendingManualPointUpdates,
  syncUsersPointsFromUsers,
} from '@/lib/sync-points';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync-points
 * 1) Syncs users_points up to match users when behind/missing
 * 2) Applies pending one-time manual adjustments only if not already applied
 *
 * Header: x-admin-auth: true
 */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const applyManual = body?.applyManual !== false;

    const sync = await syncUsersPointsFromUsers();
    const manual = applyManual ? await applyPendingManualPointUpdates() : [];

    // Re-sync after manual grants so both tables stay aligned.
    const postManualSync = applyManual ? await syncUsersPointsFromUsers() : null;

    return NextResponse.json({
      success: true,
      sync: {
        created: sync.created,
        updated: sync.updated,
        unchanged: sync.unchanged,
        changed: sync.synced.filter((r) => r.action === 'created' || r.action === 'synced'),
      },
      manual,
      postManualSync: postManualSync
        ? {
            created: postManualSync.created,
            updated: postManualSync.updated,
            unchanged: postManualSync.unchanged,
          }
        : null,
    });
  } catch (error: any) {
    console.error('[sync-points] failed:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to sync points' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    usage: 'POST with header x-admin-auth: true to sync desynced points and apply pending manual updates once.',
  });
}
