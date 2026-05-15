"use client"

import { useAuth, useSignIn } from "@clerk/nextjs"
import { Eye, EyeOff, KeyRound, Loader2, Lock, LogIn, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AuthDivider } from "@/components/auth/auth-divider"
import { AuthField } from "@/components/auth/auth-field"
import { AuthGlassCard } from "@/components/auth/auth-glass-card"
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button"
import { Button } from "@/components/ui/button"
import { getClerkErrorMessage } from "@/lib/clerk-auth-errors"
import { getClerkOAuthCallbackUrl } from "@/lib/clerk-oauth"
import {
  CLERK_AUTH_FALLBACK_REDIRECT_PATH,
  CLERK_SIGN_IN_PATH,
  CLERK_SIGN_UP_PATH,
} from "@/lib/clerk-routes"
import { cn } from "@/lib/utils"

type SignInStep = "sign-in" | "forgot-code" | "forgot-password"

export const SignInForm = () => {
  const router = useRouter()
  const { isLoaded: isAuthLoaded } = useAuth()
  const { signIn, fetchStatus } = useSignIn()

  const [step, setStep] = useState<SignInStep>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const isSubmitting = fetchStatus === "fetching"

  const handleTogglePasswordVisibility = () => {
    setShowPassword((current) => !current)
  }

  const handleToggleNewPasswordVisibility = () => {
    setShowNewPassword((current) => !current)
  }

  const handleFinalizeSignIn = async () => {
    const { error } = await signIn.finalize({
      navigate: () => {
        router.push(CLERK_AUTH_FALLBACK_REDIRECT_PATH)
        router.refresh()
      },
    })

    if (error) {
      setFormError(getClerkErrorMessage(error))
    }
  }

  const handleSignInSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const { error } = await signIn.password({
      identifier: email.trim(),
      password,
    })

    if (error) {
      setFormError(getClerkErrorMessage(error))
      return
    }

    if (signIn.status === "complete") {
      await handleFinalizeSignIn()
      return
    }

    if (signIn.status === "needs_second_factor") {
      setFormError("Additional verification is required. Complete sign-in in your Clerk settings or contact support.")
      return
    }

    setFormError("Unable to complete sign-in. Please check your credentials and try again.")
  }

  const handleForgotPassword = async () => {
    setFormError(null)

    if (!email.trim()) {
      setFormError("Enter your email address first.")
      return
    }

    const createResult = await signIn.create({ identifier: email.trim() })
    if (createResult.error) {
      setFormError(getClerkErrorMessage(createResult.error))
      return
    }

    const sendResult = await signIn.resetPasswordEmailCode.sendCode()
    if (sendResult.error) {
      setFormError(getClerkErrorMessage(sendResult.error))
      return
    }

    setStep("forgot-code")
  }

  const handleVerifyResetCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: resetCode.trim() })
    if (error) {
      setFormError(getClerkErrorMessage(error))
      return
    }

    setStep("forgot-password")
  }

  const handleResetPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
    })

    if (error) {
      setFormError(getClerkErrorMessage(error))
      return
    }

    if (signIn.status === "complete") {
      await handleFinalizeSignIn()
      return
    }

    setFormError("Password updated. Try signing in with your new password.")
    setStep("sign-in")
    setPassword("")
    setResetCode("")
    setNewPassword("")
  }

  const handleGoogleSignIn = async () => {
    setFormError(null)

    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: getClerkOAuthCallbackUrl(CLERK_AUTH_FALLBACK_REDIRECT_PATH),
      redirectCallbackUrl: getClerkOAuthCallbackUrl(`${CLERK_SIGN_IN_PATH}/sso-callback`),
    })

    if (error) {
      setFormError(getClerkErrorMessage(error))
    }
  }

  const handleBackToSignIn = () => {
    setFormError(null)
    setStep("sign-in")
    setResetCode("")
    setNewPassword("")
    void signIn.reset()
  }

  if (!isAuthLoaded) {
    return (
      <AuthGlassCard icon={LogIn} title="Sign in with email" subtitle="Loading...">
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-accent-neon" aria-hidden />
        </div>
      </AuthGlassCard>
    )
  }

  if (step === "forgot-code") {
    return (
      <AuthGlassCard
        icon={LogIn}
        title="Reset your password"
        subtitle={`Enter the code sent to ${email}`}
      >
        <form className="space-y-4" onSubmit={handleVerifyResetCode}>
          {formError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <AuthField
            id="reset-code"
            label="Verification code"
            icon={KeyRound}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter verification code"
            value={resetCode}
            onChange={(event) => setResetCode(event.target.value)}
            disabled={isSubmitting}
            required
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl border border-[#b8ebff]/70 bg-[#ecf8ff] text-sm font-semibold text-[#03101f] shadow-[0_10px_24px_rgb(17_191_255/0.18)] hover:bg-white"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Continue"}
          </Button>
          <button
            type="button"
            onClick={handleBackToSignIn}
            className="w-full text-center text-sm text-[#87abcf] underline-offset-4 hover:text-[#d7ebff] hover:underline"
          >
            Back to sign in
          </button>
        </form>
      </AuthGlassCard>
    )
  }

  if (step === "forgot-password") {
    return (
      <AuthGlassCard
        icon={LogIn}
        title="Create new password"
        subtitle="Choose a strong password for your account"
      >
        <form className="space-y-4" onSubmit={handleResetPasswordSubmit}>
          {formError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <AuthField
            id="new-password"
            label="New password"
            icon={Lock}
            type={showNewPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={isSubmitting}
            required
            endAdornment={
              <button
                type="button"
                onClick={handleToggleNewPasswordVisibility}
                className="flex size-8 items-center justify-center rounded-lg text-[#6e93b8] hover:text-[#d7ebff]"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl border border-[#b8ebff]/70 bg-[#ecf8ff] text-sm font-semibold text-[#03101f] shadow-[0_10px_24px_rgb(17_191_255/0.18)] hover:bg-white"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Update password"}
          </Button>
        </form>
      </AuthGlassCard>
    )
  }

  return (
    <AuthGlassCard
      icon={LogIn}
      title="Sign in with email"
      subtitle="Welcome back — compete on paper perpetuals with live prices."
    >
      <form className="space-y-4" onSubmit={handleSignInSubmit}>
        {formError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <AuthField
          id="sign-in-email"
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          required
        />

        <div className="space-y-2">
          <AuthField
            id="sign-in-password"
            label="Password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            required
            endAdornment={
              <button
                type="button"
                onClick={handleTogglePasswordVisibility}
                className="flex size-8 items-center justify-center rounded-lg text-[#6e93b8] hover:text-[#d7ebff]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSubmitting}
              className="text-xs font-medium text-[#87abcf] underline-offset-4 hover:text-accent-neon hover:underline disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl border border-[#b8ebff]/70 bg-[#ecf8ff] text-sm font-semibold text-[#03101f] shadow-[0_10px_24px_rgb(17_191_255/0.18)] hover:bg-white"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Sign in"}
        </Button>
      </form>

      <AuthDivider label="Or sign in with" />

      <div className="flex justify-center">
        <GoogleOAuthButton onClick={handleGoogleSignIn} disabled={isSubmitting} />
      </div>

      <p className="mt-6 text-center text-sm text-[#87abcf]">
        Don&apos;t have an account?{" "}
        <Link
          href={CLERK_SIGN_UP_PATH}
          className={cn("font-semibold text-[#e6f3ff] underline-offset-4 hover:text-accent-neon hover:underline")}
        >
          Sign up
        </Link>
      </p>
    </AuthGlassCard>
  )
}
