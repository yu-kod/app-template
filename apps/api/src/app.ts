import { errorHandler, NotFoundError, requestLogger } from "@app/server-core";
import { Hono } from "hono";

/**
 * アプリが外から受け取る依存（保存先・外部サービスのクライアントなど）。
 *
 * 本番の値は環境変数から組み立て、テストでは直接渡して差し替える。
 * 機能を足すときはここに項目を増やし、createApp の中でルートへ配る。
 */
export type AppDeps = Record<string, never>;

/**
 * Hono アプリを組み立てる。
 *
 * Lambda（src/lambda.ts）とローカル開発（src/index.ts）の両方から同じアプリを使うため、
 * listen は呼び出し側に任せる。
 */
export function createApp(_deps: Partial<AppDeps> = {}) {
  const app = new Hono();

  app.use(requestLogger());
  app.onError(errorHandler);
  app.notFound((c) => {
    throw new NotFoundError(`${c.req.method} ${c.req.path} は存在しない`);
  });

  app.get("/api/health", (c) => c.json({ status: "ok" }));

  return app;
}
