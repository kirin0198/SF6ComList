/**
 * validation.ts のユニットテスト
 * comboCreateSchema / comboUpdateSchema の動作を検証する
 */

import { describe, it, expect } from "vitest";
import { comboCreateSchema, comboUpdateSchema } from "../validation";

// ============================================================
// 共通テストデータ
// ============================================================

/** 有効な ComboSequence のテストデータ */
const validSequence = {
  steps: [
    {
      type: "normal" as const,
      directions: ["2", "3", "6"],
      button: "HP" as const,
    },
  ],
  notation: "236HP",
};

/** 有効なコンボ作成データ */
const validComboCreate = {
  name: "テストコンボ",
  sequence: validSequence,
  damage: 2500,
  memo: "テストメモ",
  tagIds: [],
};

// ============================================================
// comboCreateSchema テスト
// ============================================================

describe("comboCreateSchema", () => {
  it("有効な入力を受け入れる", () => {
    const result = comboCreateSchema.safeParse(validComboCreate);
    expect(result.success).toBe(true);
  });

  it("sequence のみ必須（他フィールドは任意）", () => {
    const result = comboCreateSchema.safeParse({
      sequence: validSequence,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual([]);
    }
  });

  it("sequence がない場合は失敗する", () => {
    const result = comboCreateSchema.safeParse({
      name: "テスト",
    });
    expect(result.success).toBe(false);
  });

  it("コンボ名が101文字以上の場合は失敗する", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("コンボ名は100文字以内で入力してください");
    }
  });

  it("コンボ名が100文字以内なら成功する", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      name: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("ダメージが負の値の場合は失敗する", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      damage: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("ダメージ値は0以上で入力してください");
    }
  });

  it("ダメージが0なら成功する", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      damage: 0,
    });
    expect(result.success).toBe(true);
  });

  it("ダメージが小数の場合は失敗する", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      damage: 1.5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("ダメージ値は整数で入力してください");
    }
  });

  it("メモが1001文字以上の場合は失敗する", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      memo: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("メモは1000文字以内で入力してください");
    }
  });

  it("sequence の steps が空配列の場合は失敗する", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      sequence: { steps: [], notation: "" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("コンボは1ステップ以上必要です");
    }
  });

  it("tagIds が省略された場合、デフォルト値は空配列", () => {
    const result = comboCreateSchema.safeParse({
      sequence: validSequence,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual([]);
    }
  });

  it("name, damage, memo に null を渡せる", () => {
    const result = comboCreateSchema.safeParse({
      sequence: validSequence,
      name: null,
      damage: null,
      memo: null,
    });
    expect(result.success).toBe(true);
  });

  it("溜め入力ステップを持つシーケンスを受け入れる", () => {
    const result = comboCreateSchema.safeParse({
      sequence: {
        steps: [
          {
            type: "charge" as const,
            chargeDir: "4" as const,
            releaseDir: "6" as const,
            button: "HP" as const,
          },
        ],
        notation: "[4]6HP",
      },
    });
    expect(result.success).toBe(true);
  });

  it("コネクターステップを含むシーケンスを受け入れる", () => {
    const result = comboCreateSchema.safeParse({
      sequence: {
        steps: [
          {
            type: "normal" as const,
            directions: ["5"] as const,
            button: "MP" as const,
          },
          { type: "connector" as const, symbol: ">" as const },
          {
            type: "normal" as const,
            directions: ["2", "3", "6"] as const,
            button: "HP" as const,
          },
        ],
        notation: "5MP > 236HP",
      },
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// comboCreateSchema 追加テストケース: エッジケース
// ============================================================

describe("comboCreateSchema 追加エッジケース", () => {
  // TC-V01: ダメージ値 99999（高い値）が受け入れられる
  it("TC-V01: ダメージ値 99999（高い値）が受け入れられる", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      damage: 99999,
    });
    expect(result.success).toBe(true);
  });

  // TC-V02: tagIds に文字列配列を受け入れる
  it("TC-V02: tagIds に文字列配列を受け入れる", () => {
    const result = comboCreateSchema.safeParse({
      ...validComboCreate,
      tagIds: ["id1", "id2"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual(["id1", "id2"]);
    }
  });

  // TC-V03: 複数ステップを持つ sequence が受け入れられる
  it("TC-V03: 7ステップのフルコンボシーケンスが受け入れられる", () => {
    const result = comboCreateSchema.safeParse({
      sequence: {
        steps: [
          { type: "normal" as const, directions: ["5"] as const, button: "MP" as const },
          { type: "connector" as const, symbol: ">" as const },
          { type: "normal" as const, directions: ["5"] as const, button: "HP" as const },
          { type: "connector" as const, symbol: "xx" as const },
          { type: "normal" as const, directions: ["2", "3", "6"] as const, button: "HP" as const },
          { type: "connector" as const, symbol: "xx" as const },
          { type: "normal" as const, directions: [] as const, button: "SA2" as const },
        ],
        notation: "5MP > 5HP xx 236HP xx SA2",
      },
    });
    expect(result.success).toBe(true);
  });

  // TC-V04: 不正な step type を含む sequence は失敗する
  it("TC-V04: 不正な step type を含む sequence は失敗する", () => {
    const result = comboCreateSchema.safeParse({
      sequence: {
        steps: [{ type: "unknown" }],
        notation: "unknown",
      },
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// comboUpdateSchema テスト
// ============================================================

describe("comboUpdateSchema", () => {
  it("全フィールドが任意（空オブジェクトが有効）", () => {
    const result = comboUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("有効なフィールドを部分的に指定できる", () => {
    const result = comboUpdateSchema.safeParse({
      name: "更新したコンボ名",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("更新したコンボ名");
      expect(result.data.sequence).toBeUndefined();
    }
  });

  it("sequence フィールドを更新できる", () => {
    const result = comboUpdateSchema.safeParse({
      sequence: validSequence,
    });
    expect(result.success).toBe(true);
  });

  it("damage フィールドを更新できる", () => {
    const result = comboUpdateSchema.safeParse({
      damage: 3000,
    });
    expect(result.success).toBe(true);
  });

  it("tagIds を空配列で更新できる", () => {
    const result = comboUpdateSchema.safeParse({
      tagIds: [],
    });
    expect(result.success).toBe(true);
  });

  it("コンボ名が101文字以上の場合は失敗する", () => {
    const result = comboUpdateSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("コンボ名は100文字以内で入力してください");
    }
  });
});
