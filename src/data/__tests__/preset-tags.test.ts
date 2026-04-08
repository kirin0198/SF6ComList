/**
 * preset-tags.ts のテスト
 * プリセットタグが12種あること、各タグに必須フィールドがあることを確認する
 */

import { describe, it, expect } from "vitest";
import {
  PRESET_TAGS,
  PRESET_TAG_NAMES,
  getPresetTagLabel,
} from "../preset-tags";

describe("PRESET_TAGS", () => {
  it("プリセットタグが12種存在する", () => {
    expect(PRESET_TAGS).toHaveLength(12);
  });

  it("各タグに必須フィールドが存在する", () => {
    PRESET_TAGS.forEach((tag, index) => {
      expect(tag.name, `タグ${index}: name が存在すること`).toBeDefined();
      expect(tag.name, `タグ${index}: name が空でないこと`).not.toBe("");

      expect(tag.label, `タグ${index}: label が存在すること`).toBeDefined();
      expect(tag.label, `タグ${index}: label が空でないこと`).not.toBe("");

      expect(
        tag.category,
        `タグ${index}: category が存在すること`,
      ).toBeDefined();
    });
  });

  it("各タグの category が有効な値である", () => {
    const validCategories = ["situation", "drive", "super", "other"];
    PRESET_TAGS.forEach((tag, index) => {
      expect(
        validCategories,
        `タグ${index} (${tag.name}): category が有効な値であること`,
      ).toContain(tag.category);
    });
  });

  it("各タグの name が一意である", () => {
    const names = PRESET_TAGS.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("BnB タグが含まれる", () => {
    const bnb = PRESET_TAGS.find((t) => t.name === "BnB");
    expect(bnb).toBeDefined();
    expect(bnb?.category).toBe("situation");
  });

  it("Corner（画面端）タグが含まれる", () => {
    const corner = PRESET_TAGS.find((t) => t.name === "Corner");
    expect(corner).toBeDefined();
    expect(corner?.label).toBe("画面端");
  });

  it("SA1, SA2, SA3 タグが含まれる", () => {
    ["SA1", "SA2", "SA3"].forEach((saName) => {
      const tag = PRESET_TAGS.find((t) => t.name === saName);
      expect(tag, `${saName} タグが存在すること`).toBeDefined();
      expect(tag?.category).toBe("super");
    });
  });
});

describe("PRESET_TAG_NAMES", () => {
  it("12個のタグ名を含む", () => {
    expect(PRESET_TAG_NAMES).toHaveLength(12);
  });

  it("PRESET_TAGS の name と一致する", () => {
    const expectedNames = PRESET_TAGS.map((t) => t.name);
    expect(PRESET_TAG_NAMES).toEqual(expectedNames);
  });
});

describe("getPresetTagLabel", () => {
  it("既知のタグ名からラベルを取得する", () => {
    expect(getPresetTagLabel("BnB")).toBe("BnB");
    expect(getPresetTagLabel("Corner")).toBe("画面端");
    expect(getPresetTagLabel("Drive Rush")).toBe("DR");
    expect(getPresetTagLabel("Overdrive")).toBe("OD使用");
  });

  it("未知のタグ名はそのまま返す", () => {
    expect(getPresetTagLabel("UnknownTag")).toBe("UnknownTag");
  });
});
