"use client";

/**
 * ボタンパレットコンポーネント
 * SF6 のボタン入力を5グループに分けてパレット表示する
 */

import ButtonIcon from "@/components/icons/ButtonIcon";
import type { ButtonInput } from "@/lib/combo/types";

// ButtonIcon がサポートするボタン種別（"PP" を除く）
type ButtonIconInput = Exclude<ButtonInput, "PP">;

interface ButtonPaletteProps {
  /** ボタンが選択されたときのコールバック */
  onSelect: (button: ButtonInput) => void;
  className?: string;
}

/** ボタングループの定義 */
interface ButtonGroup {
  label: string;
  buttons: ButtonIconInput[];
}

const BUTTON_GROUPS: ButtonGroup[] = [
  {
    label: "パンチ",
    buttons: ["LP", "MP", "HP"] as ButtonIconInput[],
  },
  {
    label: "キック",
    buttons: ["LK", "MK", "HK"] as ButtonIconInput[],
  },
  {
    label: "ドライブ",
    buttons: ["DI", "DR", "OD", "DP", "DRev"] as ButtonIconInput[],
  },
  {
    label: "SA",
    buttons: ["SA1", "SA2", "SA3"] as ButtonIconInput[],
  },
  {
    label: "その他",
    buttons: ["Throw"] as ButtonIconInput[],
  },
];

/**
 * ボタン入力パレットコンポーネント
 * 5グループに分けてボタンを表示し、クリックで選択する
 */
export default function ButtonPalette({
  onSelect,
  className = "",
}: ButtonPaletteProps) {
  return (
    <div
      className={`flex flex-col gap-2 ${className}`}
      role="group"
      aria-label="ボタン選択パレット"
    >
      {BUTTON_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {/* グループラベル */}
          <span className="text-xs text-gray-400">{group.label}</span>

          {/* ボタン列 */}
          <div className="flex flex-wrap gap-1">
            {group.buttons.map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => onSelect(btn as ButtonInput)}
                className="rounded border border-transparent transition-opacity duration-150 hover:opacity-80 focus:ring-2 focus:ring-cyan-500 focus:outline-none active:opacity-60"
                aria-label={btn}
              >
                <ButtonIcon button={btn} size="md" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
