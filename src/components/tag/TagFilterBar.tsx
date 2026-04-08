"use client";

/**
 * タグフィルタバーコンポーネント（Client Component）
 * タグをクリックして ON/OFF を切り替え、URLクエリパラメータに反映する
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { TagResponse } from "@/lib/combo/types";

interface TagFilterBarProps {
  tags: TagResponse[];
  /** 現在選択中のタグ ID 一覧 */
  selectedTagIds: string[];
  /** ベースとなる URL パス（例: /characters/ryu/combos） */
  basePath: string;
}

export default function TagFilterBar({
  tags,
  selectedTagIds,
  basePath,
}: TagFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleTag = useCallback(
    (tagId: string) => {
      // 現在の選択タグを更新
      const newSelected = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId];

      // URLクエリパラメータを更新
      const params = new URLSearchParams(searchParams.toString());
      if (newSelected.length > 0) {
        params.set("tags", newSelected.join(","));
      } else {
        params.delete("tags");
      }

      router.push(`${basePath}?${params.toString()}`);
    },
    [selectedTagIds, basePath, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push(basePath);
  }, [basePath, router]);

  if (tags.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-2 text-sm text-gray-400">タグで絞り込み:</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={[
                "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors duration-150",
                isSelected
                  ? "border border-cyan-500 bg-cyan-900 text-cyan-300"
                  : "border border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500",
              ].join(" ")}
            >
              {tag.name}
            </button>
          );
        })}

        {/* フィルタクリアボタン（選択中タグがある場合のみ表示） */}
        {selectedTagIds.length > 0 && (
          <button
            onClick={clearFilters}
            className="cursor-pointer rounded-full border border-gray-600 bg-transparent px-3 py-1 text-xs text-gray-500 transition-colors duration-150 hover:border-gray-500 hover:text-gray-300"
          >
            クリア
          </button>
        )}
      </div>
    </div>
  );
}
