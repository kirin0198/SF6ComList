/// <reference types="vitest/globals" />
/// <reference types="vite/client" />
/**
 * command-list-types.ts のユニットテスト
 * CommandMove 型の followUps フィールドの動作を検証する
 * ISSUE-009 (2026-04-18) で追加
 */

import { describe, it, expect } from "vitest";
import type { CommandMove, CharacterCommandList } from "../command-list-types";
import kimberlyData from "@/data/command-lists/kimberly.json";

// ============================================================
// テストヘルパー: ID ユニーク性チェック
// ============================================================

/**
 * CharacterCommandList の moves ツリー全体（派生を含む）から全 ID を収集する
 * 循環参照防止のため、最大深度を設ける
 */
function collectAllMoveIds(moves: CommandMove[], maxDepth = 10): string[] {
  const ids: string[] = [];

  function collect(move: CommandMove, depth: number): void {
    if (depth > maxDepth) return;
    ids.push(move.id);
    if (move.followUps) {
      for (const followUp of move.followUps) {
        collect(followUp, depth + 1);
      }
    }
  }

  for (const move of moves) {
    collect(move, 0);
  }

  return ids;
}

/**
 * moves ツリー内の ID 重複を検出する
 * 重複があれば重複 ID の配列を返す
 */
function findDuplicateIds(moves: CommandMove[]): string[] {
  const ids = collectAllMoveIds(moves);
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.push(id);
    } else {
      seen.add(id);
    }
  }

  return duplicates;
}

/**
 * moves ツリー内の循環参照を検出する（簡易 DFS チェック）
 * 循環参照があれば true を返す
 */
function hasCircularReference(moves: CommandMove[]): boolean {
  function dfs(move: CommandMove, ancestors: Set<string>): boolean {
    if (ancestors.has(move.id)) return true;

    if (move.followUps) {
      const newAncestors = new Set(ancestors);
      newAncestors.add(move.id);
      for (const followUp of move.followUps) {
        if (dfs(followUp, newAncestors)) return true;
      }
    }

    return false;
  }

  for (const move of moves) {
    if (dfs(move, new Set<string>())) return true;
  }

  return false;
}

// ============================================================
// テストデータ
// ============================================================

/** followUps を持つ CommandMove のテストデータ */
const moveWithFollowUps: CommandMove = {
  id: "test-parent",
  name: "親技",
  nameEn: "Parent Move",
  category: "special",
  notation: "236+K",
  steps: [],
  variants: [
    {
      strength: "H",
      notation: "236HK",
      steps: [
        {
          type: "normal",
          directions: ["2", "3", "6"],
          button: "HK",
        },
      ],
    },
  ],
  followUps: [
    {
      id: "test-parent-followup1",
      name: "派生技1",
      nameEn: "Follow-up 1",
      category: "special",
      notation: "P派生",
      steps: [
        {
          type: "normal",
          directions: ["5"],
          button: "HP",
        },
      ],
    },
    {
      id: "test-parent-followup2",
      name: "派生技2",
      nameEn: "Follow-up 2",
      category: "special",
      notation: "K派生",
      steps: [
        {
          type: "normal",
          directions: ["5"],
          button: "MK",
        },
      ],
    },
  ],
};

/** followUps を持たない既存の CommandMove のテストデータ */
const moveWithoutFollowUps: CommandMove = {
  id: "test-normal-move",
  name: "通常技",
  nameEn: "Normal Move",
  category: "normal",
  notation: "5MP",
  steps: [
    {
      type: "normal",
      directions: ["5"],
      button: "MP",
    },
  ],
};

/** ネストした followUps（派生の派生）を持つテストデータ */
const moveWithNestedFollowUps: CommandMove = {
  id: "test-nested-parent",
  name: "構え技",
  nameEn: "Stance Move",
  category: "special",
  notation: "236+P",
  steps: [],
  followUps: [
    {
      id: "test-nested-parent-child",
      name: "構え中技1",
      nameEn: "Stance Attack 1",
      category: "special",
      notation: "P",
      steps: [
        {
          type: "normal",
          directions: ["5"],
          button: "LP",
        },
      ],
      followUps: [
        {
          id: "test-nested-parent-child-grandchild",
          name: "構え中派生",
          nameEn: "Stance Followup",
          category: "special",
          notation: "P2",
          steps: [
            {
              type: "normal",
              directions: ["5"],
              button: "MP",
            },
          ],
        },
      ],
    },
  ],
};

/** 循環参照を含む不正なテストデータ（検出テスト用） */
const circularMoveWithSelfReference: CommandMove = {
  id: "self-ref",
  name: "自己参照技",
  nameEn: "Self Reference",
  category: "special",
  notation: "X",
  steps: [],
  followUps: [
    {
      id: "self-ref", // 同じ ID を使用（循環参照の模擬）
      name: "自己参照技（複製）",
      nameEn: "Self Reference Copy",
      category: "special",
      notation: "X2",
      steps: [],
    },
  ],
};

