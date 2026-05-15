"use client"

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs"
import { Button, type buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

type SignOutButtonProps = {
  className?: string
  size?: VariantProps<typeof buttonVariants>["size"]
}

export const SignOutButton = ({ className, size = "default" }: SignOutButtonProps) => (
  <ClerkSignOutButton redirectUrl="/sign-in">
    <Button variant="outline" type="button" size={size} className={cn(className)}>
      Sign out
    </Button>
  </ClerkSignOutButton>
)
