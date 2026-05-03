// api/validate-license.js
// GIT Invoice License Validation — Vercel Serverless + Supabase
//
// Environment variables required (set in Vercel dashboard):
//   SUPABASE_URL       → https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  → your Supabase anon/service key
//
// Supabase table: run setup-db.sql to create the activations table

export const config = { runtime: 'nodejs' };

// ── Gumroad product permalinks → tier config ──────────────────────────────
const TIER_MAP = {
  'GITInvoice-solo':     { tier: 'solo',     users_max: 1  },
  'GITInvoice-team':     { tier: 'team',     users_max: 10 },
  'GITInvoice-business': { tier: 'business', users_max: 25 },
};

const DEMO_LICENSES = {
  'DEMO-SOLO':     { tier: 'solo',     users_max: 1,  email: 'demo-solo@gitinvoice.local' },
  'DEMO-TEAM':     { tier: 'team',     users_max: 10, email: 'demo-team@gitinvoice.local' },
  'DEMO-BUSINESS': { tier: 'business', users_max: 25, email: 'demo-business@gitinvoice.local' },
};

function getDemoLicense(key) {
  if (process.env.ENABLE_DEMO_LICENSES !== 'true') return null;
  return DEMO_LICENSES[key] || null;
}

// Startup check for required env vars (to avoid silent failures later)
// misconfiguration immediately in Vercel function logs.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('[GIT Invoice] MISSING ENV VARS: SUPABASE_URL and/or SUPABASE_SERVICE_KEY are not set. License validation will fail.');
}
// ── Tiny Supabase REST helper (no SDK needed) ─────────────────────────────
function sb(path, method = 'GET', body = null) {
  const url  = `${process.env.SUPABASE_URL}/rest/v1${path}`;
  const opts = {
    method,
    headers: {
      'apikey':        process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=representation' : 'return=minimal',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(url, opts).then(r => r.json());
}

// ── Verify key against Gumroad ─────────────────────────────────────────────
async function verifyWithGumroad(license_key) {
  for (const [permalink, cfg] of Object.entries(TIER_MAP)) {
    const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink:    permalink,
        license_key,
        increment_uses_count: 'false',
      }),
    });
    const data = await r.json();
    if (data.success) {
      return {
        valid:       true,
        refunded:    data.purchase?.refunded      || false,
        chargedback: data.purchase?.chargebacked  || false,
        email:       data.purchase?.email         || '',
        ...cfg,
      };
    }
  }
  return { valid: false };
}

// ── Main handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { license_key, action = 'activate', device_id = 'default' } = req.body || {};
  if (!license_key) return res.json({ success: false, error: 'No license key provided.' });

  const key = license_key.trim().toUpperCase();
  const demoLicense = getDemoLicense(key);

  if (demoLicense) {
    return res.json({
      success: true,
      tier: demoLicense.tier,
      users_max: demoLicense.users_max,
      users_used: 1,
      email: demoLicense.email,
    });
  }

  // ── ACTION: check (silent background ping on every app load) ───────────
  if (action === 'check') {
    try {
      const rows = await sb(
        `/activations?license_key=eq.${encodeURIComponent(key)}&device_id=eq.${encodeURIComponent(device_id)}&is_active=eq.true`
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.json({ success: false, error: 'License not found for this device.' });
      }
      const row = rows[0];

      // Re-verify with Gumroad every 7 days to catch refunds
      const daysSince = (Date.now() - new Date(row.last_seen_at)) / 86_400_000;
      if (daysSince > 7) {
        const gum = await verifyWithGumroad(key);
        if (!gum.valid || gum.refunded || gum.chargedback) {
          await sb(`/activations?license_key=eq.${encodeURIComponent(key)}`, 'PATCH', { is_active: false });
          return res.json({ success: false, error: 'License revoked or refunded.' });
        }
      }

      // Update last seen
      await sb(
        `/activations?license_key=eq.${encodeURIComponent(key)}&device_id=eq.${encodeURIComponent(device_id)}`,
        'PATCH',
        { last_seen_at: new Date().toISOString() }
      );

      const allSeats   = await sb(`/activations?license_key=eq.${encodeURIComponent(key)}&is_active=eq.true&select=device_id`);
      const users_used = Array.isArray(allSeats) ? allSeats.length : 1;

      return res.json({ success: true, tier: row.tier, users_max: row.users_max, users_used, email: row.email });
    } catch (e) {
      console.error('[check]', e);
      // Fail open so offline/DB-down users aren't locked out
      return res.json({ success: true, tier: 'unknown', users_max: 1, users_used: 1 });
    }
  }

  // ── ACTION: activate ───────────────────────────────────────────────────
  if (action === 'activate') {
    try {
      const gum = await verifyWithGumroad(key);
      if (!gum.valid)                    return res.json({ success: false, error: 'Invalid license key. Check your Gumroad receipt.' });
      if (gum.refunded || gum.chargedback) return res.json({ success: false, error: 'This license has been refunded and is no longer valid.' });

      // Already activated on this device? Re-use the seat.
      const existing = await sb(
        `/activations?license_key=eq.${encodeURIComponent(key)}&device_id=eq.${encodeURIComponent(device_id)}&is_active=eq.true`
      );
      if (Array.isArray(existing) && existing.length > 0) {
        const allSeats   = await sb(`/activations?license_key=eq.${encodeURIComponent(key)}&is_active=eq.true&select=device_id`);
        const users_used = Array.isArray(allSeats) ? allSeats.length : 1;
        return res.json({ success: true, tier: gum.tier, users_max: gum.users_max, users_used, email: gum.email });
      }

      // Check seat limit
      const activeSeats = await sb(`/activations?license_key=eq.${encodeURIComponent(key)}&is_active=eq.true&select=device_id`);
      const seatCount   = Array.isArray(activeSeats) ? activeSeats.length : 0;
      if (seatCount >= gum.users_max) {
        return res.json({
          success: false,
          error: `Seat limit reached (${seatCount}/${gum.users_max}). Deactivate another device first or upgrade your plan.`,
        });
      }

      // Insert new activation record
      await sb('/activations', 'POST', {
        license_key:  key,
        tier:         gum.tier,
        users_max:    gum.users_max,
        device_id,
        email:        gum.email,
        activated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active:    true,
      });

      return res.json({ success: true, tier: gum.tier, users_max: gum.users_max, users_used: seatCount + 1, email: gum.email });
    } catch (e) {
      console.error('[activate]', e);
      return res.json({ success: false, error: 'Activation server error. Please try again.' });
    }
  }

  // ── ACTION: deactivate ─────────────────────────────────────────────────
  if (action === 'deactivate') {
    try {
      await sb(
        `/activations?license_key=eq.${encodeURIComponent(key)}&device_id=eq.${encodeURIComponent(device_id)}`,
        'PATCH',
        { is_active: false }
      );
      return res.json({ success: true });
    } catch (e) {
      console.error('[deactivate]', e);
      return res.json({ success: false, error: 'Could not deactivate. Try again.' });
    }
  }

  return res.json({ success: false, error: 'Unknown action.' });
}
