import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { DevWarningFilter } from "@/components/dev-warning-filter"
import { Toaster } from "@/components/ui/sonner"
import {
  CLERK_SIGN_IN_PATH,
  CLERK_SIGN_UP_PATH,
} from "@/lib/clerk-routes"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Liquidation",
  description: "Paper-trading crypto perpetuals competitions",
  icons: {
    apple: "/images/liquidation-logo.png",
  },
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider signInUrl={CLERK_SIGN_IN_PATH} signUpUrl={CLERK_SIGN_UP_PATH}>
      <html
        lang="en"
        data-scroll-behavior="smooth"
        className={`${geistSans.variable} ${geistMono.variable} scroll-smooth dark`}
      >
        <body>
          <DevWarningFilter />
          {children}
          <Toaster richColors theme="dark" />
        </body>
      </html>
    </ClerkProvider>
  )
}
