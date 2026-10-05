import { ApiRequestError, type ApiClient, type JsonStorage } from "@app/web-core";

/** サーバー（@app/identity）の GuestIdentity と同じ形 */
export type Guest = { kind: "guest"; id: string; name: string };

/** サーバー（@app/identity）の GUEST_NAME_MAX_LENGTH と揃える */
export const GUEST_NAME_MAX_LENGTH = 20;

/** 既定の保存先のキー。同じドメインに複数のアプリを置くなら storageKey で分ける */
export const GUEST_TOKEN_KEY = "guest:token";

export type GuestSessionOptions = {
  api: ApiClient;
  storage: JsonStorage;
  storageKey?: string;
};

/**
 * ブラウザ側のゲストセッション。
 *
 * - トークンは localStorage に保存し、次に来たときも同じゲストとして扱う
 * - 名前は聞かない。何かをするときに ensure() で初めて登録し、仮の名前はサーバーが付ける
 * - 同時に呼ばれても登録は1回だけ（連打や StrictMode の二重実行で別人が増えない）
 * - トークンが失効していたら（401）捨てる。通信の失敗では捨てない
 */
export function createGuestSession({
  api,
  storage,
  storageKey = GUEST_TOKEN_KEY,
}: GuestSessionOptions) {
  /** 今わかっているゲスト。失敗したら捨てて、次の呼び出しでやり直す */
  let current: Promise<Guest | null> | null = null;

  const token = () => storage.get<string>(storageKey);

  function remember<T extends Guest | null>(promise: Promise<T>): Promise<T> {
    current = promise;
    promise.catch(() => {
      if (current === promise) current = null;
    });
    return promise;
  }

  async function fetchMe(): Promise<Guest | null> {
    const saved = token();
    if (saved === null) {
      return null;
    }
    try {
      const { guest } = await api.request<{ guest: Guest }>("/api/guests/me", { token: saved });
      return guest;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        storage.remove(storageKey);
        return null;
      }
      throw error;
    }
  }

  async function register(): Promise<Guest> {
    const { guest, token: issued } = await api.request<{ guest: Guest; token: string }>(
      "/api/guests",
      { method: "POST", body: {} }
    );
    storage.set(storageKey, issued);
    return guest;
  }

  function get(): Promise<Guest | null> {
    return current ?? remember(fetchMe());
  }

  function ensure(): Promise<Guest> {
    return remember(get().then((guest) => guest ?? register()));
  }

  async function rename(name: string): Promise<Guest> {
    await ensure();
    const { guest } = await api.request<{ guest: Guest }>("/api/guests/me", {
      method: "PATCH",
      body: { name },
      token: token(),
    });
    current = Promise.resolve(guest);
    return guest;
  }

  return { get, ensure, rename, token };
}

export type GuestSession = ReturnType<typeof createGuestSession>;
