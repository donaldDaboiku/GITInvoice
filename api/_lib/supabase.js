const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[GIT Invoice] MISSING ENV VARS: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.');
} else if (!process.env.SUPABASE_SERVICE_KEY) {
  console.warn('[GIT Invoice] Using SUPABASE_ANON_KEY — set SUPABASE_SERVICE_KEY after tightening RLS.');
}

export function isSupabaseConfigured() {
  return !!(process.env.SUPABASE_URL && SUPABASE_KEY);
}

export async function sb(path, method = 'GET', body = null, prefer = null) {
  if (!process.env.SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Database storage is not configured.');
  }

  const defaultPrefer = method === 'POST' ? 'return=representation' : 'return=minimal';
  const url = `${process.env.SUPABASE_URL}/rest/v1${path}`;
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer || defaultPrefer,
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
