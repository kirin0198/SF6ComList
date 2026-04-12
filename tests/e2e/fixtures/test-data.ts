/**
 * E2E テスト用定数
 * TEST_PLAN.md Section 9.4 に準拠
 */

/** テストユーザー A（メインテストユーザー） */
export const TEST_USER_A = {
  email: "e2e-user-a@test.local",
  password: "TestPass123!",
} as const;

/** テストユーザー B（データ分離テスト用） */
export const TEST_USER_B = {
  email: "e2e-user-b@test.local",
  password: "TestPass456!",
} as const;

/** テスト用キャラクター */
export const TEST_CHARACTER = {
  id: "ryu",
  displayName: "リュウ",
} as const;

/** テスト用コンボデータ */
export const TEST_COMBO = {
  name: "テスト BnB",
  damage: "2800",
  notation: "2MK xx 236HP",
  memo: "テスト用メモ",
} as const;

/** プリセットタグ名（seed.ts と同期） */
export const PRESET_TAG_NAMES = [
  "BnB",
  "画面端",
  "画面中央",
  "DR",
  "パニカン始動", // seed.ts では "パニカン始動"
  "CH始動", // seed.ts では "CH始動"
  "対空",
  "SA1",
  "SA2",
  "SA3",
  "投げ",
  "OD使用",
] as const;
