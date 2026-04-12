/**
 * コンボ登録画面 Page Object Model
 * SCR-005: /characters/[characterId]/combos/new
 * TEST_PLAN.md Section 9.5 に準拠
 */

import { type Page, type Locator } from "@playwright/test";

export class ComboNewPage {
  readonly page: Page;
  readonly characterId: string;

  // セレクタ
  readonly heading: Locator;
  readonly breadcrumbLink: Locator;
  readonly visualModeTab: Locator;
  readonly textModeTab: Locator;
  readonly directionPad: Locator;
  readonly buttonPalette: Locator;
  readonly connectorSelector: Locator;
  readonly previewArea: Locator;
  readonly nameInput: Locator;
  readonly damageInput: Locator;
  readonly memoTextarea: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly undoButton: Locator;
  readonly resetButton: Locator;
  readonly odToggle: Locator;
  readonly textInput: Locator;
  readonly newTagInput: Locator;
  readonly addTagButton: Locator;

  constructor(page: Page, characterId: string = "ryu") {
    this.page = page;
    this.characterId = characterId;
    this.heading = page.getByRole("heading", { name: "新しいコンボを登録" });
    this.breadcrumbLink = page.locator("nav, .mb-4").locator("a").first();
    this.visualModeTab = page.getByRole("tab", { name: "ビジュアル入力" });
    this.textModeTab = page.getByRole("tab", { name: "テキスト入力" });
    this.directionPad = page.getByRole("grid", { name: "方向入力パッド" });
    this.buttonPalette = page.getByRole("group", { name: "ボタン選択パレット" });
    this.connectorSelector = page.getByRole("group", { name: "コネクター選択" });
    this.previewArea = page.locator("text=コンボプレビュー").locator("..");
    this.nameInput = page.getByLabel("コンボ名（任意）");
    this.damageInput = page.getByLabel("ダメージ値（任意）");
    this.memoTextarea = page.locator("#combo-memo");
    this.saveButton = page.getByRole("button", { name: "このコンボを保存" });
    this.cancelButton = page.getByRole("button", { name: "キャンセル" });
    this.undoButton = page.getByRole("button", { name: "元に戻す" });
    this.resetButton = page.getByRole("button", { name: "リセット" });
    this.odToggle = page.getByRole("button", { name: "オーバードライブ修飾子" });
    this.textInput = page.locator("#combo-text-input");
    this.newTagInput = page.getByLabel("新しいタグ名");
    this.addTagButton = page.getByLabel("タグを追加");
  }

  async goto() {
    await this.page.goto(`/characters/${this.characterId}/combos/new`);
    // ローディング完了を待つ（スピナーが消えるまで）
    await this.page.waitForSelector(".animate-spin", { state: "detached", timeout: 10000 }).catch(() => {
      // スピナーがない場合も継続
    });
  }

  async switchToTextMode() {
    await this.textModeTab.click();
  }

  async switchToVisualMode() {
    await this.visualModeTab.click();
  }

  /** 方向パッドで指定した方向をクリック */
  async clickDirection(direction: string) {
    const label = this._getDirectionLabel(direction);
    // aria-label の完全一致で検索（partial match で複数要素にマッチするのを防ぐ）
    await this.directionPad
      .locator(`button[aria-label="${label}"]`)
      .click();
  }

  /** ボタンパレットで指定したボタンをクリック */
  async clickButton(buttonName: string) {
    // ButtonPalette 内の <button aria-label="..."> を直接選択する（内部の span も aria-label を持つため button に限定）
    await this.buttonPalette.locator(`button[aria-label="${buttonName}"]`).click();
  }

  /** コネクターをクリック */
  async clickConnector(connectorDescription: string) {
    // ConnectorSelector 内の <button aria-label="..."> を直接選択（内部 span も aria-label を持つため button に限定）
    await this.connectorSelector.locator(`button[aria-label="${connectorDescription}"]`).click();
  }

  /** メタデータを入力 */
  async fillMetadata(options: {
    name?: string;
    damage?: string;
    memo?: string;
  }) {
    if (options.name !== undefined) {
      await this.nameInput.fill(options.name);
    }
    if (options.damage !== undefined) {
      await this.damageInput.fill(options.damage);
    }
    if (options.memo !== undefined) {
      await this.memoTextarea.fill(options.memo);
    }
  }

  /** タグを選択 */
  async selectTag(tagName: string) {
    await this.page.getByRole("button", { name: tagName, exact: true }).click();
  }

  /** 新しいタグを作成 */
  async createTag(tagName: string) {
    await this.newTagInput.fill(tagName);
    await this.addTagButton.click();
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async getPreviewNotation(): Promise<string> {
    const notation = this.page.locator(".font-mono").first();
    return await notation.textContent() ?? "";
  }

  /** 方向ラベルを取得（aria-label 用） */
  private _getDirectionLabel(dir: string): string {
    const labels: Record<string, string> = {
      "1": "左下（下後）",
      "2": "下",
      "3": "右下（下前）",
      "4": "左（後）",
      "5": "ニュートラル",
      "6": "右（前）",
      "7": "左上（上後）",
      "8": "上",
      "9": "右上（上前）",
    };
    return labels[dir] ?? dir;
  }
}
