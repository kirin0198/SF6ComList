"use client";

/**
 * 汎用入力フィールドコンポーネント
 * ラベル・エラーメッセージ・パスワード表示トグルに対応
 */

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, type, className = "", id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-400"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={[
              "w-full rounded border bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500",
              "transition-colors duration-150",
              "focus:ring-2 focus:outline-none",
              error
                ? "border-red-600 focus:border-red-500 focus:ring-red-500"
                : "border-gray-700 focus:border-cyan-500 focus:ring-cyan-500",
              isPassword ? "pr-10" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {/* パスワード表示/非表示トグル */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
              tabIndex={-1}
              aria-label={
                showPassword ? "パスワードを隠す" : "パスワードを表示"
              }
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {/* エラーメッセージ */}
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* ヒントテキスト（エラーがない場合のみ表示） */}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;
