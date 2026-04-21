-- invoHub — Supabase Database Setup
-- Run this once in the Supabase SQL Editor (app.supabase.com → SQL Editor)

-- 1. Activations table — one row per device per license key
create table if not exists activations (
  id            bigint        generated always as identity primary key,
  license_key   text          not null,
  tier          text          not null,           -- 'solo' | 'team' | 'business'
  users_max     int           not null,           -- 1 | 10 | 25
  device_id     text          not null,           -- UUID generated in the browser
  email         text          default '',
  activated_at  timestamptz   default now(),
  last_seen_at  timestamptz   default now(),
  is_active     boolean       default true
);

-- 2. Indexes for fast lookups (the API queries these columns every request)
create index if not exists idx_activations_key        on activations (license_key);
create index if not exists idx_activations_key_device on activations (license_key, device_id);
create index if not exists idx_activations_active     on activations (license_key, is_active);

-- 3. Row Level Security — enable it, then allow the service role full access
alter table activations enable row level security;

-- Allow the anon/service key used by the API to do everything
create policy "service_full_access" on activations
  for all
  using (true)
  with check (true);

-- 4. Optional: view to see active seats per license key (useful for support)
create or replace view active_seats as
  select
    license_key,
    tier,
    users_max,
    count(*) filter (where is_active) as seats_used,
    users_max - count(*) filter (where is_active) as seats_free,
    max(last_seen_at) as last_active
  from activations
  group by license_key, tier, users_max
  order by last_active desc;
