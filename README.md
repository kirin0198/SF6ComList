# SF6 ComboList

[![CI](https://github.com/kirin0198/SF6ComList/actions/workflows/ci.yml/badge.svg)](https://github.com/kirin0198/SF6ComList/actions/workflows/ci.yml)
[![Deploy to Cloud Run](https://github.com/kirin0198/SF6ComList/actions/workflows/deploy.yml/badge.svg)](https://github.com/kirin0198/SF6ComList/actions/workflows/deploy.yml)

ストリートファイター6（SF6）のコンボ管理 Web アプリケーションです。
ビジュアル UI でコンボを組み立て、キャラクター別・タグ別に整理できます。

**https://sf6labs.com**

## 使い方

### 1. アカウント登録

サイトにアクセスし、メールアドレスとパスワードでアカウントを作成してください。

### 2. キャラクターを選ぶ

ログイン後、キャラクター一覧から登録したいキャラクターを選択します。
よく使うキャラクターはお気に入りに登録すると、一覧の上部に表示されます。

### 3. コンボを登録する

2 つの入力方法があります。

- **ビジュアル入力** -- 方向キーパッド + 6 ボタンパレット + コネクターで直感的に組み立て
- **テンキー表記入力** -- `236P > 236236P` のようなテキスト入力にも対応

各コンボにはダメージ値やメモを記録できます。

### 4. タグで整理する

プリセットタグ 12 種（基本コンボ、画面端、対空など）に加え、自分だけのタグを作成してコンボを分類できます。
タグでフィルタリングすれば、目的のコンボをすぐに見つけられます。

## 機能一覧

- **ビジュアルコンボ入力** -- 方向キーパッド + 6 ボタンパレット + コネクターで組み立て
- **テンキー表記入力** -- テキストベースの入力にも対応
- **キャラクター別管理** -- SF6 全キャラクターに対応、グリッド / リスト表示切替・ソート
- **お気に入り機能** -- よく使うキャラクターを上部に固定
- **タグベース整理** -- プリセットタグ + ユーザー定義タグで分類・フィルタ
- **ダメージ値・メモ** -- 各コンボに補足情報を記録

---

## セルフホスティング

自分の環境でデプロイしたい場合の手順です。

### 必要な環境

- Node.js 20+
- npm

### ローカル開発

```bash
# 依存関係のインストール
npm install

# Prisma Client の生成
npx prisma generate

# データベースの作成・スキーマ適用
npx prisma db push

# プリセットタグの投入
npx prisma db seed

# 開発サーバーの起動
npm run dev
```

http://localhost:3000 でアクセスできます。

### Docker

```bash
# 環境変数ファイルの作成
cp .env.example .env
# AUTH_SECRET を生成して .env に設定:
#   openssl rand -base64 32

# ビルド・起動
docker-compose up --build -d
```

### 技術スタック

| レイヤー       | 技術                                              |
| -------------- | ------------------------------------------------- |
| フロントエンド | Next.js (App Router) + React 19 + Tailwind CSS v4 |
| バックエンド   | Next.js API Routes                                |
| データベース   | SQLite (Prisma ORM)                               |
| 認証           | Auth.js (NextAuth v5) - Credentials Provider      |
| テスト         | Vitest + Testing Library + Playwright (E2E)       |

### プロジェクト構成

```
src/
  app/                  # Next.js App Router pages & API routes
  components/           # React components
    character/          #   Character list, card, favorites
    combo/              #   Combo form, input UI, preview
    icons/              #   Direction, button, connector icons
    input/              #   Direction pad, button palette
    tag/                #   Tag selector, filter bar
    ui/                 #   Shared UI components
  lib/                  # Business logic & utilities
    combo/              #   Notation converter, validation
    validators/         #   Zod schemas
  data/                 # Static data (characters.json, preset tags)
prisma/                 # Schema & seed
tests/                  # E2E tests (Playwright)
docs/                   # Design documents
```

### スクリプト

| コマンド              | 説明                    |
| --------------------- | ----------------------- |
| `npm run dev`         | 開発サーバーの起動      |
| `npm run build`       | プロダクションビルド    |
| `npm test`            | ユニットテスト (Vitest) |
| `npm run lint`        | ESLint の実行           |
| `npx playwright test` | E2E テストの実行        |
| `npx prisma studio`   | Prisma Studio (DB GUI)  |

## License

[MIT](LICENSE)
