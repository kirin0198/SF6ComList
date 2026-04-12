/**
 * E2E テスト共通ヘルパー関数
 */

import { type Page } from "@playwright/test";

/**
 * Next.js route announcer を除いた alert ロケーター
 * Next.js が内部で使用する role="alert" のアナウンサーを除外する
 */
export function getAlert(page: Page) {
  return page.locator(
    '[role="alert"]:not([id="__next-route-announcer__"])',
  );
}

/**
 * ログイン試行ヘルパー（遷移待機なし）
 * ログイン失敗テストなど、遷移が発生しないケースで使用する
 */
export async function tryLogin(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(email);
  // type="password" の input を直接選択（"パスワード" ラベルは複数要素にマッチするため）
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
}

/**
 * ログインヘルパー（成功時の遷移待機あり）
 * ログイン成功が期待されるケースで使用する
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await tryLogin(page, email, password);
  await page.waitForURL("/");
}

/**
 * ユーザー登録ヘルパー（API 経由）
 * 既に登録済みの場合は 409 を無視する
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const response = await page.request.post("/api/auth/register", {
    data: { email, password },
  });
  if (!response.ok() && response.status() !== 409) {
    throw new Error(`ユーザー登録失敗: ${response.status()}`);
  }
}

/**
 * 認証済みセットアップヘルパー
 */
export async function setupAuthenticatedPage(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await registerUser(page, email, password);
  await loginUser(page, email, password);
}

/**
 * API 経由でコンボを作成する共通ヘルパー
 */
export async function createComboViaAPI(
  page: Page,
  characterId: string,
  data: {
    name?: string;
    damage?: number | null;
    memo?: string | null;
    tagIds?: string[];
  } = {},
): Promise<string> {
  const comboData = {
    name: data.name ?? "テスト BnB",
    sequence: {
      steps: [
        {
          type: "normal",
          directions: [],
          button: "LP",
          isOD: false,
          modifier: undefined,
        },
      ],
      notation: "LP",
    },
    notation: "LP",
    damage: data.damage ?? null,
    memo: data.memo ?? null,
    tagIds: data.tagIds ?? [],
  };

  const response = await page.request.post(
    `/api/characters/${characterId}/combos`,
    { data: comboData },
  );

  if (!response.ok()) {
    throw new Error(`コンボ作成失敗: ${response.status()}`);
  }

  const combo = await response.json();
  return combo.id;
}
