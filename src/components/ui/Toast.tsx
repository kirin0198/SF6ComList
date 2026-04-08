"use client";

/**
 * トースト通知コンポーネント
 * success / error / info の3種類
 * 自動消去（3秒後）に対応
 */

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

// トースト種別のスタイル定義
const toastStyles: Record<
  ToastType,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  success: {
    bg: "bg-green-900/80",
    border: "border-green-700",
    text: "text-green-300",
    icon: <CheckCircle size={16} />,
  },
  error: {
    bg: "bg-red-900/80",
    border: "border-red-700",
    text: "text-red-300",
    icon: <XCircle size={16} />,
  },
  info: {
    bg: "bg-blue-900/80",
    border: "border-blue-700",
    text: "text-blue-300",
    icon: <Info size={16} />,
  },
};

/**
 * 個別トーストアイテム（3秒後に自動消去）
 */
function ToastItem({ toast, onClose }: ToastItemProps) {
  const [visible, setVisible] = useState(true);
  const styles = toastStyles[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // フェードアウト後に削除
      setTimeout(() => onClose(toast.id), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={[
        "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg",
        "transition-all duration-300",
        styles.bg,
        styles.border,
        styles.text,
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      ].join(" ")}
      role="alert"
    >
      {styles.icon}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-2 opacity-60 transition-opacity hover:opacity-100"
        aria-label="閉じる"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

/**
 * トーストコンテナ（画面右下に固定表示）
 */
export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

/**
 * トースト管理フック
 * useToast() で toasts 配列と add/close 関数を取得する
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    addToast,
    closeToast,
    toast: {
      success: (message: string) => addToast("success", message),
      error: (message: string) => addToast("error", message),
      info: (message: string) => addToast("info", message),
    },
  };
}
