/**
 * コンボ CRUD のバリデーションスキーマ（Zod）
 * サーバー側 API ルートとクライアント側フォームの両方で共有する
 */

import { z } from "zod";

// ============================================================
// 共通ステップスキーマ
// ============================================================

const directionSchema = z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

const basicButtonSchema = z.enum(["LP", "MP", "HP", "LK", "MK", "HK"]);

const buttonInputSchema = z.enum([
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
]);

const attackModifierSchema = z.enum(["j", "cl", "cr", "st"]);

const normalInputSchema = z.object({
  type: z.literal("normal"),
  directions: z.array(directionSchema),
  button: buttonInputSchema,
  modifier: attackModifierSchema.optional(),
  isOD: z.boolean().optional(),
});

const chargeInputSchema = z.object({
  type: z.literal("charge"),
  chargeDir: directionSchema,
  releaseDir: directionSchema,
  button: basicButtonSchema,
});

const connectorStepSchema = z.object({
  type: z.literal("connector"),
  symbol: z.enum([">", "xx", "~", ","]),
});

const comboStepSchema = z.discriminatedUnion("type", [
  normalInputSchema,
  chargeInputSchema,
  connectorStepSchema,
]);

/** ComboSequence の Zod スキーマ */
export const comboSequenceSchema = z.object({
  steps: z.array(comboStepSchema).min(1, "コンボは1ステップ以上必要です"),
  notation: z.string().min(1, "テンキー表記は必須です"),
});

// ============================================================
// コンボ作成スキーマ
// ============================================================

/** POST /api/characters/[characterId]/combos のリクエストスキーマ */
export const comboCreateSchema = z.object({
  /** コンボ名（任意、最大100文字） */
  name: z
    .string()
    .max(100, "コンボ名は100文字以内で入力してください")
    .optional()
    .nullable(),
  /** コンボシーケンス（必須） */
  sequence: comboSequenceSchema,
  /** ダメージ値（任意、0以上の整数） */
  damage: z
    .number()
    .int("ダメージ値は整数で入力してください")
    .min(0, "ダメージ値は0以上で入力してください")
    .optional()
    .nullable(),
  /** 自由記述メモ（任意、最大1000文字） */
  memo: z
    .string()
    .max(1000, "メモは1000文字以内で入力してください")
    .optional()
    .nullable(),
  /** タグ ID 配列（任意） */
  tagIds: z.array(z.string()).optional().default([]),
});

// ============================================================
// コンボ更新スキーマ
// ============================================================

/** PUT /api/combos/[comboId] のリクエストスキーマ（全フィールド任意） */
export const comboUpdateSchema = z.object({
  name: z
    .string()
    .max(100, "コンボ名は100文字以内で入力してください")
    .optional()
    .nullable(),
  sequence: comboSequenceSchema.optional(),
  damage: z
    .number()
    .int("ダメージ値は整数で入力してください")
    .min(0, "ダメージ値は0以上で入力してください")
    .optional()
    .nullable(),
  memo: z
    .string()
    .max(1000, "メモは1000文字以内で入力してください")
    .optional()
    .nullable(),
  tagIds: z.array(z.string()).optional(),
});

export type ComboCreateInput = z.infer<typeof comboCreateSchema>;
export type ComboUpdateInput = z.infer<typeof comboUpdateSchema>;
