import * as React from "react"

import { cn } from "@/lib/utils"

function sanitizeNumberInput(value: string, opts: { allowDecimal: boolean }) {
  const { allowDecimal } = opts

  if (value === "") return ""

  const chars = value.split("")
  const kept: string[] = []
  let seenDot = false

  for (const ch of chars) {
    if (ch >= "0" && ch <= "9") {
      kept.push(ch)
      continue
    }
    if (allowDecimal && ch === "." && !seenDot) {
      kept.push(ch)
      seenDot = true
      continue
    }
  }

  return kept.join("")
}

function allowsDecimal(step: React.ComponentProps<"input">["step"]) {
  if (step === undefined) return false
  if (step === "any") return true
  if (typeof step === "number") return !Number.isInteger(step)
  if (typeof step === "string") return step.includes(".")
  return false
}

function Input({
  className,
  type,
  onChange,
  onKeyDown,
  onPaste,
  inputMode,
  pattern,
  step,
  ...props
}: React.ComponentProps<"input">) {
  const isNumber = type === "number"
  const allowDecimal = isNumber ? allowsDecimal(step) : false

  const mergedOnKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNumber) {
        if (e.ctrlKey || e.metaKey) {
          onKeyDown?.(e)
          return
        }

        const isDigit = e.key.length === 1 && e.key >= "0" && e.key <= "9"
        const isControl = [
          "Backspace",
          "Delete",
          "Tab",
          "Escape",
          "Enter",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
        ].includes(e.key)

        const isDecimalPoint = e.key === "."

        if (allowDecimal && isDecimalPoint) {
          const start = e.currentTarget.selectionStart ?? 0
          const end = e.currentTarget.selectionEnd ?? 0
          const selected = e.currentTarget.value.slice(start, end)
          const selectionIncludesDot = selected.includes(".")
          const alreadyHasDot = e.currentTarget.value.includes(".")
          if (alreadyHasDot && !selectionIncludesDot) e.preventDefault()
        } else if (!isDigit && !isControl) {
          e.preventDefault()
        }
      }

      onKeyDown?.(e)
    },
    [allowDecimal, isNumber, onKeyDown],
  )

  const mergedOnPaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (isNumber) {
        const pasted = e.clipboardData.getData("text")
        const sanitized = sanitizeNumberInput(pasted, { allowDecimal })
        if (pasted !== sanitized) {
          e.preventDefault()

          const start = e.currentTarget.selectionStart ?? 0
          const end = e.currentTarget.selectionEnd ?? 0
          const nextValue =
            e.currentTarget.value.slice(0, start) +
            sanitized +
            e.currentTarget.value.slice(end)

          e.currentTarget.value = sanitizeNumberInput(nextValue, { allowDecimal })

          const nextCaret = start + sanitized.length
          e.currentTarget.setSelectionRange(nextCaret, nextCaret)

          const inputEvent = new Event("input", { bubbles: true })
          e.currentTarget.dispatchEvent(inputEvent)
        }
      }

      onPaste?.(e)
    },
    [allowDecimal, isNumber, onPaste],
  )

  const mergedOnChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumber) {
        const raw = e.currentTarget.value
        const next = sanitizeNumberInput(raw, { allowDecimal })
        if (raw !== next) e.currentTarget.value = next
      }

      onChange?.(e)
    },
    [allowDecimal, isNumber, onChange],
  )

  const derivedInputMode = isNumber
    ? (inputMode ?? (allowDecimal ? "decimal" : "numeric"))
    : inputMode

  const derivedPattern = isNumber
    ? (pattern ?? (allowDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*"))
    : pattern

  return (
    <input
      type={type}
      data-slot="input"
      step={isNumber ? step : undefined}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      inputMode={derivedInputMode}
      pattern={derivedPattern}
      onKeyDown={mergedOnKeyDown}
      onPaste={mergedOnPaste}
      onChange={mergedOnChange}
      {...props}
    />
  )
}

export { Input }
