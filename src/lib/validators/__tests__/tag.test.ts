/**
 * tag.ts のユニットテスト
 * tagCreateSchema のバリデーション動作を検証する
 */

import { describe, it, expect } from "vitest";
import { tagCreateSchema } from "../tag";

// ============================================================
// tagCreateSchema テスト
// ============================================================

describe("tagCreateSchema", () => {
  // TC-T01: 有効なタグ名を受け入れる
  it("TC-T01: 有効なタグ名を受け入れる", () => {
    const result = tagCreateSchema.safeParse({ name: "BnB" });
    expect(result.success).toBe(true);
  });

  // TC-T02: 1文字のタグ名を受け入れる（最小境界）
  it("TC-T02: 1文字のタグ名を受け入れる（最小境界）", () => {
    const result = tagCreateSchema.safeParse({ name: "A" });
    expect(result.success).toBe(true);
  });

  // TC-T03: 30文字のタグ名を受け入れる（最大境界）
  it("TC-T03: 30文字のタグ名を受け入れる（最大境界）", () => {
    const result = tagCreateSchema.safeParse({ name: "a".repeat(30) });
    expect(result.success).toBe(true);
  });

  // TC-T04: 日本語タグ名を受け入れる
  it("TC-T04: 日本語タグ名を受け入れる", () => {
    const result = tagCreateSchema.safeParse({ name: "画面端コンボ" });
    expect(result.success).toBe(true);
  });

  // TC-T05: タグ名が空文字の場合は失敗する
  it("TC-T05: タグ名が空文字の場合は失敗する", () => {
    const result = tagCreateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("タグ名を入力してください");
    }
  });

  // TC-T06: タグ名が31文字以上の場合は失敗する
  it("TC-T06: タグ名が31文字以上の場合は失敗する", () => {
    const result = tagCreateSchema.safeParse({ name: "a".repeat(31) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("タグ名は30文字以内で入力してください");
    }
  });

  // TC-T07: name フィールドがない場合は失敗する
  it("TC-T07: name フィールドがない場合は失敗する", () => {
    const result = tagCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
