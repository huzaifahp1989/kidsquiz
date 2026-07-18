-- Make Masjid Al-Aqsa review updates and point awards one idempotent transaction.

alter table public.masjid_al_aqsa_quiz_submissions
  add column if not exists points_awarded integer not null default 0,
  add column if not exists points_award_basis integer not null default 0;

-- This legacy trigger assumes question_marks is integer[] even though this table
-- stores JSONB, and it also overwrites the admin's explicit main-score override.
drop trigger if exists trg_compute_competition_scores
  on public.masjid_al_aqsa_quiz_submissions;

-- Existing approved rows were handled by the legacy route. Mark their effective
-- score as committed so deploying this migration cannot award them a second time.
update public.masjid_al_aqsa_quiz_submissions
set
  points_awarded = greatest(
    0,
    coalesce(total_score, 0) + greatest(
      -15,
      least(
        15,
        coalesce(
          substring(admin_notes from '\[\[manual_adjustment=(-?\d+)\]\]')::integer,
          0
        )
      )
    )
  ),
  points_award_basis = greatest(
    0,
    coalesce(total_score, 0) + greatest(
      -15,
      least(
        15,
        coalesce(
          substring(admin_notes from '\[\[manual_adjustment=(-?\d+)\]\]')::integer,
          0
        )
      )
    )
  )
where status = 'approved'
  and points_award_basis = 0;

create or replace function public.review_masjid_al_aqsa_submission(
  p_submission_id uuid,
  p_question_marks integer[],
  p_bonus_marks integer,
  p_main_score integer,
  p_manual_adjustment integer,
  p_action text,
  p_admin_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.masjid_al_aqsa_quiz_submissions%rowtype;
  v_updated public.masjid_al_aqsa_quiz_submissions%rowtype;
  v_status text;
  v_marks integer[];
  v_bonus integer;
  v_main integer;
  v_total integer;
  v_adjustment integer;
  v_effective integer;
  v_previous_basis integer;
  v_delta integer := 0;
  v_actual_award integer := 0;
  v_user_total integer := 0;
  v_user_weekly integer := 0;
  v_user_monthly integer := 0;
  v_points_total integer := 0;
  v_points_weekly integer := 0;
  v_points_monthly integer := 0;
  v_base_total integer := 0;
  v_base_weekly integer := 0;
  v_base_monthly integer := 0;
  v_badges integer := 0;
  v_level integer := 1;
  v_is_test_mode boolean := false;
begin
  if p_action not in ('review', 'approve', 'reject') then
    raise exception 'Invalid review action';
  end if;

  select *
  into v_submission
  from public.masjid_al_aqsa_quiz_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  select coalesce(array_agg(case when mark > 0 then 1 else 0 end order by ordinal), '{}'::integer[])
  into v_marks
  from unnest(coalesce(p_question_marks, '{}'::integer[])) with ordinality as submitted(mark, ordinal);

  v_bonus := greatest(0, least(5, coalesce(p_bonus_marks, 0)));
  v_main := greatest(0, least(10, coalesce(p_main_score, 0)));
  v_total := least(15, v_main + v_bonus);
  v_adjustment := greatest(-15, least(15, coalesce(p_manual_adjustment, 0)));
  v_effective := greatest(0, v_total + v_adjustment);
  v_previous_basis := greatest(0, coalesce(v_submission.points_award_basis, 0));
  v_status := case p_action
    when 'approve' then 'approved'
    when 'reject' then 'rejected'
    else 'reviewed'
  end;

  -- The score trigger recalculates main_score when marks change. Apply the
  -- explicit admin override in a second update inside this same transaction.
  update public.masjid_al_aqsa_quiz_submissions
  set
    question_marks = to_jsonb(v_marks),
    bonus_marks = v_bonus,
    status = v_status,
    admin_notes = nullif(trim(coalesce(p_admin_notes, '')), ''),
    reviewed_at = timezone('utc'::text, now()),
    reviewed_by = 'admin',
    updated_at = timezone('utc'::text, now())
  where id = p_submission_id;

  update public.masjid_al_aqsa_quiz_submissions
  set
    main_score = v_main,
    total_score = v_total,
    updated_at = timezone('utc'::text, now())
  where id = p_submission_id;

  if v_status = 'approved' and v_submission.user_id is not null then
    v_delta := greatest(0, v_effective - v_previous_basis);

    if v_delta > 0 then
      select
        coalesce(points, 0),
        coalesce(weeklypoints, 0),
        coalesce(monthlypoints, 0),
        lower(trim(coalesce(email, ''))) = 'huzaify786@gmail.com'
      into
        v_user_total,
        v_user_weekly,
        v_user_monthly,
        v_is_test_mode
      from public.users
      where uid = v_submission.user_id
      for update;

      insert into public.users_points (
        user_id,
        total_points,
        weekly_points,
        monthly_points,
        today_points,
        last_earned_date
      )
      values (
        v_submission.user_id,
        coalesce(v_user_total, 0),
        coalesce(v_user_weekly, 0),
        coalesce(v_user_monthly, 0),
        0,
        (now() at time zone 'utc')::date
      )
      on conflict (user_id) do nothing;

      select
        coalesce(total_points, 0),
        coalesce(weekly_points, 0),
        coalesce(monthly_points, 0)
      into
        v_points_total,
        v_points_weekly,
        v_points_monthly
      from public.users_points
      where user_id = v_submission.user_id
      for update;

      v_base_total := greatest(v_points_total, coalesce(v_user_total, 0));
      v_base_weekly := greatest(v_points_weekly, coalesce(v_user_weekly, 0));
      v_base_monthly := greatest(v_points_monthly, coalesce(v_user_monthly, 0));

      if not coalesce(v_is_test_mode, false) then
        v_actual_award := least(v_delta, greatest(0, 400 - v_base_weekly));
      end if;

      v_badges := floor((v_base_total + v_actual_award) / 100.0);
      v_level := 1 + floor(v_badges / 5.0);

      update public.users_points
      set
        total_points = v_base_total + v_actual_award,
        weekly_points = v_base_weekly + v_actual_award,
        monthly_points = v_base_monthly + v_actual_award,
        badges = v_badges,
        level = v_level,
        updated_at = timezone('utc'::text, now())
      where user_id = v_submission.user_id;

      update public.users
      set
        points = v_base_total + v_actual_award,
        weeklypoints = v_base_weekly + v_actual_award,
        monthlypoints = v_base_monthly + v_actual_award
      where uid = v_submission.user_id;
    end if;

    update public.masjid_al_aqsa_quiz_submissions
    set
      points_awarded = greatest(0, coalesce(points_awarded, 0)) + v_actual_award,
      points_award_basis = greatest(v_previous_basis, v_effective),
      updated_at = timezone('utc'::text, now())
    where id = p_submission_id;
  end if;

  select *
  into v_updated
  from public.masjid_al_aqsa_quiz_submissions
  where id = p_submission_id;

  return jsonb_build_object(
    'submission', to_jsonb(v_updated),
    'points_awarded', v_actual_award,
    'points_requested', v_delta
  );
end;
$$;

revoke all on function public.review_masjid_al_aqsa_submission(
  uuid,
  integer[],
  integer,
  integer,
  integer,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.review_masjid_al_aqsa_submission(
  uuid,
  integer[],
  integer,
  integer,
  integer,
  text,
  text
) to service_role;
