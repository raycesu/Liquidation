import type { Metadata } from "next"
import { LegalHtmlContent } from "@/components/legal/legal-html-content"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { loadTermsOfServiceHtml } from "@/lib/legal/load-terms-of-service"
import { BRAND_NAME } from "@/lib/brand"

export const metadata: Metadata = {
  title: `Terms of Service — ${BRAND_NAME}`,
  description: `Terms of Service for ${BRAND_NAME}, governing your access to and use of our platform.`,
}

export default function TermsOfServicePage() {
  const html = loadTermsOfServiceHtml()

  return (
    <LegalPageShell title="Terms of Service">
      <LegalHtmlContent html={html} />
    </LegalPageShell>
  )
}
