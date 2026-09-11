const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

/** @type {Map<string, { count: number, windowStart: number }>} */
const hits = new Map()

/**
 * Reads the caller IP without trusting spoofed headers in local dev.
 * @param {import('express').Request} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

/**
 * Basic in-memory per-IP rate limiter for the chat endpoint.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function rateLimit(req, res, next) {
  const ip = getClientIp(req)
  const now = Date.now()
  const current = hits.get(ip)

  if (!current || now - current.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now })
    return next()
  }

  current.count += 1
  if (current.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many messages. Please wait a moment and try again.',
    })
  }

  return next()
}
