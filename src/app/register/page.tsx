"use client";

/**
 * ユーザー登録画面 (SCR-002)
 * 新規ユーザーがメール/パスワードでアカウントを作成する
 * react-hook-form + Zod バリデーション
 * 登録成功後 → 自動ログイン → キャラクター一覧へ遷移
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { z } from "zod";

import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import { registerSchema } from "@/lib/validators/auth";

// 登録フォーム用スキーマ（パスワード確認フィールドを追加）
const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "パスワード（確認）を入力してください"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type RegisterFormInput = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setServerError(null);

    try {
      // 1. 登録API を呼び出す
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        if (response.status === 409) {
          setServerError("このメールアドレスは既に登録されています");
        } else {
          setServerError(
            body?.error ?? "登録中にエラーが発生しました。再度お試しください。",
          );
        }
        return;
      }

      // 2. 自動ログイン
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // 登録は成功したがログインに失敗 → ログイン画面へ誘導
        router.push("/login");
        return;
      }

      // 3. キャラクター一覧へ遷移
      router.push("/");
      router.refresh();
    } catch {
      setServerError("登録中にエラーが発生しました。再度お試しください。");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ・タイトル */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            SF6 <span className="text-cyan-500">COMBO</span>{" "}
            <span className="text-gray-400">NOTE</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">新規登録</p>
        </div>

        {/* 登録フォーム */}
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
          {/* サーバーエラーバナー */}
          {serverError && (
            <div
              className="mb-4 rounded border border-red-700 bg-red-900/50 px-3 py-2 text-sm text-red-300"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-4">
              {/* メールアドレス */}
              <InputField
                label="メールアドレス"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />

              {/* パスワード */}
              <InputField
                label="パスワード（8文字以上）"
                type="password"
                placeholder="8文字以上のパスワード"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
              />

              {/* パスワード確認 */}
              <InputField
                label="パスワード（確認）"
                type="password"
                placeholder="パスワードを再入力"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              {/* 登録ボタン */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                className="mt-2 w-full"
              >
                アカウントを作成
              </Button>
            </div>
          </form>

          {/* ログインリンク */}
          <p className="mt-4 text-center text-sm text-gray-500">
            既にアカウントをお持ちの方は{" "}
            <Link
              href="/login"
              className="text-cyan-400 underline transition-colors hover:text-cyan-300"
            >
              ログインはこちら
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
