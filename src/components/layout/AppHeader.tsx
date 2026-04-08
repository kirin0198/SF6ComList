/**
 * 共通ヘッダーコンポーネント
 * ロゴ・ナビゲーション・ログアウトボタンを含む
 * Server Component として実装（signOut は Server Action を使用）
 */

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { auth, signOut } from "@/lib/auth";

export default async function AppHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-700 bg-gray-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* ロゴ */}
        <Link
          href="/"
          className="text-lg font-bold tracking-widest text-white transition-colors hover:text-cyan-400"
        >
          SF6 <span className="text-cyan-500">COMBO</span>{" "}
          <span className="text-gray-400">NOTE</span>
        </Link>

        {/* ユーザー情報・ログアウト */}
        <div className="flex items-center gap-4">
          {session?.user && (
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <User size={14} />
              {session.user.email}
            </span>
          )}

          {/* ログアウトフォーム（Server Action） */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <LogOut size={14} />
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
