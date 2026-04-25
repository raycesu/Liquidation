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
