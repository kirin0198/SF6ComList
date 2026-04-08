/**
 * 方向キーアイコン SVG コンポーネント
 * テンキー表記の数字（1-9）に対応する矢印アイコンを表示する
 * 5 はニュートラル（N）を表す
 */

import React from "react";

type Direction =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9;

type IconSize = "sm" | "md" | "lg";

interface DirectionIconProps {
  direction: Direction;
  size?: IconSize;
  className?: string;
}

// サイズ定義（px）
const sizeMap: Record<IconSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

// 方向数字から回転角度へのマッピング
// テンキー配置: 7=左上, 8=上, 9=右上, 4=左, 5=ニュートラル, 6=右, 1=左下, 2=下, 3=右下
const directionToRotation: Record<string, number | null> = {
  "1": 225, // 左下
  "2": 270, // 下
  "3": 315, // 右下
  "4": 180, // 左
  "5": null, // ニュートラル（回転なし・別アイコン）
  "6": 0, // 右
  "7": 135, // 左上
  "8": 90, // 上
  "9": 45, // 右上
};

// 矢印 SVG（右向きをベースに回転で他の方向を表現）
function ArrowSvg({
  px,
  className,
  style,
}: {
  px: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ニュートラル（中立）アイコン
function NeutralSvg({ px, className }: { px: number; className?: string }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="5"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * DirectionIcon コンポーネント
 * テンキー表記の方向（1-9）を矢印または円形アイコンで表示する
 */
export default function DirectionIcon({
  direction,
  size = "sm",
  className = "",
}: DirectionIconProps) {
  const dirStr = String(direction);
  const px = sizeMap[size];
  const rotation = directionToRotation[dirStr];

  // ニュートラル（5）の場合は円形アイコン
  if (rotation === null) {
    return <NeutralSvg px={px} className={`text-gray-400 ${className}`} />;
  }

  return (
    <ArrowSvg
      px={px}
      className={`text-gray-300 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    />
  );
}
