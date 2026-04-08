/**
 * SCR-004: コンボ一覧画面
 * キャラクター別コンボ一覧 + タグフィルタ + 新規登録ボタン
 * Server Component + Client Component (TagFilterBar) の組み合わせ
 */

import { Suspense } from "react";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCharacterById, getCharacterInitials } from "@/lib/characters";
import ComboCard from "@/components/combo/ComboCard";
import TagFilterBar from "@/components/tag/TagFilterBar";
import { notFound } from "next/navigation";
import type {
  ComboResponse,
  ComboSequence,
  TagResponse,
} from "@/lib/combo/types";

interface PageProps {
  params: Promise<{ characterId: string }>;
  searchParams: Promise<{ tags?: string }>;
}

export default async function ComboListPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  const { characterId } = await params;
  const { tags: tagsParam } = await searchParams;

  // キャラクター存在チェック
  const character = getCharacterById(characterId);
  if (!character) {
    notFound();
  }

  // 選択中タグ ID を URL クエリパラメータから取得
  const selectedTagIds = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  // タグ一覧取得（プリセット + ユーザー定義）
  const tags = session?.user?.id
    ? await prisma.tag.findMany({
        where: {
          OR: [{ isPreset: true }, { userId: session.user.id }],
        },
        orderBy: [{ isPreset: "desc" }, { name: "asc" }],
      })
    : [];

  const tagResponses: TagResponse[] = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    isPreset: tag.isPreset,
  }));

  // コンボ一覧取得（タグフィルタ付き）
  const combos = session?.user?.id
    ? await prisma.combo.findMany({
        where: {
          userId: session.user.id,
          characterId,
          ...(selectedTagIds.length > 0
            ? {
                tags: {
                  some: {
                    tagId: { in: selectedTagIds },
                  },
                },
              }
            : {}),
        },
        include: {
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const comboResponses: ComboResponse[] = combos.map((combo) => ({
    id: combo.id,
    userId: combo.userId,
    characterId: combo.characterId,
    name: combo.name,
    sequence: JSON.parse(combo.sequence) as ComboSequence,
    notation: combo.notation,
    damage: combo.damage,
    memo: combo.memo,
    tags: combo.tags.map((ct) => ({
      id: ct.tag.id,
      name: ct.tag.name,
      isPreset: ct.tag.isPreset,
    })),
    createdAt: combo.createdAt.toISOString(),
    updatedAt: combo.updatedAt.toISOString(),
  }));

  const initials = getCharacterInitials(character);
  const basePath = `/characters/${characterId}/combos`;

  return (
    <div>
      {/* パンくずリスト */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-cyan-400"
        >
          <ArrowLeft size={14} />
          キャラクター一覧
        </Link>
      </div>

      {/* キャラクター情報ヘッダー */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* キャラクターアバター */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-lg font-bold text-gray-300">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {character.displayName} のコンボ一覧
            </h1>
            <p className="text-sm text-gray-400">
              {comboResponses.length} 件
              {selectedTagIds.length > 0 && " (フィルタ中)"}
            </p>
          </div>
        </div>

        {/* 新規登録ボタン */}
        <Link
          href={`${basePath}/new`}
          className="inline-flex items-center gap-2 rounded bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-500"
        >
          <Plus size={16} />
          新しいコンボを登録
        </Link>
      </div>

      {/* タグフィルタバー */}
      {tagResponses.length > 0 && (
        <Suspense fallback={null}>
          <TagFilterBar
            tags={tagResponses}
            selectedTagIds={selectedTagIds}
            basePath={basePath}
          />
        </Suspense>
      )}

      {/* コンボ一覧 */}
      {comboResponses.length === 0 ? (
        <EmptyState hasFilter={selectedTagIds.length > 0} basePath={basePath} />
      ) : (
        <div className="flex flex-col gap-3">
          {comboResponses.map((combo) => (
            <ComboCard key={combo.id} combo={combo} characterId={characterId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 空状態コンポーネント
// ============================================================

function EmptyState({
  hasFilter,
  basePath,
}: {
  hasFilter: boolean;
  basePath: string;
}) {
  if (hasFilter) {
    return (
      <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center">
        <p className="text-gray-400">
          選択したタグに該当するコンボがありません
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center">
      <p className="mb-4 text-gray-400">
        コンボが登録されていません。最初のコンボを登録しましょう！
      </p>
      <Link
        href={`${basePath}/new`}
        className="inline-flex items-center gap-2 rounded bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-500"
      >
        <Plus size={16} />
        最初のコンボを登録
      </Link>
    </div>
  );
}
