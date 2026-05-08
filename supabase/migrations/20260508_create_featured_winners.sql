create table if not exists featured_winners (
  user_id uuid primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table featured_winners enable row level security;

drop policy if exists "read_featured_winners" on featured_winners;
create policy "read_featured_winners"
on featured_winners
for select
using (true);

grant select on featured_winners to anon;
grant select on featured_winners to authenticated;
grant all on featured_winners to service_role;

