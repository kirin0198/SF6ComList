/**
 * レートリミッターのテスト
 */

import { describe, it, expect } from "vitest";
import { createRateLimit } from "@/lib/rate-limit";

describe("createRateLimit", () => {
  it("リミット内のリクエストは成功する", () => {
    const limiter = createRateLimit("test-success", {
      limit: 3,
      windowMs: 60_000,
    });

    expect(limiter.check("ip-1").success).toBe(true);
    expect(limiter.check("ip-1").success).toBe(true);
    expect(limiter.check("ip-1").success).toBe(true);
  });

  it("リミット超過でリクエストが拒否される", () => {
    const limiter = createRateLimit("test-exceed", {
      limit: 2,
      windowMs: 60_000,
    });

    expect(limiter.check("ip-2").success).toBe(true);
    expect(limiter.check("ip-2").success).toBe(true);

    const result = limiter.check("ip-2");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("異なるキーは独立してカウントされる", () => {
    const limiter = createRateLimit("test-keys", {
      limit: 1,
      windowMs: 60_000,
    });

    expect(limiter.check("ip-a").success).toBe(true);
    expect(limiter.check("ip-b").success).toBe(true);

    expect(limiter.check("ip-a").success).toBe(false);
    expect(limiter.check("ip-b").success).toBe(false);
  });
});
