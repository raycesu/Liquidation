const inFlightPolls = new Set<string>()

export const tryAcquireEnginePoll = (key: string): boolean => {
  if (inFlightPolls.has(key)) {
    return false
  }

  inFlightPolls.add(key)
  return true
}

export const releaseEnginePoll = (key: string) => {
  inFlightPolls.delete(key)
}
