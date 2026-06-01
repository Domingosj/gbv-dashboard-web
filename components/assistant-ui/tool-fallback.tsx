import type { FC } from "react"

export const ToolFallback: FC<{ part: any }> = ({ part }) => {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container p-3 text-caption text-on-surface-variant my-2">
      Tool call: {part.args?.name || "unknown"}
    </div>
  )
}
