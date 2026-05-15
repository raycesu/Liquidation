type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitConfig = {
  maxAttempts: number
  windowMs: number
}

const buckets = new Map<string, RateLimitEntry>()

export type RateLimitResult = {
  allowed: boolean
  retryAfterMs: number
}

export const checkRateLimit = (key: string, config: RateLimitConfig): RateLimitResult => {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (existing.count >= config.maxAttempts) {
    return { allowed: false, retryAfterMs: Math.max(0, existing.resetAt - now) }
  }

  existing.count += 1
  buckets.set(key, existing)
  return { allowed: true, retryAfterMs: 0 }
}

export const resetRateLimit = (key: string) => {
  buckets.delete(key)
}
