import type { Metadata } from "next"
import { LegalHtmlContent } from "@/components/legal/legal-html-content"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { loadPrivacyPolicyHtml } from "@/lib/legal/load-privacy-policy"
import { BRAND_NAME } from "@/lib/brand"

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `Privacy Policy for ${BRAND_NAME}, describing how we collect, use, and protect your personal information.`,
}

export default function PrivacyPolicyPage() {
  const html = loadPrivacyPolicyHtml()

  return (
    <LegalPageShell title="Privacy Policy">
      <LegalHtmlContent html={html} />
    </LegalPageShell>
  )
}
