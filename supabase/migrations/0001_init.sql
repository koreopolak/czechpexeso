-- Czech Pexeso — database schema.
-- Run once in the Supabase SQL editor (or `supabase db push`).
--
-- Security model:
--   * Row Level Security is ON for every table.
--   * Signed-in users may only READ their own rows.
--   * All writes go through the server with the service-role key
--     (Stripe webhooks write billing fields; /api/progress writes sync data),
--     so nobody can grant themselves Premium from the browser.

-- ---------------------------------------------------------------------------
-- profiles: one row per user, holds the Stripe link and subscription state
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  email                   text,
  stripe_customer_id      text unique,
  stripe_subscription_id  text,
  subscription_status     text,         -- active | trialing | past_due | canceled | unpaid | ...
  subscription_price_id   text,
  subscription_interval   text,         -- month | year
  current_period_end      timestamptz,  -- renewal date, or end date when cancelling
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- user_progress: Premium cloud sync (one JSON document per user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_progress (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "progress: read own" on public.user_progress;
create policy "progress: read own" on public.user_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Create a profile automatically for every new user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep the email copy in sync if a user changes their address.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute procedure public.handle_user_email_change();

-- Backfill profiles for users created before this migration.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
