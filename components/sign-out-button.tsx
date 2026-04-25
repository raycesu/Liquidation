import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export const SignOutButton = () => (
  <ClerkSignOutButton redirectUrl="/sign-in">
    <Button variant="outline" type="button">
      Sign out
    </Button>
  </ClerkSignOutButton>
)
