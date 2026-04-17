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

/** 強度ラベル（弱/中/強/OD） */
export type StrengthLevel = "L" | "M" | "H" | "OD";

/** 強度バリアント（弱/中/強で異なるボタンの技に使用） */
export interface StrengthVariant {
  /** 強度ラベル */
  strength: StrengthLevel;
  /** テンキー表記（例: "236LP"） */
  notation: string;
  /** パース済み ComboStep 配列 */
  steps: ComboStep[];
}

/**
 * コマンドリスト上の1つの技を表す型
 *
 * 強度バリアントがある技（必殺技等）:
 *   - variants に弱/中/強を定義
 *   - notation は表示用の汎用表記（例: "236+P"）
 *   - steps は未使用（variants 内の steps を使う）
 *
 * 強度バリアントがない技（通常技・SA等）:
 *   - variants は undefined
 *   - steps をそのまま使用
 *
 * 派生技（follow-up）を持つ技（ISSUE-009, 2026-04-18 追加）:
 *   - followUps に子 CommandMove 配列を格納
 *   - 派生技自身もさらに variants / followUps を持てる（再帰構造）
 *
 * カテゴリ非依存:
 *   followUps は CommandMove のベースフィールドに付くため、
 *   親の category が special / unique / command-normal / normal いずれでも同じ構造で派生を保持できる。
 *
 * ID 命名規則:
 *   - トップレベル技: "{characterId}-{技の英略}" (例: "kimberly-shikkuke")
 *   - 派生技: "{characterId}-{parent}-{derivation}"
 *            (例: "kimberly-shikkuke-bushin-shoha", "kimberly-4hk-followup")
 */
export interface CommandMove {
  /** 一意ID（キャラクター内でユニーク。例: "ryu-hadoken"）
   *
   * 命名規則:
   *   - トップレベル技: "{characterId}-{技の英略}"（例: "kimberly-shikkuke"）
   *   - 派生技: "{characterId}-{parent}-{derivation}"
   *            （例: "kimberly-shikkuke-bushin-shoha", "kimberly-4hk-followup"）
   */
  id: string;
  /** 技名（日本語） */
  name: string;
  /** 技名（英語） */
  nameEn: string;
  /** カテゴリ（派生技は親と独立した値を持てる） */
  category: CommandCategory;
  /** テンキー表記（表示用。例: "236+P", "5MP"） */
  notation: string;
  /** パース済み ComboStep 配列（バリアントなしの技で使用） */
  steps: ComboStep[];
  /** 強度バリアント（弱/中/強がある技のみ） */
  variants?: StrengthVariant[];
  /**
   * 派生技（follow-up moves）
   * ISSUE-009 (2026-04-18) で追加
   *
   * 親技から発生する派生技の配列。要素も CommandMove 型であり、
   * 派生技自身がさらに variants / followUps を持つ再帰構造を許容する。
   * カテゴリに依存せず、親が special / unique / command-normal / normal の
   * いずれでも使用できる汎用フィールド。
   *
   * 循環参照禁止: JSON データ上で派生 ID の循環参照を作成してはならない。
   */
  followUps?: CommandMove[];
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
