/// <reference types="vitest/globals" />
/**
 * notation-converter.ts のユニットテスト
 * parseNotation / serializeNotation の動作を検証する
 */

import { describe, it, expect } from "vitest";
import { parseNotation, serializeNotation } from "../notation-converter";
import type { ComboSequence } from "../types";

// ============================================================
// parseNotation テスト
// ============================================================

describe("parseNotation", () => {
  it("単純なボタン入力をパースする（方向なし）", () => {
    const result = parseNotation("LP");
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.type).toBe("normal");
    if (step.type === "normal") {
      expect(step.directions).toEqual([]);
      expect(step.button).toBe("LP");
    }
  });

  it("方向 + ボタン入力をパースする（5MP）", () => {
    const result = parseNotation("5MP");
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.type).toBe("normal");
    if (step.type === "normal") {
      expect(step.directions).toEqual(["5"]);
      expect(step.button).toBe("MP");
    }
  });

  it("波動拳コマンド 236HP をパースする", () => {
    const result = parseNotation("236HP");
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.type).toBe("normal");
    if (step.type === "normal") {
      expect(step.directions).toEqual(["2", "3", "6"]);
      expect(step.button).toBe("HP");
    }
  });

  it("コンボ全体 '5MP > 2MK xx 214MK > SA2' をパースする", () => {
    const result = parseNotation("5MP > 2MK xx 214MK > SA2");
    // 5MP, >, 2MK, xx, 214MK, >, SA2 の7ステップ
    expect(result.steps).toHaveLength(7);

    expect(result.steps[0].type).toBe("normal");
    expect(result.steps[1].type).toBe("connector");
    if (result.steps[1].type === "connector") {
      expect(result.steps[1].symbol).toBe(">");
    }
    expect(result.steps[2].type).toBe("normal");
    expect(result.steps[3].type).toBe("connector");
    if (result.steps[3].type === "connector") {
      expect(result.steps[3].symbol).toBe("xx");
    }
    expect(result.steps[4].type).toBe("normal");
    if (result.steps[4].type === "normal") {
      expect(result.steps[4].directions).toEqual(["2", "1", "4"]);
      expect(result.steps[4].button).toBe("MK");
    }
    expect(result.steps[5].type).toBe("connector");
    expect(result.steps[6].type).toBe("normal");
    if (result.steps[6].type === "normal") {
      expect(result.steps[6].button).toBe("SA2");
    }
  });

  it("溜め入力 [4]6HP をパースする", () => {
    const result = parseNotation("[4]6HP");
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.type).toBe("charge");
    if (step.type === "charge") {
      expect(step.chargeDir).toBe("4");
      expect(step.releaseDir).toBe("6");
      expect(step.button).toBe("HP");
    }
  });

  it("ジャンプ修飾子 j.HP をパースする", () => {
    const result = parseNotation("j.HP");
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.type).toBe("normal");
    if (step.type === "normal") {
      expect(step.modifier).toBe("j");
      expect(step.button).toBe("HP");
    }
  });

  it("OD プレフィックス OD236HP をパースする", () => {
    const result = parseNotation("OD236HP");
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.type).toBe("normal");
    if (step.type === "normal") {
      expect(step.isOD).toBe(true);
      expect(step.directions).toEqual(["2", "3", "6"]);
      expect(step.button).toBe("HP");
    }
  });

  it("コンマ区切り ', ' をコネクターとしてパースする", () => {
    const result = parseNotation("5LP, 5MP");
    expect(result.steps).toHaveLength(3);
    expect(result.steps[1].type).toBe("connector");
    if (result.steps[1].type === "connector") {
      expect(result.steps[1].symbol).toBe(",");
    }
  });

  it("DR（ドライブラッシュ）をパースする", () => {
    const result = parseNotation("DR");
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.type).toBe("normal");
    if (step.type === "normal") {
      expect(step.button).toBe("DR");
    }
  });

  it("SA1, SA2, SA3 をパースする", () => {
    ["SA1", "SA2", "SA3"].forEach((sa) => {
      const result = parseNotation(sa);
      expect(result.steps).toHaveLength(1);
      const step = result.steps[0];
      expect(step.type).toBe("normal");
      if (step.type === "normal") {
        expect(step.button).toBe(sa);
      }
    });
  });

  it("ティルダ区切り '~' をコネクターとしてパースする", () => {
    const result = parseNotation("5LP ~ 5MP");
    expect(result.steps).toHaveLength(3);
    expect(result.steps[1].type).toBe("connector");
    if (result.steps[1].type === "connector") {
      expect(result.steps[1].symbol).toBe("~");
    }
  });

  it("空文字列をパースすると空の steps を返す", () => {
    const result = parseNotation("");
    expect(result.steps).toHaveLength(0);
    expect(result.notation).toBe("");
  });

  it("パース不能なトークンは無視される", () => {
    // console.warn を抑制
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const result = parseNotation("INVALID_TOKEN");
    expect(result.steps).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it("notation フィールドが元の文字列を保持する", () => {
    const input = "5MP > 2MK";
    const result = parseNotation(input);
    expect(result.notation).toBe(input);
  });
});

