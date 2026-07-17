-- Make pledge point awards idempotent and auditable.
-- The application inserts this row before awarding points, so retries with the
-- same submission ID cannot award the same pledge twice.

ALTER TABLE public.pledges
  ADD COLUMN IF NOT EXISTS submission_id UUID,
  ADD COLUMN IF NOT EXISTS points_awarded INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS award_status TEXT NOT NULL DEFAULT 'completed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.pledges'::regclass
      AND conname = 'pledges_points_awarded_nonnegative'
  ) THEN
    ALTER TABLE public.pledges
      ADD CONSTRAINT pledges_points_awarded_nonnegative CHECK (points_awarded >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.pledges'::regclass
      AND conname = 'pledges_award_status_valid'
  ) THEN
    ALTER TABLE public.pledges
      ADD CONSTRAINT pledges_award_status_valid
      CHECK (award_status IN ('pending', 'completed'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS pledges_user_submission_unique
  ON public.pledges (user_id, submission_id)
  WHERE submission_id IS NOT NULL;
