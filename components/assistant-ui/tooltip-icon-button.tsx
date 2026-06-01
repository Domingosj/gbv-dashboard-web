import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

interface TooltipIconButtonProps extends ButtonProps {
  tooltip: string
}

export const TooltipIconButton = forwardRef<HTMLButtonElement, TooltipIconButtonProps>(
  ({ className, tooltip, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("size-8 rounded-full", className)}
      title={tooltip}
      aria-label={tooltip}
      {...props}
    />
  )
)
TooltipIconButton.displayName = "TooltipIconButton"
