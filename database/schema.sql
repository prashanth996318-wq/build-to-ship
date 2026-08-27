-- =============================================================================
-- AI-Powered Agriculture Crop Advisory Assistant
-- Production PostgreSQL Schema — Supabase
-- =============================================================================

-- Enable pgcrypto for UUID generation (gen_random_uuid)
create extension if not exists "pgcrypto";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

create type advisory_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

create type land_unit as enum (
  'acre',
  'hectare',
  'cent',
  'bigha',
  'other'
);

create type irrigation_availability as enum (
  'rainfed',
  'limited',
  'moderate',
  'reliable'
);

-- =============================================================================
-- TABLE: farm_profiles
-- Stores reusable farm profile information for a user.
-- =============================================================================

create table public.farm_profiles (
  id                    uuid          primary key default gen_random_uuid(),

  user_id               uuid          not null references auth.users(id) on delete cascade,

  farm_name             text,
  state                 text          not null,
  district              text          not null,
  village_or_locality   text,

  soil_type             text          not null,
  soil_ph               numeric(4,2),
  soil_notes            text,

  land_area             numeric(12,2) not null check (land_area > 0),
  land_unit             land_unit     not null,

  irrigation_availability irrigation_availability not null,
  water_source          text,

  current_season        text,
  previous_crop         text,

  farming_objective     text,
  preferred_crop_category text,

  additional_notes      text,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),

  constraint soil_ph_reasonable_range
    check (
      soil_ph is null
      or (soil_ph >= 0 and soil_ph <= 14)
    )
);

create index farm_profiles_user_id_idx
  on public.farm_profiles(user_id);

-- =============================================================================
-- TABLE: advisories
-- Stores each advisory request and its AI-generated result.
-- =============================================================================

create table public.advisories (
  id                    uuid          primary key default gen_random_uuid(),

  user_id               uuid          not null references auth.users(id) on delete cascade,

  -- Optional link to a saved farm profile (nullable so historical advisories
  -- remain understandable even if the profile is later deleted)
  farm_profile_id       uuid          references public.farm_profiles(id) on delete set null,

  -- Advisory processing status
  status                advisory_status not null default 'pending',

  -- Snapshot of location at time of advisory request
  state                 text          not null,
  district              text          not null,
  village_or_locality   text,

  -- Snapshot of soil conditions at time of request
  soil_type             text          not null,
  soil_ph               numeric(4,2),

  -- Snapshot of farm details at time of request
  land_area             numeric(12,2) not null check (land_area > 0),
  land_unit             land_unit     not null,

  irrigation_availability irrigation_availability not null,
  water_source          text,

  -- Agronomic context
  season                text          not null,
  previous_crop         text,

  crop_category         text,
  farming_objective     text,

  additional_notes      text,

  -- Full request payload stored for reproducibility (no secrets)
  request_payload       jsonb,

  -- Denormalized primary recommendation for quick listing queries
  recommended_crop      text,

  -- Full structured AI advisory result
  advisory_result       jsonb,

  -- AI model that generated this advisory (for audit/transparency)
  ai_model              text,

  -- Error tracking for failed advisories
  error_code            text,
  error_message         text,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),

  constraint advisories_soil_ph_reasonable_range
    check (
      soil_ph is null
      or (soil_ph >= 0 and soil_ph <= 14)
    )
);

-- Index for fast user advisory lookups
create index advisories_user_id_idx
  on public.advisories(user_id);

-- Index for chronological sorting
create index advisories_created_at_idx
  on public.advisories(created_at desc);

-- Composite index for most common query: user's advisories sorted by date
create index advisories_user_created_at_idx
  on public.advisories(user_id, created_at desc);

-- Index for status-based filtering
create index advisories_status_idx
  on public.advisories(status);

-- GIN index for JSONB advisory_result queries
create index advisories_result_gin_idx
  on public.advisories
  using gin(advisory_result);

-- =============================================================================
-- TRIGGER FUNCTION: set_updated_at
-- Automatically updates the updated_at timestamp on any row modification.
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_farm_profiles_updated_at
  before update on public.farm_profiles
  for each row
  execute function public.set_updated_at();

create trigger set_advisories_updated_at
  before update on public.advisories
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.farm_profiles enable row level security;
alter table public.advisories enable row level security;

-- =============================================================================
-- RLS POLICIES: farm_profiles
-- =============================================================================

create policy "Users can view their own farm profiles"
  on public.farm_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own farm profiles"
  on public.farm_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own farm profiles"
  on public.farm_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own farm profiles"
  on public.farm_profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- RLS POLICIES: advisories
-- =============================================================================

create policy "Users can view their own advisories"
  on public.advisories
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own advisories"
  on public.advisories
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own advisories"
  on public.advisories
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own advisories"
  on public.advisories
  for delete
  to authenticated
  using (auth.uid() = user_id);
