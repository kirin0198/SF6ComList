/// <reference types="vitest/globals" />
/**
 * CommandListPanel コンポーネントのテスト
 * ISSUE-009 (2026-04-18) で追加: 派生技（followUps）の表示・コネクター挿入テスト
 *
 * テスト方針:
 *   - loadCommandList をモックして同期的にテストデータを返す
 *   - userEvent.click でボタンクリックをシミュレートする
 *   - onMoveSelect コールバックの引数を検証する
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommandListPanel from "../CommandListPanel";
import type { CharacterCommandList } from "@/lib/combo/command-list-types";
import type { ComboStep } from "@/lib/combo/types";

// ============================================================
// loadCommandList のモック設定
// ============================================================

vi.mock("@/lib/combo/command-list-types", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/combo/command-list-types")>();
  return {
    ...original,
    loadCommandList: vi.fn(),
  };
});

import { loadCommandList } from "@/lib/combo/command-list-types";

const mockedLoadCommandList = vi.mocked(loadCommandList);

// ============================================================
// テストデータ
// ============================================================

/**
 * special カテゴリの親技（variants + followUps を両方持つ）
 * 疾駆け相当のテストデータ
 */
const specialMoveWithVariantsAndFollowUps: CharacterCommandList = {
  characterId: "test-char",
  characterName: "テストキャラ",
  moves: [
    {
      id: "test-shikkuke",
      name: "疾駆け",
      nameEn: "Shikkuke",
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
          id: "test-shikkuke-bushin-shoha",
          name: "武神翔霸",
          nameEn: "Bushin Shoha",
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
          id: "test-shikkuke-stop",
          name: "急停止",
          nameEn: "Shikkuke Stop",
          category: "special",
          notation: "K (停止)",
          steps: [
            {
              type: "normal",
              directions: ["5"],
              button: "LK",
            },
          ],
        },
      ],
    },
  ],
};

/**
 * unique カテゴリの親技（followUps のみ、variants なし）
 * 風車相当のテストデータ
 */
const uniqueMoveWithFollowUpOnly: CharacterCommandList = {
  characterId: "test-char",
  characterName: "テストキャラ",
  moves: [
    {
      id: "test-4hk",
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
          id: "test-4hk-followup",
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
    },
  ],
};

/**
 * variants のみ持つ技（followUps なし）
 */
const moveWithVariantsOnly: CharacterCommandList = {
  characterId: "test-char",
  characterName: "テストキャラ",
  moves: [
    {
      id: "test-hadoken",
      name: "波動拳",
      nameEn: "Hadoken",
      category: "special",
      notation: "236+P",
      steps: [],
      variants: [
        {
          strength: "H",
          notation: "236HP",
          steps: [
            {
              type: "normal",
              directions: ["2", "3", "6"],
              button: "HP",
            },
          ],
        },
      ],
    },
  ],
};

/**
 * 派生技自身が variants を持つケース
 */
