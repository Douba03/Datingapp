-- User Blocks: prevent two users from seeing/matching each other
-- Run this in Supabase SQL Editor

create table if not exists public.user_blocks (
  blocker_user_id uuid not null references public.users(id) on delete cascade,
  blocked_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id)
);

create index if not exists idx_user_blocks_blocked on public.user_blocks(blocked_user_id);

alter table public.user_blocks enable row level security;

-- Only allow a user to create/delete/read their own block relationships
drop policy if exists "insert own block" on public.user_blocks;
create policy "insert own block"
on public.user_blocks for insert to authenticated
with check (blocker_user_id = auth.uid());

drop policy if exists "select own blocks" on public.user_blocks;
create policy "select own blocks"
on public.user_blocks for select to authenticated
using (blocker_user_id = auth.uid());

drop policy if exists "delete own blocks" on public.user_blocks;
create policy "delete own blocks"
on public.user_blocks for delete to authenticated
using (blocker_user_id = auth.uid());

grant insert, select, delete on public.user_blocks to authenticated;
revoke all on public.user_blocks from anon;

select '✅ user_blocks ready' as status;



