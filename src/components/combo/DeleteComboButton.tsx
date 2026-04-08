"use client";

/**
 * コンボ削除ボタンコンポーネント
 * 確認ダイアログ表示 → DELETE API 呼び出し → コンボ一覧へリダイレクト
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ToastContainer } from "@/components/ui/Toast";

interface DeleteComboButtonProps {
  comboId: string;
  characterId: string;
}

/**
 * 削除ボタン + 確認ダイアログのクライアントコンポーネント
 */
export default function DeleteComboButton({
  comboId,
  characterId,
}: DeleteComboButtonProps) {
  const router = useRouter();
  const { toasts, closeToast, toast } = useToast();

  // ダイアログ開閉状態
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // 削除中フラグ
  const [isDeleting, setIsDeleting] = useState(false);

  /** 削除確認ダイアログを開く */
  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  /** ダイアログをキャンセルして閉じる */
  const handleCancel = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  /** コンボを削除する */
  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/combos/${comboId}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        let errorMessage = "コンボの削除に失敗しました";
        try {
          const error = await res.json();
          errorMessage = error.error ?? errorMessage;
        } catch {
          // JSON パース失敗は無視
        }
        throw new Error(errorMessage);
      }

      // 削除成功後はコンボ一覧へリダイレクト
      toast.success("コンボを削除しました");
      setIsDialogOpen(false);
      setTimeout(() => {
        router.push(`/characters/${characterId}/combos`);
        router.refresh();
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "削除に失敗しました";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [comboId, characterId, router, toast]);

  return (
    <>
      {/* 削除ボタン */}
      <button
        type="button"
        onClick={handleOpenDialog}
        className="inline-flex items-center gap-1.5 rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-red-700 hover:bg-red-900/30 hover:text-red-300"
        aria-label="コンボを削除"
      >
        <Trash2 size={14} />
        削除
      </button>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={isDialogOpen}
        title="コンボを削除しますか？"
        message="この操作は取り消せません。コンボが完全に削除されます。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancel}
      />

      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </>
  );
}
