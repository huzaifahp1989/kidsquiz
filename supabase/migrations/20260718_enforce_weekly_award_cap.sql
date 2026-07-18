-- Keep authenticated point awards within the 100-point daily and 400-point
-- weekly limits. The users_points row lock serializes concurrent awards.
create or replace function public.award_points(p_points integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
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
  v_points_to_award integer;
  v_new_total integer;
  v_new_weekly integer;
  v_new_monthly integer;
  v_new_today integer;
  v_new_badges integer;
  v_new_level integer;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'User not authenticated',
      'points_awarded', 0
    );
  end if;

  if p_points is null or p_points <= 0 then
    return jsonb_build_object(
      'success', false,
      'message', 'Points must be greater than 0',
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
  where uid = v_user_id;

  v_user_total := coalesce(v_user_total, 0);
  v_user_weekly := coalesce(v_user_weekly, 0);
  v_user_monthly := coalesce(v_user_monthly, 0);

  -- Seed a missing row from the legacy profile instead of resetting it to zero.
  insert into public.users_points (
    user_id,
    total_points,
    weekly_points,
    monthly_points,
    today_points,
    last_earned_date
  )
  values (
    v_user_id,
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
  where user_id = v_user_id
  for update;

  -- Re-read the legacy mirror after acquiring the canonical row lock, then
  -- lift both sides from the higher value so an award never loses points.
  select
    coalesce(points, 0),
    coalesce(weeklypoints, 0),
    coalesce(monthlypoints, 0)
  into
    v_user_total,
    v_user_weekly,
    v_user_monthly
  from public.users
  where uid = v_user_id;

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
    greatest(0, v_daily_limit - v_today_points),
    greatest(0, v_weekly_limit - v_weekly_points)
  );

  if v_points_to_award <= 0 then
    return jsonb_build_object(
      'success', false,
      'message', case
        when v_weekly_points >= v_weekly_limit then 'Weekly limit of 400 points reached'
        else 'Daily limit of 100 points reached'
      end,
      'points_awarded', 0,
      'total_points', v_total_points,
      'today_points', v_today_points,
      'weekly_points', v_weekly_points,
      'monthly_points', v_monthly_points,
      'daily_limit', v_daily_limit,
      'weekly_limit', v_weekly_limit
    );
  end if;

  v_new_total := v_total_points + v_points_to_award;
  v_new_weekly := v_weekly_points + v_points_to_award;
  v_new_monthly := v_monthly_points + v_points_to_award;
  v_new_today := v_today_points + v_points_to_award;
  v_new_badges := greatest(v_badges, floor(v_new_total / 100.0)::integer);
  v_new_level := greatest(v_level, 1 + floor(v_new_badges / 5.0)::integer);

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
  where user_id = v_user_id;

  -- A legacy-profile mismatch must not roll back the canonical award.
  begin
    update public.users
    set
      points = v_new_total,
      weeklypoints = v_new_weekly,
      monthlypoints = v_new_monthly,
      updatedat = now()
    where uid = v_user_id;
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'success', true,
    'message', 'Points awarded successfully',
    'points_awarded', v_points_to_award,
    'total_points', v_new_total,
    'today_points', v_new_today,
    'weekly_points', v_new_weekly,
    'monthly_points', v_new_monthly,
    'badges', v_new_badges,
    'level', v_new_level,
    'badges_earned_now', v_new_badges - v_badges,
    'daily_limit', v_daily_limit,
    'weekly_limit', v_weekly_limit
  );
end;
$$;

revoke all on function public.award_points(integer) from public;
revoke all on function public.award_points(integer) from anon;
grant execute on function public.award_points(integer) to authenticated;
grant execute on function public.award_points(integer) to service_role;
