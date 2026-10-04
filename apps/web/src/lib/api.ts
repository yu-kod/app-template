import { createApiClient } from "@app/web-core";

/**
 * アプリ全体で使う API クライアント。
 *
 * 本番は CloudFront が /api/* を API Gateway へ流し、開発時は Vite が apps/api へ
 * プロキシするので、どちらも同じオリジンの相対パスで呼べる。
 */
export const api = createApiClient();
