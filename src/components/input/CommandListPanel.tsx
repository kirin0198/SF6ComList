"use client";

/**
 * CommandListPanel コンポーネント
 * キャラクター固有のコマンドリストを表示し、技のクリックでコンボを組み立てる
 * ISSUE-001 (2026-04-12) で追加
 * ISSUE-009 (2026-04-18) で派生技（followUps）対応を追加
 *
 * 設計方針:
 *   - characterId が変わったタイミングで loadCommandList() を呼び出す
 *   - 読み込み中はローディングスピナーを表示する
 *   - コマンドリストがない（null）キャラクターには未登録メッセージを表示する
 *   - 技クリック時はコネクター自動挿入ロジックを適用する
 *   - variants または followUps を持つ技は展開可能（カテゴリに依存しない）
 *   - 派生技クリック直前に親技を選択していた場合は "~" コネクターを自動挿入する
 *
 * 展開状態管理（ISSUE-009 更新）:
 *   expandedPath: string[] でパスベースの展開状態を管理する。
 *   - expandedPath = [] → 全て折りたたみ
 *   - expandedPath = ["parentId"] → 親技を展開
 *   - expandedPath = ["parentId", "followUpId"] → 親技 + 派生技を展開
 *   ISSUE-009 スコープでは 1 段階の派生のみ実データがあるが、
 *   将来 2 段以上の派生（派生の派生）が必要な場合もこの構造で対応可能。
 */

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import ConnectorSelector from "@/components/input/ConnectorSelector";
import Button from "@/components/ui/Button";
import {
  loadCommandList,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/lib/combo/command-list-types";
import type {
  CharacterCommandList,
  CommandMove,
  StrengthVariant,
} from "@/lib/combo/command-list-types";
import type { ComboStep, ConnectorStep } from "@/lib/combo/types";

// ============================================================
// Props
// ============================================================

interface CommandListPanelProps {
  /** キャラクターID（コマンドリストの読み込みに使用） */
  characterId: string;
  /** 現在の確定済みステップ（コネクター自動挿入判定に使用） */
  committedSteps: ComboStep[];
  /** 技選択時のコールバック（コネクター自動挿入済みのステップ配列を渡す） */
  onMoveSelect: (steps: ComboStep[]) => void;
  /** コネクター選択時のコールバック */
  onConnectorSelect: (symbol: ConnectorStep["symbol"]) => void;
  /** 元に戻すコールバック */
  onUndo: () => void;
  /** リセットコールバック */
  onReset: () => void;
  className?: string;
}

// ============================================================
// CommandListPanel コンポーネント
// ============================================================

/**
 * CommandListPanel コンポーネント
 * キャラクター別コマンドリストを表示して技を選択する入力パネル
 */
export default function CommandListPanel({
  characterId,
  committedSteps,
  onMoveSelect,
  onConnectorSelect,
  onUndo,
  onReset,
  className = "",
}: CommandListPanelProps) {
  /** コマンドリスト読み込み状態の型 */
  type LoadState =
    | { status: "loading" }
    | { status: "error" }
    | { status: "loaded"; data: CharacterCommandList | null };

  // コマンドリストの読み込み状態（loading / error / loaded）
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  // クリックフィードバック中の技ID
  const [activeMoveId, setActiveMoveId] = useState<string | null>(null);
  // 展開パス（パスベースの展開状態管理）
  // - [] = 全て折りたたみ
  // - ["parentId"] = 親技を展開
  // - ["parentId", "followUpId"] = 親技 + 派生技を展開
  const [expandedPath, setExpandedPath] = useState<string[]>([]);
  // 直近に選択された親技 ID（派生コネクター "~" 挿入判定用）
  // ISSUE-009 追加: 親技選択直後に派生をクリックした場合 "~" を自動挿入する
  const [lastSelectedMoveId, setLastSelectedMoveId] = useState<string | null>(
    null,
  );

  // characterId が変わったタイミングでコマンドリストを読み込む
  useEffect(() => {
    let cancelled = false;

    // 非同期処理で読み込み（すべての setState は非同期コールバック内で実行する）
    const fetchCommandList = async () => {
      // 読み込み開始: ローディング状態に遷移
      if (!cancelled) {
        setLoadState({ status: "loading" });
        setExpandedPath([]);
        setLastSelectedMoveId(null);
      }

      try {
        const list = await loadCommandList(characterId);
        if (!cancelled) {
          setLoadState({ status: "loaded", data: list });
        }
      } catch {
        if (!cancelled) {
          setLoadState({ status: "error" });
        }
      }
    };

    void fetchCommandList();

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  /**
   * コネクター自動挿入を適用してステップ配列を返すヘルパー（通常技用）
   * ARCHITECTURE.md セクション 15.4「コネクター自動挿入ロジック」に準拠
   */
  const buildStepsWithConnector = useCallback(
    (steps: ComboStep[]): ComboStep[] => {
      const lastStep = committedSteps[committedSteps.length - 1];

      if (committedSteps.length === 0) {
        return steps;
      } else if (lastStep && lastStep.type === "connector") {
        return steps;
      } else {
        return [{ type: "connector", symbol: ">" } as ConnectorStep, ...steps];
      }
    },
    [committedSteps],
  );

  /**
   * 派生コネクター自動挿入を適用してステップ配列を返すヘルパー
   * ARCHITECTURE.md セクション 15.5.3「コネクター自動挿入ルール」に準拠
   *
   * 派生技クリック かつ 直前に親技が選択されていた場合: "~" を挿入
   * それ以外: 通常ルール（">" または挿入なし）
   */
  const buildFollowUpStepsWithConnector = useCallback(
    (steps: ComboStep[], parentId: string): ComboStep[] => {
      const lastStep = committedSteps[committedSteps.length - 1];

      if (committedSteps.length === 0) {
        return steps;
      } else if (lastStep && lastStep.type === "connector") {
        return steps;
      } else if (lastSelectedMoveId === parentId) {
        // 派生コネクター: 直前に親技が選択されていた場合 "~" を挿入
        return [{ type: "connector", symbol: "~" } as ConnectorStep, ...steps];
      } else {
        return [{ type: "connector", symbol: ">" } as ConnectorStep, ...steps];
      }
    },
    [committedSteps, lastSelectedMoveId],
  );

  /**
   * 技がクリックされたときのハンドラー
   * variants または followUps がある技: 展開/折りたたみをトグルする
   * それ以外の技: 即座にコンボへ追加する
   */
  const handleMoveClick = useCallback(
    (move: CommandMove) => {
      const hasVariants = move.variants && move.variants.length > 0;
      const hasFollowUps = move.followUps && move.followUps.length > 0;

      if (hasVariants || hasFollowUps) {
        // 展開可能技: 展開トグル（既に展開中なら折りたたむ）
        setExpandedPath((prev) => {
          if (prev[0] === move.id) {
            return []; // 折りたたみ
          }
          return [move.id]; // 展開
        });
        return;
      }

      // 単純技: 即座にコンボへ追加
      const stepsToAdd = buildStepsWithConnector(move.steps);
      onMoveSelect(stepsToAdd);

      setLastSelectedMoveId(move.id);
      setActiveMoveId(move.id);
      setTimeout(() => setActiveMoveId(null), 200);
    },
    [buildStepsWithConnector, onMoveSelect],
  );

  /**
   * 強度バリアントが選択されたときのハンドラー
   * 選択後に展開を閉じる
   * ISSUE-009: lastSelectedMoveId に親技の ID を記録する（派生コネクター判定用）
   */
  const handleVariantClick = useCallback(
    (move: CommandMove, variant: StrengthVariant) => {
      const stepsToAdd = buildStepsWithConnector(variant.steps);
      onMoveSelect(stepsToAdd);

      // 親技 ID を記録（バリアント選択直後の派生クリックで "~" を挿入するため）
      setLastSelectedMoveId(move.id);
      // 展開を閉じてフィードバック表示
      setExpandedPath([]);
      setActiveMoveId(move.id);
      setTimeout(() => setActiveMoveId(null), 200);
    },
    [buildStepsWithConnector, onMoveSelect],
  );

  /**
   * 派生技がクリックされたときのハンドラー
   * ISSUE-009: 親技直後の派生選択で "~" を自動挿入する
   */
  const handleFollowUpClick = useCallback(
    (followUp: CommandMove, parentMove: CommandMove) => {
      const hasVariants = followUp.variants && followUp.variants.length > 0;
      const hasFollowUps = followUp.followUps && followUp.followUps.length > 0;

      if (hasVariants || hasFollowUps) {
        // 派生技自身が展開可能: 展開パスに追加（親技 + 派生技のパス）
        setExpandedPath((prev) => {
          const parentId = parentMove.id;
          // 既に同じパスで展開中なら折りたたむ
          if (prev[0] === parentId && prev[1] === followUp.id) {
            return [parentId]; // 派生技のみ折りたたみ（親技は展開を維持）
          }
          return [parentId, followUp.id]; // 親技 + 派生技を展開
        });
        return;
      }

      // 派生コネクター自動挿入（親技直後 → "~"、それ以外 → ">"）
      const stepsToAdd = buildFollowUpStepsWithConnector(
        followUp.steps,
        parentMove.id,
      );
      onMoveSelect(stepsToAdd);

      // 派生技 ID を記録（さらに次の派生に備える）
      setLastSelectedMoveId(followUp.id);
      setActiveMoveId(followUp.id);
      setTimeout(() => setActiveMoveId(null), 200);
    },
    [buildFollowUpStepsWithConnector, onMoveSelect],
  );

  /**
   * 派生技のバリアントがクリックされたときのハンドラー
   * ISSUE-009: 派生技自身がバリアントを持つ場合に対応
   */
  const handleFollowUpVariantClick = useCallback(
    (
      followUp: CommandMove,
      variant: StrengthVariant,
      parentMove: CommandMove,
    ) => {
      // 派生コネクター自動挿入（親技直後 → "~"、それ以外 → ">"）
      const stepsToAdd = buildFollowUpStepsWithConnector(
        variant.steps,
        parentMove.id,
      );
      onMoveSelect(stepsToAdd);

      // 派生技 ID を記録（さらに次の派生に備える）
      setLastSelectedMoveId(followUp.id);
      setExpandedPath([]);
      setActiveMoveId(followUp.id);
      setTimeout(() => setActiveMoveId(null), 200);
    },
    [buildFollowUpStepsWithConnector, onMoveSelect],
  );

  const hasContent = committedSteps.length > 0;

  // ============================================================
  // ローディング状態
  // ============================================================

  if (loadState.status === "loading") {
    return (
      <div
        className={`flex items-center justify-center py-8 ${className}`}
        aria-label="コマンドリスト読み込み中"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-cyan-500" />
        <span className="ml-2 text-sm text-gray-400">読み込み中...</span>
      </div>
    );
  }

  // ============================================================
  // エラー状態
  // ============================================================

  if (loadState.status === "error") {
    return (
      <div
        className={`rounded-lg border border-red-700 bg-red-900/20 p-4 ${className}`}
      >
        <p className="text-sm text-red-300">
          コマンドリストの読み込みに失敗しました。
        </p>
      </div>
    );
  }

  // ============================================================
  // コマンドリスト未登録状態
  // ============================================================

  if (loadState.data === null) {
    return (
      <div
        className={`rounded-lg border border-gray-700 bg-gray-800/50 p-6 text-center ${className}`}
      >
        <p className="mb-2 text-sm text-gray-400">
          このキャラクターのコマンドリストはまだ登録されていません。
        </p>
        <p className="text-xs text-gray-500">
          ビジュアル入力またはテキスト入力でコンボを作成してください。
        </p>
      </div>
    );
  }

  // ============================================================
  // コマンドリスト表示
  // ============================================================

  const commandList = loadState.data;

  // カテゴリ別に技をグループ化する
  const movesByCategory = CATEGORY_ORDER.reduce<
    Partial<Record<string, CommandMove[]>>
  >((acc, category) => {
    const moves = commandList.moves.filter((m) => m.category === category);
    if (moves.length > 0) {
      acc[category] = moves;
    }
    return acc;
  }, {});

  return (
    <div
      className={`space-y-4 ${className}`}
      aria-label="コマンドリスト入力エリア"
    >
      {/* カテゴリ別技リスト */}
      <div className="space-y-4">
        {CATEGORY_ORDER.map((category) => {
          const moves = movesByCategory[category];
          if (!moves || moves.length === 0) return null;

          return (
            <div key={category}>
              {/* カテゴリ見出し */}
              <h3 className="mb-2 border-b border-gray-700 pb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                {CATEGORY_LABELS[category]}
              </h3>

              {/* 技ボタングリッド */}
              <div className="flex flex-wrap gap-2">
                {moves.map((move) => {
                  const hasVariants = move.variants && move.variants.length > 0;
                  const hasFollowUps =
                    move.followUps && move.followUps.length > 0;
                  const isExpandable = hasVariants || hasFollowUps;
                  const isExpanded = expandedPath[0] === move.id;

                  return (
                    <div key={move.id} className="flex flex-col gap-1">
                      {/* 親技ボタン */}
                      <button
                        type="button"
                        onClick={() => handleMoveClick(move)}
                        className={[
                          "flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm transition-colors duration-150",
                          "focus:ring-1 focus:ring-cyan-500 focus:outline-none",
                          isExpanded
                            ? "border-cyan-400 bg-gray-600"
                            : activeMoveId === move.id
                              ? "border-cyan-500 bg-gray-600"
                              : "border-gray-600 bg-gray-700 hover:bg-gray-600",
                        ].join(" ")}
                        aria-label={`${move.name}（${move.notation}）`}
                        aria-expanded={isExpandable ? isExpanded : undefined}
                      >
                        {/* テンキー表記 */}
                        <span className="font-mono text-xs text-gray-400">
                          {move.notation}
                        </span>
                        {/* 技名 */}
                        <span className="text-sm text-white">{move.name}</span>
                        {/* 展開インジケーター（variants または followUps がある場合） */}
                        {isExpandable && (
                          <span className="text-xs text-gray-500">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        )}
                      </button>

                      {/* 展開エリア（variants または followUps がある場合） */}
                      {isExpandable && isExpanded && (
                        <div className="flex flex-col gap-1 pl-1">
                          {/* 強度バリアントボタン行（variants がある場合のみ） */}
                          {hasVariants && (
                            <div className="flex gap-1">
                              {move.variants!.map((variant) => (
                                <button
                                  key={variant.strength}
                                  type="button"
                                  onClick={() =>
                                    handleVariantClick(move, variant)
                                  }
                                  className={[
                                    "rounded border px-2 py-1 text-xs font-semibold transition-colors duration-150",
                                    "focus:ring-1 focus:ring-cyan-500 focus:outline-none",
                                    variant.strength === "L"
                                      ? "border-blue-600 bg-blue-900/40 text-blue-300 hover:bg-blue-800/60"
                                      : variant.strength === "M"
                                        ? "border-yellow-600 bg-yellow-900/40 text-yellow-300 hover:bg-yellow-800/60"
                                        : variant.strength === "H"
                                          ? "border-red-600 bg-red-900/40 text-red-300 hover:bg-red-800/60"
                                          : "border-green-600 bg-green-900/40 text-green-300 hover:bg-green-800/60",
                                  ].join(" ")}
                                  aria-label={`${move.name} ${variant.strength === "L" ? "弱" : variant.strength === "M" ? "中" : variant.strength === "H" ? "強" : "OD"}（${variant.notation}）`}
                                >
                                  {variant.strength === "L"
                                    ? "弱"
                                    : variant.strength === "M"
                                      ? "中"
                                      : variant.strength === "H"
                                        ? "強"
                                        : "OD"}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 派生技セクション（followUps がある場合のみ）
                           * カテゴリに依存せず表示（ARCHITECTURE.md 15.5 参照）
                           */}
                          {hasFollowUps && (
                            <div className="flex flex-wrap items-center gap-1">
                              {/* 派生ラベル */}
                              <span className="text-xs font-semibold text-purple-300">
                                派生:
                              </span>
                              {/* 派生技ボタン */}
                              {move.followUps!.map((followUp) => {
                                const followUpHasVariants =
                                  followUp.variants &&
                                  followUp.variants.length > 0;
                                const followUpHasFollowUps =
                                  followUp.followUps &&
                                  followUp.followUps.length > 0;
                                const followUpIsExpandable =
                                  followUpHasVariants || followUpHasFollowUps;
                                // 派生技の展開状態: expandedPath[1] で判定
                                const followUpIsExpanded =
                                  expandedPath[0] === move.id &&
                                  expandedPath[1] === followUp.id;

                                return (
                                  <div
                                    key={followUp.id}
                                    className="flex flex-col gap-1"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleFollowUpClick(followUp, move)
                                      }
                                      className={[
                                        "flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors duration-150",
                                        "focus:ring-1 focus:ring-purple-500 focus:outline-none",
                                        followUpIsExpanded
                                          ? "border-purple-500 bg-purple-800/60"
                                          : activeMoveId === followUp.id
                                            ? "border-purple-500 bg-purple-800/60"
                                            : "border-purple-700 bg-purple-900/40 hover:bg-purple-800/60",
                                      ].join(" ")}
                                      aria-label={`${move.name} 派生: ${followUp.name}（${followUp.notation}）`}
                                      aria-expanded={
                                        followUpIsExpandable
                                          ? followUpIsExpanded
                                          : undefined
                                      }
                                    >
                                      <span className="font-mono text-xs text-purple-300">
                                        {followUp.notation}
                                      </span>
                                      <span className="text-purple-100">
                                        {followUp.name}
                                      </span>
                                      {followUpIsExpandable && (
                                        <span className="text-xs text-purple-400">
                                          {followUpIsExpanded ? "▲" : "▼"}
                                        </span>
                                      )}
                                    </button>

                                    {/* 派生技の強度バリアント（派生技自身が variants を持つ場合） */}
                                    {followUpIsExpandable &&
                                      followUpIsExpanded &&
                                      followUpHasVariants && (
                                        <div className="flex gap-1 pl-1">
                                          {followUp.variants!.map((variant) => (
                                            <button
                                              key={variant.strength}
                                              type="button"
                                              onClick={() =>
                                                handleFollowUpVariantClick(
                                                  followUp,
                                                  variant,
                                                  move,
                                                )
                                              }
                                              className={[
                                                "rounded border px-2 py-1 text-xs font-semibold transition-colors duration-150",
                                                "focus:ring-1 focus:ring-purple-500 focus:outline-none",
                                                variant.strength === "L"
                                                  ? "border-blue-600 bg-blue-900/40 text-blue-300 hover:bg-blue-800/60"
                                                  : variant.strength === "M"
                                                    ? "border-yellow-600 bg-yellow-900/40 text-yellow-300 hover:bg-yellow-800/60"
                                                    : variant.strength === "H"
                                                      ? "border-red-600 bg-red-900/40 text-red-300 hover:bg-red-800/60"
                                                      : "border-green-600 bg-green-900/40 text-green-300 hover:bg-green-800/60",
                                              ].join(" ")}
                                              aria-label={`${move.name} 派生: ${followUp.name} ${variant.strength === "L" ? "弱" : variant.strength === "M" ? "中" : variant.strength === "H" ? "強" : "OD"}（${variant.notation}）`}
                                            >
                                              {variant.strength === "L"
                                                ? "弱"
                                                : variant.strength === "M"
                                                  ? "中"
                                                  : variant.strength === "H"
                                                    ? "強"
                                                    : "OD"}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* コネクターセレクター */}
      <div className="border-t border-gray-700 pt-3">
        <ConnectorSelector onSelect={onConnectorSelect} />
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2 border-t border-gray-700 pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Undo2 size={14} />}
          onClick={onUndo}
          disabled={!hasContent}
        >
          元に戻す
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<RotateCcw size={14} />}
          onClick={onReset}
          disabled={!hasContent}
        >
          リセット
        </Button>
      </div>
    </div>
  );
}
