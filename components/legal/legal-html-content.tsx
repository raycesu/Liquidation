import "./termly-policy.css"
import { cn } from "@/lib/utils"

type LegalHtmlContentProps = {
  html: string
  className?: string
}

export const LegalHtmlContent = ({ html, className }: LegalHtmlContentProps) => (
  <article
    className={cn("legal-termly-content text-sm leading-relaxed text-slate-700", className)}
    dangerouslySetInnerHTML={{ __html: html }}
  />
)
