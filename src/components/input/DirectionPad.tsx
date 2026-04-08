"use client";

/**
 * 方向キーパッドコンポーネント
 * テンキー配置（7,8,9/4,5,6/1,2,3）の3x3グリッドで方向を選択する
 *
 * アクセシビリティ:
 *   - role="grid" でグリッドナビゲーションを明示
 *   - 矢印キーでセル間移動（キーボードナビゲーション）
 *   - 各セルに aria-label で方向を説明
 */

import { useRef, useCallback } from "react";
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

// フラット配列（グリッドインデックス→方向）
const DIRECTION_FLAT = DIRECTION_LAYOUT.flat();

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

// 矢印キーによるグリッドナビゲーションのオフセット（列3）
const KEY_OFFSETS: Record<string, number> = {
  ArrowUp: -3,
  ArrowDown: 3,
  ArrowLeft: -1,
  ArrowRight: 1,
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
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /** 矢印キーによるグリッド内ナビゲーション */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const offset = KEY_OFFSETS[e.key];
      if (offset === undefined) return;

      e.preventDefault();
      const newIndex = currentIndex + offset;

      // グリッド境界チェック
      if (newIndex < 0 || newIndex >= DIRECTION_FLAT.length) return;

      // 左右移動: 行をまたがないように制限
      if (
        (e.key === "ArrowLeft" && currentIndex % 3 === 0) ||
        (e.key === "ArrowRight" && currentIndex % 3 === 2)
      ) {
        return;
      }

      buttonRefs.current[newIndex]?.focus();
    },
    [],
  );

  return (
    <div
      className={`grid grid-cols-3 gap-1 ${className}`}
      role="grid"
      aria-label="方向入力パッド"
    >
      {DIRECTION_FLAT.map((dir, index) => {
        // 選択中の方向をハイライト（最後に追加された方向を強調）
        const isSelected = selectedDirections.includes(dir);
        const isLastSelected =
          selectedDirections.length > 0 &&
          selectedDirections[selectedDirections.length - 1] === dir;

        return (
          <div key={dir} role="gridcell">
            <button
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              onClick={() => onSelect(dir)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-label={DIRECTION_LABELS[dir]}
              aria-pressed={isSelected}
              title={`${dir}: ${DIRECTION_LABELS[dir]}`}
              className={[
                // サイズ: UI_SPEC.md 指定の 40x40px セル
                "flex h-10 w-10 items-center justify-center",
                "rounded border transition-colors duration-150",
                // フォーカスインジケーター（アクセシビリティ強化）
                "focus:ring-2 focus:ring-cyan-500 focus:outline-none",
                // 選択状態に応じたスタイル
                isLastSelected
                  ? "border-cyan-500 bg-cyan-900 text-cyan-300"
                  : isSelected
                    ? "border-cyan-700 bg-cyan-950 text-cyan-400"
                    : dir === "5"
                      ? "border-gray-600 bg-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-500"
                      : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-500 active:bg-gray-400",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <DirectionIcon direction={dir} size="sm" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
