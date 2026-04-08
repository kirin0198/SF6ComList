/**
 * auth.ts バリデーションスキーマのユニットテスト
 * loginSchema / registerSchema の動作を検証する
 */

import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../auth";

// ============================================================
// loginSchema テスト
// ============================================================

describe("loginSchema", () => {
  it("有効なログイン入力を受け入れる", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("メールアドレスが空の場合は失敗する", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("メールアドレスを入力してください");
    }
  });

  it("無効なメールアドレス形式の場合は失敗する", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("有効なメールアドレスを入力してください");
    }
  });

  it("パスワードが空の場合は失敗する", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("パスワードを入力してください");
    }
  });

  it("メールアドレスとパスワードの両方が空の場合は失敗する", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "",
    });
    expect(result.success).toBe(false);
    // email が空: "入力してください" + "有効なメールアドレス" の複数エラー + password エラー
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("email フィールドが存在しない場合は失敗する", () => {
    const result = loginSchema.safeParse({
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// registerSchema テスト
// ============================================================

describe("registerSchema", () => {
  it("有効なユーザー登録入力を受け入れる（name あり）", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
      name: "テストユーザー",
    });
    expect(result.success).toBe(true);
  });

  it("有効な入力を受け入れる（name なし）", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
    }
  });

  it("メールアドレスが空の場合は失敗する", () => {
    const result = registerSchema.safeParse({
      email: "",
      password: "securepassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("メールアドレスを入力してください");
    }
  });

  it("無効なメールアドレス形式の場合は失敗する", () => {
    const result = registerSchema.safeParse({
      email: "invalid-email",
      password: "securepassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("有効なメールアドレスを入力してください");
    }
  });

  it("パスワードが7文字以下の場合は失敗する", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("パスワードは8文字以上で入力してください");
    }
  });

  it("パスワードが8文字なら成功する", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password",
    });
    expect(result.success).toBe(true);
  });

  it("パスワードが101文字以上の場合は失敗する", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("パスワードは100文字以内で入力してください");
    }
  });

  it("パスワードが100文字なら成功する", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("名前が51文字以上の場合は失敗する", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
      name: "あ".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("名前は50文字以内で入力してください");
    }
  });

  it("名前が50文字なら成功する", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
      name: "a".repeat(50),
    });
    expect(result.success).toBe(true);
  });
});
