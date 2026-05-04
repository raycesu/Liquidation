import Link from "next/link"
import { Button } from "@/components/ui/button"

export const CtaFooterBanner = () => {
  return (
    <section
      className="border-t border-border bg-gradient-to-br from-secondary via-background to-surface py-16 sm:py-20 lg:py-24"
      aria-labelledby="cta-banner-heading"
    >
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          id="cta-banner-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl lg:text-4xl"
        >
          Ready to compete?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-text-secondary sm:text-base">
          Create a room or join a public competition. It&apos;s free.
        </p>
        <Button asChild size="lg" className="mt-8 rounded-full px-10">
          <Link href="/sign-up">Get started</Link>
        </Button>
      </div>
    </section>
  )
}
