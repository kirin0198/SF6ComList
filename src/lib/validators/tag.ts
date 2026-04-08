/**
 * タグ CRUD のバリデーションスキーマ（Zod）
 */

import { z } from "zod";

/** POST /api/tags のリクエストスキーマ */
export const tagCreateSchema = z.object({
  /** タグ名（必須、1〜30文字） */
  name: z
    .string()
    .min(1, "タグ名を入力してください")
    .max(30, "タグ名は30文字以内で入力してください"),
});

export type TagCreateInput = z.infer<typeof tagCreateSchema>;
