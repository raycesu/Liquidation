import { UserProfile } from "@clerk/nextjs"

export default function UserProfilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <UserProfile
        path="/user-profile"
        appearance={{
          elements: {
            cardBox: "border border-border bg-surface shadow-2xl shadow-accent-blue/10",
          },
        }}
      />
    </main>
  )
}
