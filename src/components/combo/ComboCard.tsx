/**
 * コンボカードコンポーネント（Server Component）
 * SCR-004 のコンボ一覧アイテム。コンボ情報をカード形式で表示する。
 */

import Link from "next/link";
import type { ComboResponse } from "@/lib/combo/types";

interface ComboCardProps {
  combo: ComboResponse;
  characterId: string;
}

export default function ComboCard({ combo, characterId }: ComboCardProps) {
  const displayName = combo.name ?? (
    <span className="text-gray-500 italic">無題のコンボ</span>
  );

  return (
    <Link
      href={`/characters/${characterId}/combos/${combo.id}`}
      className="block rounded-lg border border-gray-700 bg-gray-900 p-4 transition-colors duration-150 hover:border-gray-600 hover:bg-gray-800/80"
    >
      {/* コンボ名 */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{displayName}</h3>

        {/* ダメージ */}
        {combo.damage !== null && (
          <span className="shrink-0 text-sm text-gray-400">
            {combo.damage.toLocaleString()} ダメージ
          </span>
        )}
      </div>

      {/* テンキー表記（ComboSequencePreview の代替） */}
      <div className="mb-3 rounded border border-gray-800 bg-gray-950 px-3 py-2">
        <p className="font-mono text-sm text-cyan-400">{combo.notation}</p>
      </div>

      {/* タグバッジ */}
      {combo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {combo.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
