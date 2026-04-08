"use client";

/**
 * SCR-007: コンボ編集画面（Client Component）
 * 既存コンボデータを取得して ComboForm に初期値として渡す
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ComboForm from "@/components/combo/ComboForm";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import type {
  ComboResponse,
  TagResponse,
  ComboSequence,
} from "@/lib/combo/types";

interface PageProps {
  params: Promise<{ characterId: string; comboId: string }>;
}

/**
 * コンボ編集画面（Client Component）
 */
export default function EditComboPage({ params }: PageProps) {
  const router = useRouter();
  const { toasts, closeToast, toast } = useToast();

  // URL パラメータ
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [comboId, setComboId] = useState<string | null>(null);
  // 既存コンボデータ
  const [comboData, setComboData] = useState<ComboResponse | null>(null);
  // キャラクター名
  const [characterName, setCharacterName] = useState<string | null>(null);
  // タグ一覧
  const [availableTags, setAvailableTags] = useState<TagResponse[]>([]);
  // ローディング状態
  const [isLoading, setIsLoading] = useState(true);
  // エラー状態
  const [loadError, setLoadError] = useState<string | null>(null);

  // params を解決してデータを取得
  useEffect(() => {
    params.then(({ characterId: cid, comboId: combId }) => {
      setCharacterId(cid);
      setComboId(combId);

      // 並行してデータを取得
      Promise.all([
        // コンボデータ取得
        fetch(`/api/combos/${combId}`).then(async (res) => {
          if (!res.ok) {
            if (res.status === 404) throw new Error("コンボが見つかりません");
            throw new Error("コンボの取得に失敗しました");
          }
          return res.json() as Promise<ComboResponse>;
        }),
        // タグ一覧取得
        fetch("/api/tags")
          .then((res) => res.json() as Promise<{ tags: TagResponse[] }>)
          .then((data) => data.tags)
          .catch(() => [] as TagResponse[]),
        // キャラクター情報取得
        fetch("/api/characters")
          .then(
            (res) =>
              res.json() as Promise<{
                characters: { id: string; displayName: string }[];
              }>,
          )
          .then(
            (data) =>
              data.characters.find((c) => c.id === cid)?.displayName ?? null,
          )
          .catch(() => null),
      ])
        .then(([combo, tags, charName]) => {
          setComboData(combo);
          setAvailableTags(tags);
          setCharacterName(charName);
        })
        .catch((err) => {
          setLoadError(
            err instanceof Error
              ? err.message
              : "データの読み込みに失敗しました",
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    });
  }, [params]);

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
      setAvailableTags((prev) => [...prev, newTag]);
      return newTag;
    },
    [],
  );

  /** コンボを更新する */
  const handleSubmit = useCallback(
    async (data: {
      name?: string | null;
      sequence: ComboSequence;
      damage?: number | null;
      memo?: string | null;
      tagIds: string[];
    }) => {
      if (!comboId || !characterId) throw new Error("コンボIDが不明です");

      const res = await fetch(`/api/combos/${comboId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "コンボの更新に失敗しました");
      }

      // 成功後はコンボ詳細画面へリダイレクト
      toast.success("コンボを更新しました");
      setTimeout(() => {
        router.push(`/characters/${characterId}/combos/${comboId}`);
        router.refresh();
      }, 500);
    },
    [comboId, characterId, router, toast],
  );

  /** キャンセル処理（コンボ詳細画面へ戻る） */
  const handleCancel = useCallback(() => {
    if (characterId && comboId) {
      router.push(`/characters/${characterId}/combos/${comboId}`);
    } else {
      router.back();
    }
  }, [characterId, comboId, router]);

  const backPath =
    characterId && comboId
      ? `/characters/${characterId}/combos/${comboId}`
      : characterId
        ? `/characters/${characterId}/combos`
        : "/";
  const backLabel = comboData?.name
    ? comboData.name
    : characterName
      ? `${characterName}のコンボ一覧`
      : "コンボ詳細";

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-cyan-500" />
      </div>
    );
  }

  // エラー状態
  if (loadError) {
    return (
      <div className="rounded-lg border border-red-700 bg-red-900/20 p-6 text-center">
        <p className="mb-4 text-red-300">{loadError}</p>
        <Link
          href={characterId ? `/characters/${characterId}/combos` : "/"}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-cyan-400"
        >
          <ArrowLeft size={14} />
          コンボ一覧に戻る
        </Link>
      </div>
    );
  }

  // データが取得できない場合
  if (!comboData) {
    return (
      <div className="text-center">
        <p className="text-gray-400">コンボが見つかりません</p>
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
      <h1 className="mb-6 text-2xl font-bold text-white">コンボを編集</h1>

      {/* コンボ編集フォーム（既存データを初期値として渡す） */}
      <ComboForm
        mode="edit"
        availableTags={availableTags}
        initialData={comboData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onTagCreate={handleTagCreate}
        submitLabel="変更を保存"
      />

      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
