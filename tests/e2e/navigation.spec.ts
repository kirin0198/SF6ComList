/**
 * 画面遷移・ナビゲーション・認証ガード E2E テスト
 * TEST_PLAN.md Section 9.6.6: TC-E2E-060 〜 TC-E2E-068
 */

import { test, expect } from "@playwright/test";
import { TEST_USER_A, TEST_USER_B } from "./fixtures/test-data";
import { setupAuthenticatedPage, loginUser, registerUser, createComboViaAPI } from "./fixtures/helpers";

const CHARACTER_ID = "ryu";

test.describe("画面遷移・ナビゲーション", () => {
  // ============================================================
  // 認証ガードテスト（未認証）
  // ============================================================

  test.describe("未認証リダイレクト", () => {
    /** TC-E2E-060: 未認証で `/` にアクセスするとログイン画面にリダイレクトされる */
    test("TC-E2E-060: 未認証で / にアクセスするとリダイレクトされる", async ({
      page,
    }) => {
      // 未ログイン状態（新しいコンテキスト）
      await page.goto("/");
      await expect(page).toHaveURL("/login");
    });

    /** TC-E2E-061: 未認証で `/characters/ryu/combos` にアクセスするとリダイレクトされる */
    test("TC-E2E-061: 未認証でコンボ一覧にアクセスするとリダイレクトされる", async ({
      page,
    }) => {
      await page.goto(`/characters/${CHARACTER_ID}/combos`);
      await expect(page).toHaveURL("/login");
    });
  });

  // ============================================================
  // 認証済みナビゲーションテスト
  // ============================================================

  test.describe("認証済みナビゲーション", () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedPage(page, TEST_USER_A.email, TEST_USER_A.password);
    });

    /** TC-E2E-062: コンボ一覧のパンくずリストでキャラクター一覧に戻れる */
    test("TC-E2E-062: コンボ一覧のパンくずリストでキャラクター一覧に戻れる", async ({
      page,
    }) => {
      await page.goto(`/characters/${CHARACTER_ID}/combos`);

      // パンくずリストの「キャラクター一覧」リンクをクリック
      await page.getByRole("link", { name: "キャラクター一覧" }).click();

      await expect(page).toHaveURL("/");
    });

    /** TC-E2E-063: コンボ登録画面のパンくずリストでコンボ一覧に戻れる */
    test("TC-E2E-063: コンボ登録画面のパンくずリストでコンボ一覧に戻れる", async ({
      page,
    }) => {
      await page.goto(`/characters/${CHARACTER_ID}/combos/new`);

      // ローディング完了待機
      await page.waitForSelector(".animate-spin", { state: "detached" }).catch(() => {});

      // パンくずリンクをクリック（コンボ一覧へ）
      await page.locator(".mb-4 a").first().click();

      await expect(page).toHaveURL(
        `/characters/${CHARACTER_ID}/combos`,
      );
    });

    /** TC-E2E-064: コンボ詳細画面のパンくずリストでコンボ一覧に戻れる */
    test("TC-E2E-064: コンボ詳細画面のパンくずリストでコンボ一覧に戻れる", async ({
      page,
    }) => {
      const comboId = await createComboViaAPI(page, CHARACTER_ID, { name: "パンくずテスト (TC-064)" });

      await page.goto(`/characters/${CHARACTER_ID}/combos/${comboId}`);

      // パンくずリンクをクリック（コンボ一覧へ）
      await page.locator(".mb-4 a").first().click();

      await expect(page).toHaveURL(
        `/characters/${CHARACTER_ID}/combos`,
      );
    });

    /** TC-E2E-065: ヘッダーロゴクリックでキャラクター一覧に遷移する */
    test("TC-E2E-065: ヘッダーロゴクリックでキャラクター一覧に遷移する", async ({
      page,
    }) => {
      await page.goto(`/characters/${CHARACTER_ID}/combos`);

      // ヘッダーのロゴをクリック
      await page.locator('header a[href="/"]').click();

      await expect(page).toHaveURL("/");
    });

    /** TC-E2E-066: コンボ登録のキャンセルでコンボ一覧に戻る */
    test("TC-E2E-066: コンボ登録のキャンセルでコンボ一覧に戻る", async ({
      page,
    }) => {
      await page.goto(`/characters/${CHARACTER_ID}/combos/new`);

      // ローディング完了待機
      await page.waitForSelector(".animate-spin", { state: "detached" }).catch(() => {});

      // キャンセルボタンをクリック（フォームのキャンセルボタンを選択。コネクターの「xx」ボタンと区別するため last() を使用）
      await page.getByRole("button", { name: "キャンセル" }).last().click();

      await expect(page).toHaveURL(
        `/characters/${CHARACTER_ID}/combos`,
      );
    });

    /** TC-E2E-067: コンボ保存成功後にコンボ一覧に遷移する */
    test("TC-E2E-067: コンボ保存成功後にコンボ一覧に遷移する", async ({
      page,
    }) => {
      await page.goto(`/characters/${CHARACTER_ID}/combos/new`);

      // ローディング完了待機
      await page.waitForSelector(".animate-spin", { state: "detached" }).catch(() => {});

      // ステップを入力
      await page.getByRole("grid", { name: "方向入力パッド" }).locator('button[aria-label="下"]').click();
      await page.getByRole("group", { name: "ボタン選択パレット" }).locator('button[aria-label="MK"]').click();

      // 保存
      await page.getByRole("button", { name: "このコンボを保存" }).click();

      // コンボ一覧に遷移
      await expect(page).toHaveURL(`/characters/${CHARACTER_ID}/combos`);
    });
  });

  // ============================================================
  // データ分離テスト
  // ============================================================

  test.describe("ユーザーデータ分離", () => {
    /** TC-E2E-068: 他ユーザーのコンボがコンボ一覧に表示されない */
    test("TC-E2E-068: 他ユーザーのコンボがコンボ一覧に表示されない", async ({
      page,
    }) => {
      // USER_A でログインしてコンボを作成
      await setupAuthenticatedPage(page, TEST_USER_A.email, TEST_USER_A.password);

      // USER_A のコンボを作成
      await createComboViaAPI(page, CHARACTER_ID, { name: "USER_A のコンボ (TC-068)" });

      // USER_A をログアウト
      await page.getByRole("button", { name: "ログアウト" }).click();
      await expect(page).toHaveURL("/login");

      // USER_B を登録してログイン
      await registerUser(page, TEST_USER_B.email, TEST_USER_B.password);
      await loginUser(page, TEST_USER_B.email, TEST_USER_B.password);

      // 同じキャラクターのコンボ一覧にアクセス
      await page.goto(`/characters/${CHARACTER_ID}/combos`);

      // USER_A のコンボは表示されない
      await expect(page.getByText("USER_A のコンボ (TC-068)")).not.toBeVisible();

      // 空状態メッセージが表示される
      await expect(
        page.locator("text=コンボが登録されていません"),
      ).toBeVisible();
    });
  });
});
