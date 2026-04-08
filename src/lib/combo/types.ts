/**
 * SF6 コンボデータモデル型定義
 * poc/combo-data-model.ts から移植。Combo エンティティは Prisma 生成型に置換。
 * アイコンマッピングは src/components/icons/ に分離。
 */

// ============================================================
// 方向入力 (テンキー表記)
// ============================================================

/**
 * テンキー表記による方向入力。
 * 5はニュートラル（方向なし）。キャラクターは1P側（右向き）を基準とする。
 *
 *   7(上後) 8(上)   9(上前)
 *   4(後)   5(N)    6(前)
 *   1(下後) 2(下)   3(下前)
 */
export type Direction = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

// ============================================================
// ボタン入力
// ============================================================

/** SF6クラシック操作の6ボタン */
export type BasicButton = "LP" | "MP" | "HP" | "LK" | "MK" | "HK";

/** ドライブシステムのアクション略称 */
export type DriveAction =
  | "DI" // Drive Impact (HP+HK)
  | "DR" // Drive Rush
  | "DP" // Drive Parry (MP+MK)
  | "PP" // Perfect Parry
  | "DRev" // Drive Reversal
  | "OD"; // Overdrive

/** スーパーアーツ */
export type SuperArt = "SA1" | "SA2" | "SA3";

/** 投げ */
export type ThrowAction = "Throw"; // LP+LK

/** 全ボタン種別のユニオン */
export type ButtonInput = BasicButton | DriveAction | SuperArt | ThrowAction;

// ============================================================
// コンボ入力の各ステップ
// ============================================================

/**
 * 攻撃修飾子（位置・状態）
 * UIで表示するプレフィックス: j.HP, cl.HP, cr.MK 等
 */
export type AttackModifier =
  | "j" // ジャンプ攻撃 (j.)
  | "cl" // 近距離 (cl.)
  | "cr" // しゃがみ (cr.) — 2と同義だが表記に使う
  | "st"; // 立ち (st.) — 5と同義

/** 溜め入力の表現 */
export interface ChargeInput {
  type: "charge";
  /** 溜め方向 例: "4" (後ろ溜め), "2" (下溜め) */
  chargeDir: Direction;
  /** 離す方向 例: "6" (前), "8" (上) */
  releaseDir: Direction;
  button: BasicButton;
}

/** 通常の方向+ボタン入力 */
export interface NormalInput {
  type: "normal";
  /** 方向入力シーケンス: 236 なら ["2","3","6"] */
  directions: Direction[];
  button: ButtonInput;
  /** 修飾子: j.HP の "j" など */
  modifier?: AttackModifier;
  /** OD技の場合 true */
  isOD?: boolean;
}

/** コンボ内のコネクター（つなぎ記号） */
export interface ConnectorStep {
  type: "connector";
  /** ">" = リンク, "xx" = キャンセル, "~" = ディレイ/派生, "," = 区切り */
  symbol: ">" | "xx" | "~" | ",";
}

/** コンボの1ステップ */
export type ComboStep = NormalInput | ChargeInput | ConnectorStep;

// ============================================================
// コンボシーケンス
// ============================================================

/**
 * コンボシーケンス全体。
 * steps 配列でコンボの入力を順に表現する。
 *
 * 例: リュウの波動拳コンボ
 *   "5MP > 5HP xx 236HP"
 *   steps: [
 *     { type: "normal", directions: ["5"], button: "MP" },
 *     { type: "connector", symbol: ">" },
 *     { type: "normal", directions: ["5"], button: "HP" },
 *     { type: "connector", symbol: "xx" },
 *     { type: "normal", directions: ["2","3","6"], button: "HP" },
 *   ]
 */
export interface ComboSequence {
  steps: ComboStep[];
  /** テンキー表記の文字列表現（表示・検索用） */
  notation: string;
}

// ============================================================
// API レスポンス型（Prisma 型に依存しない形で定義）
// ============================================================

/** タグの API レスポンス型 */
export interface TagResponse {
  id: string;
  name: string;
  isPreset: boolean;
}

/** コンボの API レスポンス型 */
export interface ComboResponse {
  id: string;
  userId: string;
  characterId: string;
  name: string | null;
  sequence: ComboSequence;
  notation: string;
  damage: number | null;
  memo: string | null;
  tags: TagResponse[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ============================================================
// 定数定義
// ============================================================

/** 既知のボタン入力セット（パース・バリデーション用） */
export const BUTTON_INPUT_VALUES: ButtonInput[] = [
  "LP",
  "MP",
  "HP",
  "LK",
  "MK",
  "HK",
  "DI",
  "DR",
  "DP",
  "PP",
  "DRev",
  "OD",
  "SA1",
  "SA2",
  "SA3",
  "Throw",
];

/** コネクター記号の一覧 */
export const CONNECTOR_SYMBOLS: ConnectorStep["symbol"][] = [
  ">",
  "xx",
  "~",
  ",",
];

/** 攻撃修飾子の一覧 */
export const ATTACK_MODIFIERS: AttackModifier[] = ["j", "cl", "cr", "st"];
