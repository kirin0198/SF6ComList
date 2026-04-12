/**
 * E2E グローバルセットアップ
 * テスト用 DB 初期化（マイグレーション + シード）
 * TEST_PLAN.md Section 9.4 に準拠
 */

import { execSync } from "child_process";
import path from "path";

export default async function globalSetup() {
  // テスト用 DB のパスを環境変数に設定
  process.env.DATABASE_URL = "file:./data/test-e2e.db";

  const projectRoot = path.resolve(__dirname, "../..");

  console.log("テスト用 DB を初期化中...");
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);

  try {
    // スキーマを適用（migrate deploy はマイグレーションフォルダが必要なため db push を使用）
    execSync("npx prisma db push --skip-generate", {
      cwd: projectRoot,
      env: {
        ...process.env,
        DATABASE_URL: "file:./data/test-e2e.db",
      },
      stdio: "pipe",
    });
    console.log("スキーマ適用完了");

    // プリセットタグを投入
    execSync("npx prisma db seed", {
      cwd: projectRoot,
      env: {
        ...process.env,
        DATABASE_URL: "file:./data/test-e2e.db",
      },
      stdio: "pipe",
    });
    console.log("シード完了");
  } catch (error) {
    console.error("DB 初期化エラー:", error);
    throw error;
  }
}
