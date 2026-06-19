-- GIT Invoice — initial schema (activations + buyer KYC)

create table if not exists activations (
  id            bigint        generated always as identity primary key,
  license_key   text          not null,
  tier          text          not null,
  users_max     int           not null,
  device_id     text          not null,
  email         text          default '',
  activated_at  timestamptz   default now(),
  last_seen_at  timestamptz   default now(),
  is_active     boolean       default true
);

create index if not exists idx_activations_key        on activations (license_key);
create index if not exists idx_activations_key_device on activations (license_key, device_id);
create index if not exists idx_activations_active     on activations (license_key, is_active);

create unique index if not exists idx_activations_key_device_unique
  on activations (license_key, device_id);

alter table activations enable row level security;

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

create table if not exists buyer_kyc (
  id                bigint        generated always as identity primary key,
  license_key       text          not null unique,
  device_id         text          default '',
  email             text          default '',
  tier              text          default 'solo',
  full_name         text          not null,
  phone             text          not null,
  country           text          not null,
  business_name     text          default '',
  business_type     text          default 'individual',
  id_type           text          not null,
  id_number         text          not null,
  business_reg      text          default '',
  address           text          not null,
  status            text          default 'pending',
  rejection_reason  text          default '',
  submitted_at      timestamptz   default now(),
  reviewed_at       timestamptz,
  updated_at        timestamptz   default now()
);

create index if not exists idx_buyer_kyc_license on buyer_kyc (license_key);
create index if not exists idx_buyer_kyc_status  on buyer_kyc (status);

alter table buyer_kyc enable row level security;
