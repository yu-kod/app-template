import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Guest, GuestSession } from "./guest-session.js";

export type GuestState =
  | { status: "loading"; guest: null }
  | { status: "anonymous"; guest: null }
  | { status: "ready"; guest: Guest }
  | { status: "error"; guest: null };

export type GuestContextValue = GuestState & {
  /** ゲストでなければ（名前を聞かずに）登録する。何かを始めるボタンの中で呼ぶ */
  ensureGuest: () => Promise<Guest>;
  rename: (name: string) => Promise<Guest>;
};

const GuestContext = createContext<GuestContextValue | null>(null);

type Props = {
  session: GuestSession;
  children?: ReactNode;
};

/** アプリ全体を包み、useGuest() で今のゲストを読めるようにする */
export function GuestProvider({ session, children }: Props) {
  const [state, setState] = useState<GuestState>({ status: "loading", guest: null });

  useEffect(() => {
    let active = true;
    session.get().then(
      (guest) => {
        if (active) {
          setState(guest ? { status: "ready", guest } : { status: "anonymous", guest: null });
        }
      },
      () => {
        if (active) setState({ status: "error", guest: null });
      }
    );
    return () => {
      active = false;
    };
  }, [session]);

  const ready = useCallback((guest: Guest) => {
    setState({ status: "ready", guest });
    return guest;
  }, []);

  const ensureGuest = useCallback(() => session.ensure().then(ready), [session, ready]);
  const rename = useCallback((name: string) => session.rename(name).then(ready), [session, ready]);

  const value = useMemo(() => ({ ...state, ensureGuest, rename }), [state, ensureGuest, rename]);

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest(): GuestContextValue {
  const value = useContext(GuestContext);
  if (value === null) {
    throw new Error("useGuest() は GuestProvider の中で使う");
  }
  return value;
}
