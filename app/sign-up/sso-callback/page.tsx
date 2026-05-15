import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SignUpSsoCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <AuthenticateWithRedirectCallback />
    </main>
  )
}
