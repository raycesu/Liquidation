import { readFileSync } from "node:fs"
import { join } from "node:path"
import { redactLegalContactInfo } from "@/lib/legal/redact-legal-contact-info"
import { sanitizeLegalHtml } from "@/lib/legal/sanitize-legal-html"
import { stripTermlyExportArtifacts } from "@/lib/legal/strip-termly-artifacts"

const privacyPolicyPath = join(process.cwd(), "content/legal/privacy-policy.html")

export const loadPrivacyPolicyHtml = () => {
  const rawHtml = readFileSync(privacyPolicyPath, "utf-8")
  return sanitizeLegalHtml(redactLegalContactInfo(stripTermlyExportArtifacts(rawHtml)))
}
