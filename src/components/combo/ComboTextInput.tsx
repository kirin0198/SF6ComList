"use client";

/**
 * ComboTextInput コンポーネント
 * テンキー表記のテキスト入力でコンボシーケンスを入力する
 * notation-converter を使用してテキスト ↔ ComboSequence を変換する
 *
 * 設計方針:
 *   - テキスト入力が主となる制御コンポーネント
 *   - value は初回マウント時の初期値として使用する
 *   - 外部から再初期化する場合は key prop を変更してコンポーネントを再マウントする
 */

import { useState, useCallback } from "react";
import {
  parseNotation,
  serializeNotation,
} from "@/lib/combo/notation-converter";
import type { ComboSequence } from "@/lib/combo/types";

interface ComboTextInputProps {
  /** 初期シーケンス（マウント時の初期値として使用） */
  value?: ComboSequence;
  /** シーケンスが変更されたときのコールバック */
  onChange: (sequence: ComboSequence) => void;
  className?: string;
}

/**
 * テンキー表記テキスト入力コンポーネント
 *
 * テキスト入力 → parseNotation → ComboSequence に変換して onChange を呼び出す
 */
export default function ComboTextInput({
  value,
  onChange,
  className = "",
}: ComboTextInputProps) {
  // テキスト入力値（内部状態・初回のみ value から初期化）
  const [text, setText] = useState<string>(
    value ? serializeNotation(value) : "",
  );
  // パースエラーメッセージ
  const [parseError, setParseError] = useState<string | null>(null);

  /** テキスト変更ハンドラー */
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setText(newText);

      if (newText.trim() === "") {
        // 空テキストの場合はエラーなし・空シーケンスを通知
        setParseError(null);
        onChange({ steps: [], notation: "" });
        return;
      }

      // テキストをパースして ComboSequence に変換
      try {
        const sequence = parseNotation(newText.trim());

        // パース結果が空のステップのみ（コネクターのみ等）の場合はエラーとして扱う
        const hasValidSteps = sequence.steps.some(
          (step) => step.type !== "connector",
        );

        if (!hasValidSteps && newText.trim().length > 0) {
          setParseError(`入力を認識できませんでした: "${newText.trim()}"`);
          // エラーでも部分的な結果を渡す（プレビューを更新するため）
          onChange(sequence);
          return;
        }

        setParseError(null);
        onChange(sequence);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "不明なエラー";
        setParseError(`パースエラー: ${errorMessage}`);
      }
    },
    [onChange],
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 入力ラベル */}
      <label
        htmlFor="combo-text-input"
        className="text-sm font-medium text-gray-400"
      >
        テンキー表記で入力
      </label>

      {/* テンキー表記テキストエリア */}
      <textarea
        id="combo-text-input"
        value={text}
        onChange={handleTextChange}
        placeholder="例: 5MP > 2MK xx 214MK > SA2"
        rows={3}
        className={[
          "w-full rounded border bg-gray-800 px-3 py-2 font-mono text-sm text-white placeholder:text-gray-500",
          "resize-none transition-colors duration-150",
          "focus:ring-1 focus:outline-none",
          parseError
            ? "border-yellow-600 focus:border-yellow-500 focus:ring-yellow-500"
            : "border-gray-700 focus:border-cyan-500 focus:ring-cyan-500",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={!!parseError}
        aria-describedby={parseError ? "combo-text-error" : "combo-text-hint"}
      />

      {/* パースエラーメッセージ */}
      {parseError ? (
        <p
          id="combo-text-error"
          className="text-xs text-yellow-300"
          role="alert"
        >
          {parseError}
        </p>
      ) : (
        <p id="combo-text-hint" className="text-xs text-gray-500">
          テンキー表記: 方向数字（236など）+ ボタン名（HP, MK など）。区切り:
          &gt;（リンク）xx（キャンセル）~（ディレイ）,（区切り）
        </p>
      )}
    </div>
  );
}
