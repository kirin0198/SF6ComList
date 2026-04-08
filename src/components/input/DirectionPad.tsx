"use client";

/**
 * 方向キーパッドコンポーネント
 * テンキー配置（7,8,9/4,5,6/1,2,3）の3x3グリッドで方向を選択する
 */

import DirectionIcon from "@/components/icons/DirectionIcon";
import type { Direction } from "@/lib/combo/types";

interface DirectionPadProps {
  /** 選択中の方向（ハイライト表示に使用） */
  selectedDirections?: Direction[];
  /** 方向が選択されたときのコールバック */
  onSelect: (direction: Direction) => void;
  className?: string;
}

// テンキー配置通りのレイアウト（行: 上→中→下、列: 左→中→右）
const DIRECTION_LAYOUT: Direction[][] = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
];

// 方向の説明ラベル（アクセシビリティ用）
const DIRECTION_LABELS: Record<Direction, string> = {
  "7": "左上（上後）",
  "8": "上",
  "9": "右上（上前）",
  "4": "左（後）",
  "5": "ニュートラル",
  "6": "右（前）",
  "1": "左下（下後）",
  "2": "下",
  "3": "右下（下前）",
};

/**
 * テンキー配置の方向パッドコンポーネント
 * UI_SPEC.md: 40x40px セル、gap-1
 */
export default function DirectionPad({
  selectedDirections = [],
  onSelect,
  className = "",
}: DirectionPadProps) {
  return (
    <div
      className={`grid grid-cols-3 gap-1 ${className}`}
      role="group"
      aria-label="方向入力パッド"
    >
      {DIRECTION_LAYOUT.flat().map((dir) => {
        // 選択中の方向をハイライト（最後に追加された方向を強調）
        const isSelected = selectedDirections.includes(dir);
        const isLastSelected =
          selectedDirections.length > 0 &&
          selectedDirections[selectedDirections.length - 1] === dir;

        return (
          <button
            key={dir}
            type="button"
            onClick={() => onSelect(dir)}
            aria-label={DIRECTION_LABELS[dir]}
            title={`${dir}: ${DIRECTION_LABELS[dir]}`}
            className={[
              // サイズ: UI_SPEC.md 指定の 40x40px セル
              "flex h-10 w-10 items-center justify-center",
              "rounded border transition-colors duration-150",
              // ベーススタイル
              "focus:ring-1 focus:ring-cyan-500 focus:outline-none",
              // 選択状態に応じたスタイル
              isLastSelected
                ? "border-cyan-500 bg-cyan-900 text-cyan-300"
                : isSelected
                  ? "border-cyan-700 bg-cyan-950 text-cyan-400"
                  : dir === "5"
                    ? "border-gray-600 bg-gray-600 text-gray-300 hover:bg-gray-500 hover:border-gray-500"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-500 hover:border-gray-500 active:bg-gray-400",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <DirectionIcon direction={dir} size="sm" />
          </button>
        );
      })}
    </div>
  );
}
