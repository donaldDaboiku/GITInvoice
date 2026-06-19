// Vercel Edge Middleware — API rate limiting (runs before serverless functions)
const RATE_LIMITS = {
  '/api/validate-license': { limit: 40, windowMs: 15 * 60 * 1000 },
  '/api/buyer-kyc': { limit: 25, windowMs: 15 * 60 * 1000 },
};

const buckets = new Map();
const MAX_BUCKETS = 10000;

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function getRateConfig(pathname) {
  if (pathname.startsWith('/api/validate-license')) return RATE_LIMITS['/api/validate-license'];
  if (pathname.startsWith('/api/buyer-kyc')) return RATE_LIMITS['/api/buyer-kyc'];
  return null;
}

function checkRateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (buckets.size > MAX_BUCKETS) {
    for (const [storedKey, storedBucket] of buckets) {
      if (now >= storedBucket.resetAt) buckets.delete(storedKey);
    }
  }

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true };
}

export default function middleware(request) {
  const { pathname } = new URL(request.url);
  const rateConfig = getRateConfig(pathname);

  if (!rateConfig || request.method === 'OPTIONS') {
    return fetch(request);
  }

  if (request.method !== 'POST') {
    return fetch(request);
  }

  const ip = getClientIp(request);
  const result = checkRateLimit(`${pathname}:${ip}`, rateConfig);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfterSec),
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  return fetch(request);
}

export const config = {
  matcher: ['/api/validate-license', '/api/buyer-kyc'],
};
