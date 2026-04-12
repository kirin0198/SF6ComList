/**
 * Playwright E2E テスト設定
 * TEST_PLAN.md Section 9.8 に準拠
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",

  // タイムアウト設定
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  // リトライ（CI: 1回、ローカル: 0回）
  retries: process.env.CI ? 1 : 0,

  // レポーター設定
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    // ベース URL
    baseURL: "http://localhost:3000",

    // ビューポート（UI_SPEC.md のデスクトップ前提）
    viewport: { width: 1280, height: 720 },

    // 失敗時のみスクリーンショット・トレースを取得
    screenshot: "only-on-failure",
    trace: "retain-on-failure",

    // アクションタイムアウト
    actionTimeout: 10000,
    navigationTimeout: 10000,
  },

  // ブラウザ設定（Chromium のみ）
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // 開発サーバーを自動起動
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      DATABASE_URL: "file:./data/test-e2e.db",
    },
  },
});
