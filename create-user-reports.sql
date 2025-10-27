-- User Reports table and policies
-- Run this in Supabase SQL Editor

create table if not exists public.user_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_user_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  reason text not null check (reason in (
    'spam','inappropriate','fake_profile','harassment','scam','other'
  )),
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_reports_reported on public.user_reports(reported_user_id);
create index if not exists idx_user_reports_reporter on public.user_reports(reporter_user_id);

alter table public.user_reports enable row level security;

-- Only allow authenticated users to insert reports for themselves
drop policy if exists "insert_own_reports" on public.user_reports;
create policy "insert_own_reports" on public.user_reports
  for insert to authenticated
  with check (reporter_user_id = auth.uid());

-- By default, deny select/update/delete to clients; allow service-role on server.

grant insert on public.user_reports to authenticated;
revoke all on public.user_reports from anon;

select '✅ user_reports ready' as status;



