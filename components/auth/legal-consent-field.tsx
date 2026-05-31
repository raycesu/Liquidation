import Link from "next/link"
import { PRIVACY_POLICY_PATH, TERMS_OF_SERVICE_PATH } from "@/lib/legal/routes"
import { cn } from "@/lib/utils"

type LegalConsentFieldProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const LegalConsentField = ({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: LegalConsentFieldProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange(event.target.checked)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLLabelElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    if (disabled) {
      return
    }

    onCheckedChange(!checked)
  }

  return (
    <label
      htmlFor="legal-consent"
      tabIndex={0}
      aria-label="Agree to Terms of Service and Privacy Policy"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        id="legal-consent"
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        required
        className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-transparent accent-[#11bfff]"
        aria-describedby="legal-consent-description"
      />
      <span id="legal-consent-description" className="text-sm leading-relaxed text-[#87abcf]">
        I agree to the{" "}
        <Link
          href={TERMS_OF_SERVICE_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#e6f3ff] underline-offset-4 hover:text-accent-neon hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href={PRIVACY_POLICY_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#e6f3ff] underline-offset-4 hover:text-accent-neon hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          Privacy Policy
        </Link>
      </span>
    </label>
  )
}
