"use client";

/**
 * ログイン画面 (SCR-001)
 * メール/パスワードでログインする
 * react-hook-form + Zod バリデーション
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("メールアドレスまたはパスワードが正しくありません");
        return;
      }

      // ログイン成功 → キャラクター一覧へ遷移
      router.push("/");
      router.refresh();
    } catch {
      setServerError("ログイン中にエラーが発生しました。再度お試しください。");
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
          <p className="mt-1 text-sm text-gray-500">
            ストリートファイター6 コンボ管理ツール
          </p>
        </div>

        {/* ログインフォーム */}
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
                label="パスワード"
                type="password"
                placeholder="パスワードを入力"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />

              {/* ログインボタン */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                className="mt-2 w-full"
              >
                ログイン
              </Button>
            </div>
          </form>

          {/* 登録リンク */}
          <p className="mt-4 text-center text-sm text-gray-500">
            アカウントをお持ちでない方は{" "}
            <Link
              href="/register"
              className="text-cyan-400 underline transition-colors hover:text-cyan-300"
            >
              新規登録はこちら
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
