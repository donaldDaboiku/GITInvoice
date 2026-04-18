export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { license_key } = req.body || {};
  if (!license_key) return res.json({ success: false, error: 'No key provided.' });

  const tierMap = {
    'invohub-solo':     { tier: 'solo',     users_max: 1  },
    'invohub-team':     { tier: 'team',     users_max: 10 },
    'invohub-business': { tier: 'business', users_max: 25 },
  };

  try {
    // Try all three products — Gumroad will match the right one
    for (const [permalink, config] of Object.entries(tierMap)) {
      const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          product_permalink: permalink,
          license_key,
          increment_uses_count: 'false'
        })
      });
      const data = await r.json();
      if (data.success) {
        return res.json({
          success: true,
          tier: config.tier,
          users_max: config.users_max,
          email: data.purchase?.email || ''
        });
      }
    }
    return res.json({ success: false, error: 'Invalid license key. Check your Gumroad receipt.' });
  } catch (e) {
    return res.json({ success: false, error: 'Could not reach activation server.' });
  }
}