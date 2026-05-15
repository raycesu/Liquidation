import { z } from "zod"

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(/^[a-z0-9-]+$/, "Username can only include lowercase letters, numbers, and hyphens")

export const normalizeUsername = (username: string) => username.toLowerCase()

export const isUniqueViolation = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false
  }

  return "code" in error && error.code === "23505"
}
