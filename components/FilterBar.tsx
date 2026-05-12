"use client";

interface Props {
  label?: string;
  children: React.ReactNode;
}

export default function FilterBar({ label = "Filtrar por:", children }: Props) {
  return (
    <div className="flex items-center flex-wrap gap-3 mb-5 p-3 bg-white rounded-xl border border-border">
      <span className="text-caption font-medium text-text-secondary uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}
