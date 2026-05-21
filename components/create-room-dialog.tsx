"use client"

import type { VariantProps } from "class-variance-authority"
import type { KeyboardEvent, ReactNode } from "react"
import { useActionState, useMemo, useState } from "react"
import { createRoom } from "@/actions/rooms"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { dialogAccentSubmitClassName } from "@/lib/dashboard-nav-triggers"
import {
  getDescriptionWordCount,
  MAX_ROOM_DESCRIPTION_WORDS,
  normalizeRoomDescription,
} from "@/lib/room-description"
import type { ActionResult } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, GlobeIcon, InfoIcon, LockIcon } from "lucide-react"

export type CreateRoomDialogProps = {
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"]
  triggerSize?: VariantProps<typeof buttonVariants>["size"]
  triggerClassName?: string
  triggerLeadingIcon?: ReactNode
}

const initialState: ActionResult<{ roomId: string }> = {
  ok: true,
  data: {
    roomId: "",
  },
}

const BALANCE_PRESETS = [
  { label: "$10K", value: 10_000 },
  { label: "$100K", value: 100_000 },
  { label: "$1M", value: 1_000_000 },
] as const

const LATE_JOIN_HELP_TEXT =
  "Leave blank to allow joins until the competition ends. Use 0 to require joining before start, or enter hours (e.g. 48) to allow late joins for that long after start."

const padDatePart = (value: number) => String(value).padStart(2, "0")

