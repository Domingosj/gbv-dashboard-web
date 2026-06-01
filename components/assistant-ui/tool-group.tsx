import type { FC, ReactNode } from "react"
import { cn } from "@/lib/utils"

export const ToolGroupRoot: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="my-2 rounded-lg border border-outline-variant overflow-hidden">{children}</div>
)

export const ToolGroupTrigger: FC<{ count?: number; active?: boolean }> = ({ count, active }) => (
  <div className={cn("px-3 py-2 text-caption font-medium", active ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant")}>
    {active ? "Running..." : `${count || 0} tool calls`}
  </div>
)

export const ToolGroupContent: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="divide-y divide-outline-variant/50">{children}</div>
)
