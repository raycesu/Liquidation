type ClerkErrorLike = {
  message?: string
  longMessage?: string
}

export const getClerkErrorMessage = (error: ClerkErrorLike | null | undefined): string | null => {
  if (!error) {
    return null
  }

  if (error.longMessage) {
    return error.longMessage
  }

  if (error.message) {
    return error.message
  }

  return "Something went wrong. Please try again."
}
