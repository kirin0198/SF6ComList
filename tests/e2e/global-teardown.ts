/**
 * E2E グローバルティアダウン
 * テスト用 DB ファイルを削除する
 * TEST_PLAN.md Section 9.4 に準拠
 */

import fs from "fs";
import path from "path";

export default async function globalTeardown() {
  const projectRoot = path.resolve(__dirname, "../..");
  const dbPath = path.join(projectRoot, "data", "test-e2e.db");
  const walPath = dbPath + "-wal";
  const shmPath = dbPath + "-shm";

  // テスト用 DB ファイルを削除
  for (const filePath of [dbPath, walPath, shmPath]) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`削除完了: ${filePath}`);
    }
  }
}
