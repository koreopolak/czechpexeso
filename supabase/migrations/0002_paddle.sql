-- Czech Pexeso — switch billing from Stripe to Paddle and add lifetime Premium.
-- Run once in the Supabase SQL editor, after 0001_init.sql. Safe to re-run.
--
-- No payments were ever taken through Stripe, so the Stripe columns are
-- renamed rather than migrated.

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles' and column_name = 'stripe_customer_id') then
    alter table public.profiles rename column stripe_customer_id to paddle_customer_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles' and column_name = 'stripe_subscription_id') then
    alter table public.profiles rename column stripe_subscription_id to paddle_subscription_id;
  end if;
end $$;

alter table public.profiles add column if not exists paddle_customer_id text unique;
alter table public.profiles add column if not exists paddle_subscription_id text;

-- One-time "lifetime" purchase: Premium forever, independent of any subscription.
alter table public.profiles add column if not exists lifetime boolean not null default false;

comment on column public.profiles.subscription_status is 'Paddle: active | trialing | past_due | paused | canceled';
