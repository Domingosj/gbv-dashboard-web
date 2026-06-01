"use client";

interface Props {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function ModuleTabs({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="flex items-center gap-1 mb-6 p-1 bg-surface-container rounded-lg w-fit">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 text-label font-medium rounded-md transition-all ${
            activeTab === tab.key
              ? "bg-surface-container-lowest text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
