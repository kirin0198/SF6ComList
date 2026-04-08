/**
 * Auth.js セッション型拡張
 * デフォルトの Session 型に userId を追加する
 */

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
