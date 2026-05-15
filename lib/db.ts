import { neon } from "@neondatabase/serverless"

type NeonSql = ReturnType<typeof neon>

let sqlClient: NeonSql | null = null

export const getSql = () => {
  if (sqlClient) {
    return sqlClient
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable")
  }

  sqlClient = neon(databaseUrl)
  return sqlClient
}

/**
 * Sets Postgres session variable used by RLS policies (app.current_user_id).
 * Engine/cron paths should not call this — they use the service role without user context.
 */
export const withUserContext = async <T>(userId: string, run: () => Promise<T>): Promise<T> => {
  const sql = getSql()
  await sql`select set_config('app.current_user_id', ${userId}, true)`

  try {
    return await run()
  } finally {
    await sql`select set_config('app.current_user_id', '', true)`
  }
}
