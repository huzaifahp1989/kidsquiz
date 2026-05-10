create table if not exists weekly_competition_progress (
  user_id uuid not null,
  week_start date not null,
  did_quiz boolean not null default false,
  did_pledge boolean not null default false,
  did_game boolean not null default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, week_start)
);

create index if not exists idx_weekly_competition_progress_week_start
on weekly_competition_progress (week_start);

alter table weekly_competition_progress disable row level security;