const moveWithFollowUpHavingVariants: CharacterCommandList = {
  characterId: "test-char",
  characterName: "テストキャラ",
  moves: [
    {
      id: "test-parent",
      name: "親技",
      nameEn: "Parent Move",
      category: "special",
      notation: "236+K",
      steps: [],
      followUps: [
        {
          id: "test-parent-followup-with-variants",
          name: "派生（強度あり）",
          nameEn: "Follow-up with Variants",
          category: "special",
          notation: "P派生",
          steps: [],
          variants: [
            {
              strength: "L",
              notation: "LP派生",
              steps: [
                {
                  type: "normal",
                  directions: ["5"],
                  button: "LP",
                },
              ],
            },
            {
              strength: "H",
              notation: "HP派生",
              steps: [
                {
                  type: "normal",
                  directions: ["5"],
                  button: "HP",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================
// テストヘルパー
// ============================================================

/** デフォルトの Props */
const defaultProps = {
  characterId: "test-char",
  committedSteps: [] as ComboStep[],
  onMoveSelect: vi.fn(),
  onConnectorSelect: vi.fn(),
  onUndo: vi.fn(),
  onReset: vi.fn(),
};

/** CommandListPanel をレンダリングしてコマンドリスト読み込み完了まで待つ */
async function renderAndWait(props = defaultProps) {
  const result = render(<CommandListPanel {...props} />);
  // ローディングが完了するまで待つ
  await waitFor(() => {
    expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
  });
  return result;
}

// ============================================================
// テスト: コマンドリスト未登録キャラクター
// ============================================================

describe("コマンドリスト未登録状態", () => {
  beforeEach(() => {
    mockedLoadCommandList.mockResolvedValue(null);
  });

  it("未登録メッセージが表示されること", async () => {
    await renderAndWait();
    expect(
      screen.getByText(
        "このキャラクターのコマンドリストはまだ登録されていません。",
      ),
    ).toBeInTheDocument();
  });
});

// ============================================================
// テスト: ローディング状態
// ============================================================

describe("ローディング状態", () => {
  it("ローディングスピナーが表示されること", () => {
    // resolve されない Promise を返してローディング状態を維持する
    mockedLoadCommandList.mockImplementation(
      () => new Promise(() => undefined),
    );

    render(<CommandListPanel {...defaultProps} />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });
});

// ============================================================
// テスト: special カテゴリの followUps 表示
// ============================================================

describe("special カテゴリの followUps 表示", () => {
  beforeEach(() => {
    mockedLoadCommandList.mockResolvedValue(
      specialMoveWithVariantsAndFollowUps,
    );
  });

  it("special 親技ボタンが表示されること", async () => {
    await renderAndWait();
    expect(screen.getByText("疾駆け")).toBeInTheDocument();
  });

  it("親技をクリックすると展開されること（variants + followUps 両方を持つ場合）", async () => {
    await renderAndWait();

    const parentButton = screen.getByRole("button", { name: /疾駆け/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    // 強度バリアント行が表示されること
    expect(
      screen.getByRole("button", { name: /疾駆け 強/ }),
    ).toBeInTheDocument();
    // 派生セクションのラベルが表示されること
    expect(screen.getByText("派生:")).toBeInTheDocument();
    // 派生技ボタンが表示されること
    expect(screen.getByText("武神翔霸")).toBeInTheDocument();
    expect(screen.getByText("急停止")).toBeInTheDocument();
  });

  it("展開後に variants と followUps が両方表示されること", async () => {
    await renderAndWait();

    const parentButton = screen.getByRole("button", { name: /疾駆け/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    // variants ボタン（強）
    expect(
      screen.getByRole("button", { name: /疾駆け 強/ }),
    ).toBeInTheDocument();
    // followUps ラベル
    expect(screen.getByText("派生:")).toBeInTheDocument();
    // followUps ボタン
    expect(screen.getByText("武神翔霸")).toBeInTheDocument();
  });
});

// ============================================================
// テスト: unique カテゴリの followUps 表示
// ============================================================

describe("unique カテゴリの followUps 表示", () => {
  beforeEach(() => {
    mockedLoadCommandList.mockResolvedValue(uniqueMoveWithFollowUpOnly);
  });

  it("unique 親技ボタンが表示されること", async () => {
    await renderAndWait();
    expect(screen.getByText("風車")).toBeInTheDocument();
  });

  it("unique 親技をクリックすると派生セクションのみ表示されること（variants なし）", async () => {
    await renderAndWait();

    const parentButton = screen.getByRole("button", { name: /風車/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    // 派生ラベルが表示されること
    expect(screen.getByText("派生:")).toBeInTheDocument();
    // 派生技ボタンが表示されること
    expect(screen.getByText("風車2段目")).toBeInTheDocument();
    // 強度バリアントボタンは表示されないこと
    expect(
      screen.queryByRole("button", { name: /風車 弱/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /風車 中/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /風車 強/ }),
    ).not.toBeInTheDocument();
  });
});

// ============================================================
// テスト: 派生技クリックでのコネクター自動挿入
// ============================================================

describe("派生技クリックでのコネクター自動挿入", () => {
  it("親技選択直後の派生クリックで ~ が自動挿入されること（空シーケンス → 親技 → 派生）", async () => {
    // 親技選択後にシーケンスが更新されることを前提とした段階的なテスト
    const onMoveSelect = vi.fn();
    mockedLoadCommandList.mockResolvedValue(
      specialMoveWithVariantsAndFollowUps,
    );

    // 1 段階目: committedSteps が空の状態
    const { rerender } = render(
      <CommandListPanel
        {...defaultProps}
        committedSteps={[]}
        onMoveSelect={onMoveSelect}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
    });

    // 親技を展開
    const parentButton = screen.getByRole("button", { name: /疾駆け/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    // 強度バリアント「強」を選択（親技 ID として記録される）
    const strongButton = screen.getByRole("button", { name: /疾駆け 強/ });
    await act(async () => {
      await userEvent.click(strongButton);
    });

    // onMoveSelect が呼ばれること（コネクターなし、空シーケンスのため）
    expect(onMoveSelect).toHaveBeenCalledWith([
      { type: "normal", directions: ["2", "3", "6"], button: "HK" },
    ]);

    // 2 段階目: committedSteps に親技のステップが追加された状態を模擬
    const committedStepsAfterParent: ComboStep[] = [
      { type: "normal", directions: ["2", "3", "6"], button: "HK" },
    ];

    onMoveSelect.mockClear();

    rerender(
      <CommandListPanel
        {...defaultProps}
        committedSteps={committedStepsAfterParent}
        onMoveSelect={onMoveSelect}
      />,
    );

    // 再度展開して派生技をクリック
    const parentButton2 = screen.getByRole("button", { name: /疾駆け/ });
    await act(async () => {
      await userEvent.click(parentButton2);
    });

    // 派生技「武神翔霸」をクリック
    const followUpButton = screen.getByText("武神翔霸");
    await act(async () => {
      await userEvent.click(followUpButton);
    });

    // ~ コネクターが挿入されること
    const callArg = onMoveSelect.mock.calls[0][0] as ComboStep[];
    expect(callArg[0]).toEqual({ type: "connector", symbol: "~" });
    expect(callArg[1]).toEqual({
      type: "normal",
      directions: ["5"],
      button: "HP",
    });
  });

  it("親技以外を経由した後に派生クリックすると > コネクターが挿入されること", async () => {
    const onMoveSelect = vi.fn();
    mockedLoadCommandList.mockResolvedValue(
      specialMoveWithVariantsAndFollowUps,
    );

    // 別の技が最後に選択されたシナリオ: lastSelectedMoveId が親ID でない
    // committedSteps に何かあり、lastSelectedMoveId が初期値 null の状態
    const committedSteps: ComboStep[] = [
      { type: "normal", directions: ["5"], button: "MP" },
    ];

    render(
      <CommandListPanel
        {...defaultProps}
        committedSteps={committedSteps}
        onMoveSelect={onMoveSelect}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
    });

    // 親技を展開
    const parentButton = screen.getByRole("button", { name: /疾駆け/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    // 派生技「武神翔霸」をクリック（親技選択なしで直接派生をクリック）
    const followUpButton = screen.getByText("武神翔霸");
    await act(async () => {
      await userEvent.click(followUpButton);
    });

    // > コネクターが挿入されること（親技直後でないため）
    const callArg = onMoveSelect.mock.calls[0][0] as ComboStep[];
    expect(callArg[0]).toEqual({ type: "connector", symbol: ">" });
  });
});

// ============================================================
// テスト: variants と followUps を両方持つ親技の展開挙動
// ============================================================

describe("variants と followUps を両方持つ親技の展開", () => {
  beforeEach(() => {
    mockedLoadCommandList.mockResolvedValue(
      specialMoveWithVariantsAndFollowUps,
    );
  });

  it("展開時に強度バリアント行と派生セクションの両方が表示されること", async () => {
    await renderAndWait();

    const parentButton = screen.getByRole("button", { name: /疾駆け/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    // 強度バリアント行
    expect(
      screen.getByRole("button", { name: /疾駆け 強/ }),
    ).toBeInTheDocument();
    // 派生セクション
    expect(screen.getByText("派生:")).toBeInTheDocument();
    expect(screen.getByText("武神翔霸")).toBeInTheDocument();
  });

  it("折りたたむと両方のセクションが非表示になること", async () => {
    await renderAndWait();

    const parentButton = screen.getByRole("button", { name: /疾駆け/ });
    // 展開
    await act(async () => {
      await userEvent.click(parentButton);
    });
    expect(screen.getByText("派生:")).toBeInTheDocument();

    // 再クリックで折りたたむ
    await act(async () => {
      await userEvent.click(parentButton);
    });
    expect(screen.queryByText("派生:")).not.toBeInTheDocument();
  });
});

// ============================================================
// テスト: 派生技自身が variants を持つ場合の再帰展開
// ============================================================

describe("派生技自身が variants を持つ場合の再帰展開", () => {
  beforeEach(() => {
    mockedLoadCommandList.mockResolvedValue(moveWithFollowUpHavingVariants);
  });

  it("派生技自身の展開ボタンをクリックするとバリアントが表示されること", async () => {
    await renderAndWait();

    // 親技を展開
    const parentButton = screen.getByRole("button", { name: /親技/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    // 派生技が表示されること
    expect(screen.getByText("派生（強度あり）")).toBeInTheDocument();

    // 派生技をクリックするとバリアントが展開されること
    const followUpButton = screen.getByText("派生（強度あり）");
    await act(async () => {
      await userEvent.click(followUpButton);
    });

    // 派生技の variants（弱/強）が表示されること
    // aria-label を持つボタンで検索
    const weakButton = screen.queryByRole("button", {
      name: /派生（強度あり） 弱/,
    });
    const strongButton = screen.queryByRole("button", {
      name: /派生（強度あり） 強/,
    });
    expect(weakButton).toBeInTheDocument();
    expect(strongButton).toBeInTheDocument();
  });

  it("派生技のバリアントをクリックすると ~ コネクターが挿入されること", async () => {
    const onMoveSelect = vi.fn();
    mockedLoadCommandList.mockResolvedValue(moveWithFollowUpHavingVariants);

    const committedStepsAfterParent: ComboStep[] = [
      { type: "normal", directions: ["5"], button: "LP" },
    ];

    render(
      <CommandListPanel
        {...defaultProps}
        committedSteps={committedStepsAfterParent}
        onMoveSelect={onMoveSelect}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
    });

    // 親技を展開
    const parentButton = screen.getByRole("button", { name: /親技/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    // 派生技をクリックして展開
    const followUpButton = screen.getByText("派生（強度あり）");
    await act(async () => {
      await userEvent.click(followUpButton);
    });

    // バリアント「強」をクリック
    const strongVariantButton = screen.getByRole("button", {
      name: /派生（強度あり） 強/,
    });
    await act(async () => {
      await userEvent.click(strongVariantButton);
    });

    // > コネクターが挿入されること（親技直後でないため）
    const callArg = onMoveSelect.mock.calls[0][0] as ComboStep[];
    expect(callArg[0]).toEqual({ type: "connector", symbol: ">" });
  });
});

// ============================================================
// テスト: variants のみの技（followUps なし）の挙動が維持されること
// ============================================================

describe("variants のみの技の挙動維持", () => {
  beforeEach(() => {
    mockedLoadCommandList.mockResolvedValue(moveWithVariantsOnly);
  });

  it("派生ラベルが表示されないこと", async () => {
    await renderAndWait();

    const parentButton = screen.getByRole("button", { name: /波動拳/ });
    await act(async () => {
      await userEvent.click(parentButton);
    });

    expect(screen.queryByText("派生:")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /波動拳 強/ }),
    ).toBeInTheDocument();
  });
});