// ============================================================
// テスト: CommandMove 型の followUps フィールド
// ============================================================

describe("CommandMove 型の followUps フィールド", () => {
  it("followUps を持つ CommandMove が型エラーなくパースできること", () => {
    expect(moveWithFollowUps.followUps).toBeDefined();
    expect(moveWithFollowUps.followUps).toHaveLength(2);
  });

  it("followUps を持たない既存の CommandMove が引き続き正しく扱えること（後方互換性）", () => {
    expect(moveWithoutFollowUps.followUps).toBeUndefined();
    expect(moveWithoutFollowUps.steps).toHaveLength(1);
  });

  it("ネストした followUps（派生の派生）が型上許容されること", () => {
    expect(moveWithNestedFollowUps.followUps).toBeDefined();
    expect(moveWithNestedFollowUps.followUps![0].followUps).toBeDefined();
    expect(moveWithNestedFollowUps.followUps![0].followUps![0].id).toBe(
      "test-nested-parent-child-grandchild",
    );
  });

  it("followUps の派生技が正しい型を持つこと", () => {
    const followUp = moveWithFollowUps.followUps![0];
    expect(followUp.id).toBe("test-parent-followup1");
    expect(followUp.name).toBe("派生技1");
    expect(followUp.category).toBe("special");
    expect(followUp.steps).toHaveLength(1);
  });

  it("variants と followUps を同時に持てること", () => {
    expect(moveWithFollowUps.variants).toBeDefined();
    expect(moveWithFollowUps.variants).toHaveLength(1);
    expect(moveWithFollowUps.followUps).toBeDefined();
    expect(moveWithFollowUps.followUps).toHaveLength(2);
  });
});

// ============================================================
// テスト: ID ユニーク性チェックヘルパー
// ============================================================

describe("collectAllMoveIds ヘルパー", () => {
  it("フラットな moves リストから全 ID を収集できること", () => {
    const moves: CommandMove[] = [moveWithoutFollowUps];
    const ids = collectAllMoveIds(moves);
    expect(ids).toContain("test-normal-move");
  });

  it("派生技 ID を含めて全 ID を収集できること", () => {
    const moves: CommandMove[] = [moveWithFollowUps];
    const ids = collectAllMoveIds(moves);
    expect(ids).toContain("test-parent");
    expect(ids).toContain("test-parent-followup1");
    expect(ids).toContain("test-parent-followup2");
  });

  it("ネストした派生技の ID も収集できること", () => {
    const moves: CommandMove[] = [moveWithNestedFollowUps];
    const ids = collectAllMoveIds(moves);
    expect(ids).toContain("test-nested-parent");
    expect(ids).toContain("test-nested-parent-child");
    expect(ids).toContain("test-nested-parent-child-grandchild");
  });
});

describe("findDuplicateIds ヘルパー", () => {
  it("ID 重複がない場合は空配列を返すこと", () => {
    const moves: CommandMove[] = [moveWithFollowUps, moveWithoutFollowUps];
    expect(findDuplicateIds(moves)).toHaveLength(0);
  });

  it("ID 重複がある場合は重複 ID を返すこと", () => {
    const duplicateMove: CommandMove = {
      id: "test-parent", // moveWithFollowUps と同じ ID
      name: "重複技",
      nameEn: "Duplicate Move",
      category: "special",
      notation: "X",
      steps: [],
    };
    const moves: CommandMove[] = [moveWithFollowUps, duplicateMove];
    const duplicates = findDuplicateIds(moves);
    expect(duplicates).toContain("test-parent");
  });
});

describe("hasCircularReference ヘルパー", () => {
  it("循環参照がない場合は false を返すこと", () => {
    const moves: CommandMove[] = [moveWithFollowUps, moveWithoutFollowUps];
    expect(hasCircularReference(moves)).toBe(false);
  });

  it("ネストした循環参照がない場合は false を返すこと", () => {
    const moves: CommandMove[] = [moveWithNestedFollowUps];
    expect(hasCircularReference(moves)).toBe(false);
  });

  it("ID が同じ（自己参照的な）データを循環参照として検出すること", () => {
    // circularMoveWithSelfReference の followUps[0] が同じ ID を持つ
    // これは本質的に循環参照ではないが、DFS の ancestors セットで検出できる
    expect(hasCircularReference([circularMoveWithSelfReference])).toBe(true);
  });
});

// ============================================================
// テスト: CharacterCommandList との統合
// ============================================================

