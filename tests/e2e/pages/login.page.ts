/**
 * ログイン画面 Page Object Model
 * SCR-001: /login
 * TEST_PLAN.md Section 9.5 に準拠
 */

import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  // セレクタ
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly errorAlert: Locator;
  readonly passwordToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('form[aria-label="ログインフォーム"]');
    this.emailInput = page.getByLabel("メールアドレス");
    // "パスワード" ラベルは複数要素にマッチするため input に限定する
    this.passwordInput = page.locator('input[type="password"]').first();
    this.submitButton = page.getByRole("button", { name: "ログイン" });
    this.registerLink = page.getByRole("link", { name: "新規登録はこちら" });
    this.errorAlert = page.getByRole("alert").filter({ hasNot: page.locator('[id="__next-route-announcer__"]') });
    this.passwordToggle = page.getByRole("button", { name: "パスワードを表示" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorAlert.textContent() ?? "";
  }

  async getFieldError(fieldLabel: string): Promise<string> {
    const field = this.page.getByLabel(fieldLabel);
    const container = field.locator("../..");
    const error = container.getByRole("alert");
    return await error.textContent() ?? "";
  }
}
