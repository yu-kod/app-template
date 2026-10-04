import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Health = { status: "checking" } | { status: "ok" } | { status: "unreachable" };

/** トップページ。アプリを作り始めたら中身を差し替える */
export default function HomePage() {
  const [health, setHealth] = useState<Health>({ status: "checking" });

  useEffect(() => {
    api
      .request("/api/health")
      .then(() => setHealth({ status: "ok" }))
      .catch(() => setHealth({ status: "unreachable" }));
  }, []);

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold">App Template</h1>
      {health.status === "checking" && <p className="text-muted-foreground">API の状態を確認中…</p>}
      {health.status === "ok" && <p>API: 稼働中</p>}
      {health.status === "unreachable" && (
        <p role="alert" className="text-destructive">
          API に接続できない
        </p>
      )}
    </main>
  );
}
