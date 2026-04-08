/**
 * SCR-003: キャラクター一覧画面（トップ）
 * 全キャラクターをグリッド表示する Server Component
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCharacters } from "@/lib/characters";
import CharacterCard from "@/components/character/CharacterCard";

export default async function CharacterListPage() {
  const session = await auth();

  // active キャラクター一覧取得
  const activeCharacters = getActiveCharacters();

  // ユーザーのキャラクター別コンボ数を一括取得
  let comboCountMap = new Map<string, number>();
  if (session?.user?.id) {
    const comboCounts = await prisma.combo.groupBy({
      by: ["characterId"],
      where: { userId: session.user.id },
      _count: { id: true },
    });
    comboCountMap = new Map(
      comboCounts.map((c) => [c.characterId, c._count.id]),
    );
  }

  return (
    <div>
      {/* ページタイトル */}
      <h1 className="mb-6 text-2xl font-bold text-white">キャラクター一覧</h1>

      {/* キャラクターグリッド */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {activeCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            comboCount={comboCountMap.get(character.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
