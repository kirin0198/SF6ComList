/**
 * キャラクターカードコンポーネント（Server Component）
 * SCR-003 のグリッドアイテム。キャラクター名・コンボ数・イニシャルアバターを表示。
 */

import Link from "next/link";
import { getCharacterInitials } from "@/lib/characters";
import type { Character } from "@/lib/characters";

interface CharacterCardProps {
  character: Character;
  comboCount: number;
}

export default function CharacterCard({
  character,
  comboCount,
}: CharacterCardProps) {
  const initials = getCharacterInitials(character);

  return (
    <Link
      href={`/characters/${character.id}/combos`}
      className="group flex flex-col items-center rounded-lg border border-gray-700 bg-gray-900 p-4 transition-colors duration-150 hover:border-cyan-600 hover:bg-gray-800"
    >
      {/* キャラクターアバター（イニシャル） */}
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-2xl font-bold text-gray-300 transition-colors duration-150 group-hover:bg-gray-600">
        {initials}
      </div>

      {/* キャラクター名 */}
      <p className="text-center text-sm font-semibold text-white">
        {character.displayName}
      </p>

      {/* コンボ数 */}
      <p className="mt-1 text-xs text-gray-400">
        {comboCount === 0 ? "コンボなし" : `${comboCount} combos`}
      </p>
    </Link>
  );
}
