---
name: points-fixer
description: Diagnose and immediately fix kidsquiz points system issues (users vs users_points desync, missing profiles, award_points regressions, pending manual grants).
---

# Points Fixer

When the user mentions points not updating, leaderboard wrong, missing points, or asks to fix points — act immediately.

## First actions
1. Run or implement the self-heal path in `src/lib/points-agent.ts`.
2. Prefer:
   - `POST /api/admin/points-agent` with `x-admin-auth: true`
   - `GET /api/cron/points-agent` with `Authorization: Bearer $CRON_SECRET`
   - `FIX_POINTS_SYNC.sql` for DB/RPC repair
3. Do not ask for confirmation before safe idempotent repairs (sync up, create missing rows, coalesce NULLs).

## Guardrails
- Never wipe or reduce points unless explicitly requested.
- Never double-apply Sara/Husnain manual grants (`points_manual_adjustments`).
- Keep code changes scoped to points reliability.

## Known root causes
- Dual-table desync (`users` vs `users_points`)
- Missing `users_points` seeded as zeros while `users` has totals
- `award_points` sync to `users` failing and rolling back awards
- Auth user without `public.users` profile
