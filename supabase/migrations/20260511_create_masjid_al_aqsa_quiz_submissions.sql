create table if not exists masjid_al_aqsa_quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  competition_key text not null default 'masjid-al-aqsa-quiz-2026',
  user_id uuid,
  full_name text not null,
  email text not null,
  email_normalized text not null,
  question_order jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  bonus_answer text not null default '',
  time_taken_seconds integer not null default 0,
  status text not null default 'submitted',
  question_marks jsonb not null default '[]'::jsonb,
  bonus_marks integer not null default 0,
  main_score integer not null default 0,
  total_score integer not null default 0,
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists idx_masjid_al_aqsa_quiz_email_normalized
  on masjid_al_aqsa_quiz_submissions (email_normalized);

create unique index if not exists idx_masjid_al_aqsa_quiz_user_id
  on masjid_al_aqsa_quiz_submissions (user_id)
  where user_id is not null;

create index if not exists idx_masjid_al_aqsa_quiz_status
  on masjid_al_aqsa_quiz_submissions (status);

create index if not exists idx_masjid_al_aqsa_quiz_total_score
  on masjid_al_aqsa_quiz_submissions (total_score desc);

alter table masjid_al_aqsa_quiz_submissions disable row level security;
