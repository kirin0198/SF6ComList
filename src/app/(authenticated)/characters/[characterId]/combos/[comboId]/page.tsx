/**
 * SCR-006: コンボ詳細画面（Server Component）
 * 登録済みコンボの全属性を表示する
 * Prisma で直接データを取得する
 */

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCharacterById } from "@/lib/characters";
import ComboSequencePreview from "@/components/combo/ComboSequencePreview";
import DeleteComboButton from "@/components/combo/DeleteComboButton";
import type { ComboSequence } from "@/lib/combo/types";

interface PageProps {
  params: Promise<{ characterId: string; comboId: string }>;
}

/**
 * コンボ詳細画面（Server Component）
 */
export default async function ComboDetailPage({ params }: PageProps) {
  const session = await auth();
  const { characterId, comboId } = await params;

  // キャラクター存在チェック
  const character = getCharacterById(characterId);
  if (!character) {
    notFound();
  }

  // コンボを Prisma で取得（タグを含む）
  const combo = await prisma.combo.findUnique({
    where: { id: comboId },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  // コンボが存在しない、または他のユーザーのコンボの場合は 404
  if (!combo || combo.userId !== session?.user?.id) {
    notFound();
  }

  const sequence = JSON.parse(combo.sequence) as ComboSequence;
  const backPath = `/characters/${characterId}/combos`;

  return (
    <div>
      {/* パンくずリスト */}
      <div className="mb-4">
        <Link
          href={backPath}
          className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-cyan-400"
        >
          <ArrowLeft size={14} />
          {character.displayName}のコンボ一覧
        </Link>
      </div>

      {/* メインコンテンツカード */}
      <div className="rounded-lg border border-gray-700 bg-gray-900">
        {/* ヘッダー: コンボ名 + アクションボタン */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-700 p-4">
          <h1 className="text-xl font-bold text-white">
            {combo.name ?? (
              <span className="text-gray-500 italic">無題のコンボ</span>
            )}
          </h1>

          <div className="flex shrink-0 gap-2">
            {/* 編集ボタン */}
            <Link
              href={`/characters/${characterId}/combos/${comboId}/edit`}
              className="inline-flex items-center gap-1.5 rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
            >
              <Pencil size={14} />
              編集
            </Link>

            {/* 削除ボタン（Client Component） */}
            <DeleteComboButton comboId={comboId} characterId={characterId} />
          </div>
        </div>

        {/* コンボシーケンス表示 */}
        <div className="p-4">
          <p className="mb-2 text-sm font-medium text-gray-400">
            コンボシーケンス
          </p>
          <ComboSequencePreview steps={sequence.steps} size="md" />

          {/* テンキー表記 */}
          <p className="mt-3 font-mono text-sm text-gray-300">
            {combo.notation}
          </p>
        </div>

        {/* メタデータ行 */}
        <div className="flex flex-wrap items-start gap-6 border-t border-gray-700 px-4 py-3">
          {/* ダメージ値 */}
          {combo.damage !== null && (
            <div>
              <p className="text-xs text-gray-500">ダメージ</p>
              <p className="text-xl font-bold text-white">
                {combo.damage.toLocaleString()}
              </p>
            </div>
          )}

          {/* タグ */}
          {combo.tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-gray-500">タグ</p>
              <div className="flex flex-wrap gap-1.5">
                {combo.tags.map((ct) => (
                  <span
                    key={ct.tag.id}
                    className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-300"
                  >
                    {ct.tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* メモ */}
        {combo.memo && (
          <div className="border-t border-gray-700 px-4 py-3">
            <p className="mb-1.5 text-xs text-gray-500">メモ</p>
            <p className="text-sm whitespace-pre-wrap text-gray-300">
              {combo.memo}
            </p>
          </div>
        )}

        {/* 日時情報 */}
        <div className="flex gap-6 border-t border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500">
            作成日:{" "}
            <span className="text-gray-400">
              {new Date(combo.createdAt).toLocaleDateString("ja-JP")}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            更新日:{" "}
            <span className="text-gray-400">
              {new Date(combo.updatedAt).toLocaleDateString("ja-JP")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