// ============================================================
// serializeNotation テスト
// ============================================================

describe("serializeNotation", () => {
  it("単純な NormalInput をシリアライズする", () => {
    const sequence: ComboSequence = {
      notation: "5MP",
      steps: [{ type: "normal", directions: ["5"], button: "MP" }],
    };
    expect(serializeNotation(sequence)).toBe("5MP");
  });

  it("方向なし NormalInput をシリアライズする", () => {
    const sequence: ComboSequence = {
      notation: "SA2",
      steps: [{ type: "normal", directions: [], button: "SA2" }],
    };
    expect(serializeNotation(sequence)).toBe("SA2");
  });

  it("コネクターを含むシーケンスをシリアライズする", () => {
    const sequence: ComboSequence = {
      notation: "5MP > 2MK",
      steps: [
        { type: "normal", directions: ["5"], button: "MP" },
        { type: "connector", symbol: ">" },
        { type: "normal", directions: ["2"], button: "MK" },
      ],
    };
    expect(serializeNotation(sequence)).toBe("5MP > 2MK");
  });

  it("ChargeInput をシリアライズする", () => {
    const sequence: ComboSequence = {
      notation: "[4]6HP",
      steps: [
        { type: "charge", chargeDir: "4", releaseDir: "6", button: "HP" },
      ],
    };
    expect(serializeNotation(sequence)).toBe("[4]6HP");
  });

  it("OD 修飾子付き入力をシリアライズする", () => {
    const sequence: ComboSequence = {
      notation: "OD236HP",
      steps: [
        {
          type: "normal",
          directions: ["2", "3", "6"],
          button: "HP",
          isOD: true,
        },
      ],
    };
    expect(serializeNotation(sequence)).toBe("OD236HP");
  });

  it("ジャンプ修飾子付き入力をシリアライズする", () => {
    const sequence: ComboSequence = {
      notation: "j.HP",
      steps: [
        {
          type: "normal",
          directions: [],
          button: "HP",
          modifier: "j",
        },
      ],
    };
    expect(serializeNotation(sequence)).toBe("j.HP");
  });

  it("空の steps を持つシーケンスをシリアライズすると空文字列を返す", () => {
    const sequence: ComboSequence = {
      notation: "",
      steps: [],
    };
    expect(serializeNotation(sequence)).toBe("");
  });
});

// ============================================================
// ラウンドトリップテスト
// ============================================================

describe("ラウンドトリップ（parseNotation → serializeNotation）", () => {
  // コンマ区切りは "5LP , 5MP" のように前後スペース付きで出力されるため除外
  const testCases = [
    "5MP > 2MK xx 214MK",
    "236HP",
    "j.HP > 5HP xx 236HP",
    "[4]6HP",
    "DR > 5LP > 2MK xx SA2",
    "5LP ~ 5MP",
  ];

  testCases.forEach((notation) => {
    it(`"${notation}" のラウンドトリップが一致する`, () => {
      const parsed = parseNotation(notation);
      const serialized = serializeNotation(parsed);
      expect(serialized).toBe(notation);
    });
  });
});
