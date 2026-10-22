create table if not exists public.qr_login_challenges (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null,
  secret_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists qr_login_challenges_expiry_idx
  on public.qr_login_challenges(expires_at);

create table if not exists public.user_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null default 'Qurilma',
  user_agent text,
  refresh_token_ciphertext text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists user_sessions_user_last_seen_idx
  on public.user_sessions(user_id, last_seen_at desc);

alter table public.qr_login_challenges enable row level security;
alter table public.user_sessions enable row level security;

revoke all on public.qr_login_challenges from public, anon, authenticated;
revoke all on public.user_sessions from public, anon, authenticated;
grant all on public.qr_login_challenges to service_role;
grant all on public.user_sessions to service_role;

create or replace function public.vimi_consume_qr_login(
  p_challenge_id uuid,
  p_secret_hash text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  result_token_hash text;
begin
  update public.qr_login_challenges
  set consumed_at = now()
  where id = p_challenge_id
    and secret_hash = p_secret_hash
    and consumed_at is null
    and expires_at > now()
  returning token_hash into result_token_hash;

  return result_token_hash;
end;
$$;

revoke all on function public.vimi_consume_qr_login(uuid, text) from public, anon, authenticated;
grant execute on function public.vimi_consume_qr_login(uuid, text) to service_role;