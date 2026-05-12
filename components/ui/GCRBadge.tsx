type Color = "green" | "red" | "amber" | "blue" | "grey";

const COLORS: Record<Color, string> = {
  green: "bg-success/10 text-success",
  red: "bg-critical/10 text-critical",
  amber: "bg-warning/10 text-warning",
  blue: "bg-info/10 text-info",
  grey: "bg-inactive/20 text-text-secondary",
};

interface Props {
  color?: Color;
  children: React.ReactNode;
  className?: string;
}

export default function GCRBadge({ color = "grey", children, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium ${COLORS[color]} ${className}`}>
      {children}
    </span>
  );
}
