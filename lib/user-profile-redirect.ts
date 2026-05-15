export const USER_PROFILE_REDIRECT_ALLOWLIST = ["/dashboard/profile", "/onboarding"] as const

export type UserProfileRedirectPath = (typeof USER_PROFILE_REDIRECT_ALLOWLIST)[number]

export const DEFAULT_USER_PROFILE_REDIRECT: UserProfileRedirectPath = "/dashboard/profile"

export const resolveUserProfileRedirect = (redirectUrl: string | null | undefined): UserProfileRedirectPath => {
  if (!redirectUrl) {
    return DEFAULT_USER_PROFILE_REDIRECT
  }

  if (USER_PROFILE_REDIRECT_ALLOWLIST.includes(redirectUrl as UserProfileRedirectPath)) {
    return redirectUrl as UserProfileRedirectPath
  }

  return DEFAULT_USER_PROFILE_REDIRECT
}
