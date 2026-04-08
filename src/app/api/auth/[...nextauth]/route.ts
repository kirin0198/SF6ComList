/**
 * Auth.js ルートハンドラー
 * /api/auth/* への全リクエストを Auth.js が処理する
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
