type SuggestUsernameInput = {
  clerkUsername: string | null
  fullName: string | null
  email: string | null
  userId: string
  currentUsername: string
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24)

export const suggestUsername = ({
  clerkUsername,
  fullName,
  email,
  userId,
  currentUsername,
}: SuggestUsernameInput) => {
  const placeholderSuffix = `-${userId.slice(-6)}`

  if (currentUsername.endsWith(placeholderSuffix)) {
    const withoutSuffix = currentUsername.slice(0, -placeholderSuffix.length)
    if (withoutSuffix.length >= 3) {
      return withoutSuffix
    }
  }

  const fromClerk = clerkUsername ? slugify(clerkUsername) : ""
  if (fromClerk.length >= 3) {
    return fromClerk
  }

  const fromName = fullName ? slugify(fullName) : ""
  if (fromName.length >= 3) {
    return fromName
  }

  const emailPrefix = email?.split("@")[0] ?? ""
  const fromEmail = emailPrefix ? slugify(emailPrefix) : ""
  if (fromEmail.length >= 3) {
    return fromEmail
  }

  return "trader"
}
