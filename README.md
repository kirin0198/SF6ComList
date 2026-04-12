# SF6 ComboList

SF6（ストリートファイター6）の個人向けコンボ管理 Web アプリケーション。
ビジュアル UI（方向キーパッド + ボタンパレット）でコンボを組み立て、キャラクター別・タグ別に整理できます。

## Features

- **ビジュアルコンボ入力** -- 方向キーパッド + 6ボタンパレット + コネクターでコンボを直感的に組み立て
- **テンキー表記入力** -- `236P > 236236P` のようなテンキー表記テキストからの入力にも対応
- **キャラクター別管理** -- SF6 全キャラクターに対応。一覧はグリッド/リスト表示切替・ソート・お気に入り機能つき
- **タグベース整理** -- プリセットタグ 12 種 + ユーザー定義タグでコンボを分類・フィルタ
- **ダメージ値・メモ** -- 各コンボにダメージ値やメモを記録

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + React 19 + Tailwind CSS v4 |
| Backend | Next.js API Routes |
| Database | SQLite (Prisma ORM) |
| Auth | Auth.js (NextAuth v5) - Credentials Provider |
| Testing | Vitest + Testing Library + Playwright (E2E) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Create database & apply schema
npx prisma db push

# Seed preset tags
npx prisma db seed

# Start dev server
npm run dev
```

Open http://localhost:3000 to access the app.

### Docker

```bash
# Create .env (AUTH_SECRET is required)
cp .env.example .env
# Generate a secret:
# openssl rand -base64 32

# Build and start
docker-compose up --build -d
```

## Project Structure

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

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests (Vitest) |
| `npm run lint` | Run ESLint |
| `npx playwright test` | Run E2E tests |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |

## License

[MIT](LICENSE)
