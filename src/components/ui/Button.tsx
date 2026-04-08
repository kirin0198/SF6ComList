"use client";

/**
 * 汎用ボタンコンポーネント
 * variant: primary / secondary / danger / ghost
 * size: sm / md / lg
 */

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// バリアント別スタイル定義
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-40 text-white",
  secondary:
    "bg-gray-700 hover:bg-gray-600 active:bg-gray-800 disabled:opacity-40 text-white",
  danger:
    "bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-40 text-white",
  ghost:
    "bg-transparent hover:bg-gray-800 active:bg-gray-900 disabled:opacity-40 text-gray-400 hover:text-white",
};

// サイズ別スタイル定義
const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2 rounded font-bold",
          "transition-colors duration-150",
          "focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-gray-950 focus:outline-none",
          "disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {/* ローディングスピナー */}
        {loading && <Loader2 size={14} className="animate-spin" />}

        {/* 左アイコン（ローディング中は非表示） */}
        {!loading && leftIcon}

        {children}

        {/* 右アイコン */}
        {rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
