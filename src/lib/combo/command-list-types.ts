/**
 * コマンドリスト入力モード 型定義
 * ISSUE-001 (2026-04-12) で追加
 * キャラクター別コマンドリストデータの型定義・読み込み・キャッシュ
 */

import type { ComboStep } from "./types";

// ============================================================
// カテゴリ定義
// ============================================================

/**
 * 技のカテゴリ分類
 * UI_SPEC.md のカテゴリ見出し順に定義
 */
export type CommandCategory =
  | "normal" // 通常技（立ち/しゃがみ）
  | "unique" // 特殊技（固有技）
  | "special" // 必殺技
  | "super" // スーパーアーツ
  | "throw" // 投げ
  | "drive" // ドライブ系システム技
  | "target-combo"; // ターゲットコンボ

/**
 * カテゴリの表示名マッピング
 */
export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  normal: "通常技",
  unique: "特殊技",
  special: "必殺技",
  super: "スーパーアーツ",
  throw: "投げ",
  drive: "ドライブ系",
  "target-combo": "ターゲットコンボ",
};

/**
 * カテゴリの表示順序
 * UI_SPEC.md セクション 9.6 のレイアウトに準拠
 */
export const CATEGORY_ORDER: CommandCategory[] = [
  "normal",
  "unique",
  "special",
  "super",
  "throw",
  "drive",
  "target-combo",
];

// ============================================================
// 型定義
// ============================================================

/**
 * コマンドリスト上の1つの技を表す型
 */
export interface CommandMove {
  /** 一意ID（キャラクター内でユニーク。例: "ryu-hadoken"） */
  id: string;
  /** 技名（日本語） */
  name: string;
  /** 技名（英語） */
  nameEn: string;
  /** カテゴリ */
  category: CommandCategory;
  /** テンキー表記（表示用。例: "236P", "5MP"） */
  notation: string;
  /** パース済み ComboStep 配列（技クリック時にそのまま追加される） */
  steps: ComboStep[];
}

/**
 * 1キャラクター分のコマンドリスト
 */
export interface CharacterCommandList {
  /** キャラクターID（characters.json の id と一致） */
  characterId: string;
  /** キャラクター表示名 */
  characterName: string;
  /** 技リスト */
  moves: CommandMove[];
}

// ============================================================
// 遅延読み込み + キャッシュ
// ============================================================

/** 読み込み済みコマンドリストのインメモリキャッシュ */
const commandListCache = new Map<string, CharacterCommandList | null>();

/**
 * キャラクター別コマンドリストを遅延読み込みする
 * JSON ファイルが存在しない場合は null を返す
 * 一度読み込んだデータはキャッシュして再利用する
 */
export async function loadCommandList(
  characterId: string,
): Promise<CharacterCommandList | null> {
  // キャッシュに存在する場合はキャッシュから返す
  if (commandListCache.has(characterId)) {
    return commandListCache.get(characterId) ?? null;
  }

  try {
    // Next.js dynamic import で JSON を遅延読み込みする
    const data = await import(`@/data/command-lists/${characterId}.json`);
    const commandList = data.default as CharacterCommandList;
    commandListCache.set(characterId, commandList);
    return commandList;
  } catch {
    // JSON ファイルが存在しない場合（コマンドリスト未登録キャラクター）
    commandListCache.set(characterId, null);
    return null;
  }
}
