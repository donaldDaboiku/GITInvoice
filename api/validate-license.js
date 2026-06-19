// api/validate-license.js
// GIT Invoice License Validation — Vercel Serverless + Supabase

import { applyCors, json } from './_lib/http.js';
import { enforceRateLimit } from './_lib/rate-limit.js';
import { sb } from './_lib/supabase.js';

export const config = { runtime: 'nodejs' };

const TIER_MAP = {
  'GITInvoice-solo':     { tier: 'solo',     users_max: 1  },
  'GITInvoice-team':     { tier: 'team',     users_max: 10 },
  'GITInvoice-business': { tier: 'business', users_max: 25 },
};

const DEMO_LICENSES = {
  'DEMO':          { tier: 'business', users_max: 25, email: 'demo-business@gitinvoice.local' },
  'DEMO-LICENSE':  { tier: 'business', users_max: 25, email: 'demo-business@gitinvoice.local' },
  'DEMO-SOLO':     { tier: 'solo',     users_max: 1,  email: 'demo-solo@gitinvoice.local' },
  'DEMO-TEAM':     { tier: 'team',     users_max: 10, email: 'demo-team@gitinvoice.local' },
  'DEMO-BUSINESS': { tier: 'business', users_max: 25, email: 'demo-business@gitinvoice.local' },
};

const RATE_LIMITS = {
  activate:   { limit: 20, windowMs: 15 * 60 * 1000 },
  check:      { limit: 60, windowMs: 15 * 60 * 1000 },
  deactivate: { limit: 20, windowMs: 15 * 60 * 1000 },
  default:    { limit: 30, windowMs: 15 * 60 * 1000 },
};

function getDemoLicense(key) {
  if (process.env.ENABLE_DEMO_LICENSES !== 'true') return null;
  return DEMO_LICENSES[key] || null;
}

async function verifyWithGumroad(license_key) {
  for (const [permalink, cfg] of Object.entries(TIER_MAP)) {
    const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: permalink,
        license_key,
        increment_uses_count: 'false',
      }),
    });
    const data = await r.json();
    if (data.success) {
      return {
        valid: true,
        refunded: data.purchase?.refunded || false,
        chargedback: data.purchase?.chargebacked || false,
        email: data.purchase?.email || '',
        ...cfg,
      };
    }
  }
  return { valid: false };
}

export default async function handler(req, res) {
  applyCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { license_key, action = 'activate', device_id = 'default' } = req.body || {};
  if (!license_key) return json(res, { success: false, error: 'No license key provided.' }, 400);

  const rateScope = `license:${action || 'default'}`;
  const rateConfig = RATE_LIMITS[action] || RATE_LIMITS.default;
  if (!enforceRateLimit(req, res, rateScope, rateConfig)) return;

  const key = license_key.trim().toUpperCase();
  const demoLicense = getDemoLicense(key);

  if (demoLicense) {
    return json(res, {
      success: true,
      tier: demoLicense.tier,
      users_max: demoLicense.users_max,
      users_used: 1,
      email: demoLicense.email,
    });
  }

  if (action === 'check') {
    try {
      const rows = await sb(
        `/activations?license_key=eq.${encodeURIComponent(key)}&device_id=eq.${encodeURIComponent(device_id)}&is_active=eq.true`
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return json(res, { success: false, error: 'License not found for this device.' });
      }

      const row = rows[0];
      const daysSince = (Date.now() - new Date(row.last_seen_at)) / 86_400_000;
      if (daysSince > 7) {
        const gum = await verifyWithGumroad(key);
        if (!gum.valid || gum.refunded || gum.chargedback) {
          await sb(`/activations?license_key=eq.${encodeURIComponent(key)}`, 'PATCH', { is_active: false });
          return json(res, { success: false, error: 'License revoked or refunded.' });
        }
      }

      await sb(
        `/activations?license_key=eq.${encodeURIComponent(key)}&device_id=eq.${encodeURIComponent(device_id)}`,
        'PATCH',
        { last_seen_at: new Date().toISOString() }
      );

      const allSeats = await sb(`/activations?license_key=eq.${encodeURIComponent(key)}&is_active=eq.true&select=device_id`);
      const users_used = Array.isArray(allSeats) ? allSeats.length : 1;

      return json(res, {
        success: true,
        tier: row.tier,
        users_max: row.users_max,
        users_used,
        email: row.email,
      });
    } catch (e) {
      console.error('[check]', e);
      return json(res, { success: true, tier: 'unknown', users_max: 1, users_used: 1 });
    }
  }

  if (action === 'activate') {
    try {
      const gum = await verifyWithGumroad(key);
      if (!gum.valid) return json(res, { success: false, error: 'Invalid license key. Check your Gumroad receipt.' });
      if (gum.refunded || gum.chargedback) {
        return json(res, { success: false, error: 'This license has been refunded and is no longer valid.' });
      }

      const existing = await sb(
        `/activations?license_key=eq.${encodeURIComponent(key)}&device_id=eq.${encodeURIComponent(device_id)}&is_active=eq.true`
      );
      if (Array.isArray(existing) && existing.length > 0) {
        const allSeats = await sb(`/activations?license_key=eq.${encodeURIComponent(key)}&is_active=eq.true&select=device_id`);
        const users_used = Array.isArray(allSeats) ? allSeats.length : 1;
        return json(res, {
          success: true,
          tier: gum.tier,
          users_max: gum.users_max,
          users_used,
          email: gum.email,
        });
      }

      const activeSeats = await sb(`/activations?license_key=eq.${encodeURIComponent(key)}&is_active=eq.true&select=device_id`);
      const seatCount = Array.isArray(activeSeats) ? activeSeats.length : 0;
      if (seatCount >= gum.users_max) {
        return json(res, {
          success: false,
          error: `Seat limit reached (${seatCount}/${gum.users_max}). Deactivate another device first or upgrade your plan.`,
        });
      }

      await sb('/activations', 'POST', {
        license_key: key,
        tier: gum.tier,
        users_max: gum.users_max,
        device_id,
        email: gum.email,
        activated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active: true,
      });

      return json(res, {
        success: true,
        tier: gum.tier,
        users_max: gum.users_max,
        users_used: seatCount + 1,
        email: gum.email,
      });
    } catch (e) {
      console.error('[activate]', e);
      return json(res, { success: false, error: 'Activation server error. Please try again.' }, 500);
    }
  }

  if (action === 'deactivate') {
    try {
      await sb(
        `/activations?license_key=eq.${encodeURIComponent(key)}&device_id=eq.${encodeURIComponent(device_id)}`,
        'PATCH',
        { is_active: false }
      );
      return json(res, { success: true });
    } catch (e) {
      console.error('[deactivate]', e);
      return json(res, { success: false, error: 'Could not deactivate. Try again.' }, 500);
    }
  }

  return json(res, { success: false, error: 'Unknown action.' }, 400);
}
