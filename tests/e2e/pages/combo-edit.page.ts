/**
 * コンボ編集画面 Page Object Model
 * SCR-007: /characters/[characterId]/combos/[comboId]/edit
 * TEST_PLAN.md Section 9.5 に準拠
 * ComboNewPage と同じセレクタを使用（submitLabel が異なる）
 */

import { type Page, type Locator } from "@playwright/test";

export class ComboEditPage {
  readonly page: Page;

  // セレクタ
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly damageInput: Locator;
  readonly memoTextarea: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly breadcrumbLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "コンボを編集" });
    this.nameInput = page.getByLabel("コンボ名（任意）");
    this.damageInput = page.getByLabel("ダメージ値（任意）");
    this.memoTextarea = page.locator("#combo-memo");
    this.saveButton = page.getByRole("button", { name: "変更を保存" });
    this.cancelButton = page.getByRole("button", { name: "キャンセル" });
    this.breadcrumbLink = page.locator(".mb-4 a").first();
  }

  async getPrefilledName(): Promise<string> {
    return await this.nameInput.inputValue();
  }

  async getPrefilledDamage(): Promise<string> {
    return await this.damageInput.inputValue();
  }

  async updateMetadata(options: {
    name?: string;
    damage?: string;
    memo?: string;
  }) {
    if (options.name !== undefined) {
      await this.nameInput.clear();
      await this.nameInput.fill(options.name);
    }
    if (options.damage !== undefined) {
      await this.damageInput.clear();
      await this.damageInput.fill(options.damage);
    }
    if (options.memo !== undefined) {
      await this.memoTextarea.clear();
      await this.memoTextarea.fill(options.memo);
    }
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }
}
