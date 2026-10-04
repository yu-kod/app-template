# テンプレートの使い方と方針

yu-kod のアプリを同じ土台で作るためのテンプレート。setnote（ログインのある Web アプリ）、
pop-art-trick / pusher-table（ログインなし・ロビーのあるオンラインゲーム）で育った部品のうち、
最も進んだものを集めている。

## 層の分け方

```
① 土台           — このリポジトリをコピーして使う（設定、CI、CLAUDE.md、skills、Terraform の組み立て）
② 共有部品       — packages/*（server-core / web-core / これから identity・game-platform）
                   infra/modules/*（static-site / http-api / app-table / これから cognito・websocket・scheduler）
③ アプリ固有     — apps/* の中身、docs/spec.md、CLAUDE.md の「このアプリ固有のルール」
```

- ① はテンプレートから作った時点で各アプリのものになる。以後は自由に変えてよい
- ② は「直したら全アプリに届けたい」部品。テンプレートの中で育て、安定したら独立したパッケージ・モジュールとして切り出す
- ③ はアプリごとにまったく違う

## テンプレートから作ったら

1. GitHub で「Use this template」からリポジトリを作る
2. `app-template` をアプリ名に置き換える

   ```bash
   grep -rn "app-template" --exclude-dir=node_modules --exclude=package-lock.json .
   ```

   | 場所 | 置き換えるもの |
   |---|---|
   | `package.json` | `name` |
   | `infra/main.tf` | `backend "s3"` のバケット名・ロックテーブル名 |
   | `infra/variables.tf` | `project_name` の既定値 |
   | `apps/web/index.html` | `<title>` |
   | `CLAUDE.md` / `README.md` | 見出しと説明 |

3. `npm install` し直して `package-lock.json` を更新する
4. `CLAUDE.md` の「このアプリ固有のルール」、`.claude/skills/coding-standards.md` の「0.」、
   `.claude/skills/ui-design.md` の「0.」を書く
5. GitHub のリポジトリ設定（下記）を行う
6. `docs/deploy.md` の「初回だけ必要な作業」で AWS 側を用意する

### GitHub のリポジトリ設定

`.claude/skills/pr-merge.md` の流れ（PR → CI → 自動マージ）が動くための設定。

- Settings → General → Pull Requests
  - 「Allow auto-merge」を有効にする
  - 「Automatically delete head branches」を有効にする
- Settings → Rules → Rulesets で `main` に対して
  - 「Require a pull request before merging」
  - 「Require status checks to pass」に **`ci`** を1つだけ指定する（`.github/workflows/ci.yml` の集約ジョブ）

## 認証（これから packages/identity として入れる）

「このリクエストは誰か」を1つの形で取れるようにし、アプリは方式を選ぶだけにする。

| 方式 | 使うアプリ | 資格情報 |
|---|---|---|
| アカウント | setnote 型 | Cognito のアクセストークン（`Authorization: Bearer`） |
| ゲスト | ゲーム型 | 名前登録で発行するゲストトークン（`Authorization: Bearer`）。DB にはハッシュだけを置く |

どちらも Hono のミドルウェアとして `c.var.identity` に入れる。

## ゲーム基盤（これから packages/game-platform として入れる）

pop-art-trick / pusher-table の比較から、次を共通部品にする（設計は three-marks で固める）。

- ルームの状態遷移（ロビー → 対戦中 → 終了）と、版番号つきの条件付き書き込み
- 期限・回数・取り消しのある招待 URL
- 席トークンでの再接続（同じ席に戻る）
- 手番のタイムアウト（EventBridge Scheduler）
- WebSocket での通知（送り先ごとに見えてよい情報だけを送る）
- ゲームの差し込み口（初期化・操作の適用・プレイヤーごとの見え方・終了判定）

## これから足すもの

- `packages/identity`（ゲスト / Cognito）と `infra/modules/cognito`
- `packages/game-platform` と `infra/modules/websocket` / `infra/modules/scheduler`
- Playwright の E2E（setnote の `frontend/e2e/` を移植）
- CI 失敗時の自動修復と Dependabot の自動マージ（setnote の `ci-gate.yml`）
