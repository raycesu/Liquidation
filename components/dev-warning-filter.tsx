"use client"

import { useEffect } from "react"

const IGNORED_WARNING_PATTERNS = ["[Cloudflare Turnstile] Cannot find widget"]

export const DevWarningFilter = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return
    }

    const originalWarn = console.warn

    console.warn = (...args: unknown[]) => {
      const warningMessage = typeof args[0] === "string" ? args[0] : ""
      const isIgnoredWarning = IGNORED_WARNING_PATTERNS.some((pattern) =>
        warningMessage.includes(pattern)
      )

      if (isIgnoredWarning) {
        return
      }

      originalWarn(...args)
    }

    return () => {
      console.warn = originalWarn
    }
  }, [])

  return null
}
