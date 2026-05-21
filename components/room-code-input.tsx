"use client"

import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const ROOM_CODE_LENGTH = 6
const CODE_CHAR_PATTERN = /[A-Za-z0-9]/

export type RoomCodeInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

const sanitizeCode = (raw: string): string => {
  return raw
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, ROOM_CODE_LENGTH)
}

const getChars = (value: string): string[] => {
  const chars = value.split("")
  while (chars.length < ROOM_CODE_LENGTH) {
    chars.push("")
  }
  return chars.slice(0, ROOM_CODE_LENGTH)
}

export const RoomCodeInput = ({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  className,
}: RoomCodeInputProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const chars = getChars(value)

  const focusCell = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, ROOM_CODE_LENGTH - 1))
    inputRefs.current[clampedIndex]?.focus()
    inputRefs.current[clampedIndex]?.select()
  }, [])

  const updateValue = useCallback(
    (next: string) => {
      onChange(sanitizeCode(next))
    },
    [onChange],
  )

  useEffect(() => {
    if (!autoFocus || disabled) {
      return
    }

    const frame = requestAnimationFrame(() => {
      focusCell(0)
    })

    return () => cancelAnimationFrame(frame)
  }, [autoFocus, disabled, focusCell])

  const handleChange = (index: number, nextChar: string) => {
    const sanitized = sanitizeCode(nextChar)
    const nextChars = [...chars]

    if (sanitized.length === 0) {
      nextChars[index] = ""
      updateValue(nextChars.join(""))
      return
    }

    const char = sanitized[sanitized.length - 1]
    nextChars[index] = char
    updateValue(nextChars.join(""))

    if (index < ROOM_CODE_LENGTH - 1) {
      focusCell(index + 1)
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault()

      if (chars[index]) {
        const nextChars = [...chars]
        nextChars[index] = ""
        updateValue(nextChars.join(""))
        return
      }

      if (index > 0) {
        const nextChars = [...chars]
        nextChars[index - 1] = ""
        updateValue(nextChars.join(""))
        focusCell(index - 1)
      }

      return
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault()
      focusCell(index - 1)
      return
    }

    if (event.key === "ArrowRight" && index < ROOM_CODE_LENGTH - 1) {
      event.preventDefault()
      focusCell(index + 1)
      return
    }

    if (event.key === "Delete") {
      event.preventDefault()
      const nextChars = [...chars]
      nextChars[index] = ""
      updateValue(nextChars.join(""))
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = sanitizeCode(event.clipboardData.getData("text"))
    if (!pasted) {
      return
    }

    updateValue(pasted)
    focusCell(Math.min(pasted.length, ROOM_CODE_LENGTH - 1))
  }

  return (
    <fieldset className={cn("min-w-0", className)} disabled={disabled}>
      <legend className="sr-only">Room code</legend>
      <input type="hidden" name="joinCode" value={value} required={value.length === ROOM_CODE_LENGTH} />
      <div
        className="flex justify-center gap-2"
        role="group"
        aria-label="Room code"
      >
        {chars.map((char, index) => (
          <Input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element
            }}
            type="text"
            inputMode="text"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={1}
            value={char}
            disabled={disabled}
            aria-label={`Room code character ${index + 1} of ${ROOM_CODE_LENGTH}`}
            className={cn(
              "size-11 shrink-0 px-0 text-center font-mono text-lg font-semibold uppercase",
              "tracking-normal md:text-lg",
            )}
            onChange={(event) => {
              const nextValue = event.target.value
              if (nextValue.length === 0) {
                handleChange(index, "")
                return
              }

              const lastChar = nextValue[nextValue.length - 1]
              if (!CODE_CHAR_PATTERN.test(lastChar)) {
                return
              }

              handleChange(index, lastChar)
            }}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
          />
        ))}
      </div>
    </fieldset>
  )
}
