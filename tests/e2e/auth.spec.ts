/**
 * 認証フロー E2E テスト
 * TEST_PLAN.md Section 9.6.1: TC-E2E-001 〜 TC-E2E-016
 * 対応 UC: UC-001（ユーザー登録）、UC-002（ログイン）、UC-003（ログアウト）
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { RegisterPage } from "./pages/register.page";
import { TEST_USER_A } from "./fixtures/test-data";
import { getAlert, loginUser, tryLogin } from "./fixtures/helpers";

test.describe("認証フロー", () => {
  // テストユニークID（並列実行対策）
  const uniqueEmail = (base: string) =>
    `${base}-${Date.now()}@test.local`;

  // ============================================================
  // ユーザー登録テスト
  // ============================================================

  test.describe("ユーザー登録", () => {
    /** TC-E2E-001: 新規ユーザー登録が成功する */
    test("TC-E2E-001: 新規ユーザー登録が成功する", async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const email = uniqueEmail("tc001");

      await registerPage.goto();
      await registerPage.register(email, "TestPass123!", "TestPass123!");

      // キャラクター一覧に遷移する
      await expect(page).toHaveURL("/");
      await expect(
        page.getByRole("heading", { name: "キャラクター一覧" }),
      ).toBeVisible();
    });

    /** TC-E2E-002: パスワード不一致で登録が失敗する */
    test("TC-E2E-002: パスワード不一致で登録が失敗する", async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const email = uniqueEmail("tc002");

      await registerPage.goto();
      await registerPage.register(email, "TestPass123!", "DifferentPass!");

      // エラーが表示される（route announcer を除外）
      await expect(getAlert(page).first()).toContainText(
        "パスワードが一致しません",
      );
      // 画面遷移しない
      await expect(page).toHaveURL("/register");
    });

    /** TC-E2E-003: パスワード7文字以下で登録が失敗する */
    test("TC-E2E-003: パスワード7文字以下で登録が失敗する", async ({
      page,
    }) => {
      const registerPage = new RegisterPage(page);
      const email = uniqueEmail("tc003");

      await registerPage.goto();
      await registerPage.register(email, "short1!", "short1!");

      // バリデーションエラーが表示される
      await expect(getAlert(page).first()).toContainText("8文字以上");
      await expect(page).toHaveURL("/register");
    });

    /** TC-E2E-004: 無効なメール形式で登録が失敗する */
    test("TC-E2E-004: 無効なメール形式で登録が失敗する", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.register(
        "invalid-email",
        "TestPass123!",
        "TestPass123!",
      );

      // バリデーションエラーが表示される
      await expect(getAlert(page).first()).toContainText(
        "有効なメールアドレス",
      );
      await expect(page).toHaveURL("/register");
    });

    /** TC-E2E-005: 重複メールアドレスで登録が失敗する */
    test("TC-E2E-005: 重複メールアドレスで登録が失敗する", async ({ page }) => {
      const email = uniqueEmail("tc005");

      // 1回目の登録（API 経由で作成して二重登録を回避）
      const res = await page.request.post("/api/auth/register", {
        data: { email, password: "TestPass123!" },
      });
      expect(res.ok()).toBeTruthy();

      // 2回目：同じメールで UI から登録を試みる
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register(email, "TestPass123!", "TestPass123!");

      // エラーが表示される
      await expect(getAlert(page).first()).toContainText(
        "このメールアドレスは既に登録されています",
      );
    });

    /** TC-E2E-013: 登録画面からログイン画面へ遷移できる */
    test("TC-E2E-013: 登録画面からログイン画面へ遷移できる", async ({
      page,
    }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.clickLoginLink();

      await expect(page).toHaveURL("/login");
    });
  });

  // ============================================================
  // ログインテスト
  // ============================================================

  test.describe("ログイン", () => {
    // 各テスト前にユーザーを作成
    test.beforeEach(async ({ page }) => {
      // TEST_USER_A を登録（既に存在する場合は 409 を無視）
      const response = await page.request.post("/api/auth/register", {
        data: {
          email: TEST_USER_A.email,
          password: TEST_USER_A.password,
        },
      });
      // 409（既に登録済み）は無視
      if (!response.ok() && response.status() !== 409) {
        throw new Error(`ユーザー登録失敗: ${response.status()}`);
      }
    });

    /** TC-E2E-006: 正しい認証情報でログインが成功する */
    test("TC-E2E-006: 正しい認証情報でログインが成功する", async ({ page }) => {
      await loginUser(page, TEST_USER_A.email, TEST_USER_A.password);

      // キャラクター一覧に遷移する
      await expect(page).toHaveURL("/");
    });

    /** TC-E2E-007: 不正なパスワードでログインが失敗する */
    test("TC-E2E-007: 不正なパスワードでログインが失敗する", async ({
      page,
    }) => {
      await tryLogin(page, TEST_USER_A.email, "WrongPassword!");

      // エラーが表示される
      await expect(getAlert(page).first()).toContainText(
        "メールアドレスまたはパスワードが正しくありません",
      );
    });

    /** TC-E2E-008: 未登録メールでログインが失敗する */
    test("TC-E2E-008: 未登録メールでログインが失敗する", async ({ page }) => {
      await tryLogin(page, "nonexistent@test.local", "TestPass123!");

      // エラーが表示される
      await expect(getAlert(page).first()).toContainText(
        "メールアドレスまたはパスワードが正しくありません",
      );
    });

    /** TC-E2E-009: ログイン後にブラウザリロードしてもセッションが維持される */
    test("TC-E2E-009: ログイン後にブラウザリロードしてもセッションが維持される", async ({
      page,
    }) => {
      await loginUser(page, TEST_USER_A.email, TEST_USER_A.password);
      await expect(page).toHaveURL("/");

      // リロード
      await page.reload();

      // ログイン画面に飛ばされない
      await expect(page).toHaveURL("/");
      await expect(
        page.getByRole("heading", { name: "キャラクター一覧" }),
      ).toBeVisible();
    });

    /** TC-E2E-012: ログイン画面から登録画面へ遷移できる */
    test("TC-E2E-012: ログイン画面から登録画面へ遷移できる", async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.clickRegisterLink();

      await expect(page).toHaveURL("/register");
    });

    /** TC-E2E-014: Enter キーでログインフォームを送信できる */
    test("TC-E2E-014: Enter キーでログインフォームを送信できる", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByLabel("メールアドレス").fill(TEST_USER_A.email);
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(TEST_USER_A.password);
      await passwordInput.press("Enter");

      // ログイン成功してキャラクター一覧へ遷移
      await expect(page).toHaveURL("/");
    });

    /** TC-E2E-015: 必須フィールド空でログインが失敗する */
    test("TC-E2E-015: 必須フィールド空でログインが失敗する", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "ログイン" }).click();

      // バリデーションエラーが表示される（route announcer を除く最初のアラート）
      await expect(getAlert(page).first()).toBeVisible();
    });

    /** TC-E2E-016: パスワード表示/非表示トグルが動作する */
    test("TC-E2E-016: パスワード表示/非表示トグルが動作する", async ({
      page,
    }) => {
      await page.goto("/login");
      const passwordInput = page.locator('input[id="パスワード"]');
      await passwordInput.fill("TestPass123!");

      // 初期状態は password 型
      await expect(passwordInput).toHaveAttribute("type", "password");

      // 表示トグルをクリック
      await page.getByLabel("パスワードを表示").click();
      await expect(passwordInput).toHaveAttribute("type", "text");

      // 再クリックで非表示に戻る
      await page.getByLabel("パスワードを隠す").click();
      await expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  // ============================================================
  // ログアウトテスト
  // ============================================================

  test.describe("ログアウト", () => {
    test.beforeEach(async ({ page }) => {
      // TEST_USER_A を登録してログイン
      await page.request.post("/api/auth/register", {
        data: {
          email: TEST_USER_A.email,
          password: TEST_USER_A.password,
        },
      });

      await loginUser(page, TEST_USER_A.email, TEST_USER_A.password);
      await expect(page).toHaveURL("/");
    });

    /** TC-E2E-010: ログアウトが成功しログイン画面に遷移する */
    test("TC-E2E-010: ログアウトが成功しログイン画面に遷移する", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "ログアウト" }).click();
      await expect(page).toHaveURL("/login");
    });

    /** TC-E2E-011: ログアウト後に認証画面へのアクセスがリダイレクトされる */
    test("TC-E2E-011: ログアウト後に認証画面へのアクセスがリダイレクトされる", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "ログアウト" }).click();
      await expect(page).toHaveURL("/login");

      // / に直接アクセス
      await page.goto("/");
      await expect(page).toHaveURL("/login");
    });
  });
});
