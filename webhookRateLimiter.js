const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const createLocalWebhookRateLimiter = ({ maxRequests = 60, windowMs = 60000, now = () => Date.now() } = {}) => {
  const attempts = new Map()
  const cleanup = (timestamp = now()) => {
    for (const [key, entry] of attempts) {
      if (timestamp - entry.startedAt >= windowMs) attempts.delete(key)
    }
  }
  return {
    allow(key) {
      const timestamp = now(); cleanup(timestamp)
      const current = attempts.get(key)
      if (!current) {
        attempts.set(key, { startedAt: timestamp, count: 1 })
        return true
      }
      if (current.count >= maxRequests) return false
      current.count += 1
      return true
    },
    cleanup,
    size: () => attempts.size,
    distributed: false
  }
}

const configuredRateLimit = ({ maxRequests, windowSeconds } = {}) => createLocalWebhookRateLimiter({
  maxRequests: toPositiveInteger(maxRequests, 60),
  windowMs: toPositiveInteger(windowSeconds, 60) * 1000
})

export { createLocalWebhookRateLimiter, configuredRateLimit }
