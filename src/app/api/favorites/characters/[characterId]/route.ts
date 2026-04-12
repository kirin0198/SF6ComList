/**
 * PUT /api/favorites/characters/[characterId] — お気に入り追加
 * DELETE /api/favorites/characters/[characterId] — お気に入り解除
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCharacterById } from "@/lib/characters";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;

  if (!getCharacterById(characterId)) {
    return NextResponse.json(
      { error: "キャラクターが見つかりません" },
      { status: 404 },
    );
  }

  await prisma.favoriteCharacter.upsert({
    where: {
      userId_characterId: {
        userId: session.user.id,
        characterId,
      },
    },
    create: {
      userId: session.user.id,
      characterId,
    },
    update: {},
  });

  return NextResponse.json({ favorited: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;

  await prisma.favoriteCharacter.deleteMany({
    where: {
      userId: session.user.id,
      characterId,
    },
  });

  return NextResponse.json({ favorited: false });
}
