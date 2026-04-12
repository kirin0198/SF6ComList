/**
 * SCR-003: キャラクター一覧画面（トップ）
 * Server Component でデータを取得し、Client Component に渡す
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCharacters } from "@/lib/characters";
import CharacterListClient from "@/components/character/CharacterListClient";

export default async function CharacterListPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // active キャラクター一覧取得
  const activeCharacters = getActiveCharacters();

  // ユーザーのキャラクター別コンボ数を一括取得
  let comboCountMap: Record<string, number> = {};
  let favoriteIds: string[] = [];

  if (userId) {
    const [comboCounts, favorites] = await Promise.all([
      prisma.combo.groupBy({
        by: ["characterId"],
        where: { userId },
        _count: { id: true },
      }),
      prisma.favoriteCharacter.findMany({
        where: { userId },
        select: { characterId: true },
      }),
    ]);

    comboCountMap = Object.fromEntries(
      comboCounts.map((c) => [c.characterId, c._count.id]),
    );
    favoriteIds = favorites.map((f) => f.characterId);
  }

  return (
    <CharacterListClient
      characters={activeCharacters}
      comboCountMap={comboCountMap}
      initialFavoriteIds={favoriteIds}
      isLoggedIn={!!userId}
    />
  );
}
