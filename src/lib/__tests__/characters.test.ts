/**
 * characters.ts のユニットテスト
 * getActiveCharacters / getCharacterById / getCharacterInitials の動作を検証する
 */

import { describe, it, expect } from "vitest";
import {
  getActiveCharacters,
  getCharacterById,
  getCharacterInitials,
  type Character,
} from "../characters";

// ============================================================
// getActiveCharacters テスト
// ============================================================

describe("getActiveCharacters", () => {
  // TC-C01: getActiveCharacters が active ステータスのキャラクターのみ返す
  it("TC-C01: active ステータスのキャラクターのみ返す", () => {
    const result = getActiveCharacters();
    expect(result.length).toBeGreaterThan(0);
    result.forEach((c) => {
      expect(c.status).toBe("active");
    });
  });

  // TC-C02: getActiveCharacters が upcoming を除外する
  it("TC-C02: upcoming キャラクター（ingrid）を除外する", () => {
    const result = getActiveCharacters();
    const ids = result.map((c) => c.id);
    expect(ids).not.toContain("ingrid");
  });
});

// ============================================================
// getCharacterById テスト
// ============================================================

describe("getCharacterById", () => {
  // TC-C03: getCharacterById で存在するキャラクターを取得する
  it("TC-C03: 存在するキャラクター（ryu）を取得する", () => {
    const result = getCharacterById("ryu");
    expect(result).toBeDefined();
    expect(result?.id).toBe("ryu");
    expect(result?.name).toBe("Ryu");
  });

  // TC-C04: getCharacterById で存在しない ID は undefined を返す
  it("TC-C04: 存在しない ID は undefined を返す", () => {
    const result = getCharacterById("nonexistent");
    expect(result).toBeUndefined();
  });

  // TC-C08: getCharacterById に空文字列を渡すと undefined
  it("TC-C08: 空文字列を渡すと undefined を返す", () => {
    const result = getCharacterById("");
    expect(result).toBeUndefined();
  });
});

// ============================================================
// getCharacterInitials テスト
// ============================================================

describe("getCharacterInitials", () => {
  // TC-C05: getCharacterInitials が日本語名の先頭2文字を返す
  it("TC-C05: 日本語名の先頭2文字を返す", () => {
    const character: Character = {
      id: "ryu",
      name: "Ryu",
      displayName: "リュウ",
      status: "active",
    };
    const result = getCharacterInitials(character);
    expect(result).toBe("リュ");
  });

  // TC-C06: getCharacterInitials が英数字名をそのまま返す
  it("TC-C06: 英数字名（JP）をそのまま返す", () => {
    const character: Character = {
      id: "jp",
      name: "JP",
      displayName: "JP",
      status: "active",
    };
    const result = getCharacterInitials(character);
    expect(result).toBe("JP");
  });

  // TC-C07: getCharacterInitials がスペース区切りの英語名からイニシャルを返す
  it("TC-C07: スペース区切りの英語名（E. Honda）からイニシャル EH を返す", () => {
    const character: Character = {
      id: "e-honda",
      name: "E. Honda",
      displayName: "E. Honda",
      status: "active",
    };
    const result = getCharacterInitials(character);
    expect(result).toBe("EH");
  });
});
