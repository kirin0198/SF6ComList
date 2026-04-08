/**
 * 認証ミドルウェア
 * Auth.js の middleware でルート保護を行う
 *
 * 認証不要パス: /login, /register, /api/auth
 * 認証必須パス: それ以外全て
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

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
