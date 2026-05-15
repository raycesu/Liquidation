export const getClerkOAuthCallbackUrl = (path: string) => {
  if (typeof window === "undefined") {
    return path
  }

  return new URL(path, window.location.origin).toString()
}
