/**
 * GET /api/characters/[characterId]/combos — キャラクター別コンボ一覧取得
 * POST /api/characters/[characterId]/combos — コンボ新規登録
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCharacterById } from "@/lib/characters";
import { comboCreateSchema } from "@/lib/combo/validation";
import { serializeNotation } from "@/lib/combo/notation-converter";
import type { ComboResponse } from "@/lib/combo/types";
import type { ComboSequence } from "@/lib/combo/types";

// ============================================================
// GET /api/characters/[characterId]/combos
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;

  // キャラクター存在チェック
  const character = getCharacterById(characterId);
  if (!character) {
    return NextResponse.json(
      { error: "キャラクターが見つかりません" },
      { status: 404 },
    );
  }

  // クエリパラメータ取得
  const { searchParams } = new URL(request.url);
  const tagsParam = searchParams.get("tags");
  const tagIds = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  // コンボ一覧取得（タグフィルタ付き）
  const combos = await prisma.combo.findMany({
    where: {
      userId: session.user.id,
      characterId,
      // タグフィルタ（OR条件）
      ...(tagIds.length > 0
        ? {
            tags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          }
        : {}),
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // レスポンス形式に変換
  const response: ComboResponse[] = combos.map((combo) => ({
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

  return NextResponse.json({ combos: response });
}

// ============================================================
// POST /api/characters/[characterId]/combos
// ============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;

  // キャラクター存在チェック
  const character = getCharacterById(characterId);
  if (!character) {
    return NextResponse.json(
      { error: "キャラクターが見つかりません" },
      { status: 404 },
    );
  }

  // リクエストボディのパースとバリデーション
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディのパースに失敗しました" },
      { status: 400 },
    );
  }

  const parseResult = comboCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "バリデーションエラー", details: parseResult.error.errors },
      { status: 400 },
    );
  }

  const { name, sequence, damage, memo, tagIds } = parseResult.data;

  // テンキー表記を sequence から生成（notation カラムへ保存）
  const notation = serializeNotation(sequence);

  // タグの所有権チェック（ユーザー所有タグ または プリセットタグのみ許可）
  if (tagIds && tagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        OR: [{ isPreset: true }, { userId: session.user.id }],
      },
    });
    if (tags.length !== tagIds.length) {
      return NextResponse.json(
        { error: "無効なタグIDが含まれています" },
        { status: 400 },
      );
    }
  }

  // コンボ作成
  const combo = await prisma.combo.create({
    data: {
      userId: session.user.id,
      characterId,
      name: name ?? null,
      sequence: JSON.stringify(sequence),
      notation,
      damage: damage ?? null,
      memo: memo ?? null,
      tags: {
        create: (tagIds ?? []).map((tagId: string) => ({
          tag: { connect: { id: tagId } },
        })),
      },
    },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  const response: ComboResponse = {
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
  };

  return NextResponse.json(response, { status: 201 });
}
