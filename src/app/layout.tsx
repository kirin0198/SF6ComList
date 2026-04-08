/**
 * ルートレイアウト
 * ダークテーマ（bg-gray-950）+ Inter フォント設定
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SF6 コンボ帳",
  description: "ストリートファイター6 コンボ管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
