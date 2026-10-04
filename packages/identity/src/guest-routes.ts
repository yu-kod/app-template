import { parseJson } from "@app/server-core";
import { Hono } from "hono";
import { z } from "zod";
import type { GuestService } from "./guest-service.js";
import { bearerToken, requireIdentity, type IdentityEnv } from "./middleware.js";

/** 画面に並べて崩れない長さ。アプリごとに変えたくなったら引数にする */
export const GUEST_NAME_MAX_LENGTH = 20;

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "名前を入力してください")
    .max(GUEST_NAME_MAX_LENGTH, `名前は${GUEST_NAME_MAX_LENGTH}文字以内にしてください`),
});

/**
 * ゲストの登録と、自分の情報の取得・変更。`/api/guests` にマウントする。
 *
 * 前段に identity([service.authenticate, ...]) を置くこと。
 */
export function createGuestRoutes(service: GuestService) {
  const routes = new Hono<IdentityEnv>();

  routes.post("/", async (c) => {
    const { name } = await parseJson(c, nameSchema);
    return c.json(await service.register(name), 201);
  });

  routes.get("/me", requireIdentity(), (c) => c.json({ guest: c.var.identity }));

  routes.patch("/me", requireIdentity(), async (c) => {
    const { name } = await parseJson(c, nameSchema);
    // requireIdentity を通っているのでトークンは必ずある
    const token = bearerToken(c.req.header("Authorization"))!;
    return c.json({ guest: await service.rename(token, name) });
  });

  return routes;
}
