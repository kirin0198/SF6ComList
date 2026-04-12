/**
 * キャラクター一覧画面 Page Object Model
 * SCR-003: /
 * TEST_PLAN.md Section 9.5 に準拠
 */

import { type Page, type Locator } from "@playwright/test";

export class CharacterListPage {
  readonly page: Page;

  // セレクタ
  readonly heading: Locator;
  readonly characterCards: Locator;
  readonly logoutButton: Locator;
  readonly headerLogo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "キャラクター一覧" });
    // キャラクターカードは Link 要素
    this.characterCards = page.locator(
      'a[href*="/characters/"][href*="/combos"]',
    );
    this.logoutButton = page.getByRole("button", { name: "ログアウト" });
    this.headerLogo = page.locator('header a[href="/"]');
  }

  async goto() {
    await this.page.goto("/");
  }

  async getCharacterCards() {
    return this.characterCards.all();
  }

  async getCharacterCardByName(name: string): Promise<Locator> {
    return this.page.locator('a[href*="/characters/"]').filter({
      hasText: name,
    });
  }

  async clickCharacter(name: string) {
    const card = await this.getCharacterCardByName(name);
    await card.click();
  }

  async getComboCount(name: string): Promise<string> {
    const card = await this.getCharacterCardByName(name);
    const countText = card.locator("p").last();
    return await countText.textContent() ?? "";
  }

  async logout() {
    await this.logoutButton.click();
  }
}
