/**
 * キャラクター一覧 E2E テスト
 * TEST_PLAN.md Section 9.6.2: TC-E2E-017 〜 TC-E2E-021
 * 対応 UC: UC-004（キャラクター一覧）
 */

import { test, expect } from "@playwright/test";
import { CharacterListPage } from "./pages/character-list.page";
import { TEST_USER_A } from "./fixtures/test-data";
import { setupAuthenticatedPage } from "./fixtures/helpers";

test.describe("キャラクター一覧", () => {
  // 認証済み状態のセットアップ
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, TEST_USER_A.email, TEST_USER_A.password);
  });

  /** TC-E2E-017: active キャラクターが一覧表示される（upcoming 除外で29件） */
  test("TC-E2E-017: active キャラクターが一覧表示される", async ({ page }) => {
    const characterListPage = new CharacterListPage(page);
    await characterListPage.goto();

    // active キャラクターカードが表示される（upcoming の「イングリッド」を除く29件）
    const cards = await characterListPage.getCharacterCards();
    expect(cards.length).toBe(29);
    // キャラクター一覧見出しが表示される
    await expect(characterListPage.heading).toBeVisible();
  });

  /** TC-E2E-018: 各キャラクターにコンボ数が表示される */
  test("TC-E2E-018: 各キャラクターにコンボ数が表示される", async ({ page }) => {
    const characterListPage = new CharacterListPage(page);
    await characterListPage.goto();

    // 各カードにコンボ数のテキストが存在する（初期状態は「コンボなし」）
    const cards = await characterListPage.getCharacterCards();
    // 少なくとも1枚はコンボ数テキストを持つ
    const firstCard = cards[0];
    await expect(firstCard).toBeVisible();
    // コンボ数テキスト（「コンボなし」または「N combos」）
    await expect(firstCard).toContainText(/コンボなし|combos/);
  });

  /** TC-E2E-019: キャラクターカードクリックでコンボ一覧に遷移する */
  test("TC-E2E-019: キャラクターカードクリックでコンボ一覧に遷移する", async ({
    page,
  }) => {
    const characterListPage = new CharacterListPage(page);
    await characterListPage.goto();

    // リュウのカードをクリック
    await characterListPage.clickCharacter("リュウ");

    // コンボ一覧画面に遷移
    await expect(page).toHaveURL(/\/characters\/ryu\/combos/);
    await expect(
      page.getByRole("heading", { name: /リュウ のコンボ一覧/ }),
    ).toBeVisible();
  });

  /** TC-E2E-020: upcoming ステータスのキャラクターが表示されない */
  test("TC-E2E-020: upcoming ステータスのキャラクターが表示されない", async ({
    page,
  }) => {
    const characterListPage = new CharacterListPage(page);
    await characterListPage.goto();

    // upcoming キャラクター「イングリッド」が一覧に含まれないことを明示的に検証
    await expect(page.getByText("イングリッド")).not.toBeVisible();

    // active のみ表示される（29件）
    const cards = await characterListPage.getCharacterCards();
    expect(cards.length).toBe(29);
  });

  /** TC-E2E-021: ヘッダーにロゴとユーザー情報が表示される */
  test("TC-E2E-021: ヘッダーにロゴとユーザー情報が表示される", async ({
    page,
  }) => {
    const characterListPage = new CharacterListPage(page);
    await characterListPage.goto();

    // ヘッダーに SF6 ロゴが含まれる
    await expect(characterListPage.headerLogo).toContainText("SF6");

    // ログアウトボタンが表示される
    await expect(characterListPage.logoutButton).toBeVisible();
  });
});
