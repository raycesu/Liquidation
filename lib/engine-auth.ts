export const verifyEngineCronSecret = (request: Request): boolean => {
  const engineSecret = process.env.ENGINE_CRON_SECRET
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!engineSecret || !bearerToken) {
    return false
  }

  return bearerToken === engineSecret
}
