-- Current schema for Fam Dinners / Family Meal Planner.
-- Safe to run on a fresh Supabase project; also backfills columns added after the initial prototype.

create extension if not exists pgcrypto;

-- Profiles are 1:1 with Supabase auth users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_members jsonb not null default '[]'::jsonb,
  dietary_restrictions text[] not null default '{}',
  dislikes text[] not null default '{}',
  onboarding_complete boolean not null default false,
  calendar_token uuid unique,
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists family_members jsonb not null default '[]'::jsonb,
  add column if not exists dietary_restrictions text[] not null default '{}',
  add column if not exists dislikes text[] not null default '{}',
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists calendar_token uuid unique,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_calendar_token_idx
  on public.profiles(calendar_token);

-- Weekly plans, one current plan per user/week.
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  plan jsonb not null default '[]'::jsonb,
  share_token uuid not null default gen_random_uuid(),
  finalized boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, week_start),
  unique (share_token)
);

alter table public.meal_plans
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists share_token uuid default gen_random_uuid(),
  add column if not exists finalized boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_plans_pkey'
      and conrelid = 'public.meal_plans'::regclass
  ) then
    alter table public.meal_plans add constraint meal_plans_pkey primary key (id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_plans_user_id_week_start_key'
      and conrelid = 'public.meal_plans'::regclass
  ) then
    alter table public.meal_plans add constraint meal_plans_user_id_week_start_key unique (user_id, week_start);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_plans_share_token_key'
      and conrelid = 'public.meal_plans'::regclass
  ) then
    alter table public.meal_plans add constraint meal_plans_share_token_key unique (share_token);
  end if;
end $$;

update public.meal_plans
set id = gen_random_uuid()
where id is null;

update public.meal_plans
set share_token = gen_random_uuid()
where share_token is null;

alter table public.meal_plans
  alter column id set not null,
  alter column share_token set not null;

create index if not exists meal_plans_user_week_idx
  on public.meal_plans(user_id, week_start desc);

create index if not exists meal_plans_share_token_idx
  on public.meal_plans(share_token);

-- Household-level ratings that steer future prompts.
create table if not exists public.meal_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_name text not null,
  rating_type text not null check (rating_type in ('keep', 'discard', 'tweak')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meal_name)
);

create index if not exists meal_ratings_user_updated_idx
  on public.meal_ratings(user_id, updated_at desc);

-- User-imported and copied curated recipes.
create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text not null,
  imported_at timestamptz not null default now(),
  meal_name text not null,
  description text not null default '',
  cook_time_minutes integer not null default 30 check (cook_time_minutes > 0),
  emoji text not null default '🍽️',
  sides_suggestion text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  unique (user_id, source_url)
);

create index if not exists saved_recipes_user_imported_idx
  on public.saved_recipes(user_id, imported_at desc);

-- Seeded curated recipe library. Service-role scripts maintain this table.
create table if not exists public.curated_recipes (
  id uuid primary key default gen_random_uuid(),
  meal_name text not null unique,
  description text not null default '',
  cook_time_minutes integer not null default 30 check (cook_time_minutes > 0),
  emoji text not null default '🍽️',
  cuisine text not null,
  kid_friendly boolean not null default false,
  sides_suggestion text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists curated_recipes_cuisine_idx
  on public.curated_recipes(cuisine);

create index if not exists curated_recipes_kid_friendly_idx
  on public.curated_recipes(kid_friendly);

-- Row-level security.
alter table public.profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_ratings enable row level security;
alter table public.saved_recipes enable row level security;
alter table public.curated_recipes enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can view own meal plans" on public.meal_plans;
create policy "Users can view own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own meal plans" on public.meal_plans;
create policy "Users can insert own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own meal plans" on public.meal_plans;
create policy "Users can update own meal plans"
  on public.meal_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own meal ratings" on public.meal_ratings;
create policy "Users can view own meal ratings"
  on public.meal_ratings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own meal ratings" on public.meal_ratings;
create policy "Users can insert own meal ratings"
  on public.meal_ratings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own meal ratings" on public.meal_ratings;
create policy "Users can update own meal ratings"
  on public.meal_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own saved recipes" on public.saved_recipes;
create policy "Users can view own saved recipes"
  on public.saved_recipes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved recipes" on public.saved_recipes;
create policy "Users can insert own saved recipes"
  on public.saved_recipes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved recipes" on public.saved_recipes;
create policy "Users can update own saved recipes"
  on public.saved_recipes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read curated recipes" on public.curated_recipes;
create policy "Authenticated users can read curated recipes"
  on public.curated_recipes for select
  to authenticated
  using (true);
