/**
 * プリセットタグ定義
 * prisma/seed.ts と同期する必要がある（12種）
 */

export interface PresetTag {
  /** DB の Tag.name と一致させる */
  name: string;
  /** 表示ラベル */
  label: string;
  /** カテゴリ（UI グルーピング用） */
  category: "situation" | "drive" | "super" | "other";
}

export const PRESET_TAGS: PresetTag[] = [
  // 状況系
  { name: "BnB", label: "BnB", category: "situation" },
  { name: "Corner", label: "画面端", category: "situation" },
  { name: "Midscreen", label: "画面中央", category: "situation" },
  // ドライブ系
  { name: "Drive Rush", label: "DR", category: "drive" },
  { name: "Punish Counter", label: "パニカン", category: "situation" },
  { name: "Counter Hit", label: "CH", category: "situation" },
  { name: "Anti-Air", label: "対空", category: "situation" },
  // スーパーアーツ系
  { name: "SA1", label: "SA1", category: "super" },
  { name: "SA2", label: "SA2", category: "super" },
  { name: "SA3", label: "SA3", category: "super" },
  // その他
  { name: "Throw", label: "投げ", category: "other" },
  { name: "Overdrive", label: "OD使用", category: "drive" },
] as const;

/** プリセットタグ名の一覧（型安全アクセス用） */
export const PRESET_TAG_NAMES = PRESET_TAGS.map((tag) => tag.name);

/** プリセットタグ名から表示ラベルを取得する */
export function getPresetTagLabel(name: string): string {
  return PRESET_TAGS.find((tag) => tag.name === name)?.label ?? name;
}
