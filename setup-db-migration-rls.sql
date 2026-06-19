-- GIT Invoice — RLS hardening migration (run once on existing Supabase projects)
-- After this, API routes must use SUPABASE_SERVICE_KEY (service role bypasses RLS).

drop policy if exists "service_full_access" on activations;
drop policy if exists "buyer_kyc_service_full_access" on buyer_kyc;

alter table activations enable row level security;
alter table buyer_kyc enable row level security;

create unique index if not exists idx_activations_key_device_unique
  on activations (license_key, device_id);
