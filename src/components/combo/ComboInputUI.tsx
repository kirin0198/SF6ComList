"use client";

/**
 * ComboInputUI 統合コンポーネント
 * DirectionPad + ButtonPalette + ConnectorSelector + ComboSequencePreview を統合した
 * ビジュアルコンボ入力UIのメインコンポーネント
 *
 * 設計方針:
 *   - initialSequence は初回マウント時の初期値として使用する（その後は内部状態で管理）
 *   - 外部から再初期化する場合は key prop を変更してコンポーネントを再マウントする
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import DirectionPad from "@/components/input/DirectionPad";
import ButtonPalette from "@/components/input/ButtonPalette";
import ConnectorSelector from "@/components/input/ConnectorSelector";
import ComboSequencePreview from "@/components/combo/ComboSequencePreview";
import Button from "@/components/ui/Button";
import { serializeNotation } from "@/lib/combo/notation-converter";
import type {
  ComboStep,
  ComboSequence,
  NormalInput,
  ConnectorStep,
  Direction,
  ButtonInput,
  AttackModifier,
} from "@/lib/combo/types";

// ============================================================
// 内部状態型
// ============================================================

/** 入力中の1ステップのドラフト状態 */
interface DraftStep {
  directions: Direction[];
  modifier: AttackModifier | undefined;
  isOD: boolean;
}

const emptyDraft = (): DraftStep => ({
  directions: [],
  modifier: undefined,
  isOD: false,
});

// ============================================================
// Props
// ============================================================

interface ComboInputUIProps {
  /** 初期シーケンス（マウント時の初期値として使用） */
  initialSequence?: ComboSequence;
  /** シーケンスが変更されたときのコールバック */
  onChange: (sequence: ComboSequence) => void;
  className?: string;
}

/**
 * ビジュアルコンボ入力UIのメインコンポーネント
 *
 * 操作フロー:
 *   1. DirectionPad で方向を選択（複数追加可: 236 など）
 *   2. ButtonPalette でボタンを選択 → ステップが確定
 *   3. ConnectorSelector でコネクターを挿入
 *   4. 繰り返してコンボを完成させる
 */
