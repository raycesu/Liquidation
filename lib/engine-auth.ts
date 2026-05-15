import { timingSafeEqual } from "node:crypto"

const safeCompare = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export const verifyEngineCronSecret = (request: Request): boolean => {
  const engineSecret = process.env.ENGINE_CRON_SECRET
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!engineSecret || !bearerToken) {
    return false
  }

  return safeCompare(bearerToken, engineSecret)
}
