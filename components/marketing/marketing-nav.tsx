"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"

export const MarketingNav = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMobileNavClick = () => {
    setMobileOpen(false)
  }

  return (
    <header className="relative z-50 pt-4 sm:pt-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-3 rounded-full border border-[#2a4668] bg-[#0a1627]/80 px-3 shadow-[0_18px_40px_rgb(3_8_18/0.55)] backdrop-blur-xl">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1.5"
            aria-label={`${BRAND_NAME} home`}
          >
            <Image
              src={BRAND_LOGO_SRC}
              alt=""
              width={BRAND_LOGO_WIDTH}
              height={BRAND_LOGO_HEIGHT}
              className="h-6 w-auto sm:h-7"
              priority
              unoptimized
            />
            <span className="sr-only">{BRAND_NAME}</span>
          </Link>

          <div className="ml-auto hidden items-center gap-2 sm:gap-3 md:flex">
            <Button
              asChild
              variant="outline"
              size="default"
              className="rounded-full border-[#36577b] bg-[#0e2239] px-5 text-[#d7ebff] hover:bg-[#163152]"
            >
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button
              asChild
              size="default"
              className="rounded-full border border-[#6ac7ff]/20 bg-[#0f8dff] px-5 text-white shadow-[0_8px_20px_rgb(4_106_201/0.45)] hover:bg-[#0b7fe2]"
            >
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <Button
              asChild
              variant="default"
              size="sm"
              className="rounded-full border border-[#6ac7ff]/20 bg-[#0f8dff] px-3 text-xs text-white sm:text-sm"
            >
              <Link href="/sign-up">Get started</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full border-[#36577b] bg-[#0e2239] text-[#d7ebff] hover:bg-[#163152]"
              aria-expanded={mobileOpen}
              aria-controls="marketing-mobile-menu"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent id="marketing-mobile-menu" className="max-w-sm gap-6">
          <DialogHeader>
            <DialogTitle className="text-left">Menu</DialogTitle>
            <DialogDescription className="text-left text-muted-foreground">
              Account actions
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/sign-in" onClick={handleMobileNavClick}>
                Log in
              </Link>
            </Button>
            <Button asChild className="w-full rounded-full">
              <Link href="/sign-up" onClick={handleMobileNavClick}>
                Get started
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
