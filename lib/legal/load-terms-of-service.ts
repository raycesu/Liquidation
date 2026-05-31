import { readFileSync } from "node:fs"
import { join } from "node:path"
import { redactLegalContactInfo } from "@/lib/legal/redact-legal-contact-info"
import { sanitizeLegalHtml } from "@/lib/legal/sanitize-legal-html"
import { stripTermlyExportArtifacts } from "@/lib/legal/strip-termly-artifacts"

const termsOfServicePath = join(process.cwd(), "content/legal/terms-of-service.html")

export const loadTermsOfServiceHtml = () => {
  const rawHtml = readFileSync(termsOfServicePath, "utf-8")
  return sanitizeLegalHtml(redactLegalContactInfo(stripTermlyExportArtifacts(rawHtml)))
}
