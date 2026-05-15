import { SignUp } from "@clerk/nextjs"
import {
  CLERK_SIGN_IN_PATH,
  CLERK_SIGN_UP_PATH,
} from "@/lib/clerk-routes"

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={CLERK_SIGN_UP_PATH}
        signInUrl={CLERK_SIGN_IN_PATH}
        appearance={{
          elements: {
            cardBox: "border border-border bg-surface shadow-2xl shadow-accent-blue/10",
          },
        }}
      />
    </main>
  )
}
