"use client"

import { useAuth, useSignUp } from "@clerk/nextjs"
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail, UserPlus } from "lucide-react"
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
  CLERK_SIGN_IN_PATH,
  CLERK_SIGN_UP_PATH,
} from "@/lib/clerk-routes"
import { cn } from "@/lib/utils"

type SignUpStep = "sign-up" | "verify-email"

const ONBOARDING_PATH = "/onboarding"

export const SignUpForm = () => {
  const router = useRouter()
  const { isLoaded: isAuthLoaded } = useAuth()
  const { signUp, fetchStatus } = useSignUp()

  const [step, setStep] = useState<SignUpStep>("sign-up")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const isSubmitting = fetchStatus === "fetching"

  const handleTogglePasswordVisibility = () => {
    setShowPassword((current) => !current)
  }

  const handleFinalizeSignUp = async () => {
    const { error } = await signUp.finalize({
      navigate: () => {
        router.push(ONBOARDING_PATH)
        router.refresh()
      },
    })

    if (error) {
      setFormError(getClerkErrorMessage(error))
    }
  }

  const handleSignUpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    })

    if (error) {
      setFormError(getClerkErrorMessage(error))
      return
    }

    if (signUp.status === "complete") {
      await handleFinalizeSignUp()
      return
    }

    if (
      signUp.status === "missing_requirements" &&
      signUp.unverifiedFields.includes("email_address")
    ) {
      const sendResult = await signUp.verifications.sendEmailCode()
      if (sendResult.error) {
        setFormError(getClerkErrorMessage(sendResult.error))
        return
      }

      setStep("verify-email")
      return
    }

    setFormError("Unable to complete sign-up. Please try again.")
  }

  const handleVerifyEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const { error } = await signUp.verifications.verifyEmailCode({
      code: verificationCode.trim(),
    })

    if (error) {
      setFormError(getClerkErrorMessage(error))
      return
    }

    if (signUp.status === "complete") {
      await handleFinalizeSignUp()
      return
    }

    setFormError("Verification incomplete. Check your code and try again.")
  }

  const handleGoogleSignUp = async () => {
    setFormError(null)

    const { error } = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: getClerkOAuthCallbackUrl(ONBOARDING_PATH),
      redirectCallbackUrl: getClerkOAuthCallbackUrl(`${CLERK_SIGN_UP_PATH}/sso-callback`),
    })

    if (error) {
      setFormError(getClerkErrorMessage(error))
    }
  }

  const handleBackToSignUp = () => {
    setFormError(null)
    setStep("sign-up")
    setVerificationCode("")
    void signUp.reset()
  }

  if (!isAuthLoaded) {
    return (
      <AuthGlassCard icon={UserPlus} title="Sign up with email" subtitle="Loading...">
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-accent-neon" aria-hidden />
        </div>
      </AuthGlassCard>
    )
  }

  if (step === "verify-email") {
    return (
      <AuthGlassCard
        icon={UserPlus}
        title="Verify your email"
        subtitle={`Enter the code sent to ${email}`}
      >
        <form className="space-y-4" onSubmit={handleVerifyEmailSubmit}>
          {formError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <AuthField
            id="verification-code"
            label="Verification code"
            icon={KeyRound}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            disabled={isSubmitting}
            required
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl border border-[#b8ebff]/70 bg-[#ecf8ff] text-sm font-semibold text-[#03101f] shadow-[0_10px_24px_rgb(17_191_255/0.18)] hover:bg-white"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Verify email"}
          </Button>
          <button
            type="button"
            onClick={handleBackToSignUp}
            className="w-full text-center text-sm text-[#87abcf] underline-offset-4 hover:text-[#d7ebff] hover:underline"
          >
            Back to sign up
          </button>
        </form>
      </AuthGlassCard>
    )
  }

  return (
    <AuthGlassCard
      icon={UserPlus}
      title="Sign up with email"
      subtitle="Create your account to join rooms and climb the leaderboard."
    >
      <form className="space-y-4" onSubmit={handleSignUpSubmit}>
        {formError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <AuthField
          id="sign-up-email"
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

        <AuthField
          id="sign-up-password"
          label="Password"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl border border-[#b8ebff]/70 bg-[#ecf8ff] text-sm font-semibold text-[#03101f] shadow-[0_10px_24px_rgb(17_191_255/0.18)] hover:bg-white"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Get started"}
        </Button>
      </form>

      <AuthDivider label="Or sign up with" />

      <div className="flex justify-center">
        <GoogleOAuthButton onClick={handleGoogleSignUp} disabled={isSubmitting} label="Continue with Google" />
      </div>

      <p className="mt-6 text-center text-sm text-[#87abcf]">
        Already have an account?{" "}
        <Link
          href={CLERK_SIGN_IN_PATH}
          className={cn("font-semibold text-[#e6f3ff] underline-offset-4 hover:text-accent-neon hover:underline")}
        >
          Sign in
        </Link>
      </p>
    </AuthGlassCard>
  )
}
