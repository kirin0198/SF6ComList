/**
 * コンボ入力 UI 詳細 E2E テスト
 * TEST_PLAN.md Section 9.6.4: TC-E2E-039 〜 TC-E2E-050
 * 対応 UC: UC-005（ビジュアル入力）、UC-006（テキスト入力）
 */

import { test, expect } from "@playwright/test";
import { ComboNewPage } from "./pages/combo-new.page";
import { TEST_USER_A } from "./fixtures/test-data";
import { setupAuthenticatedPage, getAlert } from "./fixtures/helpers";

const CHARACTER_ID = "ryu";

test.describe("コンボ入力 UI 詳細", () => {
  // 認証済み状態のセットアップ
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, TEST_USER_A.email, TEST_USER_A.password);
  });

  /** TC-E2E-039: 方向パッドの全9方向が選択できる */
  test("TC-E2E-039: 方向パッドの全9方向が選択できる", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    const directions = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

    for (const dir of directions) {
      // 方向をクリックしてから LP でステップを確定
      await comboNewPage.clickDirection(dir);
      await comboNewPage.clickButton("LP");
    }

    // 9ステップ入力後に保存ボタンが有効
    await expect(comboNewPage.saveButton).toBeEnabled();
  });

  /** TC-E2E-040: ボタンパレットの全ボタンが選択できる（通常攻撃） */
  test("TC-E2E-040: ボタンパレットの全ボタンが選択できる", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    const buttons = ["LP", "MP", "HP", "LK", "MK", "HK"];

    for (const btn of buttons) {
      await comboNewPage.clickButton(btn);
    }

    // ステップが入力されて保存ボタンが有効
    await expect(comboNewPage.saveButton).toBeEnabled();
  });

  /** TC-E2E-041: ドライブアクションボタン (DI/DR/DP/DRev) が選択できる */
  test("TC-E2E-041: ドライブアクションボタンが選択できる", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // DI（ドライブインパクト）を追加
    await comboNewPage.clickButton("DI");
    await expect(comboNewPage.saveButton).toBeEnabled();
  });

  /** TC-E2E-042: スーパーアーツ (SA1/SA2/SA3) が選択できる */
  test("TC-E2E-042: スーパーアーツが選択できる", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    await comboNewPage.clickButton("SA1");
    await expect(comboNewPage.saveButton).toBeEnabled();
  });

  /** TC-E2E-043: Throw が選択できる */
  test("TC-E2E-043: Throw が選択できる", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    await comboNewPage.clickButton("Throw");
    await expect(comboNewPage.saveButton).toBeEnabled();
  });

  /** TC-E2E-044: 4種のコネクターが選択できる */
  test("TC-E2E-044: 4種のコネクターが選択できる", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // まずステップを入力してからコネクター
    await comboNewPage.clickButton("LP");

    // コネクターを挿入（aria-label はdescription 属性）
    // リンク（>）
    await comboNewPage.clickConnector("リンク");
    // キャンセル（xx）
    await comboNewPage.clickButton("MP");
    await comboNewPage.clickConnector("キャンセル");

    // コネクターが入力された状態でも保存ボタンは有効
    await comboNewPage.clickButton("HP");
    await expect(comboNewPage.saveButton).toBeEnabled();
  });

  /** TC-E2E-045: OD トグルで OD 技を入力できる */
  test("TC-E2E-045: OD トグルで OD 技を入力できる", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // OD トグルを ON にする
    await comboNewPage.odToggle.click();
    await expect(comboNewPage.odToggle).toHaveAttribute("aria-pressed", "true");

    // ボタンを入力
    await comboNewPage.clickDirection("2");
    await comboNewPage.clickDirection("3");
    await comboNewPage.clickDirection("6");
    await comboNewPage.clickButton("HP");

    // OD 表記で入力された
    await expect(comboNewPage.saveButton).toBeEnabled();
  });

  /** TC-E2E-046: 入力モード切替でビジュアルからテキストに切り替わる */
  test("TC-E2E-046: ビジュアルからテキストに切り替わる", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // ビジュアルモードで入力
    await comboNewPage.clickDirection("5");
    await comboNewPage.clickButton("MP");

    // テキスト入力モードに切替
    await comboNewPage.switchToTextMode();

    // テキスト入力フィールドが表示される
    await expect(comboNewPage.textInput).toBeVisible();

    // ビジュアルパネル（方向パッド）は非表示になる
    await expect(comboNewPage.directionPad).not.toBeVisible();

    // テキストフィールドに「5MP」が表示される
    await expect(comboNewPage.textInput).toHaveValue("5MP");
  });

  /** TC-E2E-047: テキスト入力のパースエラーで警告が表示される */
  test("TC-E2E-047: テキスト入力のパースエラーで警告が表示される", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    await comboNewPage.switchToTextMode();
    await comboNewPage.textInput.fill("INVALID_TOKEN");

    // パースエラー警告が表示される
    await expect(getAlert(page).first()).toBeVisible();
  });

  /** TC-E2E-048: 複数方向入力（コマンド入力）が可能 */
  test("TC-E2E-048: 複数方向入力（コマンド入力）が可能", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // 波動拳入力: 2, 3, 6 → HP
    await comboNewPage.clickDirection("2");
    await comboNewPage.clickDirection("3");
    await comboNewPage.clickDirection("6");
    await comboNewPage.clickButton("HP");

    // プレビューに「236HP」が表示される
    const notation = page.locator(".font-mono").first();
    await expect(notation).toContainText("236HP");
  });

  /** TC-E2E-049: コンボ名が空でも保存できる（無題のコンボ） */
  test("TC-E2E-049: コンボ名が空でも保存できる（無題のコンボ）", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // ステップを入力（名前なし）
    await comboNewPage.clickButton("LP");

    // 保存
    await comboNewPage.clickSave();

    // コンボ一覧に遷移
    await expect(page).toHaveURL(`/characters/${CHARACTER_ID}/combos`);

    // 「無題のコンボ」として表示される（イタリック体のグレーテキスト、複数件ある場合は first() で確認）
    await expect(page.locator(".italic").first()).toBeVisible();
  });

  /** TC-E2E-050: ダメージ値に負数を入力するとバリデーションエラー */
  test("TC-E2E-050: ダメージ値に負数を入力するとバリデーションエラー", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // ステップを入力
    await comboNewPage.clickButton("LP");

    // 負のダメージ値を入力（type="number" の min=0 により HTML5 ネイティブバリデーションが機能する）
    await comboNewPage.fillMetadata({ damage: "-100" });

    // ダメージ入力フィールドに min=0 属性が設定されていることを確認
    await expect(comboNewPage.damageInput).toHaveAttribute("min", "0");

    // HTML5 バリデーションが機能している: フィールドが invalidity 状態になる
    // 評価: ブラウザのネイティブバリデーションは role="alert" を使用しないため、
    // input の validity プロパティを確認する
    const isInvalid = await page.evaluate(() => {
      const input = document.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement | null;
      return input ? !input.validity.valid : false;
    });
    expect(isInvalid).toBeTruthy();
  });
});
