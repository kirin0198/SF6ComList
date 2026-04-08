"use client";

/**
 * ComboForm 統合コンポーネント
 * コンボ登録/編集の共通フォーム
 * ビジュアル入力とテキスト入力の切替に対応する
 */

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ComboInputUI from "@/components/combo/ComboInputUI";
import ComboTextInput from "@/components/combo/ComboTextInput";
import ComboSequencePreview from "@/components/combo/ComboSequencePreview";
import TagSelector from "@/components/tag/TagSelector";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import type {
  ComboSequence,
  TagResponse,
  ComboResponse,
} from "@/lib/combo/types";

// ============================================================
// フォームスキーマ（クライアント側バリデーション）
// ============================================================

const comboFormSchema = z.object({
  name: z
    .string()
    .max(100, "コンボ名は100文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  damage: z
    .string()
    .refine(
      (val) =>
        val === "" ||
        (!isNaN(Number(val)) &&
          Number(val) >= 0 &&
          Number.isInteger(Number(val))),
      { message: "0以上の整数を入力してください" },
    )
    .optional(),
  memo: z
    .string()
    .max(1000, "メモは1000文字以内で入力してください")
    .optional()
    .or(z.literal("")),
});

type ComboFormValues = z.infer<typeof comboFormSchema>;

// ============================================================
// Props
// ============================================================

/** 入力モード */
type InputMode = "visual" | "text";

interface ComboFormProps {
  /** フォームモード（新規 or 編集） */
  mode: "create" | "edit";
  /** 利用可能なタグ一覧 */
  availableTags: TagResponse[];
  /** 初期データ（編集モード時に使用） */
  initialData?: ComboResponse;
  /** 保存時のコールバック */
  onSubmit: (data: {
    name?: string | null;
    sequence: ComboSequence;
    damage?: number | null;
    memo?: string | null;
    tagIds: string[];
  }) => Promise<void>;
  /** キャンセル時のコールバック */
  onCancel: () => void;
  /** 新しいタグ作成コールバック */
  onTagCreate?: (tagName: string) => Promise<TagResponse | null>;
  /** 保存ボタンのラベル */
  submitLabel?: string;
}

/**
 * コンボ登録/編集フォーム
 * ビジュアル入力モードとテキスト入力モードを切り替えられる
 */
export default function ComboForm({
  mode,
  availableTags,
  initialData,
  onSubmit,
  onCancel,
  onTagCreate,
  submitLabel,
}: ComboFormProps) {
  // 入力モード: visual or text
  const [inputMode, setInputMode] = useState<InputMode>("visual");
  // コンボシーケンス（ビジュアル/テキスト入力から共有）
  const [sequence, setSequence] = useState<ComboSequence>(
    initialData?.sequence ?? { steps: [], notation: "" },
  );
  // 選択中のタグID
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags.map((t) => t.id) ?? [],
  );
  // 保存中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);
  // エラーメッセージ
  const [submitError, setSubmitError] = useState<string | null>(null);

  // react-hook-form のセットアップ
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ComboFormValues>({
    resolver: zodResolver(comboFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      damage:
        initialData?.damage !== null && initialData?.damage !== undefined
          ? String(initialData.damage)
          : "",
      memo: initialData?.memo ?? "",
    },
  });

  // シーケンスの変更ハンドラー（ビジュアル/テキスト入力共通）
  const handleSequenceChange = useCallback((newSequence: ComboSequence) => {
    setSequence(newSequence);
  }, []);

  // フォーム送信ハンドラー
  const onFormSubmit = handleSubmit(async (formValues: ComboFormValues) => {
    if (sequence.steps.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name: formValues.name || null,
        sequence,
        damage:
          formValues.damage && formValues.damage !== ""
            ? Number(formValues.damage)
            : null,
        memo: formValues.memo || null,
        tagIds: selectedTagIds,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "保存に失敗しました";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  });

  const hasSequence = sequence.steps.length > 0;
  const defaultSubmitLabel =
    submitLabel ?? (mode === "create" ? "このコンボを保存" : "変更を保存");

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      {/* ============================================================ */}
      {/* コンボプレビューエリア */}
      {/* ============================================================ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
        <p className="mb-2 text-xs text-gray-400">コンボプレビュー</p>
        <ComboSequencePreview steps={sequence.steps} size="md" />
        {hasSequence && (
          <p className="mt-2 font-mono text-xs text-gray-500">
            {sequence.notation}
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/* 入力モード切替タブ */}
      {/* ============================================================ */}
      <div>
        <div
          className="mb-4 inline-flex rounded bg-gray-800 p-0.5"
          role="tablist"
          aria-label="入力モード"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "visual"}
            onClick={() => setInputMode("visual")}
            className={[
              "rounded px-4 py-1.5 text-sm font-medium transition-colors duration-150",
              inputMode === "visual"
                ? "bg-gray-600 text-white"
                : "text-gray-400 hover:text-gray-300",
            ].join(" ")}
          >
            ビジュアル入力
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "text"}
            onClick={() => setInputMode("text")}
            className={[
              "rounded px-4 py-1.5 text-sm font-medium transition-colors duration-150",
              inputMode === "text"
                ? "bg-gray-600 text-white"
                : "text-gray-400 hover:text-gray-300",
            ].join(" ")}
          >
            テキスト入力
          </button>
        </div>

        {/* ビジュアル入力モード */}
        {inputMode === "visual" && (
          <div
            role="tabpanel"
            className="rounded-lg border border-gray-700 bg-gray-800 p-4"
          >
            <ComboInputUI
              initialSequence={sequence.steps.length > 0 ? sequence : undefined}
              onChange={handleSequenceChange}
            />
          </div>
        )}

        {/* テキスト入力モード */}
        {inputMode === "text" && (
          <div
            role="tabpanel"
            className="rounded-lg border border-gray-700 bg-gray-800 p-4"
          >
            <ComboTextInput
              value={sequence.steps.length > 0 ? sequence : undefined}
              onChange={handleSequenceChange}
            />
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* メタデータフィールド */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {/* コンボ名 */}
        <InputField
          label="コンボ名（任意）"
          placeholder="例: BnBコンボ、画面端SA2コンボ"
          maxLength={100}
          error={errors.name?.message}
          {...register("name")}
        />

        {/* ダメージ値 */}
        <InputField
          label="ダメージ値（任意）"
          type="number"
          min={0}
          step={1}
          placeholder="例: 2800"
          error={errors.damage?.message}
          {...register("damage")}
        />

        {/* タグ選択 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">タグ</label>
          <div className="rounded border border-gray-700 bg-gray-800 p-3">
            <TagSelector
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onTagsChange={setSelectedTagIds}
              onTagCreate={onTagCreate}
            />
          </div>
        </div>

        {/* メモ */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="combo-memo"
            className="text-sm font-medium text-gray-400"
          >
            メモ（任意）
          </label>
          <Controller
            name="memo"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="combo-memo"
                rows={4}
                maxLength={1000}
                placeholder="コンボの注意点や応用例など"
                className={[
                  "w-full rounded border bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500",
                  "resize-none transition-colors duration-150",
                  "focus:ring-1 focus:outline-none",
                  errors.memo
                    ? "border-red-600 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-700 focus:border-cyan-500 focus:ring-cyan-500",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-invalid={!!errors.memo}
              />
            )}
          />
          {errors.memo && (
            <p className="text-xs text-red-400" role="alert">
              {errors.memo.message}
            </p>
          )}
          {/* 文字数カウンター */}
          <p className="text-right text-xs text-gray-500">
            {watch("memo")?.length ?? 0} / 1000
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* サーバーエラー表示 */}
      {/* ============================================================ */}
      {submitError && (
        <div
          className="rounded border border-red-700 bg-red-900/50 px-3 py-2 text-sm text-red-300"
          role="alert"
        >
          {submitError}
        </div>
      )}

      {/* ============================================================ */}
      {/* アクションボタン */}
      {/* ============================================================ */}
      <div className="flex justify-between gap-3 border-t border-gray-700 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={!hasSequence || isSubmitting}
        >
          {defaultSubmitLabel}
        </Button>
      </div>
    </form>
  );
}
