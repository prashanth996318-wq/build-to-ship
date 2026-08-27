-- =============================================================================
-- CropSage — AI-Powered Agriculture Crop Advisory Assistant
-- Supabase Cloud PostgreSQL Migration
-- File    : 001_initial_schema.sql
-- Version : 1.0.0
-- Applies : Full schema, RLS policies, helper functions, seed / reference data
-- =============================================================================
-- Run via: node scripts/run-migration.mjs
-- Or paste into: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SAFETY GUARDS (idempotent re-run support)
-- ---------------------------------------------------------------------------
-- Each block uses CREATE IF NOT EXISTS / OR REPLACE so the migration can be
-- re-applied without error if the objects already exist.

-- ---------------------------------------------------------------------------
-- EXTENSION
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- Drop + recreate approach is NOT used because Supabase production enums
-- should not be dropped once data exists.  We use DO $$ blocks to add
-- types only if they do not already exist.
-- ---------------------------------------------------------------------------

do $$ begin
  create type advisory_status as enum (
    'pending',
    'processing',
    'completed',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type land_unit as enum (
    'acre',
    'hectare',
    'cent',
    'bigha',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type irrigation_availability as enum (
    'rainfed',
    'limited',
    'moderate',
    'reliable'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- TABLE: farm_profiles
-- Stores reusable farm profile information owned by a single authenticated
-- user. Each row is associated with auth.users via a foreign key.
-- ---------------------------------------------------------------------------

create table if not exists public.farm_profiles (
  id                      uuid          primary key default gen_random_uuid(),

  -- Owner — cascade delete so profiles are removed when the user is deleted
  user_id                 uuid          not null references auth.users(id) on delete cascade,

  -- Human-readable name for this farm / field
  farm_name               text,

  -- Location
  state                   text          not null,
  district                text          not null,
  village_or_locality     text,

  -- Soil
  soil_type               text          not null,
  soil_ph                 numeric(4,2),
  soil_notes              text,

  -- Land
  land_area               numeric(12,2) not null check (land_area > 0),
  land_unit               land_unit     not null,

  -- Water
  irrigation_availability irrigation_availability not null,
  water_source            text,

  -- Agronomy
  current_season          text,
  previous_crop           text,
  farming_objective       text,
  preferred_crop_category text,

  additional_notes        text,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now(),

  constraint farm_profiles_soil_ph_range
    check (soil_ph is null or (soil_ph >= 0 and soil_ph <= 14))
);

-- Indexes
create index if not exists farm_profiles_user_id_idx
  on public.farm_profiles(user_id);

-- ---------------------------------------------------------------------------
-- TABLE: advisories
-- Stores each advisory request submitted by an authenticated user, along with
-- the AI-generated result once processing completes.
-- ---------------------------------------------------------------------------

create table if not exists public.advisories (
  id                      uuid          primary key default gen_random_uuid(),

  -- Owner
  user_id                 uuid          not null references auth.users(id) on delete cascade,

  -- Optional link to a saved farm profile.
  -- ON DELETE SET NULL: historical advisories remain readable even if the
  -- farm profile is later deleted.
  farm_profile_id         uuid          references public.farm_profiles(id) on delete set null,

  -- Processing state
  status                  advisory_status not null default 'pending',

  -- ── Snapshot of inputs at time of request ──
  -- Stored directly on the advisory so historical records remain meaningful
  -- even if the user later changes their farm profile.
  state                   text          not null,
  district                text          not null,
  village_or_locality     text,

  soil_type               text          not null,
  soil_ph                 numeric(4,2),

  land_area               numeric(12,2) not null check (land_area > 0),
  land_unit               land_unit     not null,

  irrigation_availability irrigation_availability not null,
  water_source            text,

  season                  text          not null,
  previous_crop           text,
  crop_category           text,
  farming_objective       text,
  additional_notes        text,

  -- Full validated request payload (JSON snapshot for reproducibility).
  -- Does NOT contain authentication tokens or secrets.
  request_payload         jsonb,

  -- Denormalized primary recommendation for quick list-view rendering
  -- without needing to deserialize the full advisory_result JSONB.
  recommended_crop        text,

  -- Full structured AI advisory response (validated against Zod schema
  -- before storage — see backend/src/validators/advisory.ts).
  advisory_result         jsonb,

  -- Which Gemini model generated this advisory (for audit / transparency).
  ai_model                text,

  -- Error tracking for advisories that failed AI generation.
  error_code              text,
  error_message           text,

  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now(),

  constraint advisories_soil_ph_range
    check (soil_ph is null or (soil_ph >= 0 and soil_ph <= 14))
);

-- Indexes
create index if not exists advisories_user_id_idx
  on public.advisories(user_id);

create index if not exists advisories_created_at_idx
  on public.advisories(created_at desc);

-- Composite index: most common query (user's advisories, newest first)
create index if not exists advisories_user_created_at_idx
  on public.advisories(user_id, created_at desc);

create index if not exists advisories_status_idx
  on public.advisories(status);

-- GIN index: fast JSONB searches / filtering on advisory_result
create index if not exists advisories_result_gin_idx
  on public.advisories using gin(advisory_result);

-- ---------------------------------------------------------------------------
-- TABLE: crop_reference (reference / seed data)
-- A lightweight reference table of common crops with agronomic metadata.
-- Used for lookup / validation suggestions in the UI.
-- No RLS needed — this table is public read-only reference data.
-- ---------------------------------------------------------------------------

create table if not exists public.crop_reference (
  id             uuid    primary key default gen_random_uuid(),
  crop_name      text    not null unique,
  category       text    not null,   -- Cereal, Pulse, Oilseed, Vegetable, Fruit, Cash crop, etc.
  typical_season text,               -- Kharif / Rabi / Zaid / Year-round
  min_ph         numeric(4,2),
  max_ph         numeric(4,2),
  irrigation_requirement text,       -- Low / Medium / High
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists crop_reference_category_idx
  on public.crop_reference(category);

create index if not exists crop_reference_season_idx
  on public.crop_reference(typical_season);

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: set_updated_at
-- Automatically stamps updated_at on any row modification.
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach trigger to farm_profiles (idempotent)
do $$ begin
  create trigger set_farm_profiles_updated_at
    before update on public.farm_profiles
    for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

-- Attach trigger to advisories (idempotent)
do $$ begin
  create trigger set_advisories_updated_at
    before update on public.advisories
    for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table public.farm_profiles enable row level security;
alter table public.advisories    enable row level security;
-- crop_reference is public read-only — no RLS required

-- ---------------------------------------------------------------------------
-- RLS POLICIES: farm_profiles
-- Each policy enforces auth.uid() = user_id so users can only ever access
-- their own rows.  No back-door bypass is possible even with direct SQL
-- access (unless the caller uses the service-role key, which never reaches
-- the browser).
-- ---------------------------------------------------------------------------

do $$ begin
  create policy "farm_profiles: owners can select"
    on public.farm_profiles for select
    to authenticated
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "farm_profiles: owners can insert"
    on public.farm_profiles for insert
    to authenticated
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "farm_profiles: owners can update"
    on public.farm_profiles for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "farm_profiles: owners can delete"
    on public.farm_profiles for delete
    to authenticated
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- RLS POLICIES: advisories
-- ---------------------------------------------------------------------------

do $$ begin
  create policy "advisories: owners can select"
    on public.advisories for select
    to authenticated
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "advisories: owners can insert"
    on public.advisories for insert
    to authenticated
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "advisories: owners can update"
    on public.advisories for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "advisories: owners can delete"
    on public.advisories for delete
    to authenticated
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- SEED DATA: crop_reference
-- Common South Asian and globally relevant crops with basic agronomic metadata.
-- Useful as reference / suggestion data in the application UI.
-- ---------------------------------------------------------------------------

insert into public.crop_reference
  (crop_name, category, typical_season, min_ph, max_ph, irrigation_requirement, notes)
values
  -- Cereals
  ('Rice (Paddy)',        'Cereals', 'Kharif (monsoon season)', 5.0, 7.0, 'High',   'Requires standing water in early stages. Common in tropical and subtropical regions.'),
  ('Wheat',              'Cereals', 'Rabi (winter season)',    6.0, 7.5, 'Medium', 'Cool-season crop. Requires well-drained loamy soil.'),
  ('Maize (Corn)',       'Cereals', 'Kharif (monsoon season)', 5.8, 7.0, 'Medium', 'Warm-season crop. Versatile across many soil types.'),
  ('Sorghum (Jowar)',    'Cereals', 'Kharif (monsoon season)', 5.5, 7.5, 'Low',    'Drought-tolerant. Suitable for rainfed conditions.'),
  ('Pearl Millet (Bajra)','Cereals','Kharif (monsoon season)', 6.0, 8.0, 'Low',    'Highly drought-tolerant. Thrives in sandy and sandy-loam soils.'),
  ('Finger Millet (Ragi)','Cereals','Kharif (monsoon season)', 5.0, 8.0, 'Low',    'Highly nutritious. Adapts well to hilly and dry regions.'),
  ('Barley',             'Cereals', 'Rabi (winter season)',    6.0, 8.0, 'Low',    'Hardy crop. Tolerates alkaline soils better than wheat.'),
  ('Oats',               'Cereals', 'Rabi (winter season)',    5.0, 7.0, 'Medium', 'Cool-season crop used for grain and fodder.'),

  -- Pulses
  ('Chickpea (Bengal Gram)','Pulses','Rabi (winter season)',  6.0, 9.0, 'Low',    'Nitrogen-fixing legume. Prefers well-drained loamy soils.'),
  ('Pigeon Pea (Tur/Arhar)','Pulses','Kharif (monsoon season)',5.0,7.0, 'Low',    'Drought-tolerant perennial legume. Deep taproots.'),
  ('Black Gram (Urad)',   'Pulses', 'Kharif (monsoon season)', 5.5, 7.0, 'Low',    'Short-duration legume. Grows well in sandy loam soils.'),
  ('Green Gram (Moong)',  'Pulses', 'Zaid (summer season)',    6.0, 7.5, 'Low',    'Short-duration crop. Suitable for summer and kharif.'),
  ('Lentil (Masoor)',     'Pulses', 'Rabi (winter season)',    6.0, 8.0, 'Low',    'Cool-season legume. Prefers well-drained clay loam soils.'),
  ('Soybean',             'Pulses', 'Kharif (monsoon season)', 6.0, 7.0, 'Medium', 'High-protein crop. Also classified as oilseed.'),
  ('Field Pea',           'Pulses', 'Rabi (winter season)',    6.0, 7.5, 'Medium', 'Cool-season crop. Nitrogen-fixing legume.'),

  -- Oilseeds
  ('Groundnut (Peanut)',  'Oilseeds','Kharif (monsoon season)',6.0,7.0, 'Medium', 'Requires well-drained sandy loam. Calcium-sensitive.'),
  ('Sunflower',           'Oilseeds','Kharif (monsoon season)',6.0,7.5, 'Medium', 'Tolerates drought reasonably well.'),
  ('Mustard (Rapeseed)',  'Oilseeds','Rabi (winter season)',   6.0,7.5, 'Low',    'Cool-season crop. Tolerates light frost.'),
  ('Sesame (Gingelly)',   'Oilseeds','Kharif (monsoon season)',5.5,8.0, 'Low',    'Extremely drought-tolerant. Prefers sandy loam.'),
  ('Castor',              'Oilseeds','Kharif (monsoon season)',5.0,8.0, 'Low',    'Deep-rooted drought-tolerant crop.'),
  ('Linseed (Flaxseed)',  'Oilseeds','Rabi (winter season)',   6.0,7.0, 'Low',    'Cool-season oilseed crop.'),
  ('Coconut',             'Oilseeds','Year-round',             5.5,8.0, 'Medium', 'Tropical perennial. Prefers coastal sandy loam.'),

  -- Vegetables
  ('Tomato',              'Vegetables','Year-round',           5.5,7.0, 'Medium', 'Warm-season crop. Sensitive to frost.'),
  ('Onion',               'Vegetables','Rabi (winter season)', 6.0,7.5, 'Medium', 'Prefers well-drained sandy loam.'),
  ('Potato',              'Vegetables','Rabi (winter season)', 5.0,6.5, 'Medium', 'Cool-season tuber crop. Sensitive to waterlogging.'),
  ('Brinjal (Eggplant)',  'Vegetables','Kharif (monsoon season)',5.5,6.8,'Medium','Warm-season crop. Tolerates heat well.'),
  ('Okra (Bhindi)',       'Vegetables','Kharif (monsoon season)',6.0,7.0,'Medium','Warm-season crop. Cannot tolerate waterlogging.'),
  ('Cauliflower',         'Vegetables','Rabi (winter season)', 5.5,6.5, 'Medium', 'Cool-season crop. Sensitive to heat.'),
  ('Cabbage',             'Vegetables','Rabi (winter season)', 6.0,7.0, 'Medium', 'Cool-season crop.'),
  ('Bitter Gourd',        'Vegetables','Kharif (monsoon season)',6.0,7.0,'Medium','Warm-season vine crop.'),
  ('Bottle Gourd',        'Vegetables','Kharif (monsoon season)',6.0,7.0,'Medium','Fast-growing warm-season vine.'),
  ('Chilli (Hot Pepper)', 'Vegetables','Kharif (monsoon season)',6.0,7.0,'Medium','Warm-season crop. Sensitive to waterlogging.'),
  ('Garlic',              'Vegetables','Rabi (winter season)', 6.0,7.0, 'Medium', 'Bulb crop. Well-drained fertile loam preferred.'),
  ('Ginger',              'Vegetables','Kharif (monsoon season)',5.5,6.5,'Medium','Rhizome crop requiring partial shade.'),
  ('Carrot',              'Vegetables','Rabi (winter season)', 5.5,7.0, 'Medium', 'Cool-season root crop.'),
  ('Spinach',             'Vegetables','Rabi (winter season)', 6.0,7.0, 'Medium', 'Cool-season leafy vegetable.'),
  ('Fenugreek (Methi)',   'Vegetables','Rabi (winter season)', 6.0,7.5, 'Low',    'Cool-season leafy herb/vegetable.'),

  -- Fruits
  ('Mango',               'Fruits',    'Year-round',           5.5,7.5, 'Low',    'Tropical perennial tree. Drought-tolerant once established.'),
  ('Banana',              'Fruits',    'Year-round',           6.0,7.5, 'High',   'Tropical perennial. Requires abundant water and nutrients.'),
  ('Guava',               'Fruits',    'Year-round',           5.0,7.0, 'Low',    'Hardy tropical/subtropical fruit tree.'),
  ('Papaya',              'Fruits',    'Year-round',           6.0,7.0, 'Medium', 'Fast-growing tropical fruit. Cannot tolerate waterlogging.'),
  ('Pomegranate',         'Fruits',    'Year-round',           5.5,7.5, 'Low',    'Drought-tolerant fruit shrub/tree.'),
  ('Lime / Lemon',        'Fruits',    'Year-round',           6.0,7.5, 'Medium', 'Citrus fruit. Prefers well-drained loamy soil.'),
  ('Grapes',              'Fruits',    'Year-round',           6.0,7.0, 'Medium', 'Vine crop. Well-drained loamy to sandy loam preferred.'),
  ('Watermelon',          'Fruits',    'Zaid (summer season)', 6.0,7.0, 'Medium', 'Warm-season vine fruit. Sandy loam preferred.'),
  ('Muskmelon',           'Fruits',    'Zaid (summer season)', 6.0,7.0, 'Medium', 'Warm-season vine fruit.'),
  ('Pineapple',           'Fruits',    'Year-round',           4.5,6.5, 'Low',    'Tropical perennial. Tolerates acidic laterite soils.'),

  -- Cash crops
  ('Sugarcane',           'Cash crops','Year-round',           6.0,7.5, 'High',   'High water and nutrient demand. Long growing season.'),
  ('Cotton',              'Cash crops','Kharif (monsoon season)',6.0,8.0,'Medium','Warm-season crop. Deep black soil preferred.'),
  ('Tobacco',             'Cash crops','Rabi (winter season)', 5.5,7.0, 'Medium', 'Well-drained sandy loam preferred.'),
  ('Tea',                 'Cash crops','Year-round',           4.5,5.5, 'High',   'Perennial crop. Requires acidic soil and high rainfall.'),
  ('Coffee',              'Cash crops','Year-round',           6.0,6.5, 'Medium', 'Shade-grown perennial. Prefers laterite/red soil.'),
  ('Rubber',              'Cash crops','Year-round',           4.5,6.0, 'Medium', 'Tropical perennial tree. Laterite soil preferred.'),
  ('Vanilla',             'Cash crops','Year-round',           6.0,7.0, 'Medium', 'Vine crop requiring support structure and partial shade.'),

  -- Fiber crops
  ('Jute',                'Fiber crops','Kharif (monsoon season)',6.0,7.5,'High', 'Requires high humidity and loamy alluvial soil.'),
  ('Hemp',                'Fiber crops','Kharif (monsoon season)',6.0,7.0,'Medium','Tall annual fiber crop.'),
  ('Sisal',               'Fiber crops','Year-round',           6.0,8.0, 'Low',   'Drought-tolerant agave fiber crop.'),

  -- Fodder crops
  ('Napier Grass',        'Fodder crops','Year-round',          6.0,7.0, 'Medium','Perennial high-yield fodder grass.'),
  ('Maize (Fodder)',      'Fodder crops','Kharif (monsoon season)',5.5,7.0,'Medium','Grown specifically for green fodder.'),
  ('Cowpea (Fodder)',     'Fodder crops','Kharif (monsoon season)',5.5,7.0,'Low',  'Dual-purpose legume: grain and fodder.'),
  ('Lucerne (Alfalfa)',   'Fodder crops','Rabi (winter season)', 6.5,8.0, 'Medium','High-quality perennial legume fodder.'),

  -- Spices
  ('Turmeric',            'Spices',    'Kharif (monsoon season)',5.0,7.5, 'Medium','Rhizome crop. Requires good drainage.'),
  ('Cardamom',            'Spices',    'Year-round',            5.0,6.5, 'High',   'Shade-loving tropical spice.'),
  ('Black Pepper',        'Spices',    'Year-round',            5.5,6.5, 'Medium', 'Vine spice crop. Laterite soil preferred.'),
  ('Coriander',           'Spices',    'Rabi (winter season)',  6.5,7.5, 'Low',    'Cool-season aromatic herb/spice.'),
  ('Cumin',               'Spices',    'Rabi (winter season)',  6.8,8.0, 'Low',    'Cool and dry climate preferred.'),
  ('Fennel',              'Spices',    'Rabi (winter season)',  6.0,8.0, 'Low',    'Cool-season aromatic spice.')
on conflict (crop_name) do update set
  category              = excluded.category,
  typical_season        = excluded.typical_season,
  min_ph                = excluded.min_ph,
  max_ph                = excluded.max_ph,
  irrigation_requirement = excluded.irrigation_requirement,
  notes                 = excluded.notes;

-- ---------------------------------------------------------------------------
-- GRANT crop_reference read access to authenticated and anon roles
-- ---------------------------------------------------------------------------
grant select on public.crop_reference to authenticated, anon;

-- ---------------------------------------------------------------------------
-- VERIFICATION QUERIES (informational — safe to run anytime)
-- ---------------------------------------------------------------------------

-- Uncomment to verify table creation and row counts:
-- select 'farm_profiles'  as table_name, count(*) as rows from public.farm_profiles
-- union all
-- select 'advisories',                   count(*) from public.advisories
-- union all
-- select 'crop_reference',               count(*) from public.crop_reference;

-- ---------------------------------------------------------------------------
-- END OF MIGRATION
-- ---------------------------------------------------------------------------
