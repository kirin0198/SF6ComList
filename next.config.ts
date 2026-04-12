import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // クライアントが MIME タイプを上書きしないよう強制
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // クリックジャッキング対策: iframe への埋め込みを禁止
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Referer ヘッダーの送信を制限（プライバシー保護）
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 不要なブラウザ機能を無効化
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS: HTTPS 接続を強制（本番環境では必須）
          // Cloud Run は HTTPS 終端するため、アプリ側でも設定
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // XSS フィルタ（レガシーブラウザ向け）
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // CSP: 個人利用ツールのため比較的緩めの設定
          // unsafe-inline は Next.js のインラインスクリプト・スタイルに必要
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
