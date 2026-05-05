// api/buyer-kyc.js
// Stores buyer/licensee KYC submissions for admin review.

export const config = { runtime: 'nodejs' };

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

function json(res, body, status = 200) {
  return res.status(status).json(body);
}

async function sb(path, method = 'GET', body = null) {
  if (!process.env.SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('KYC storage is not configured.');
  }

  const url = `${process.env.SUPABASE_URL}/rest/v1${path}`;
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const response = await fetch(url, opts);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.error || `Supabase request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function clean(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const action = body.action || 'submit';
  const licenseKey = clean(body.license_key, 120).toUpperCase();
  const deviceId = clean(body.device_id, 120);

  if (!licenseKey) return json(res, { success: false, error: 'License key is required.' }, 400);

  try {
    if (action === 'status') {
      const rows = await sb(`/buyer_kyc?license_key=eq.${encodeURIComponent(licenseKey)}&select=status,submitted_at,reviewed_at,rejection_reason&limit=1`);
      const row = Array.isArray(rows) ? rows[0] : null;
      return json(res, {
        success: true,
        status: row?.status || 'not_submitted',
        submitted_at: row?.submitted_at || null,
        reviewed_at: row?.reviewed_at || null,
        rejection_reason: row?.rejection_reason || '',
      });
    }

    const required = ['full_name', 'phone', 'country', 'id_type', 'id_number', 'address'];
    for (const field of required) {
      if (!clean(body[field])) return json(res, { success: false, error: 'Please complete all required KYC fields.' }, 400);
    }

    const record = {
      license_key: licenseKey,
      device_id: deviceId,
      email: clean(body.email, 254),
      tier: clean(body.tier, 32) || 'solo',
      full_name: clean(body.full_name, 160),
      phone: clean(body.phone, 80),
      country: clean(body.country, 80),
      business_name: clean(body.business_name, 180),
      business_type: clean(body.business_type, 80) || 'individual',
      id_type: clean(body.id_type, 80),
      id_number: clean(body.id_number, 120),
      business_reg: clean(body.business_reg, 120),
      address: clean(body.address, 700),
      status: 'pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await sb('/buyer_kyc?on_conflict=license_key', 'POST', record);
    return json(res, { success: true, status: 'pending' });
  } catch (err) {
    console.error('[buyer-kyc]', err);
    return json(res, { success: false, error: err.message || 'Could not submit KYC.' }, 500);
  }
}
