/**
 * 認証済みレイアウト
 * AppHeader + メインコンテンツ + AppFooter を含む
 * 認証チェックはミドルウェアで処理済み
 */

import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}
