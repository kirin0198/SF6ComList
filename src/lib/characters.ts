/**
 * キャラクターデータ読み込みヘルパー
 * src/data/characters.json を型安全に扱うユーティリティ関数群
 */

import charactersData from "@/data/characters.json";

export type CharacterStatus = "active" | "upcoming";

export interface Character {
  /** URL パラメータ・DB キーとして使用するID */
  id: string;
  /** 英語名 */
  name: string;
  /** 日本語表示名 */
  displayName: string;
  /** リリース状況 */
  status: CharacterStatus;
}

/** 全キャラクターデータ */
export const characters: Character[] = charactersData as Character[];

/**
 * アクティブなキャラクターのみ取得する（upcoming を除外）
 */
export function getActiveCharacters(): Character[] {
  return characters.filter((c) => c.status === "active");
}

/**
 * ID でキャラクターを取得する
 * 見つからない場合は undefined を返す
 */
export function getCharacterById(id: string): Character | undefined {
  return characters.find((c) => c.id === id);
}

/**
 * キャラクター名のイニシャルを取得する（アバター表示用）
 * 日本語名の場合は先頭2文字、英語名の場合は先頭1文字を返す
 */
export function getCharacterInitials(character: Character): string {
  const name = character.displayName;
  // 英数字のみの場合（JP等）はそのまま
  if (/^[A-Za-z0-9.\s]+$/.test(name)) {
    const parts = name.split(" ");
    return parts.length > 1
      ? parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2)
      : name.slice(0, 2).toUpperCase();
  }
  // 日本語の場合は先頭2文字
  return name.slice(0, 2);
}
