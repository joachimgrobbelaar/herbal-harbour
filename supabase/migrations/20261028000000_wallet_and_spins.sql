-- ─────────────────────────────────────────────────────────────
-- profiles: extends auth.users with wallet + spin state
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  display_name        text,
  wallet_balance      numeric(10,2) not null default 0
                      check (wallet_balance >= 0),
  free_spins_remaining int not null default 3
                      check (free_spins_remaining between 0 and 3),
  created_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "update own display name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- spin_log: immutable audit trail. Every spin = one row.
-- ─────────────────────────────────────────────────────────────
create table public.spin_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  cost        numeric(10,2) not null check (cost >= 0),
  payout      numeric(10,2) not null check (payout >= 0),
  symbols     text[] not null check (array_length(symbols, 1) = 3),
  is_free     boolean not null,
  created_at  timestamptz not null default now()
);

create index spin_log_user_created_idx on public.spin_log (user_id, created_at desc);

alter table public.spin_log enable row level security;

create policy "read own spin log"
  on public.spin_log for select
  using (auth.uid() = user_id);

-- Only the service role (Edge Function) may insert into spin_log.
revoke insert on public.spin_log from public, anon, authenticated;
grant insert on public.spin_log to service_role;
