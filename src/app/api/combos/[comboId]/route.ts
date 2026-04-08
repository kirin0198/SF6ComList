/**
 * GET    /api/combos/[comboId] — コンボ詳細取得
 * PUT    /api/combos/[comboId] — コンボ更新
 * DELETE /api/combos/[comboId] — コンボ削除
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { comboUpdateSchema } from "@/lib/combo/validation";
import { serializeNotation } from "@/lib/combo/notation-converter";
import type { ComboResponse, ComboSequence } from "@/lib/combo/types";

// ============================================================
// GET /api/combos/[comboId]
// ============================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> },
) {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { comboId } = await params;

  // コンボ取得（所有者チェック込み）
  const combo = await prisma.combo.findUnique({
    where: { id: comboId },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  if (!combo || combo.userId !== session.user.id) {
    return NextResponse.json(
      { error: "コンボが見つかりません" },
      { status: 404 },
    );
  }

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

  return NextResponse.json(response);
}

// ============================================================
// PUT /api/combos/[comboId]
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> },
) {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { comboId } = await params;

  // コンボ存在チェック
  const existingCombo = await prisma.combo.findUnique({
    where: { id: comboId },
  });

  if (!existingCombo) {
    return NextResponse.json(
      { error: "コンボが見つかりません" },
      { status: 404 },
    );
  }

  // 所有者チェック
  if (existingCombo.userId !== session.user.id) {
    return NextResponse.json(
      { error: "このコンボを編集する権限がありません" },
      { status: 403 },
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

  const parseResult = comboUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "バリデーションエラー", details: parseResult.error.errors },
      { status: 400 },
    );
  }

  const { name, sequence, damage, memo, tagIds } = parseResult.data;

  // notation を sequence から再生成（sequence が更新された場合）
  const notation = sequence
    ? serializeNotation(sequence)
    : existingCombo.notation;

  // タグの所有権チェック
  if (tagIds !== undefined && tagIds.length > 0) {
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

  // コンボ更新（トランザクションでタグを一括更新）
  const updatedCombo = await prisma.$transaction(async (tx) => {
    // タグが指定された場合は既存タグを削除して再作成
    if (tagIds !== undefined) {
      await tx.comboTag.deleteMany({ where: { comboId } });
    }

    return tx.combo.update({
      where: { id: comboId },
      data: {
        ...(name !== undefined && { name: name ?? null }),
        ...(sequence !== undefined && {
          sequence: JSON.stringify(sequence),
          notation,
        }),
        ...(damage !== undefined && { damage: damage ?? null }),
        ...(memo !== undefined && { memo: memo ?? null }),
        ...(tagIds !== undefined && {
          tags: {
            create: tagIds.map((tagId: string) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });
  });

  const response: ComboResponse = {
    id: updatedCombo.id,
    userId: updatedCombo.userId,
    characterId: updatedCombo.characterId,
    name: updatedCombo.name,
    sequence: JSON.parse(updatedCombo.sequence) as ComboSequence,
    notation: updatedCombo.notation,
    damage: updatedCombo.damage,
    memo: updatedCombo.memo,
    tags: updatedCombo.tags.map((ct) => ({
      id: ct.tag.id,
      name: ct.tag.name,
      isPreset: ct.tag.isPreset,
    })),
    createdAt: updatedCombo.createdAt.toISOString(),
    updatedAt: updatedCombo.updatedAt.toISOString(),
  };

  return NextResponse.json(response);
}

// ============================================================
// DELETE /api/combos/[comboId]
// ============================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> },
) {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { comboId } = await params;

  // コンボ存在チェック
  const existingCombo = await prisma.combo.findUnique({
    where: { id: comboId },
  });

  if (!existingCombo) {
    return NextResponse.json(
      { error: "コンボが見つかりません" },
      { status: 404 },
    );
  }

  // 所有者チェック
  if (existingCombo.userId !== session.user.id) {
    return NextResponse.json(
      { error: "このコンボを削除する権限がありません" },
      { status: 403 },
    );
  }

  // コンボ削除（ComboTag は CASCADE で削除される）
  await prisma.combo.delete({ where: { id: comboId } });

  return new NextResponse(null, { status: 204 });
}
