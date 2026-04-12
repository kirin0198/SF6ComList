/**
 * GET /api/favorites/characters — お気に入りキャラクター一覧取得
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favoriteCharacter.findMany({
    where: { userId: session.user.id },
    select: { characterId: true },
  });

  return NextResponse.json({
    characterIds: favorites.map((f) => f.characterId),
  });
}
