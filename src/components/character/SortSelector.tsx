"use client";

/**
 * ソート条件セレクタ
 */

export type SortKey = "default" | "name" | "comboCount";

interface SortSelectorProps {
  sortKey: SortKey;
  onChange: (key: SortKey) => void;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "デフォルト" },
  { value: "name", label: "名前順" },
  { value: "comboCount", label: "コンボ数順" },
];

export default function SortSelector({ sortKey, onChange }: SortSelectorProps) {
  return (
    <select
      value={sortKey}
      onChange={(e) => onChange(e.target.value as SortKey)}
      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 focus:border-cyan-600 focus:outline-none"
      aria-label="ソート順"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
