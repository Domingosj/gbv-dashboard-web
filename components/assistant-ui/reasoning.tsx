import type { FC, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

export const ReasoningRoot: FC<{ defaultOpen?: boolean; children: ReactNode }> = ({ defaultOpen, children }) => (
  <div className="my-2">{children}</div>
)

export const ReasoningTrigger: FC<{ active?: boolean }> = ({ active }) => {
  const [open, setOpen] = useState(false)
  return (
    <button onClick={() => setOpen(!open)} className={cn("flex items-center gap-1 text-caption font-medium", active ? "text-primary" : "text-on-surface-variant")}>
      {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      {active ? "Thinking..." : "Show reasoning"}
    </button>
  )
}

export const ReasoningContent: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="mt-1 text-caption text-on-surface-variant border-l-2 border-outline-variant pl-3">{children}</div>
)

export const ReasoningText: FC<{ children: ReactNode }> = ({ children }) => <>{children}</>

export const Reasoning: FC<{ content?: string }> = ({ content }) => (
  <div className="text-caption text-on-surface-variant italic">{content}</div>
)
