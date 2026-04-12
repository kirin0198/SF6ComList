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
   * 技がクリックされたときのハンドラー
   * ARCHITECTURE.md セクション 15.4「コネクター自動挿入ロジック」に準拠
   */
  const handleMoveClick = useCallback(
    (move: CommandMove) => {
      const lastStep = committedSteps[committedSteps.length - 1];

      let stepsToAdd: ComboStep[];

      if (committedSteps.length === 0) {
        // シーケンスが空の場合: コネクターなしで技のステップを追加
        stepsToAdd = move.steps;
      } else if (lastStep && lastStep.type === "connector") {
        // 最後のステップがコネクターの場合: コネクターを挿入せずに技のステップのみ追加
        stepsToAdd = move.steps;
      } else {
        // 最後のステップが NormalInput または ChargeInput の場合: > コネクターを自動挿入
        stepsToAdd = [
          { type: "connector", symbol: ">" } as ConnectorStep,
          ...move.steps,
        ];
      }

      onMoveSelect(stepsToAdd);

      // クリックフィードバック（200ms ハイライト）
      setActiveMoveId(move.id);
      setTimeout(() => setActiveMoveId(null), 200);
    },
    [committedSteps, onMoveSelect],
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
                {moves.map((move) => (
                  <button
                    key={move.id}
                    type="button"
                    onClick={() => handleMoveClick(move)}
                    className={[
                      "flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm transition-colors duration-150",
                      "focus:ring-1 focus:ring-cyan-500 focus:outline-none",
                      activeMoveId === move.id
                        ? "border-cyan-500 bg-gray-600"
                        : "border-gray-600 bg-gray-700 hover:bg-gray-600",
                    ].join(" ")}
                    aria-label={`${move.name}（${move.notation}）`}
                  >
                    {/* テンキー表記 */}
                    <span className="font-mono text-xs text-gray-400">
                      {move.notation}
                    </span>
                    {/* 技名 */}
                    <span className="text-sm text-white">{move.name}</span>
                  </button>
                ))}
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
