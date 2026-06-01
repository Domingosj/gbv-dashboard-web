type Color = "green" | "red" | "amber" | "blue" | "grey";

const COLORS: Record<Color, string> = {
  green: "bg-success/10 text-success",
  red: "bg-danger/10 text-danger",
  amber: "bg-warning/10 text-warning",
  blue: "bg-primary/10 text-primary",
  grey: "bg-outline/10 text-on-surface-variant",
};

interface Props {
  color?: Color;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export default function GCRBadge({ color = "grey", children, className = "", dot = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold leading-none ${COLORS[color]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}
