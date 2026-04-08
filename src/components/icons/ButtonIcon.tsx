/**
 * ボタンアイコン SVG コンポーネント
 * LP/MP/HP/LK/MK/HK/DI/DR/DP/OD/DRev/SA1/SA2/SA3/Throw を表示する
 * 円形背景 + テキストラベルで表現する
 */

type ButtonInputType =
  | "LP"
  | "MP"
  | "HP"
  | "LK"
  | "MK"
  | "HK"
  | "DI"
  | "DR"
  | "DP"
  | "OD"
  | "DRev"
  | "SA1"
  | "SA2"
  | "SA3"
  | "Throw";

type IconSize = "sm" | "md" | "lg";

interface ButtonIconProps {
  button: ButtonInputType;
  size?: IconSize;
  className?: string;
}

// ボタン種別ごとの背景色定義（UI_SPEC.md カラーパレットに準拠）
const buttonColors: Record<ButtonInputType, string> = {
  // パンチ系
  LP: "bg-blue-400",
  MP: "bg-blue-600",
  HP: "bg-blue-800",
  // キック系
  LK: "bg-red-400",
  MK: "bg-red-600",
  HK: "bg-red-800",
  // ドライブ系
  DI: "bg-yellow-500",
  DR: "bg-yellow-400",
  DP: "bg-green-500",
  OD: "bg-purple-500",
  DRev: "bg-orange-500",
  // スーパーアーツ系
  SA1: "bg-cyan-500",
  SA2: "bg-cyan-600",
  SA3: "bg-cyan-800",
  // その他
  Throw: "bg-gray-500",
};

// ボタン種別ごとの省略ラベル（短くて読みやすい）
const buttonLabels: Record<ButtonInputType, string> = {
  LP: "LP",
  MP: "MP",
  HP: "HP",
  LK: "LK",
  MK: "MK",
  HK: "HK",
  DI: "DI",
  DR: "DR",
  DP: "DP",
  OD: "OD",
  DRev: "DR!",
  SA1: "SA1",
  SA2: "SA2",
  SA3: "SA3",
  Throw: "投",
};

// サイズ定義
const sizeStyles: Record<
  IconSize,
  { container: string; text: string }
> = {
  sm: {
    container: "h-6 min-w-6 px-1.5",
    text: "text-xs",
  },
  md: {
    container: "h-8 min-w-8 px-2",
    text: "text-sm",
  },
  lg: {
    container: "h-10 min-w-10 px-2.5",
    text: "text-base",
  },
};

/**
 * ButtonIcon コンポーネント
 * 格闘ゲームのボタン（LP/MP 等）を色付き円形バッジで表示する
 */
export default function ButtonIcon({
  button,
  size = "sm",
  className = "",
}: ButtonIconProps) {
  const colorClass = buttonColors[button];
  const label = buttonLabels[button];
  const { container, text } = sizeStyles[size];

  return (
    <span
      className={[
        "inline-flex items-center justify-center",
        "rounded-full font-bold text-white",
        "border border-white/20",
        colorClass,
        container,
        text,
        className,
      ].join(" ")}
      aria-label={button}
      title={button}
    >
      {label}
    </span>
  );
}
