/**
 * タグフィルタ + ユーザータグ作成 E2E テスト
 * TEST_PLAN.md Section 9.6.5: TC-E2E-051 〜 TC-E2E-059
 * 対応 UC: UC-011（タグフィルタ）、UC-012（ユーザータグ作成）
 */

import { test, expect } from "@playwright/test";
import { ComboNewPage } from "./pages/combo-new.page";
import { TEST_USER_A, PRESET_TAG_NAMES } from "./fixtures/test-data";
import { setupAuthenticatedPage, createComboViaAPI } from "./fixtures/helpers";

const CHARACTER_ID = "ryu";

/** プリセットタグの ID を取得するヘルパー */
async function getTagId(
  page: import("@playwright/test").Page,
  tagName: string,
): Promise<string> {
  const response = await page.request.get("/api/tags");
  const data = await response.json();
  const tag = data.tags.find(
    (t: { id: string; name: string }) => t.name === tagName,
  );
  if (!tag) throw new Error(`タグが見つかりません: ${tagName}`);
  return tag.id;
}

test.describe("タグフィルタ + ユーザータグ作成", () => {
  // 認証済み状態のセットアップ
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, TEST_USER_A.email, TEST_USER_A.password);
  });

  /** TC-E2E-051: プリセットタグ12種がフィルタ選択肢に表示される */
  test("TC-E2E-051: プリセットタグ12種がフィルタ選択肢に表示される", async ({
    page,
  }) => {
    // コンボを1件作成してフィルタバーを表示させる
    await createComboViaAPI(page, CHARACTER_ID, { name: "フィルタ確認用コンボ" });
    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // タグフィルタバーが表示される
    await expect(page.locator("text=タグで絞り込み")).toBeVisible();

    // プリセットタグ12種が全て表示される（test-data.ts の定数を使用）
    for (const tagName of PRESET_TAG_NAMES) {
      await expect(
        page.getByRole("button", { name: tagName, exact: true }),
      ).toBeVisible();
    }
  });

  /** TC-E2E-052: タグバッジクリックで一覧がフィルタされる */
  test("TC-E2E-052: タグバッジクリックで一覧がフィルタされる", async ({
    page,
  }) => {
    // BnB タグとそれ以外のコンボを作成
    const bnbTagId = await getTagId(page, "BnB");
    const cornerTagId = await getTagId(page, "画面端");

    await createComboViaAPI(page, CHARACTER_ID, { name: "BnBコンボ (TC-052)", tagIds: [bnbTagId] });
    await createComboViaAPI(page, CHARACTER_ID, { name: "画面端コンボ (TC-052)", tagIds: [cornerTagId] });

    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // BnB タグをクリック（exact: true で完全一致）
    await page.getByRole("button", { name: "BnB", exact: true }).click();

    // BnB タグのコンボのみ表示される
    await expect(page.getByText("BnBコンボ (TC-052)").first()).toBeVisible();
    // 画面端タグのコンボは非表示
    await expect(
      page.getByText("画面端コンボ (TC-052)").first(),
    ).not.toBeVisible();
  });

  /** TC-E2E-053: 複数タグを選択すると OR 条件で絞り込まれる */
  test("TC-E2E-053: 複数タグを選択すると OR 条件で絞り込まれる", async ({
    page,
  }) => {
    const bnbTagId = await getTagId(page, "BnB");
    const cornerTagId = await getTagId(page, "画面端");

    await createComboViaAPI(page, CHARACTER_ID, { name: "BnBコンボ (TC-053)", tagIds: [bnbTagId] });
    await createComboViaAPI(page, CHARACTER_ID, { name: "画面端コンボ (TC-053)", tagIds: [cornerTagId] });
    await createComboViaAPI(page, CHARACTER_ID, { name: "タグなしコンボ (TC-053)" });

    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // BnB と 画面端 を両方選択（exact: true で完全一致）
    await page.getByRole("button", { name: "BnB", exact: true }).click();
    await page.getByRole("button", { name: "画面端", exact: true }).click();

    // 両方のタグを持つコンボが表示される（OR 条件）
    await expect(page.getByText("BnBコンボ (TC-053)").first()).toBeVisible();
    await expect(page.getByText("画面端コンボ (TC-053)").first()).toBeVisible();

    // タグなしコンボは非表示
    await expect(page.getByText("タグなしコンボ (TC-053)").first()).not.toBeVisible();
  });

  /** TC-E2E-054: フィルタクリアで全コンボが表示される */
  test("TC-E2E-054: フィルタクリアで全コンボが表示される", async ({ page }) => {
    const bnbTagId = await getTagId(page, "BnB");

    await createComboViaAPI(page, CHARACTER_ID, { name: "BnBコンボ (TC-054)", tagIds: [bnbTagId] });
    await createComboViaAPI(page, CHARACTER_ID, { name: "タグなしコンボ (TC-054)" });

    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // BnB でフィルタ（exact: true で完全一致）
    await page.getByRole("button", { name: "BnB", exact: true }).click();

    // クリアボタンをクリック
    await page.getByRole("button", { name: "クリア" }).click();

    // 全コンボが表示される
    await expect(page.getByText("BnBコンボ (TC-054)").first()).toBeVisible();
    await expect(page.getByText("タグなしコンボ (TC-054)").first()).toBeVisible();
  });

  /** TC-E2E-055: フィルタ結果が0件の場合にメッセージが表示される */
  test("TC-E2E-055: フィルタ結果が0件の場合にメッセージが表示される", async ({
    page,
  }) => {
    // タグなしコンボのみ作成
    await createComboViaAPI(page, CHARACTER_ID, { name: "タグなしコンボ (TC-055)" });

    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // SA3 でフィルタ（一致するコンボなし、exact: true で完全一致）
    await page.getByRole("button", { name: "SA3", exact: true }).click();

    // 0件メッセージが表示される
    await expect(
      page.getByText("選択したタグに該当するコンボがありません"),
    ).toBeVisible();
  });

  /** TC-E2E-056: コンボ登録画面でプリセットタグを選択できる */
  test("TC-E2E-056: コンボ登録画面でプリセットタグを選択できる", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    // BnB タグをクリック
    // タグセレクター内の BnB ボタン
    const bnbButton = page.getByRole("button", { name: "BnB" });
    await bnbButton.click();

    // バッジが選択状態になる（aria-pressed=true）
    await expect(bnbButton).toHaveAttribute("aria-pressed", "true");
  });

  /** TC-E2E-057: コンボ登録画面で新しいユーザー定義タグを作成できる */
  test("TC-E2E-057: コンボ登録画面で新しいユーザー定義タグを作成できる", async ({
    page,
  }) => {
    const comboNewPage = new ComboNewPage(page, CHARACTER_ID);
    await comboNewPage.goto();

    const newTagName = `画面端コンボ-${Date.now()}`;

    // 新しいタグを追加
    await comboNewPage.newTagInput.fill(newTagName);
    await comboNewPage.addTagButton.click();

    // 新しいタグバッジが追加されて選択状態になる
    const newTagButton = page.getByRole("button", { name: newTagName });
    await expect(newTagButton).toBeVisible();
    await expect(newTagButton).toHaveAttribute("aria-pressed", "true");
  });

  /** TC-E2E-058: タグ付きコンボを保存すると一覧でタグが表示される */
  test("TC-E2E-058: タグ付きコンボを保存すると一覧でタグが表示される", async ({
    page,
  }) => {
    const bnbTagId = await getTagId(page, "BnB");
    const sa2TagId = await getTagId(page, "SA2");

    await createComboViaAPI(page, CHARACTER_ID, {
      name: "タグ表示確認 (TC-058)",
      tagIds: [bnbTagId, sa2TagId],
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // コンボカードが表示される（コンボ名を持つリンク要素）
    const comboCard = page.getByRole("link").filter({ hasText: "タグ表示確認 (TC-058)" }).first();
    await expect(comboCard).toBeVisible();

    // タグバッジ「BnB」「SA2」がコンボカード内に表示される
    await expect(comboCard.getByText("BnB")).toBeVisible();
    await expect(comboCard.getByText("SA2")).toBeVisible();
  });

  /** TC-E2E-059: ユーザー定義タグがフィルタ選択肢に表示される */
  test("TC-E2E-059: ユーザー定義タグがフィルタ選択肢に表示される", async ({
    page,
  }) => {
    // ユーザー定義タグを作成
    const tagResponse = await page.request.post("/api/tags", {
      data: { name: `カスタムタグ-${Date.now()}` },
    });
    const tagData = await tagResponse.json();
    const customTagName = tagData.name;

    // そのタグを付けたコンボを作成
    await createComboViaAPI(page, CHARACTER_ID, {
      name: "カスタムタグ付きコンボ (TC-059)",
      tagIds: [tagData.id],
    });

    await page.goto(`/characters/${CHARACTER_ID}/combos`);

    // フィルタバーにユーザー定義タグが表示される
    await expect(
      page.getByRole("button", { name: customTagName }),
    ).toBeVisible();
  });
});
