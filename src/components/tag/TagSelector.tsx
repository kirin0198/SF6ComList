"use client";

/**
 * TagSelector コンポーネント
 * プリセットタグ + ユーザー定義タグのトグル選択UI
 * 新しいユーザー定義タグの作成機能も含む
 */

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import type { TagResponse } from "@/lib/combo/types";

interface TagSelectorProps {
  /** 利用可能なタグ一覧 */
  availableTags: TagResponse[];
  /** 選択中のタグIDの配列 */
  selectedTagIds: string[];
  /** タグ選択が変更されたときのコールバック */
  onTagsChange: (tagIds: string[]) => void;
  /** 新しいタグが作成されたときのコールバック（オプション） */
  onTagCreate?: (tagName: string) => Promise<TagResponse | null>;
  className?: string;
}

/**
 * タグセレクターコンポーネント
 * プリセットタグとユーザー定義タグをトグルバッジとして表示する
 */
export default function TagSelector({
  availableTags,
  selectedTagIds,
  onTagsChange,
  onTagCreate,
  className = "",
}: TagSelectorProps) {
  // 新規タグ入力フィールドの値
  const [newTagName, setNewTagName] = useState("");
  // 新規タグ作成中フラグ
  const [isCreating, setIsCreating] = useState(false);
  // 新規タグ作成エラー
  const [createError, setCreateError] = useState<string | null>(null);

  /** タグのトグル選択 */
  const handleTagToggle = useCallback(
    (tagId: string) => {
      if (selectedTagIds.includes(tagId)) {
        onTagsChange(selectedTagIds.filter((id) => id !== tagId));
      } else {
        onTagsChange([...selectedTagIds, tagId]);
      }
    },
    [selectedTagIds, onTagsChange],
  );

  /** 新しいタグを作成 */
  const handleCreateTag = useCallback(async () => {
    const trimmedName = newTagName.trim();

    // バリデーション
    if (trimmedName.length === 0) {
      setCreateError("タグ名を入力してください");
      return;
    }
    if (trimmedName.length > 30) {
      setCreateError("タグ名は30文字以内で入力してください");
      return;
    }

    // 重複チェック（既存タグと同名）
    const exists = availableTags.some(
      (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (exists) {
      setCreateError("同じ名前のタグが既に存在します");
      return;
    }

    if (!onTagCreate) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const newTag = await onTagCreate(trimmedName);
      if (newTag) {
        // 作成後に自動選択
        onTagsChange([...selectedTagIds, newTag.id]);
        setNewTagName("");
      }
    } catch {
      setCreateError("タグの作成に失敗しました");
    } finally {
      setIsCreating(false);
    }
  }, [newTagName, availableTags, onTagCreate, selectedTagIds, onTagsChange]);

  /** Enterキーで作成 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreateTag();
      }
    },
    [handleCreateTag],
  );

  // プリセットタグとユーザー定義タグに分類
  const presetTags = availableTags.filter((tag) => tag.isPreset);
  const userTags = availableTags.filter((tag) => !tag.isPreset);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* プリセットタグ */}
      {presetTags.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-gray-500">プリセットタグ</p>
          <div className="flex flex-wrap gap-1.5">
            {presetTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  aria-pressed={isSelected}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
                    "focus:ring-1 focus:ring-cyan-500 focus:outline-none",
                    isSelected
                      ? "border-cyan-500 bg-cyan-900 text-cyan-300"
                      : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-gray-300",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ユーザー定義タグ */}
      {userTags.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-gray-500">カスタムタグ</p>
          <div className="flex flex-wrap gap-1.5">
            {userTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  aria-pressed={isSelected}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
                    "focus:ring-1 focus:ring-cyan-500 focus:outline-none",
                    isSelected
                      ? "border-cyan-500 bg-cyan-900 text-cyan-300"
                      : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-gray-300",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 新しいタグの作成 */}
      {onTagCreate && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">新しいタグを追加</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => {
                setNewTagName(e.target.value);
                setCreateError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="タグ名（最大30文字）"
              maxLength={30}
              disabled={isCreating}
              className={[
                "flex-1 rounded border bg-gray-800 px-3 py-1.5 text-sm text-white placeholder:text-gray-500",
                "transition-colors duration-150",
                "focus:ring-1 focus:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-40",
                createError
                  ? "border-red-600 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-700 focus:border-cyan-500 focus:ring-cyan-500",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="新しいタグ名"
              aria-invalid={!!createError}
              aria-describedby={createError ? "tag-create-error" : undefined}
            />
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={isCreating || newTagName.trim().length === 0}
              className="flex h-8 w-8 items-center justify-center rounded border border-gray-600 bg-gray-700 text-gray-300 transition-colors duration-150 hover:bg-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              aria-label="タグを追加"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* エラーメッセージ */}
          {createError && (
            <p id="tag-create-error" className="text-xs text-red-400" role="alert">
              {createError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
