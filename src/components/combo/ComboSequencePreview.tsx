"use client";

/**
 * コンボシーケンスプレビューコンポーネント
 * ComboStep の配列をアイコン列として可視化する
 * 削除可能モードでは各ステップに×ボタンを表示する
 */

import { X } from "lucide-react";
import DirectionIcon from "@/components/icons/DirectionIcon";
import ButtonIcon from "@/components/icons/ButtonIcon";
import ConnectorIcon from "@/components/icons/ConnectorIcon";
import type {
  ComboStep,
  NormalInput,
  ChargeInput,
  Direction,
  ButtonInput,
} from "@/lib/combo/types";

// ButtonIcon がサポートするボタン種別（types.ts の ButtonInput から "PP" を除いたもの）
type ButtonIconInput = Exclude<ButtonInput, "PP">;

interface ComboSequencePreviewProps {
  /** 表示するコンボステップの配列 */
  steps: ComboStep[];
  /** 削除可能モード: true の場合、各入力ステップに×ボタンを表示 */
  deletable?: boolean;
  /** ステップ削除コールバック（deletable=true の場合に使用） */
  onRemoveStep?: (index: number) => void;
  /** プレビューのサイズ */
  size?: "sm" | "md";
  className?: string;
}

// ============================================================
// 個別ステップ表示コンポーネント
// ============================================================

interface StepViewProps {
  step: ComboStep;
  size: "sm" | "md";
}

/** 溜め入力ステップを表示 */
function ChargeStepView({
  step,
  size,
}: {
  step: ChargeInput;
  size: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="text-xs text-gray-500">[</span>
      <DirectionIcon direction={step.chargeDir} size="sm" />
      <span className="text-xs text-gray-500">]</span>
      <DirectionIcon direction={step.releaseDir} size="sm" />
      <ButtonIcon button={step.button as ButtonIconInput} size={size} />
    </span>
  );
}

/** 通常入力ステップを表示 */
function NormalStepView({
  step,
  size,
}: {
  step: NormalInput;
  size: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {/* 修飾子 */}
      {step.modifier && (
        <span className="text-xs text-gray-500">{step.modifier}.</span>
      )}
      {/* OD プレフィックス */}
      {step.isOD && (
        <span className="text-xs font-bold text-purple-400">OD</span>
      )}
      {/* 方向アイコン（5=ニュートラルは省略） */}
      {step.directions
        .filter((d): d is Exclude<Direction, "5"> => d !== "5")
        .map((dir, i) => (
          <DirectionIcon key={i} direction={dir} size="sm" />
        ))}
      {/* ボタンアイコン（PP は非表示） */}
      {step.button && step.button !== "PP" && (
        <ButtonIcon button={step.button as ButtonIconInput} size={size} />
      )}
      {/* PP の場合はテキスト表示 */}
      {step.button === "PP" && (
        <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-white/20 bg-green-400 px-1.5 py-0.5 text-xs font-bold text-white">
          PP
        </span>
      )}
    </span>
  );
}

/** 1ステップを表示 */
function StepView({ step, size }: StepViewProps) {
  if (step.type === "connector") {
    return <ConnectorIcon symbol={step.symbol} className="px-0.5 text-sm" />;
  }
  if (step.type === "charge") {
    return <ChargeStepView step={step} size={size} />;
  }
  // NormalInput
  return <NormalStepView step={step as NormalInput} size={size} />;
}

// ============================================================
// ComboSequencePreview メインコンポーネント
// ============================================================

/**
 * コンボシーケンスプレビューコンポーネント
 * コンボステップをアイコン列として表示する
 */
export default function ComboSequencePreview({
  steps,
  deletable = false,
  onRemoveStep,
  size = "sm",
  className = "",
}: ComboSequencePreviewProps) {
  // 空の状態
  if (steps.length === 0) {
    return (
      <div
        className={`flex min-h-12 items-center justify-center rounded border border-dashed border-gray-700 px-3 py-2 ${className}`}
      >
        <p className="text-xs text-gray-500 italic">
          方向キーとボタンを選択してコンボを組み立ててください
        </p>
      </div>
    );
  }

  // 削除可能モード: 入力ステップ（コネクター以外）をグループ化してインデックスを管理
  if (deletable) {
    // 各 step のオリジナルインデックスを保持
    const stepsWithIndex = steps.map((step, originalIndex) => ({
      step,
      originalIndex,
    }));

    return (
      <div
        className={`flex min-h-12 flex-wrap items-center gap-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 ${className}`}
      >
        {stepsWithIndex.map(({ step, originalIndex }) => {
          const isConnector = step.type === "connector";

          if (isConnector) {
            return (
              <span key={originalIndex} className="inline-flex">
                <StepView step={step} size={size} />
              </span>
            );
          }

          // 入力ステップには×ボタンを付ける
          return (
            <span
              key={originalIndex}
              className="group inline-flex items-center gap-0.5 rounded border border-transparent hover:border-gray-600"
            >
              <StepView step={step} size={size} />
              {onRemoveStep && (
                <button
                  type="button"
                  onClick={() => onRemoveStep(originalIndex)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-900/50 hover:text-red-400"
                  aria-label="このステップを削除"
                >
                  <X size={10} />
                </button>
              )}
            </span>
          );
        })}
      </div>
    );
  }

  // 通常表示モード（読み取り専用）
  return (
    <div
      className={`flex min-h-12 flex-wrap items-center gap-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 ${className}`}
    >
      {steps.map((step, index) => (
        <span key={index} className="inline-flex">
          <StepView step={step} size={size} />
        </span>
      ))}
    </div>
  );
}