const toDatetimeLocalValue = (date: Date) => {
  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  const hours = padDatePart(date.getHours())
  const minutes = padDatePart(date.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const roundToNextHalfHour = (date: Date) => {
  const rounded = new Date(date)
  const minutes = rounded.getMinutes()
  const remainder = minutes % 30

  if (remainder !== 0) {
    rounded.setMinutes(minutes + (30 - remainder))
  }

  rounded.setSeconds(0, 0)

  return rounded
}

const getDefaultCompetitionDates = () => {
  const startDate = roundToNextHalfHour(new Date())
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 7)

  return {
    startDate: toDatetimeLocalValue(startDate),
    endDate: toDatetimeLocalValue(endDate),
  }
}

const visibilityActiveClassName =
  "bg-accent-neon/12 text-foreground ring-1 ring-accent-neon/35 shadow-[0_0_14px_rgba(17,201,255,0.18)]"

export const CreateRoomDialog = (props?: CreateRoomDialogProps) => {
  const {
    triggerVariant = "default",
    triggerSize = "default",
    triggerClassName,
    triggerLeadingIcon,
  } = props ?? {}
  const [state, formAction, isPending] = useActionState(createRoom, initialState)
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [isPublic, setIsPublic] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [description, setDescription] = useState("")
  const [startingBalance, setStartingBalance] = useState("10000")
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10_000)
  const defaultDates = useMemo(() => getDefaultCompetitionDates(), [])
  const [startDate, setStartDate] = useState(defaultDates.startDate)
  const [endDate, setEndDate] = useState(defaultDates.endDate)
  const [stepError, setStepError] = useState<string | null>(null)

  const descriptionWordCount = getDescriptionWordCount(normalizeRoomDescription(description))
  const isDescriptionOverLimit = descriptionWordCount > MAX_ROOM_DESCRIPTION_WORDS

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (open) {
      return
    }

    setStep(1)
    setStepError(null)
    setIsPublic(false)
    setRoomName("")
    setDescription("")
    setStartingBalance("10000")
    setSelectedPreset(10_000)
    const resetDates = getDefaultCompetitionDates()
    setStartDate(resetDates.startDate)
    setEndDate(resetDates.endDate)
  }

  const handleSelectPrivate = () => {
    setIsPublic(false)
  }

  const handleSelectPublic = () => {
    setIsPublic(true)
  }

  const handleVisibilityKeyDown = (event: KeyboardEvent, selectPublic: boolean) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()

    if (selectPublic) {
      handleSelectPublic()
      return
    }

    handleSelectPrivate()
  }

  const handleBalanceChange = (value: string) => {
    setStartingBalance(value)

    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) {
      setSelectedPreset(null)
      return
    }

    const matchingPreset = BALANCE_PRESETS.find((preset) => preset.value === numericValue)
    setSelectedPreset(matchingPreset?.value ?? null)
  }

  const handlePresetSelect = (value: number) => {
    setStartingBalance(String(value))
    setSelectedPreset(value)
  }

  const handlePresetKeyDown = (event: KeyboardEvent, value: number) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    handlePresetSelect(value)
  }

  const handleNextStep = () => {
    const trimmedName = roomName.trim()

    if (trimmedName.length < 3) {
      setStepError("Room name must be at least 3 characters")
      return
    }

    if (isDescriptionOverLimit) {
      setStepError(`Description must be ${MAX_ROOM_DESCRIPTION_WORDS} words or fewer`)
      return
    }

    setStepError(null)
    setStep(2)
  }

  const handleBackStep = () => {
    setStepError(null)
    setStep(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          {triggerLeadingIcon}
          Create room
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden border-border/80 bg-popover p-0 sm:max-w-md",
          "max-h-[min(90vh,720px)] overflow-y-auto shadow-xl shadow-black/20",
        )}
      >
        <TooltipProvider>
          <form action={formAction} className="space-y-4 px-6 py-4">
            {step === 2 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackStep}
                className="-ml-2 w-fit gap-1 px-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
            ) : null}
            <DialogHeader className="gap-2 text-left">
              <DialogTitle className="text-lg font-semibold tracking-tight">Create competition room</DialogTitle>
              {step === 1 ? (
                <DialogDescription className="text-sm leading-snug text-muted-foreground">
                  {isPublic
                    ? "Public rooms appear on every trader’s dashboard. Anyone can join until the join window closes."
                    : "Private rooms stay hidden. Share a six-character code so others can join."}
                </DialogDescription>
              ) : null}
            </DialogHeader>

            {!state.ok ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

            {stepError ? (
              <Alert variant="destructive">
                <AlertDescription>{stepError}</AlertDescription>
              </Alert>
            ) : null}

            <input type="hidden" name="isPublic" value={isPublic ? "true" : "false"} />

            <div className={cn("space-y-4", step !== 1 && "hidden")} aria-hidden={step !== 1}>
              <div className="space-y-2">
                <Label htmlFor="name">Room name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Room visibility</Label>
                <div
                  className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/15 p-1"
                  role="group"
                  aria-label="Room visibility"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!isPublic}
                    tabIndex={0}
                    onClick={handleSelectPrivate}
                    onKeyDown={(event) => handleVisibilityKeyDown(event, false)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      !isPublic ? visibilityActiveClassName : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <LockIcon className="size-4 shrink-0" aria-hidden />
                    Private
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isPublic}
                    tabIndex={0}
                    onClick={handleSelectPublic}
                    onKeyDown={(event) => handleVisibilityKeyDown(event, true)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isPublic ? visibilityActiveClassName : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <GlobeIcon className="size-4 shrink-0" aria-hidden />
                    Public
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {isPublic
                    ? "Listed on everyone’s dashboard; no join code."
                    : "Hidden from browse; share a join code after creation."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Optional. Describe the competition."
                    rows={2}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className={cn(
                      "min-h-0 resize-none pb-7 !min-h-[4.25rem]",
                      isDescriptionOverLimit && "border-destructive ring-destructive/20",
                    )}
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute right-2.5 bottom-2 text-xs tabular-nums",
                      isDescriptionOverLimit ? "text-destructive" : "text-muted-foreground",
                    )}
                    aria-live="polite"
                  >
                    {descriptionWordCount} / {MAX_ROOM_DESCRIPTION_WORDS} words
                  </span>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className={dialogAccentSubmitClassName}
                onClick={handleNextStep}
              >
                Next
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>

            <div className={cn("space-y-4", step !== 2 && "hidden")} aria-hidden={step !== 2}>
              <div className="space-y-2">
                <Label htmlFor="startingBalance">Starting balance</Label>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
                    aria-hidden
                  >
                    $
                  </span>
                  <Input
                    id="startingBalance"
                    name="startingBalance"
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={startingBalance}
                    onChange={(event) => handleBalanceChange(event.target.value)}
                    className="pl-7"
                  />
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Starting balance presets">
                  {BALANCE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      tabIndex={0}
                      aria-pressed={selectedPreset === preset.value}
                      onClick={() => handlePresetSelect(preset.value)}
                      onKeyDown={(event) => handlePresetKeyDown(event, preset.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selectedPreset === preset.value
                          ? "border-accent-neon/35 bg-accent-neon/12 text-foreground ring-1 ring-accent-neon/35"
                          : "border-border/60 bg-muted/15 text-muted-foreground hover:border-accent-neon/25 hover:text-foreground",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Competition dates</Label>
                <div className="relative grid grid-cols-2 overflow-hidden rounded-lg border border-input">
                  <div className="space-y-1.5 border-r border-input p-2.5">
                    <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                      Start date
                    </Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="datetime-local-input border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div
                    className="pointer-events-none absolute top-1/2 left-1/2 z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-popover text-muted-foreground"
                    aria-hidden
                  >
                    <ArrowRight className="size-3" />
                  </div>
                  <div className="space-y-1.5 p-2.5">
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                      End date
                    </Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="datetime-local-input border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="lateJoinHours" className="mb-0">
                    Late join window (hours after start)
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        id="lateJoinHoursHelp"
                        tabIndex={0}
                        aria-label="Late join policy help"
                        className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      >
                        <InfoIcon className="size-3.5" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-left leading-relaxed">
                      {LATE_JOIN_HELP_TEXT}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="lateJoinHours"
                  name="lateJoinHours"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="Optional"
                  aria-describedby="lateJoinHoursHelp"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isPending}
                className={dialogAccentSubmitClassName}
              >
                {isPending ? (
                  "Creating..."
                ) : (
                  <>
                    Create Room
                    <ArrowRight className="size-4" aria-hidden />
                  </>
                )}
              </Button>
            </div>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  )
}
