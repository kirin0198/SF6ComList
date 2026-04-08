/**
 * GET  /api/tags — タグ一覧取得（プリセット + ユーザー定義）
 * POST /api/tags — ユーザー定義タグ作成
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tagCreateSchema } from "@/lib/validators/tag";

// ============================================================
// GET /api/tags
// ============================================================

export async function GET() {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // プリセットタグ + ログインユーザーのタグを取得
  const tags = await prisma.tag.findMany({
    where: {
      OR: [{ isPreset: true }, { userId: session.user.id }],
    },
    orderBy: [
      { isPreset: "desc" }, // プリセットを先に表示
      { name: "asc" },
    ],
  });

  return NextResponse.json({
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      isPreset: tag.isPreset,
    })),
  });
}

// ============================================================
// POST /api/tags
// ============================================================

export async function POST(request: NextRequest) {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const parseResult = tagCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "バリデーションエラー", details: parseResult.error.errors },
      { status: 400 },
    );
  }

  const { name } = parseResult.data;

  // 同名タグの重複チェック（ユーザー内）
  const existingTag = await prisma.tag.findFirst({
    where: {
      name,
      OR: [{ isPreset: true }, { userId: session.user.id }],
    },
  });

  if (existingTag) {
    return NextResponse.json(
      { error: "同名のタグが既に存在します" },
      { status: 409 },
    );
  }

  // タグ作成
  const tag = await prisma.tag.create({
    data: {
      name,
      isPreset: false,
      userId: session.user.id,
    },
  });

  return NextResponse.json(
    {
      id: tag.id,
      name: tag.name,
      isPreset: tag.isPreset,
    },
    { status: 201 },
  );
}
