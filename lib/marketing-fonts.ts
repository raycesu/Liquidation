import { Inter_Tight, Manrope } from "next/font/google"

export const marketingSans = Manrope({
  variable: "--font-marketing-sans",
  subsets: ["latin"],
})

export const marketingHeading = Inter_Tight({
  variable: "--font-marketing-heading",
  subsets: ["latin"],
})

export const marketingFontClassName = `${marketingSans.variable} ${marketingHeading.variable}`
