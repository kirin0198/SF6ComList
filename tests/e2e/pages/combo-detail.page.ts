/**
 * コンボ詳細画面 Page Object Model
 * SCR-006: /characters/[characterId]/combos/[comboId]
 * TEST_PLAN.md Section 9.5 に準拠
 */

import { type Page, type Locator } from "@playwright/test";

export class ComboDetailPage {
  readonly page: Page;

  // セレクタ
  readonly heading: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;
  readonly breadcrumbLink: Locator;
  readonly notationText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.editButton = page.getByRole("link", { name: "編集" });
    this.deleteButton = page.getByLabel("コンボを削除");
    this.confirmDialog = page.getByRole("dialog");
    this.confirmDeleteButton = page.getByRole("button", { name: "削除する" });
    this.cancelDeleteButton = page.getByRole("button", { name: "キャンセル" });
    this.breadcrumbLink = page.locator(".mb-4 a").first();
    this.notationText = page.locator(".font-mono").first();
  }

  async getComboName(): Promise<string> {
    return await this.heading.textContent() ?? "";
  }

  async getNotation(): Promise<string> {
    return await this.notationText.textContent() ?? "";
  }

  async getDamage(): Promise<string> {
    // ダメージ値は大きいテキスト
    const damageEl = this.page.locator(".text-xl.font-bold.text-white").first();
    return await damageEl.textContent() ?? "";
  }

  async getTags(): Promise<string[]> {
    const tagBadges = this.page.locator(".rounded-full.border.border-gray-700");
    const all = await tagBadges.all();
    const texts: string[] = [];
    for (const badge of all) {
      const text = await badge.textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  async getMemo(): Promise<string> {
    const memoEl = this.page.locator(".whitespace-pre-wrap");
    return await memoEl.textContent() ?? "";
  }

  async clickEdit() {
    await this.editButton.click();
  }

  async clickDelete() {
    await this.deleteButton.click();
  }

  async confirmDelete() {
    await this.confirmDeleteButton.click();
  }

  async cancelDelete() {
    await this.cancelDeleteButton.click();
  }
}
