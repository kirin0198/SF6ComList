/**
 * ユーザー登録 API
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import {
  registerRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Origin ヘッダー検証（CSRF 対策）
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "不正なリクエスト元です" },
          { status: 403 },
        );
      }
    }

    // レートリミットチェック（IP あたり 3回/分）
    const ip = getClientIp(request.headers);
    const rateLimitResult = registerRateLimit.check(ip);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.retryAfterMs);
    }

    const body = await request.json();

    // バリデーション
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "入力値が不正です",
          details: result.error.errors,
        },
        { status: 400 },
      );
    }

    const { email, password, name } = result.data;

    // メールアドレス重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 409 },
      );
    }

    // パスワードハッシュ化（cost factor: 12）
    const passwordHash = await hash(password, 12);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error(
      "ユーザー登録エラー:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
