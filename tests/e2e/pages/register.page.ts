/**
 * ユーザー登録画面 Page Object Model
 * SCR-002: /register
 * TEST_PLAN.md Section 9.5 に準拠
 */

import { type Page, type Locator } from "@playwright/test";

export class RegisterPage {
  readonly page: Page;

  // セレクタ
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('form[aria-label="ユーザー登録フォーム"]');
    this.emailInput = page.getByLabel("メールアドレス");
    this.passwordInput = page.getByLabel("パスワード（8文字以上）");
    this.confirmPasswordInput = page.getByLabel("パスワード（確認）");
    this.submitButton = page.getByRole("button", { name: "アカウントを作成" });
    this.loginLink = page.getByRole("link", { name: "ログインはこちら" });
    this.errorAlert = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/register");
  }

  async register(email: string, password: string, confirmPassword: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }

  async clickLoginLink() {
    await this.loginLink.click();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorAlert.first().textContent() ?? "";
  }

  async getFieldError(fieldLabel: string): Promise<string> {
    const field = this.page.getByLabel(fieldLabel);
    const container = field.locator("../..");
    const error = container.getByRole("alert");
    return await error.textContent() ?? "";
  }
}
