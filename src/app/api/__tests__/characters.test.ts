/**
 * characters.json 構造テスト
 * 全30キャラクター、必須フィールドの存在を確認する
 */

import { describe, it, expect } from "vitest";
import charactersData from "@/data/characters.json";

// characters.json の各エントリ型
interface Character {
  id: string;
  name: string;
  displayName: string;
  status: string;
}

describe("characters.json", () => {
  it("全30キャラクターが存在する", () => {
    expect(charactersData).toHaveLength(30);
  });

  it("各キャラクターに必須フィールドが存在する", () => {
    const chars = charactersData as Character[];
    chars.forEach((char, index) => {
      expect(char.id, `キャラクター${index}: id が存在すること`).toBeDefined();
      expect(char.id, `キャラクター${index}: id が空でないこと`).not.toBe("");

      expect(
        char.name,
        `キャラクター${index}: name が存在すること`,
      ).toBeDefined();
      expect(char.name, `キャラクター${index}: name が空でないこと`).not.toBe(
        "",
      );

      expect(
        char.displayName,
        `キャラクター${index}: displayName が存在すること`,
      ).toBeDefined();
      expect(
        char.displayName,
        `キャラクター${index}: displayName が空でないこと`,
      ).not.toBe("");

      expect(
        char.status,
        `キャラクター${index}: status が存在すること`,
      ).toBeDefined();
    });
  });

  it("各キャラクターの id が一意である", () => {
    const chars = charactersData as Character[];
    const ids = chars.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("各キャラクターの status が 'active', 'inactive', または 'upcoming' である", () => {
    const chars = charactersData as Character[];
    chars.forEach((char, index) => {
      expect(
        ["active", "inactive", "upcoming"],
        `キャラクター${index} (${char.id}): status が有効な値であること`,
      ).toContain(char.status);
    });
  });

  it("リュウ（ryu）が含まれる", () => {
    const chars = charactersData as Character[];
    const ryu = chars.find((c) => c.id === "ryu");
    expect(ryu).toBeDefined();
    expect(ryu?.name).toBe("Ryu");
    expect(ryu?.displayName).toBe("リュウ");
  });

  it("各キャラクターの id がスラッグ形式（英数字とハイフン）である", () => {
    const chars = charactersData as Character[];
    const slugPattern = /^[a-z0-9-]+$/;
    chars.forEach((char, index) => {
      expect(
        slugPattern.test(char.id),
        `キャラクター${index} (${char.id}): id がスラッグ形式であること`,
      ).toBe(true);
    });
  });
});
