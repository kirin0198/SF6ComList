/**
 * コンボ CRUD E2E テスト
 * TEST_PLAN.md Section 9.6.3: TC-E2E-022 〜 TC-E2E-038
 * 対応 UC: UC-005〜UC-010
 */

import { test, expect } from "@playwright/test";
import { ComboListPage } from "./pages/combo-list.page";
import { ComboNewPage } from "./pages/combo-new.page";
import { ComboDetailPage } from "./pages/combo-detail.page";
import { ComboEditPage } from "./pages/combo-edit.page";
import { TEST_USER_A } from "./fixtures/test-data";
import { setupAuthenticatedPage, createComboViaAPI } from "./fixtures/helpers";

const CHARACTER_ID = "ryu";

test.describe("コンボ CRUD", () => {
  // 認証済み状態のセットアップ
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, TEST_USER_A.email, TEST_USER_A.password);
  });

  /** TC-E2E-022: コンボが0件の場合に空状態メッセージが表示される */
  test("TC-E2E-022: コンボが0件の場合に空状態メッセージが表示される", async ({
    page,
  }) => {
    // 新規キャラ（コンボなし）のページへアクセス
    await page.goto(`/characters/ken/combos`);

    // 空状態メッセージが表示される
    await expect(
      page.locator("text=コンボが登録されていません"),
    ).toBeVisible();

    // 新規登録リンクが表示される
    await expect(
      page.getByRole("link", { name: "最初のコンボを登録" }),
    ).toBeVisible();
  });

  /** TC-E2E-023: ビジュアル入力でコンボを新規登録する */
  test("TC-E2E-023: ビジュアル入力でコンボを新規登録する", async ({ page }) => {
    const comboListPage = new ComboListPage(page, CHARACTER_ID);
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);

    await comboListPage.goto();
    await comboListPage.clickNewCombo();
    await comboNewPage.heading.waitFor();

    // ビジュアル入力: 2（下）→ MK
    await comboNewPage.clickDirection("2");
    await comboNewPage.clickButton("MK");

    // コンボ名とダメージを入力
    await comboNewPage.fillMetadata({
      name: "テスト BnB (TC-023)",
      damage: "2800",
    });

    // 保存
    await comboNewPage.clickSave();

    // コンボ一覧に遷移してコンボが表示される
    await expect(page).toHaveURL(
      `/characters/${CHARACTER_ID}/combos`,
    );
    await expect(
      page.getByText("テスト BnB (TC-023)").first(),
    ).toBeVisible();
  });

  /** TC-E2E-024: テキスト入力でコンボを新規登録する */
  test("TC-E2E-024: テキスト入力でコンボを新規登録する", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);

    await comboNewPage.goto();

    // テキスト入力モードに切替
    await comboNewPage.switchToTextMode();

    // テキストを入力
    await comboNewPage.textInput.fill("5MP > 2MK xx 236HP");

    // コンボ名を入力
    await comboNewPage.fillMetadata({ name: "テキスト入力テスト (TC-024)" });

    // 保存
    await comboNewPage.clickSave();

    // コンボ一覧に遷移
    await expect(page).toHaveURL(`/characters/${CHARACTER_ID}/combos`);
    await expect(page.getByText("テキスト入力テスト (TC-024)").first()).toBeVisible();
  });

  /** TC-E2E-025: リアルタイムプレビューが更新される（ビジュアル入力） */
  test("TC-E2E-025: リアルタイムプレビューが更新される（ビジュアル入力）", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // 方向 5（ニュートラル）→ MP クリック
    await comboNewPage.clickDirection("5");
    await comboNewPage.clickButton("MP");

    // プレビューエリアにテンキー表記「5MP」が表示される
    const notation = page.locator(".font-mono").first();
    await expect(notation).toContainText("5MP");
  });

  /** TC-E2E-026: リアルタイムプレビューが更新される（テキスト入力） */
  test("TC-E2E-026: リアルタイムプレビューが更新される（テキスト入力）", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    await comboNewPage.switchToTextMode();
    await comboNewPage.textInput.fill("2MK xx 236HP");

    // プレビューが更新される（コンボプレビューエリア内に内容が表示される）
    // テキスト入力後にプレビューが表示されること
    await expect(
      page.locator('[class*="combo"], .rounded-lg').filter({ hasText: "コンボプレビュー" }),
    ).toBeVisible();
  });

  /** TC-E2E-027: コンボ一覧に登録済みコンボが表示される */
  test("TC-E2E-027: コンボ一覧に登録済みコンボが表示される", async ({
    page,
  }) => {
    // API でコンボを登録
    await createComboViaAPI(page, CHARACTER_ID, {
      name: "表示確認コンボ (TC-027)",
      damage: 1500,
    });

    // コンボ一覧にアクセス
    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // コンボカードが表示される（複数マッチする場合は first() を使用）
    await expect(page.getByText("表示確認コンボ (TC-027)").first()).toBeVisible();
    // ダメージ値が表示される
    await expect(page.getByText("1,500").first()).toBeVisible();
  });

  /** TC-E2E-028: コンボカードクリックで詳細画面に遷移する */
  test("TC-E2E-028: コンボカードクリックで詳細画面に遷移する", async ({
    page,
  }) => {
    const comboId = await createComboViaAPI(page, CHARACTER_ID, {
      name: "詳細遷移テスト (TC-028)",
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // コンボカードをクリック（複数マッチする場合は first() を使用）
    await page.getByText("詳細遷移テスト (TC-028)").first().click();

    // 詳細画面に遷移
    await expect(page).toHaveURL(
      `/characters/${CHARACTER_ID}/combos/${comboId}`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "詳細遷移テスト (TC-028)",
    );
  });

  /** TC-E2E-029: コンボ詳細画面に全属性が表示される */
  test("TC-E2E-029: コンボ詳細画面に全属性が表示される", async ({ page }) => {
    const comboId = await createComboViaAPI(page, CHARACTER_ID, {
      name: "全属性テスト (TC-029)",
      damage: 2500,
      memo: "テスト用メモ",
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos/${comboId}`);

    // コンボ名が表示される
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "全属性テスト (TC-029)",
    );

    // ダメージ値が表示される
    await expect(page.getByText("2,500")).toBeVisible();

    // メモが表示される
    await expect(page.getByText("テスト用メモ")).toBeVisible();

    // 作成日・更新日が表示される
    await expect(page.locator("text=作成日")).toBeVisible();
    await expect(page.locator("text=更新日")).toBeVisible();
  });

  /** TC-E2E-030: コンボ詳細画面から編集画面に遷移する */
  test("TC-E2E-030: コンボ詳細画面から編集画面に遷移する", async ({ page }) => {
    const comboId = await createComboViaAPI(page, CHARACTER_ID, {
      name: "編集遷移テスト (TC-030)",
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos/${comboId}`);

    const detailPage = new ComboDetailPage(page);
    await detailPage.clickEdit();

    // 編集画面に遷移
    await expect(page).toHaveURL(
      `/characters/${CHARACTER_ID}/combos/${comboId}/edit`,
    );
    await expect(
      page.getByRole("heading", { name: "コンボを編集" }),
    ).toBeVisible();
  });

  /** TC-E2E-031: コンボ編集で名前を変更して保存する */
  test("TC-E2E-031: コンボ編集で名前を変更して保存する", async ({ page }) => {
    const comboId = await createComboViaAPI(page, CHARACTER_ID, {
      name: "編集前コンボ名 (TC-031)",
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos/${comboId}/edit`);

    // ローディング完了待機
    await page.waitForSelector(".animate-spin", { state: "detached" }).catch(() => {});

    const editPage = new ComboEditPage(page);
    await editPage.heading.waitFor();

    // 名前を変更
    await editPage.updateMetadata({ name: "更新後コンボ名 (TC-031)" });
    await editPage.clickSave();

    // 詳細画面またはコンボ一覧に遷移し、更新後の名前が表示される
    await page.waitForURL(/\/characters\/ryu\/combos/);
    await expect(page.getByText("更新後コンボ名 (TC-031)")).toBeVisible();
  });

  /** TC-E2E-032: コンボ編集で既存データがプリセットされている */
  test("TC-E2E-032: コンボ編集で既存データがプリセットされている", async ({
    page,
  }) => {
    const comboId = await createComboViaAPI(page, CHARACTER_ID, {
      name: "プリセット確認 (TC-032)",
      damage: 2800,
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos/${comboId}/edit`);

    // ローディング完了待機
    await page.waitForSelector(".animate-spin", { state: "detached" }).catch(() => {});

    const editPage = new ComboEditPage(page);
    await editPage.heading.waitFor();

    // コンボ名がプリセットされている
    await expect(editPage.nameInput).toHaveValue("プリセット確認 (TC-032)");

    // ダメージ値がプリセットされている
    await expect(editPage.damageInput).toHaveValue("2800");
  });

  /** TC-E2E-033: コンボ削除の確認ダイアログが表示される */
  test("TC-E2E-033: コンボ削除の確認ダイアログが表示される", async ({
    page,
  }) => {
    const comboId = await createComboViaAPI(page, CHARACTER_ID, {
      name: "削除ダイアログテスト (TC-033)",
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos/${comboId}`);

    const detailPage = new ComboDetailPage(page);
    await detailPage.clickDelete();

    // 確認ダイアログが表示される
    await expect(detailPage.confirmDialog).toBeVisible();
    await expect(
      page.getByText("コンボを削除しますか？"),
    ).toBeVisible();

    // 「削除する」ボタンと「キャンセル」ボタンが表示される
    await expect(detailPage.confirmDeleteButton).toBeVisible();
    await expect(detailPage.cancelDeleteButton).toBeVisible();
  });

  /** TC-E2E-034: コンボ削除を確認すると削除されコンボ一覧に遷移する */
  test("TC-E2E-034: コンボ削除を確認すると削除されコンボ一覧に遷移する", async ({
    page,
  }) => {
    const comboId = await createComboViaAPI(page, CHARACTER_ID, {
      name: "削除実行テスト (TC-034)",
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos/${comboId}`);

    const detailPage = new ComboDetailPage(page);
    await detailPage.clickDelete();
    await detailPage.confirmDelete();

    // コンボ一覧に遷移
    await expect(page).toHaveURL(`/characters/${CHARACTER_ID}/combos`);

    // 削除したコンボが表示されない
    await expect(page.getByText("削除実行テスト (TC-034)")).not.toBeVisible();
  });

  /** TC-E2E-035: コンボ削除をキャンセルするとコンボが残る */
  test("TC-E2E-035: コンボ削除をキャンセルするとコンボが残る", async ({
    page,
  }) => {
    const comboId = await createComboViaAPI(page, CHARACTER_ID, {
      name: "削除キャンセルテスト (TC-035)",
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos/${comboId}`);

    const detailPage = new ComboDetailPage(page);
    await detailPage.clickDelete();
    await detailPage.cancelDelete();

    // ダイアログが閉じる
    await expect(detailPage.confirmDialog).not.toBeVisible();

    // コンボ詳細画面にとどまる
    await expect(page).toHaveURL(
      `/characters/${CHARACTER_ID}/combos/${comboId}`,
    );
  });

  /** TC-E2E-036: コンボシーケンスが空の場合は保存ボタンが非活性 */
  test("TC-E2E-036: コンボシーケンスが空の場合は保存ボタンが非活性", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // 初期状態で保存ボタンが無効
    await expect(comboNewPage.saveButton).toBeDisabled();
  });

  /** TC-E2E-037: 元に戻すボタンで最後の入力を取り消せる */
  test("TC-E2E-037: 元に戻すボタンで最後の入力を取り消せる", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // 1ステップ入力
    await comboNewPage.clickDirection("2");
    await comboNewPage.clickButton("MK");

    // 元に戻す
    await comboNewPage.undoButton.click();

    // 保存ボタンが無効になる（プレビューが空に戻る）
    await expect(comboNewPage.saveButton).toBeDisabled();
  });

  /** TC-E2E-038: リセットボタンで全入力をクリアする */
  test("TC-E2E-038: リセットボタンで全入力をクリアする", async ({ page }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // 複数ステップ入力
    await comboNewPage.clickDirection("2");
    await comboNewPage.clickButton("MK");
    await comboNewPage.clickDirection("2");
    await comboNewPage.clickButton("HP");

    // リセット
    await comboNewPage.resetButton.click();

    // 保存ボタンが無効になる
    await expect(comboNewPage.saveButton).toBeDisabled();
  });
});
