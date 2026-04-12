/**
 * コンボ一覧画面 Page Object Model
 * SCR-004: /characters/[characterId]/combos
 * TEST_PLAN.md Section 9.5 に準拠
 */

import { type Page, type Locator } from "@playwright/test";

export class ComboListPage {
  readonly page: Page;
  readonly characterId: string;

  // セレクタ
  readonly breadcrumbLink: Locator;
  readonly newComboButton: Locator;
  readonly comboCards: Locator;
  readonly emptyMessage: Locator;
  readonly tagFilterClearButton: Locator;

  constructor(page: Page, characterId: string = "ryu") {
    this.page = page;
    this.characterId = characterId;
    this.breadcrumbLink = page.getByRole("link", { name: "キャラクター一覧" });
    this.newComboButton = page.getByRole("link", { name: "新しいコンボを登録" });
    // コンボカードは combo の詳細へのリンク
    this.comboCards = page.locator(
      `a[href*="/characters/${characterId}/combos/"]`,
    ).filter({ hasNot: page.locator('[href$="/new"]') });
    this.emptyMessage = page.locator("text=コンボが登録されていません");
    this.tagFilterClearButton = page.getByRole("button", { name: "クリア" });
  }

  async goto() {
    await this.page.goto(`/characters/${this.characterId}/combos`);
  }

  async clickNewCombo() {
    await this.newComboButton.click();
  }

  async getComboCards() {
    return this.comboCards.all();
  }

  async clickCombo(name: string) {
    await this.page
      .locator(`a[href*="/characters/${this.characterId}/combos/"]`)
      .filter({ hasText: name })
      .click();
  }

  async toggleTagFilter(tagName: string) {
    await this.page.getByRole("button", { name: tagName }).click();
  }

  async clearTagFilter() {
    await this.tagFilterClearButton.click();
  }

  async getEmptyMessage(): Promise<string> {
    return await this.page.locator(".border-dashed p").first().textContent() ?? "";
  }

  async goBackToCharacterList() {
    await this.breadcrumbLink.click();
  }
}
