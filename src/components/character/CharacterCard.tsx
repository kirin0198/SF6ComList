/**
 * キャラクターカードコンポーネント
 * SCR-003 のグリッド/リスト表示に対応。
 */

import Link from "next/link";
import { getCharacterInitials } from "@/lib/characters";
import type { Character } from "@/lib/characters";
import FavoriteButton from "./FavoriteButton";
import type { ViewMode } from "./ViewToggle";

interface CharacterCardProps {
  character: Character;
  comboCount: number;
  viewMode: ViewMode;
  favorited: boolean;
  onFavoriteToggle?: (characterId: string, favorited: boolean) => void;
}

export default function CharacterCard({
  character,
  comboCount,
  viewMode,
  favorited,
  onFavoriteToggle,
}: CharacterCardProps) {
  const initials = getCharacterInitials(character);

  if (viewMode === "list") {
    return (
      <Link
        href={`/characters/${character.id}/combos`}
        className="group flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 transition-colors duration-150 hover:border-cyan-600 hover:bg-gray-800"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-700 text-lg font-bold text-gray-300 transition-colors duration-150 group-hover:bg-gray-600">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {character.displayName}
          </p>
          <p className="text-xs text-gray-400">
            {comboCount === 0 ? "コンボなし" : `${comboCount} combos`}
          </p>
        </div>
        <FavoriteButton
          characterId={character.id}
          initialFavorited={favorited}
          onToggle={onFavoriteToggle}
        />
      </Link>
    );
  }

  return (
    <Link
      href={`/characters/${character.id}/combos`}
      className="group relative flex flex-col items-center rounded-lg border border-gray-700 bg-gray-900 p-4 transition-colors duration-150 hover:border-cyan-600 hover:bg-gray-800"
    >
      <div className="absolute right-2 top-2">
        <FavoriteButton
          characterId={character.id}
          initialFavorited={favorited}
          onToggle={onFavoriteToggle}
        />
      </div>

      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-2xl font-bold text-gray-300 transition-colors duration-150 group-hover:bg-gray-600">
        {initials}
      </div>

      <p className="text-center text-sm font-semibold text-white">
        {character.displayName}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {comboCount === 0 ? "コンボなし" : `${comboCount} combos`}
      </p>
    </Link>
  );
}
