"use client";

/**
 * CommandListPanel コンポーネント
 * キャラクター固有のコマンドリストを表示し、技のクリックでコンボを組み立てる
 * ISSUE-001 (2026-04-12) で追加
 *
 * 設計方針:
 *   - characterId が変わったタイミングで loadCommandList() を呼び出す
 *   - 読み込み中はローディングスピナーを表示する
 *   - コマンドリストがない（null）キャラクターには未登録メッセージを表示する
 *   - 技クリック時はコネクター自動挿入ロジックを適用する
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
// クリックフィードバック用の技IDセット
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
  // 強度バリアント展開中の技ID（必殺技クリック時に弱/中/強を表示する）
  const [expandedMoveId, setExpandedMoveId] = useState<string | null>(null);

  // characterId が変わったタイミングでコマンドリストを読み込む
  useEffect(() => {
    let cancelled = false;

    // 非同期処理で読み込み（すべての setState は非同期コールバック内で実行する）
    const fetchCommandList = async () => {
      // 読み込み開始: ローディング状態に遷移
      if (!cancelled) {
        setLoadState({ status: "loading" });
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
   * コネクター自動挿入を適用してステップ配列を返すヘルパー
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
   * 技がクリックされたときのハンドラー
   * バリアントがある技: 展開/折りたたみをトグルする
   * バリアントがない技: 即座にコンボへ追加する
   */
  const handleMoveClick = useCallback(
    (move: CommandMove) => {
      if (move.variants && move.variants.length > 0) {
        // バリアントあり: 展開トグル
        setExpandedMoveId((prev) => (prev === move.id ? null : move.id));
        return;
      }

      // バリアントなし: 即座に追加
      const stepsToAdd = buildStepsWithConnector(move.steps);
      onMoveSelect(stepsToAdd);

      setActiveMoveId(move.id);
      setTimeout(() => setActiveMoveId(null), 200);
    },
    [buildStepsWithConnector, onMoveSelect],
  );

  /**
   * 強度バリアントが選択されたときのハンドラー
   * 選択後に展開を閉じる
   */
  const handleVariantClick = useCallback(
    (moveId: string, variant: StrengthVariant) => {
      const stepsToAdd = buildStepsWithConnector(variant.steps);
      onMoveSelect(stepsToAdd);

      // 展開を閉じてフィードバック表示
      setExpandedMoveId(null);
      setActiveMoveId(moveId);
      setTimeout(() => setActiveMoveId(null), 200);
    },
    [buildStepsWithConnector, onMoveSelect],
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
                  const isExpanded = expandedMoveId === move.id;

                  return (
                    <div key={move.id} className="flex flex-col gap-1">
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
                        aria-expanded={hasVariants ? isExpanded : undefined}
                      >
                        {/* テンキー表記 */}
                        <span className="font-mono text-xs text-gray-400">
                          {move.notation}
                        </span>
                        {/* 技名 */}
                        <span className="text-sm text-white">{move.name}</span>
                        {/* バリアントインジケーター */}
                        {hasVariants && (
                          <span className="text-xs text-gray-500">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        )}
                      </button>

                      {/* 強度バリアントボタン */}
                      {hasVariants && isExpanded && (
                        <div className="flex gap-1 pl-1">
                          {move.variants!.map((variant) => (
                            <button
                              key={variant.strength}
                              type="button"
                              onClick={() =>
                                handleVariantClick(move.id, variant)
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
