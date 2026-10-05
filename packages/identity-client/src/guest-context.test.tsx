import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { GuestProvider, useGuest } from "./guest-context.js";
import type { Guest, GuestSession } from "./guest-session.js";

const alice: Guest = { kind: "guest", id: "g-1", name: "ねむいペンギン" };

function fakeSession(overrides: Partial<GuestSession> = {}): GuestSession {
  return {
    get: vi.fn().mockResolvedValue(null),
    ensure: vi.fn().mockResolvedValue(alice),
    rename: vi.fn(async (name: string) => ({ ...alice, name })),
    token: vi.fn().mockReturnValue(null),
    ...overrides,
  };
}

type Deferred = {
  promise: Promise<Guest | null>;
  resolve: (guest: Guest | null) => void;
  reject: (error: Error) => void;
};

function defer(): Deferred {
  let resolve!: Deferred["resolve"];
  let reject!: Deferred["reject"];
  const promise = new Promise<Guest | null>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function render(session: GuestSession) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GuestProvider session={session}>{children}</GuestProvider>
  );
  return renderHook(() => useGuest(), { wrapper });
}

describe("useGuest", () => {
  it("読み込み中から始まり、ゲストが居れば ready になる", async () => {
    const { result } = render(fakeSession({ get: vi.fn().mockResolvedValue(alice) }));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready", guest: alice }));
  });

  it("まだゲストでなければ anonymous（名前は聞かない）", async () => {
    const { result } = render(fakeSession());

    await waitFor(() => expect(result.current.status).toBe("anonymous"));
    expect(result.current.guest).toBeNull();
  });

  it("読み込みに失敗したら error", async () => {
    const { result } = render(fakeSession({ get: vi.fn().mockRejectedValue(new Error("down")) }));

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("ensureGuest で登録して ready になり、ゲストを返す", async () => {
    const session = fakeSession();
    const { result } = render(session);
    await waitFor(() => expect(result.current.status).toBe("anonymous"));

    let returned: Guest | undefined;
    await act(async () => {
      returned = await result.current.ensureGuest();
    });

    expect(returned).toEqual(alice);
    expect(result.current).toMatchObject({ status: "ready", guest: alice });
  });

  it("rename で名前が変わる", async () => {
    const { result } = render(fakeSession({ get: vi.fn().mockResolvedValue(alice) }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.rename("Alice");
    });

    expect(result.current.guest?.name).toBe("Alice");
  });

  it.each([
    ["読み込めた", (r: Deferred) => r.resolve(alice)],
    ["読み込みに失敗した", (r: Deferred) => r.reject(new Error("down"))],
  ])("画面を離れた後に%sとしても、離れた画面の状態は更新しない", async (_label, settle) => {
    const deferred = defer();
    const session = fakeSession({ get: vi.fn().mockReturnValue(deferred.promise) });
    const { result, unmount } = render(session);
    const before = result.current;

    unmount();
    settle(deferred);
    await deferred.promise.catch(() => {});

    expect(result.current).toBe(before);
  });

  it("GuestProvider の外で使うと分かりやすく失敗する", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useGuest())).toThrow("GuestProvider");
  });
});
