import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp
        appearance={{
          elements: {
            cardBox: "border border-border bg-surface shadow-2xl shadow-accent-blue/10",
          },
        }}
      />
    </main>
  )
}
