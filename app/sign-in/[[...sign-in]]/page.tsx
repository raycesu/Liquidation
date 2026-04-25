import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn
        appearance={{
          elements: {
            cardBox: "border border-border bg-surface shadow-2xl shadow-accent-blue/10",
          },
        }}
      />
    </main>
  )
}
