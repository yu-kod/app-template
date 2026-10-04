import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

describe("createApp", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("GET /api/health が ok を返す", async () => {
    const res = await createApp().request("/api/health");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  it("未定義のパスは統一フォーマットの 404 を返す", async () => {
    const res = await createApp().request("/api/does-not-exist");

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: { code: "NOT_FOUND", message: "GET /api/does-not-exist は存在しない" },
    });
  });

  it("すべてのリクエストを構造化ログに残す", async () => {
    await createApp().request("/api/health");

    const logged = JSON.parse(vi.mocked(console.info).mock.calls[0]?.[0] as string);
    expect(logged).toMatchObject({ path: "/api/health", status: 200 });
  });
});
