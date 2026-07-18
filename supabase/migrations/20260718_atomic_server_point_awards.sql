-- Serialize point awards initiated by trusted API routes. Client-side awards
-- use award_points(integer); this RPC accepts an explicit user only for the
-- service role and keeps both point tables on their highest known totals.
create or replace function public.award_points_for_user(
  p_user_id uuid,
  p_points integer,
  p_count_toward_daily_limit boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_daily_limit constant integer := 100;
  v_weekly_limit constant integer := 400;
  v_today date := current_date;
  v_total_points integer := 0;
  v_weekly_points integer := 0;
  v_monthly_points integer := 0;
  v_today_points integer := 0;
  v_last_earned_date date;
  v_badges integer := 0;
  v_level integer := 1;
  v_user_total integer := 0;
  v_user_weekly integer := 0;
  v_user_monthly integer := 0;
  v_points_to_award integer := 0;
  v_new_total integer;
  v_new_weekly integer;
  v_new_monthly integer;
  v_new_today integer;
  v_new_badges integer;
  v_new_level integer;
  v_reason text;
  v_message text;
begin
  if p_user_id is null then
    return jsonb_build_object(
      'success', false,
      'reason', 'invalid_points',
      'message', 'A user ID is required.',
      'points_awarded', 0
    );
  end if;

  if p_points is null or p_points <= 0 then
    return jsonb_build_object(
      'success', false,
      'reason', 'invalid_points',
      'message', 'Points must be greater than 0.',
      'points_awarded', 0
    );
  end if;

  select
    coalesce(points, 0),
    coalesce(weeklypoints, 0),
    coalesce(monthlypoints, 0)
  into
    v_user_total,
    v_user_weekly,
    v_user_monthly
  from public.users
  where uid = p_user_id;

  v_user_total := coalesce(v_user_total, 0);
  v_user_weekly := coalesce(v_user_weekly, 0);
  v_user_monthly := coalesce(v_user_monthly, 0);

  -- Seed missing canonical rows from the legacy profile. The unique key plus
  -- the following row lock also serializes concurrent first-time awards.
  insert into public.users_points (
    user_id,
    total_points,
    weekly_points,
    monthly_points,
    today_points,
    last_earned_date
  )
  values (
    p_user_id,
    v_user_total,
    v_user_weekly,
    v_user_monthly,
    0,
    v_today
  )
  on conflict (user_id) do nothing;

  select
    coalesce(total_points, 0),
    coalesce(weekly_points, 0),
    coalesce(monthly_points, 0),
    coalesce(today_points, 0),
    last_earned_date,
    coalesce(badges, 0),
    coalesce(level, 1)
  into
    v_total_points,
    v_weekly_points,
    v_monthly_points,
    v_today_points,
    v_last_earned_date,
    v_badges,
    v_level
  from public.users_points
  where user_id = p_user_id
  for update;

  -- Re-read after taking the canonical lock so a concurrent mirror update
  -- cannot cause this award to overwrite a higher known total.
  select
    coalesce(points, 0),
    coalesce(weeklypoints, 0),
    coalesce(monthlypoints, 0)
  into
    v_user_total,
    v_user_weekly,
    v_user_monthly
  from public.users
  where uid = p_user_id;

  v_user_total := coalesce(v_user_total, 0);
  v_user_weekly := coalesce(v_user_weekly, 0);
  v_user_monthly := coalesce(v_user_monthly, 0);
  v_total_points := greatest(v_total_points, v_user_total);
  v_weekly_points := greatest(v_weekly_points, v_user_weekly);
  v_monthly_points := greatest(v_monthly_points, v_user_monthly);

  if v_last_earned_date is null or v_last_earned_date <> v_today then
    v_today_points := 0;
  end if;

  v_points_to_award := least(
    p_points,
    greatest(0, v_weekly_limit - v_weekly_points),
    case
      when coalesce(p_count_toward_daily_limit, true)
        then greatest(0, v_daily_limit - v_today_points)
      else p_points
    end
  );

  v_new_total := v_total_points + v_points_to_award;
  v_new_weekly := v_weekly_points + v_points_to_award;
  v_new_monthly := v_monthly_points + v_points_to_award;
  v_new_today := case
    when coalesce(p_count_toward_daily_limit, true)
      then v_today_points + v_points_to_award
    else v_today_points
  end;
  v_new_badges := greatest(v_badges, floor(v_new_total / 100.0)::integer);
  v_new_level := greatest(v_level, 1 + floor(v_new_badges / 5.0)::integer);

  -- Update even when capped: an attempted award also repairs a dual-table
  -- mismatch and performs the UTC daily rollover without lowering totals.
  update public.users_points
  set
    total_points = v_new_total,
    weekly_points = v_new_weekly,
    monthly_points = v_new_monthly,
    today_points = v_new_today,
    last_earned_date = v_today,
    badges = v_new_badges,
    level = v_new_level,
    updated_at = now()
  where user_id = p_user_id;

  begin
    update public.users
    set
      points = v_new_total,
      weeklypoints = v_new_weekly,
      monthlypoints = v_new_monthly,
      updatedat = now()
    where uid = p_user_id;
  exception when others then
    -- The canonical award must survive legacy-schema differences.
    null;
  end;

  if v_points_to_award > 0 then
    v_reason := 'awarded';
    v_message := format('+%s points added.', v_points_to_award);
  elsif v_weekly_points >= v_weekly_limit then
    v_reason := 'weekly_limit_reached';
    v_message := 'The weekly 400 point limit has already been reached.';
  else
    v_reason := 'daily_limit_reached';
    v_message := 'The daily 100 point limit has already been reached.';
  end if;

  return jsonb_build_object(
    'success', true,
    'reason', v_reason,
    'message', v_message,
    'points_awarded', v_points_to_award,
    'total_points', v_new_total,
    'weekly_points', v_new_weekly,
    'monthly_points', v_new_monthly,
    'today_points', v_new_today,
    'daily_limit', v_daily_limit,
    'weekly_limit', v_weekly_limit,
    'badges', v_new_badges,
    'level', v_new_level
  );
end;
$$;

revoke all on function public.award_points_for_user(uuid, integer, boolean) from public;
revoke all on function public.award_points_for_user(uuid, integer, boolean) from anon;
revoke all on function public.award_points_for_user(uuid, integer, boolean) from authenticated;
grant execute on function public.award_points_for_user(uuid, integer, boolean) to service_role;
