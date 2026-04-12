"use client";

/**
 * SCR-005: コンボ登録画面
 * ビジュアル/テキスト入力でコンボを組み立て、メタデータとともに保存する
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ComboForm from "@/components/combo/ComboForm";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import type { TagResponse, ComboSequence } from "@/lib/combo/types";

interface PageProps {
  params: Promise<{ characterId: string }>;
}

/**
 * コンボ登録画面（Client Component）
 * ComboForm を使用してコンボを登録する
 */
export default function NewComboPage({ params }: PageProps) {
  const router = useRouter();
  const { toasts, closeToast, toast } = useToast();

  // URL パラメータからキャラクターIDを取得
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string | null>(null);
  // タグ一覧（API から取得）
  const [availableTags, setAvailableTags] = useState<TagResponse[]>([]);
  // ローディング状態
  const [isLoading, setIsLoading] = useState(true);

  // params を非同期で解決してキャラクターIDを取得
  useEffect(() => {
    params.then(({ characterId: cid }) => {
      setCharacterId(cid);
      // キャラクター情報を取得
      fetch(`/api/characters`)
        .then((res) => res.json())
        .then((data: { characters: { id: string; displayName: string }[] }) => {
          const character = data.characters.find((c) => c.id === cid);
          if (character) {
            setCharacterName(character.displayName);
          }
        })
        .catch(() => {
          // キャラクター取得失敗は無視（フォームは表示する）
        });
    });
  }, [params]);

  // タグ一覧を取得
  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data: { tags: TagResponse[] }) => {
        setAvailableTags(data.tags);
      })
      .catch(() => {
        // タグ取得失敗は無視（TagSelector なしで表示）
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  /** 新しいタグを作成する */
  const handleTagCreate = useCallback(
    async (tagName: string): Promise<TagResponse | null> => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "タグの作成に失敗しました");
      }

      const newTag: TagResponse = await res.json();
      // タグ一覧を更新
      setAvailableTags((prev) => [...prev, newTag]);
      return newTag;
    },
    [],
  );

  /** コンボを保存する */
  const handleSubmit = useCallback(
    async (data: {
      name?: string | null;
      sequence: ComboSequence;
      damage?: number | null;
      memo?: string | null;
      tagIds: string[];
    }) => {
      if (!characterId) throw new Error("キャラクターIDが不明です");

      const res = await fetch(`/api/characters/${characterId}/combos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "コンボの保存に失敗しました");
      }

      // 成功後はコンボ一覧へリダイレクト
      toast.success("コンボを登録しました");
      setTimeout(() => {
        router.push(`/characters/${characterId}/combos`);
      }, 500);
    },
    [characterId, router, toast],
  );

  /** キャンセル処理 */
  const handleCancel = useCallback(() => {
    if (characterId) {
      router.push(`/characters/${characterId}/combos`);
    } else {
      router.back();
    }
  }, [characterId, router]);

  const backPath = characterId ? `/characters/${characterId}/combos` : "/";
  const backLabel = characterName
    ? `${characterName}のコンボ一覧`
    : "コンボ一覧";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-cyan-500" />
      </div>
    );
  }

  return (
    <div>
      {/* パンくずリスト */}
      <div className="mb-4">
        <Link
          href={backPath}
          className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-cyan-400"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
      </div>

      {/* ページタイトル */}
      <h1 className="mb-6 text-2xl font-bold text-white">新しいコンボを登録</h1>

      {/* コンボ登録フォーム */}
      <ComboForm
        characterId={characterId ?? ""}
        mode="create"
        availableTags={availableTags}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onTagCreate={handleTagCreate}
        submitLabel="このコンボを保存"
      />

      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
