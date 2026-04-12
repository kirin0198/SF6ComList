"use client";

/**
 * 表示切替トグル（グリッド/リスト）
 */

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-lg border border-gray-700 bg-gray-800">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`flex items-center gap-1 rounded-l-lg px-3 py-1.5 text-sm transition-colors ${
          mode === "grid"
            ? "bg-cyan-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
        aria-label="グリッド表示"
        aria-pressed={mode === "grid"}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`flex items-center gap-1 rounded-r-lg px-3 py-1.5 text-sm transition-colors ${
          mode === "list"
            ? "bg-cyan-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
        aria-label="リスト表示"
        aria-pressed={mode === "list"}
      >
        <List size={16} />
      </button>
    </div>
  );
}
