"use client";

interface Props {
  label?: string;
  children: React.ReactNode;
}

export default function FilterBar({ label = "Filtrar por:", children }: Props) {
  return (
    <div className="flex items-center flex-wrap gap-3 mb-5 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
      <span className="text-label-caps font-semibold text-on-surface-variant">{label}</span>
      {children}
    </div>
  );
}
