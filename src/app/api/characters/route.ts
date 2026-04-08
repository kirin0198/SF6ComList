/**
 * GET /api/characters — キャラクター一覧取得
 * status: "active" のキャラクターのみ返す
 * ログインユーザーの登録コンボ数を付与
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCharacters } from "@/lib/characters";

export async function GET() {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // active キャラクターのみ取得
  const activeCharacters = getActiveCharacters();

  // ユーザーのキャラクター別コンボ数を一括取得
  const comboCounts = await prisma.combo.groupBy({
    by: ["characterId"],
    where: { userId: session.user.id },
    _count: { id: true },
  });

  // characterId → コンボ数のマップ
  const comboCountMap = new Map<string, number>(
    comboCounts.map((c) => [c.characterId, c._count.id]),
  );

  const characters = activeCharacters.map((character) => ({
    id: character.id,
    name: character.name,
    nameEn: character.name,
    displayName: character.displayName,
    status: character.status,
    comboCount: comboCountMap.get(character.id) ?? 0,
  }));

  return NextResponse.json({ characters });
}
