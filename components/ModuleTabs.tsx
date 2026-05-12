"use client";

import { useState } from "react";

interface Props {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function ModuleTabs({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="flex items-center gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 text-label font-medium rounded-lg transition-all ${
            activeTab === tab.key
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
