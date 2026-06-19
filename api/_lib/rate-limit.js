// Best-effort in-memory rate limiting per serverless instance.
const buckets = new Map();
const MAX_BUCKETS = 5000;

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

export function checkRateLimit(key, { limit = 30, windowMs = 15 * 60 * 1000 } = {}) {
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

  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.count),
  };
}

export function enforceRateLimit(req, res, scope, limits) {
  const ip = getClientIp(req);
  const result = checkRateLimit(`${scope}:${ip}`, limits);
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSec));
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
    });
    return false;
  }
  return true;
}
