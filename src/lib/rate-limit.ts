/**
 * インメモリ レートリミッター
 * IP アドレスベースのスライディングウィンドウ方式
 *
 * 注意: シングルプロセス前提。複数インスタンス構成では
 * Redis ベースのソリューション（upstash/ratelimit 等）に切り替えること。
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  /** ウィンドウ内の最大リクエスト数 */
  limit: number;
  /** ウィンドウサイズ（ミリ秒） */
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * レートリミットインスタンスを作成する
 */
export function createRateLimit(name: string, config: RateLimitConfig) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  return {
    /**
     * リクエストがレートリミット内かチェックする
     * @returns { success: true } または { success: false, retryAfterMs }
     */
    check(
      key: string,
    ): { success: true } | { success: false; retryAfterMs: number } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry) {
        store.set(key, { timestamps: [now] });
        return { success: true };
      }

      // ウィンドウ外のタイムスタンプを除去
      const windowStart = now - config.windowMs;
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

      if (entry.timestamps.length >= config.limit) {
        const oldestInWindow = entry.timestamps[0];
        const retryAfterMs = oldestInWindow + config.windowMs - now;
        return { success: false, retryAfterMs };
      }

      entry.timestamps.push(now);
      return { success: true };
    },
  };
}

/**
 * 認証エンドポイント用のレートリミッター
 * ログイン: IP あたり 5回/分
 */
export const loginRateLimit = createRateLimit("login", {
  limit: 5,
  windowMs: 60 * 1000,
});

/**
 * 登録エンドポイント用のレートリミッター
 * 登録: IP あたり 3回/分
 */
export const registerRateLimit = createRateLimit("register", {
  limit: 3,
  windowMs: 60 * 1000,
});

/**
 * NextRequest から IP アドレスを取得する
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * レートリミット超過時の JSON レスポンスを生成する
 */
export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: "リクエストが多すぎます。しばらく待ってから再試行してください。",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
