"use client";

import { useState } from "react";

interface Option { value: string; label: string; }

interface Props {
  options: Option[];
  onChange?: (value: string) => void;
  defaultValue?: string;
}

export default function GCRTabToggle({ options, onChange, defaultValue }: Props) {
  const [selected, setSelected] = useState(defaultValue || options[0]?.value);

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-container p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            setSelected(opt.value);
            onChange?.(opt.value);
          }}
          className={`px-3 py-1.5 text-label font-medium rounded-md transition-all ${
            selected === opt.value
              ? "bg-surface-container-lowest text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