export default function ComboInputUI({
  initialSequence,
  onChange,
  className = "",
}: ComboInputUIProps) {
  // 確定済みステップの配列
  const [committedSteps, setCommittedSteps] = useState<ComboStep[]>(
    initialSequence?.steps ?? [],
  );
  // 入力中のドラフトステップ
  const [draft, setDraft] = useState<DraftStep>(emptyDraft());

  // onChange の最新版を ref に保持（useEffect の依存配列から除外するため）
  const onChangeRef = useRef(onChange);

  // onChange が変わったときに ref を更新する（レンダー中以外で実行）
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // committedSteps が変わるたびに onChange を呼び出す
  useEffect(() => {
    const sequence: ComboSequence = {
      steps: committedSteps,
      notation: serializeNotation({ steps: committedSteps, notation: "" }),
    };
    onChangeRef.current(sequence);
  }, [committedSteps]);

  // ============================================================
  // ハンドラー
  // ============================================================

  /** 方向クリック: ドラフトに方向を追加 */
  const handleDirectionSelect = useCallback((dir: Direction) => {
    setDraft((prev) => ({
      ...prev,
      directions: [...prev.directions, dir],
    }));
  }, []);

  /** ボタンクリック: ドラフトを確定してステップに追加 */
  const handleButtonSelect = useCallback(
    (button: ButtonInput) => {
      const newStep: NormalInput = {
        type: "normal",
        directions: draft.directions,
        button,
        modifier: draft.modifier,
        isOD: draft.isOD,
      };
      setCommittedSteps((prev) => [...prev, newStep]);
      setDraft(emptyDraft());
    },
    [draft],
  );

  /** コネクタークリック: コネクターをステップに追加 */
  const handleConnectorSelect = useCallback(
    (symbol: ConnectorStep["symbol"]) => {
      const connector: ConnectorStep = { type: "connector", symbol };
      setCommittedSteps((prev) => [...prev, connector]);
    },
    [],
  );

  /** 最後のステップを削除（Undo） */
  const handleUndo = useCallback(() => {
    // ドラフトに方向が残っていれば最後の方向を削除
    if (draft.directions.length > 0) {
      setDraft((prev) => ({
        ...prev,
        directions: prev.directions.slice(0, -1),
      }));
      return;
    }
    // ドラフトが空なら確定済みの最後のステップを削除
    setCommittedSteps((prev) => prev.slice(0, -1));
  }, [draft.directions.length]);

  /** インデックスを指定してステップを削除 */
  const handleRemoveStep = useCallback((index: number) => {
    setCommittedSteps((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** 全ステップ削除（リセット） */
  const handleClear = useCallback(() => {
    setCommittedSteps([]);
    setDraft(emptyDraft());
  }, []);

  /** OD トグル */
  const handleODToggle = useCallback(() => {
    setDraft((prev) => ({ ...prev, isOD: !prev.isOD }));
  }, []);

  // ============================================================
  // プレビュー用ステップ（ドラフトの仮表示を含む）
  // ============================================================

  const previewSteps: ComboStep[] = [
    ...committedSteps,
    // 方向選択中のドラフトを仮表示（ボタン未選択状態）
    ...(draft.directions.length > 0
      ? [
          {
            type: "normal" as const,
            directions: draft.directions,
            button: null as unknown as ButtonInput,
            isOD: draft.isOD,
            modifier: draft.modifier,
          },
        ]
      : []),
  ];

  const hasContent = committedSteps.length > 0 || draft.directions.length > 0;

  return (
    <div className={`space-y-4 ${className}`} aria-label="コンボ入力エリア">
      {/* ドラフト状態インジケーター */}
      {draft.directions.length > 0 && (
        <div
          className="text-xs text-yellow-300"
          role="status"
          aria-live="polite"
        >
          入力中: {draft.directions.join("")}
          {draft.isOD ? " (OD)" : ""} → ボタンを選択して確定
        </div>
      )}

      {/* 入力パネル */}
      <div className="flex flex-wrap gap-6">
        {/* 方向キーパッド */}
        <div>
          <p className="mb-2 text-xs text-gray-400">方向入力</p>
          <DirectionPad
            selectedDirections={draft.directions}
            onSelect={handleDirectionSelect}
          />
        </div>

        {/* ボタンパレット */}
        <div className="min-w-52 flex-1">
          <p className="mb-2 text-xs text-gray-400">ボタン</p>
          <ButtonPalette onSelect={handleButtonSelect} />
        </div>
      </div>

      {/* コネクターと修飾子 */}
      <div className="space-y-2">
        <ConnectorSelector onSelect={handleConnectorSelect} />

        {/* 修飾子（OD） */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">修飾子:</span>
          <button
            type="button"
            onClick={handleODToggle}
            className={[
              "rounded border px-2 py-1 text-xs font-bold transition-colors duration-150",
              draft.isOD
                ? "border-purple-400 bg-purple-600 text-white"
                : "border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600",
            ].join(" ")}
            aria-pressed={draft.isOD}
            aria-label="オーバードライブ修飾子"
          >
            OD
          </button>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2 border-t border-gray-700 pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Undo2 size={14} />}
          onClick={handleUndo}
          disabled={!hasContent}
        >
          元に戻す
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<RotateCcw size={14} />}
          onClick={handleClear}
          disabled={committedSteps.length === 0}
        >
          リセット
        </Button>
      </div>

      {/* コンボプレビュー（削除可能モード） */}
      <div>
        <p className="mb-1 text-xs text-gray-400">コンボプレビュー</p>
        <ComboSequencePreview
          steps={previewSteps}
          deletable={true}
          onRemoveStep={handleRemoveStep}
        />
      </div>
    </div>
  );
}
