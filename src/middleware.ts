/**
 * 認証ミドルウェア
 * Auth.js の middleware でルート保護を行う
 *
 * 認証不要パス: /login, /register, /api/auth
 * 認証必須パス: それ以外全て
 *
 * レートリミット: /api/auth/callback/credentials (POST) に適用
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  loginRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // ログイン POST にレートリミットを適用（IP あたり 5回/分）
  if (method === "POST" && pathname === "/api/auth/callback/credentials") {
    const ip = getClientIp(req.headers);
    const result = loginRateLimit.check(ip);
    if (!result.success) {
      return rateLimitResponse(result.retryAfterMs);
    }
  }

  const isLoggedIn = !!req.auth;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isApiAuth = pathname.startsWith("/api/auth");

  // 未認証で認証必須ページにアクセス → ログインへリダイレクト
  if (!isLoggedIn && !isAuthPage && !isApiAuth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 認証済みでログイン/登録ページにアクセス → トップへリダイレクト
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // 静的アセット・画像・faviconは対象外
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons).*)"],
};
