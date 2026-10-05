import type { Guest, GuestSession } from "@app/identity-client";
import { vi } from "vitest";

export const penguin: Guest = { kind: "guest", id: "g-1", name: "ねむいペンギン" };

/**
 * テスト用のゲストセッション。既定は「まだゲストでない」状態で、
 * ensure() すると penguin として登録される。
 */
export function fakeGuestSession(overrides: Partial<GuestSession> = {}): GuestSession {
  return {
    get: vi.fn().mockResolvedValue(null),
    ensure: vi.fn().mockResolvedValue(penguin),
    rename: vi.fn(async (name: string) => ({ ...penguin, name })),
    token: vi.fn().mockReturnValue(null),
    ...overrides,
  };
}

/** すでにゲストとして来たことがある状態 */
export function returningGuestSession(guest: Guest = penguin): GuestSession {
  return fakeGuestSession({
    get: vi.fn().mockResolvedValue(guest),
    ensure: vi.fn().mockResolvedValue(guest),
    token: vi.fn().mockReturnValue("t-1"),
  });
}