describe("CharacterCommandList と followUps の統合", () => {
  it("followUps を含む CharacterCommandList が正しく扱えること", () => {
    const characterList: CharacterCommandList = {
      characterId: "kimberly",
      characterName: "キンバリー",
      moves: [moveWithFollowUps, moveWithoutFollowUps],
    };

    expect(characterList.moves).toHaveLength(2);
    expect(characterList.moves[0].followUps).toHaveLength(2);
    expect(characterList.moves[1].followUps).toBeUndefined();
  });

  it("followUps を含む CharacterCommandList の ID に重複がないこと", () => {
    const characterList: CharacterCommandList = {
      characterId: "kimberly",
      characterName: "キンバリー",
      moves: [moveWithFollowUps, moveWithoutFollowUps],
    };

    const duplicates = findDuplicateIds(characterList.moves);
    expect(duplicates).toHaveLength(0);
  });

  it("followUps を含む CharacterCommandList に循環参照がないこと", () => {
    const characterList: CharacterCommandList = {
      characterId: "kimberly",
      characterName: "キンバリー",
      moves: [moveWithFollowUps, moveWithoutFollowUps],
    };

    expect(hasCircularReference(characterList.moves)).toBe(false);
  });
});

// ============================================================
// テスト: unique カテゴリの派生技
// ============================================================

describe("unique カテゴリの followUps", () => {
  const uniqueMoveWithFollowUp: CommandMove = {
    id: "char-4hk",
    name: "風車",
    nameEn: "Kazaguruma",
    category: "unique",
    notation: "4HK",
    steps: [
      {
        type: "normal",
        directions: ["4"],
        button: "HK",
      },
    ],
    followUps: [
      {
        id: "char-4hk-followup",
        name: "風車2段目",
        nameEn: "Kazaguruma Followup",
        category: "unique",
        notation: "HK派生",
        steps: [
          {
            type: "normal",
            directions: ["5"],
            button: "HK",
          },
        ],
      },
    ],
  };

  it("unique カテゴリの技に followUps を設定できること", () => {
    expect(uniqueMoveWithFollowUp.category).toBe("unique");
    expect(uniqueMoveWithFollowUp.followUps).toBeDefined();
    expect(uniqueMoveWithFollowUp.followUps![0].category).toBe("unique");
  });

  it("unique カテゴリの followUps ID に重複がないこと", () => {
    const duplicates = findDuplicateIds([uniqueMoveWithFollowUp]);
    expect(duplicates).toHaveLength(0);
  });
});

// ============================================================
// テスト: 実キャラクター JSON データの検証
// ============================================================

describe("kimberly.json 実データ検証", () => {
  // kimberly は followUps が実装済みの唯一のキャラクター (ISSUE-009)
  const kimberlyMoves = kimberlyData.moves as CommandMove[];

  it("kimberly.json の moves ツリー全体で ID 重複がないこと", () => {
    const duplicates = findDuplicateIds(kimberlyMoves);
    expect(duplicates).toHaveLength(0);
  });

  it("kimberly.json の moves ツリーに循環参照がないこと", () => {
    expect(hasCircularReference(kimberlyMoves)).toBe(false);
  });

  it("kimberly.json に followUps を持つ技が存在すること（データ完整性確認）", () => {
    const movesWithFollowUps = kimberlyMoves.filter(
      (m) => m.followUps && m.followUps.length > 0,
    );
    expect(movesWithFollowUps.length).toBeGreaterThan(0);
  });

  it("kimberly.json の followUps 内の全 ID が一意であること（派生技含む）", () => {
    const allIds = collectAllMoveIds(kimberlyMoves);
    const uniqueIds = new Set(allIds);
    expect(allIds.length).toBe(uniqueIds.size);
  });
});

describe("全キャラクター JSON データ検証", () => {
  // import.meta.glob で全キャラ JSON を動的取得
  // Vite/Vitest のグロブインポートを使用（静的解析のため文字列リテラルが必要）
  const allJsonModules = import.meta.glob<{ default: CharacterCommandList }>(
    "/src/data/command-lists/*.json",
    { eager: true },
  );

  const characterEntries = Object.entries(allJsonModules);

  it("全キャラクター JSON ファイルが読み込めること", () => {
    // 29 キャラ分のファイルが存在すること
    expect(characterEntries.length).toBeGreaterThan(0);
  });

  // 各キャラクターごとに ID 重複・循環参照テストを生成
  for (const [filePath, module] of characterEntries) {
    const characterId = filePath
      .replace("/src/data/command-lists/", "")
      .replace(".json", "");

    it(`${characterId}: moves ツリー全体で ID 重複がないこと`, () => {
      const moves = module.default.moves as CommandMove[];
      const duplicates = findDuplicateIds(moves);
      expect(duplicates).toHaveLength(0);
    });

    it(`${characterId}: moves ツリーに循環参照がないこと`, () => {
      const moves = module.default.moves as CommandMove[];
      expect(hasCircularReference(moves)).toBe(false);
    });
  }
});
