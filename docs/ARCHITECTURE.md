# アーキテクチャ設計書: SF6 コンボ帳

> 参照元: SPEC.md (2026-04-12), UI_SPEC.md (2026-04-12), DISCOVERY_RESULT.md (2026-04-08), POC_RESULT.md (2026-04-08)
> 作成日: 2026-04-08
> 更新履歴:
>
> - 2026-04-08: 初版作成
> - 2026-04-12: コマンドリスト入力モード追加 (ISSUE-001 / UC-013)
> - 2026-04-18: ISSUE-009 に基づく派生技（follow-up moves）設計の追加（セクション 15.1 / 15.4 / 15.5 新項目 / 17 ISSUE-009 実装フェーズ詳細）

---

## 1. アーキテクチャ概要

### システム構成図

```
+--------------------------------------------------+
|                   Browser                        |
|                                                  |
|  +--------------------------------------------+  |
|  |         Next.js (App Router)               |  |
|  |                                            |  |
|  |  [Server Components]  [Client Components]  |  |
|  |   - キャラ一覧        - コンボ入力UI       |  |
|  |   - コンボ一覧        - タグフィルタ       |  |
|  |   - コンボ詳細        - フォーム           |  |
|  |   - レイアウト        - プレビュー         |  |
|  |                       - コマンドリスト入力   |  |
|  +--------------------------------------------+  |
|               |                                  |
|               v                                  |
|  +--------------------------------------------+  |
|  |     Next.js Route Handlers (API)           |  |
|  |                                            |  |
|  |  /api/auth/[...nextauth]  (Auth.js)        |  |
|  |  /api/auth/register       (ユーザー登録)    |  |
|  |  /api/combos/*            (コンボCRUD)      |  |
|  |  /api/tags/*              (タグCRUD)        |  |
|  +--------------------------------------------+  |
|               |                                  |
|               v                                  |
|  +--------------------------------------------+  |
|  |     Prisma ORM                             |  |
|  |     + Auth.js Prisma Adapter               |  |
|  +--------------------------------------------+  |
|               |                                  |
|               v                                  |
|  +--------------------------------------------+  |
|  |     SQLite (./data/sf6combo.db)            |  |
|  |     ボリュームマウントで永続化              |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+

+--------------------------------------------------+
|               docker-compose                     |
|  +--------------------------------------------+  |
|  |  app (Node.js 20 LTS)                     |  |
|  |   - Next.js dev server (port 3000)        |  |
|  |   - volumes: ./data:/app/data             |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+

+--------------------------------------------------+
|          静的データ（JSONファイル）                 |
|  +--------------------------------------------+  |
|  |  src/data/characters.json                  |  |
|  |   - 全30キャラクターのマスタデータ           |  |
|  |  src/data/preset-tags.json                 |  |
|  |   - プリセットタグ12種の定義                |  |
|  |  src/data/command-lists/{characterId}.json  |  |
|  |   - キャラクター別コマンドリストデータ       |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

### 採用アーキテクチャパターン

**フルスタックモノリス（Next.js App Router）**

- フロントエンドとバックエンドを単一の Next.js アプリケーションに統合する
- Server Components でデータフェッチとレンダリングを統合し、Client Components はインタラクティブな部分（コンボ入力UI等）に限定する
- Route Handlers で REST API を提供し、Server Components から直接 Prisma を呼び出すパターンと併用する

選定理由は ADR-001 に記載。

### 技術スタック

| 層                 | 技術                     | バージョン | 選定理由                                                                                                         |
| ------------------ | ------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| ランタイム         | Node.js                  | 20 LTS     | 安定版 LTS。Next.js の推奨ランタイム                                                                             |
| フレームワーク     | Next.js (App Router)     | 15.x       | PoCでReactコンポーネント実装パターンが確立済み。APIルートとSSRの統合によりモノリス構成が可能                     |
| UIライブラリ       | React                    | 19.x       | Next.js 15 のデフォルト。Server Components 対応                                                                  |
| 言語               | TypeScript               | 5.x        | PoCの複雑な型定義（Direction Union型、ComboStep Discriminated Union等）を型安全に管理するために必須              |
| スタイリング       | Tailwind CSS             | 4.x        | PoCでボタン色分けの型安全な管理パターン（colorClass）が実証済み。ダークテーマのカスタマイズが容易                |
| 認証               | Auth.js (NextAuth.js v5) | 5.x (beta) | Next.js App Router との統合が最も成熟。Credentials Provider でメール/パスワード認証を実装。将来のOAuth追加も容易 |
| ORM                | Prisma                   | 6.x        | TypeScript 対応のスキーマ駆動 ORM。Json 型フィールドでコンボシーケンスを格納可能。マイグレーション機能内蔵       |
| DB                 | SQLite                   | 3.x        | ローカル環境前提で Docker 不要の軽量DB。Prisma の抽象化により将来 PostgreSQL へ移行可能                          |
| パスワードハッシュ | bcrypt (bcryptjs)        | 2.x        | 純 JavaScript 実装で native addon 不要。Auth.js の Credentials Provider と組み合わせて使用                       |
| UIアイコン         | Lucide React             | latest     | MIT ライセンス。軽量な SVG アイコンライブラリ。UI_SPEC.md で指定済み                                             |
| フォーム           | React Hook Form + Zod    | latest     | バリデーションスキーマの型安全な定義。サーバー/クライアント両方で共有可能                                        |
| パッケージ管理     | npm                      | 10.x       | Next.js エコシステムの標準。lock ファイルによる再現性確保                                                        |
| コンテナ           | Docker + docker-compose  | latest     | ローカル環境のワンコマンド起動                                                                                   |
| Lint / Format      | ESLint + Prettier        | latest     | Next.js 標準の lint 構成 + コードフォーマット統一                                                                |

### 主要ライブラリ一覧

| ライブラリ                  | 用途                        | 採用理由                                                                          |
| --------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| next                        | フレームワーク              | App Router による SSR/RSC + API 統合                                              |
| react / react-dom           | UI ライブラリ               | Next.js のデフォルト                                                              |
| typescript                  | 型チェック                  | PoCの複雑な型定義に必須                                                           |
| tailwindcss                 | スタイリング                | UI_SPEC.md で全コンポーネントのスタイルが Tailwind クラスで定義済み               |
| next-auth (@auth/core)      | 認証                        | Credentials Provider + Prisma Adapter                                             |
| @auth/prisma-adapter        | Auth.js の Prisma 統合      | セッション・アカウントの DB 永続化                                                |
| prisma / @prisma/client     | ORM                         | スキーマ駆動。Json 型でコンボシーケンスを格納                                     |
| bcryptjs                    | パスワードハッシュ          | 純 JS 実装。Docker 環境での native build 不要                                     |
| zod                         | バリデーション              | API リクエスト・フォーム入力の型安全なバリデーション。サーバー/クライアント共有   |
| react-hook-form             | フォーム管理                | 非制御コンポーネントベースで高パフォーマンス。Zod との統合（@hookform/resolvers） |
| @hookform/resolvers         | Zod 統合                    | react-hook-form と Zod の接続                                                     |
| lucide-react                | UIアイコン                  | UI_SPEC.md で指定。Pencil, Trash2, Plus, Search, LogOut 等                        |
| eslint                      | Lint                        | Next.js 標準構成（eslint-config-next）                                            |
| prettier                    | Format                      | コードフォーマット統一                                                            |
| prettier-plugin-tailwindcss | Tailwind クラスの並び順整理 | クラスの一貫した並び順を自動化                                                    |

---

## 2. ディレクトリ構造

```
SF6ComList/
├── .env.local                    # 環境変数（Git管理外）
├── .env.example                  # 環境変数テンプレート
├── docker-compose.yml            # ローカル開発環境定義
├── Dockerfile                    # コンテナイメージ定義
├── next.config.ts                # Next.js 設定
├── tailwind.config.ts            # Tailwind CSS 設定（カスタムアニメーション含む）
├── tsconfig.json                 # TypeScript 設定
├── package.json                  # 依存関係・スクリプト定義
├── prisma/
│   ├── schema.prisma             # Prisma スキーマ定義
│   ├── seed.ts                   # 初期データ投入（プリセットタグ）
│   └── migrations/               # マイグレーションファイル
├── data/                         # SQLite DB ファイル格納（docker volume マウント先）
│   └── sf6combo.db               # SQLite データベースファイル（Git管理外）
├── public/                       # 静的アセット
│   └── icons/                    # SVG アイコン（方向キー・ボタン等）
├── src/
│   ├── app/                      # Next.js App Router ページ群
│   │   ├── layout.tsx            # ルートレイアウト（フォント・メタデータ・Providers）
│   │   ├── globals.css           # グローバルCSS（Tailwind directives）
│   │   ├── login/
│   │   │   └── page.tsx          # SCR-001: ログイン画面
│   │   ├── register/
│   │   │   └── page.tsx          # SCR-002: ユーザー登録画面
│   │   ├── (authenticated)/      # 認証必須レイアウトグループ
│   │   │   ├── layout.tsx        # 認証チェック + AppHeader + AppFooter
│   │   │   ├── page.tsx          # SCR-003: キャラクター一覧（トップ）
│   │   │   └── characters/
│   │   │       └── [characterId]/
│   │   │           └── combos/
│   │   │               ├── page.tsx          # SCR-004: コンボ一覧
│   │   │               ├── new/
│   │   │               │   └── page.tsx      # SCR-005: コンボ登録
│   │   │               └── [comboId]/
│   │   │                   ├── page.tsx      # SCR-006: コンボ詳細
│   │   │                   └── edit/
│   │   │                       └── page.tsx  # SCR-007: コンボ編集
│   │   └── api/                  # Route Handlers
│   │       ├── auth/
│   │       │   ├── [...nextauth]/
│   │       │   │   └── route.ts  # Auth.js ハンドラ
│   │       │   └── register/
│   │       │       └── route.ts  # ユーザー登録 API
│   │       ├── characters/
│   │       │   ├── route.ts      # GET /api/characters
│   │       │   └── [characterId]/
│   │       │       └── combos/
│   │       │           └── route.ts  # GET/POST /api/characters/[characterId]/combos
│   │       ├── combos/
│   │       │   └── [comboId]/
│   │       │       └── route.ts  # GET/PUT/DELETE /api/combos/[comboId]
│   │       └── tags/
│   │           └── route.ts      # GET/POST /api/tags
│   ├── lib/                      # ビジネスロジック・ユーティリティ
│   │   ├── auth.ts               # Auth.js 設定（authOptions）
│   │   ├── prisma.ts             # Prisma Client シングルトン
│   │   ├── combo/
│   │   │   ├── types.ts          # コンボ関連の型定義（PoCから移植）
│   │   │   ├── notation-converter.ts  # テンキー表記変換ロジック（PoCから移植）
│   │   │   ├── command-list-types.ts  # コマンドリスト型定義（ISSUE-001 追加）
│   │   │   └── validation.ts     # コンボデータのバリデーションスキーマ（Zod）
│   │   └── validators/
│   │       ├── auth.ts           # 認証関連バリデーション（Zod）
│   │       └── tag.ts            # タグ関連バリデーション（Zod）
│   ├── components/               # React コンポーネント
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx     # 共通ヘッダー（Server Component）
│   │   │   └── AppFooter.tsx     # 共通フッター（Server Component）
│   │   ├── combo/
│   │   │   ├── ComboInputUI.tsx          # ビジュアルコンボ入力UI（Client Component）
│   │   │   ├── ComboTextInput.tsx        # テンキー表記テキスト入力（Client Component）
│   │   │   ├── ComboSequencePreview.tsx  # コンボプレビュー表示（Client Component）
│   │   │   ├── ComboCard.tsx             # コンボカード（Server Component）
│   │   │   ├── ComboForm.tsx             # コンボ登録/編集フォーム（Client Component）
│   │   │   └── ComboStepView.tsx         # 1ステップの表示（Server Component）
│   │   ├── input/
│   │   │   ├── DirectionPad.tsx          # 方向キーパッド（Client Component）
│   │   │   ├── ButtonPalette.tsx         # ボタンパレット（Client Component）
│   │   │   ├── ConnectorSelector.tsx     # コネクターセレクター（Client Component）
│   │   │   └── CommandListPanel.tsx      # コマンドリスト入力パネル（Client Component）（ISSUE-001 追加）
│   │   ├── tag/
│   │   │   ├── TagSelector.tsx           # タグ選択（Client Component）
│   │   │   └── TagFilterBar.tsx          # タグフィルタバー（Client Component）
│   │   ├── character/
│   │   │   └── CharacterCard.tsx         # キャラクターカード（Server Component）
│   │   ├── ui/
│   │   │   ├── InputField.tsx            # 汎用入力フィールド
│   │   │   ├── Button.tsx                # 汎用ボタン
│   │   │   ├── ConfirmDialog.tsx         # 確認ダイアログ（Client Component）
│   │   │   └── Toast.tsx                 # トースト通知（Client Component）
│   │   └── icons/
│   │       ├── DirectionIcon.tsx         # 方向アイコン SVG コンポーネント
│   │       └── ButtonIcon.tsx            # ボタンアイコン SVG コンポーネント
│   ├── data/                     # 静的マスタデータ
│   │   ├── characters.json       # 全30キャラクターデータ
│   │   ├── preset-tags.ts        # プリセットタグ12種の定義（型付き）
│   │   └── command-lists/        # キャラクター別コマンドリストデータ（ISSUE-001 追加）
│   │       └── ryu.json          # リュウのコマンドリスト（初期データ）
│   └── types/                    # グローバル型定義
│       └── next-auth.d.ts        # Auth.js のセッション型拡張
└── poc/                          # PoC コード（参照用として保持）
    ├── combo-data-model.ts
    ├── notation-converter.ts
    ├── ComboInputUI.tsx
    ├── ComboDisplay.tsx
    └── notation-converter.test.mjs
```

### PoCコードの再配置先

| PoCファイル               | 移植先                                                                               | 変更内容                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| poc/combo-data-model.ts   | src/lib/combo/types.ts                                                               | 型定義を維持。Combo エンティティ型は Prisma 生成型に置換。アイコンマッピングは src/components/icons/ に分離 |
| poc/notation-converter.ts | src/lib/combo/notation-converter.ts                                                  | ロジックをそのまま移植。import パスを変更                                                                   |
| poc/ComboInputUI.tsx      | src/components/combo/ComboInputUI.tsx + src/components/input/\*.tsx                  | メインコンポーネントを分割。DirectionPad, ButtonPalette, ConnectorSelector を個別ファイルに分離             |
| poc/ComboDisplay.tsx      | src/components/combo/ComboCard.tsx + ComboStepView.tsx + src/components/icons/\*.tsx | 表示コンポーネントを分割。アイコンコンポーネントを独立化                                                    |

---

## 3. モジュール設計

### 3.1 認証モジュール (`src/lib/auth.ts` + `src/app/api/auth/`)

- **責務:** ユーザー認証・セッション管理・ユーザー登録
- **依存関係:** Auth.js, Prisma, bcryptjs
- **公開インターフェース:**
  - `auth` -- Auth.js のメイン設定オブジェクト（authOptions）
  - `signIn()` / `signOut()` -- Auth.js のクライアントサイド関数
  - `getServerSession()` -- Server Components / Route Handlers でのセッション取得
  - `POST /api/auth/register` -- ユーザー登録エンドポイント

### 3.2 コンボモジュール (`src/lib/combo/` + `src/app/api/combos/`)

- **責務:** コンボデータの型定義・バリデーション・変換・永続化
- **依存関係:** Prisma, Zod
- **公開インターフェース:**
  - `ComboSequence`, `ComboStep`, `NormalInput`, `ChargeInput`, `ConnectorStep` 等の型定義
  - `parseNotation(notation: string): ComboSequence` -- テンキー表記文字列をパース
  - `serializeNotation(sequence: ComboSequence): string` -- ComboSequence をテンキー表記に変換
  - `comboCreateSchema` / `comboUpdateSchema` -- Zod バリデーションスキーマ
  - Route Handlers: コンボの CRUD API

### 3.3 タグモジュール (`src/data/preset-tags.ts` + `src/app/api/tags/`)

- **責務:** プリセットタグの定義・ユーザー定義タグの CRUD
- **依存関係:** Prisma, Zod
- **公開インターフェース:**
  - `PRESET_TAGS` -- プリセットタグ12種の定数定義
  - `tagCreateSchema` -- Zod バリデーションスキーマ
  - Route Handlers: タグの一覧取得・作成 API

### 3.4 キャラクターモジュール (`src/data/characters.json`)

- **責務:** SF6 キャラクターマスタデータの管理
- **依存関係:** なし（静的 JSON データ）
- **公開インターフェース:**
  - `characters.json` -- 全30キャラクターの静的データ
  - `getActiveCharacters()` -- active ステータスのキャラクターのみ取得するヘルパー

### 3.5 UIコンポーネントモジュール (`src/components/`)

- **責務:** 全画面のUI表示・ユーザーインタラクション
- **依存関係:** React, Tailwind CSS, Lucide React, react-hook-form, Zod
- **公開インターフェース:**
  - 各コンポーネントの Props インターフェース（UI_SPEC.md に準拠）

### 3.6 コマンドリストモジュール (`src/lib/combo/command-list-types.ts` + `src/data/command-lists/`)

> ISSUE-001 (2026-04-12) で追加

- **責務:** キャラクター別コマンドリストデータの型定義・読み込み・キャッシュ
- **依存関係:** `src/lib/combo/types.ts`（ComboStep, NormalInput, Direction, ButtonInput 等）
- **公開インターフェース:**
  - `CommandMove` -- 1つの技を表す型（技名・表記・カテゴリ・ステップ・強度バリアント・派生技）
  - `CommandCategory` -- 技カテゴリの型
  - `CharacterCommandList` -- 1キャラクター分のコマンドリスト型
  - `loadCommandList(characterId: string): Promise<CharacterCommandList | null>` -- 遅延読み込み関数

詳細設計はセクション 15 を参照。

---

## 4. データモデル（Prisma スキーマ）

### schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  combos   Combo[]
  tags     Tag[]
  sessions Session[]
  accounts Account[]

  @@map("users")
}

// Auth.js が要求するテーブル
model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model Combo {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  characterId String   @map("character_id")
  name        String?
  sequence    String   // JSON 文字列（SQLite は Json 型をサポートしないため String で格納）
  notation    String   // テンキー表記文字列（検索・表示用）
  damage      Int?
  memo        String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags ComboTag[]

  @@index([userId, characterId])
  @@index([userId])
  @@map("combos")
}

model Tag {
  id       String  @id @default(cuid())
  name     String
  isPreset Boolean @default(false) @map("is_preset")
  userId   String? @map("user_id")

  user   User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  combos ComboTag[]

  @@unique([name, userId])
  @@map("tags")
}

model ComboTag {
  comboId String @map("combo_id")
  tagId   String @map("tag_id")

  combo Combo @relation(fields: [comboId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([comboId, tagId])
  @@map("combo_tags")
}
```

### データモデル設計の補足

- **sequence カラム:** SQLite は JSON 型をネイティブサポートしないため、`String` 型で JSON 文字列として格納する。アプリケーション層で `JSON.parse()` / `JSON.stringify()` により `ComboSequence` 型と相互変換する。PostgreSQL 移行時は `Json` 型に変更する。
- **notation カラム:** テンキー表記文字列を別カラムとして保持する。全文検索・表示の高速化のため、sequence JSON からの都度変換を避ける。
- **characterId:** キャラクターデータは JSON マスタファイルで管理するため、外部キー制約は設けない。文字列型（"ryu", "ken" 等）でアプリケーションレベルの整合性を担保する。
- **Tag のユニーク制約:** `[name, userId]` の複合ユニーク。プリセットタグ（userId = null）と各ユーザーのタグが同名でも衝突しない。
- **Auth.js テーブル:** Account, Session, VerificationToken は Auth.js の Prisma Adapter が要求するテーブル。将来の OAuth 対応で Account テーブルを使用する。
- **コマンドリストデータ:** DB には格納しない。静的 JSON ファイルとしてリポジトリに含める。理由は ADR-006 に記載。

### インデックス

| テーブル | インデックス              | 用途                                 |
| -------- | ------------------------- | ------------------------------------ |
| combos   | `[userId, characterId]`   | キャラクター別コンボ一覧取得の高速化 |
| combos   | `[userId]`                | ユーザーの全コンボ取得               |
| tags     | `[name, userId]` (UNIQUE) | タグ名の重複防止                     |
| users    | `[email]` (UNIQUE)        | ログイン時のメール検索               |

### キャラクターマスタデータ (`src/data/characters.json`)

```json
[
  { "id": "ryu", "name": "リュウ", "nameEn": "Ryu", "status": "active" },
  { "id": "luke", "name": "ルーク", "nameEn": "Luke", "status": "active" },
  {
    "id": "jamie",
    "name": "ジェイミー",
    "nameEn": "Jamie",
    "status": "active"
  },
  { "id": "chun-li", "name": "春麗", "nameEn": "Chun-Li", "status": "active" },
  { "id": "guile", "name": "ガイル", "nameEn": "Guile", "status": "active" },
  {
    "id": "kimberly",
    "name": "キンバリー",
    "nameEn": "Kimberly",
    "status": "active"
  },
  { "id": "juri", "name": "ジュリ", "nameEn": "Juri", "status": "active" },
  { "id": "ken", "name": "ケン", "nameEn": "Ken", "status": "active" },
  {
    "id": "blanka",
    "name": "ブランカ",
    "nameEn": "Blanka",
    "status": "active"
  },
  {
    "id": "dhalsim",
    "name": "ダルシム",
    "nameEn": "Dhalsim",
    "status": "active"
  },
  { "id": "honda", "name": "E.本田", "nameEn": "E. Honda", "status": "active" },
  {
    "id": "dee-jay",
    "name": "ディージェイ",
    "nameEn": "Dee Jay",
    "status": "active"
  },
  { "id": "manon", "name": "マノン", "nameEn": "Manon", "status": "active" },
  {
    "id": "marisa",
    "name": "マリーザ",
    "nameEn": "Marisa",
    "status": "active"
  },
  { "id": "jp", "name": "JP", "nameEn": "JP", "status": "active" },
  {
    "id": "zangief",
    "name": "ザンギエフ",
    "nameEn": "Zangief",
    "status": "active"
  },
  { "id": "lily", "name": "リリー", "nameEn": "Lily", "status": "active" },
  { "id": "cammy", "name": "キャミィ", "nameEn": "Cammy", "status": "active" },
  {
    "id": "rashid",
    "name": "ラシード",
    "nameEn": "Rashid",
    "status": "active"
  },
  { "id": "aki", "name": "A.K.I.", "nameEn": "A.K.I.", "status": "active" },
  { "id": "ed", "name": "エド", "nameEn": "Ed", "status": "active" },
  { "id": "akuma", "name": "豪鬼", "nameEn": "Akuma", "status": "active" },
  { "id": "m-bison", "name": "ベガ", "nameEn": "M. Bison", "status": "active" },
  { "id": "terry", "name": "テリー", "nameEn": "Terry", "status": "active" },
  { "id": "mai", "name": "不知火舞", "nameEn": "Mai", "status": "active" },
  { "id": "elena", "name": "エレナ", "nameEn": "Elena", "status": "active" },
  {
    "id": "gouki",
    "name": "豪鬼（真）",
    "nameEn": "Gouki",
    "status": "active"
  },
  { "id": "yun", "name": "ユン", "nameEn": "Yun", "status": "active" },
  { "id": "yang", "name": "ヤン", "nameEn": "Yang", "status": "active" },
  {
    "id": "ingrid",
    "name": "イングリッド",
    "nameEn": "Ingrid",
    "status": "upcoming"
  }
]
```

注: 上記のキャラクター一覧は RESEARCH_RESULT.md 参照。イングリッド（#30）は `upcoming` ステータスとし、一覧画面に表示しない。キャラクターの追加・ステータス変更はこの JSON ファイルの手動編集で対応する。

### プリセットタグ定義 (`src/data/preset-tags.ts`)

```typescript
export const PRESET_TAGS = [
  { id: "preset-bnb", name: "BnB" },
  { id: "preset-corner", name: "画面端" },
  { id: "preset-midscreen", name: "画面中央" },
  { id: "preset-drive-rush", name: "DR" },
  { id: "preset-punish-counter", name: "パニカン始動" },
  { id: "preset-counter-hit", name: "CH始動" },
  { id: "preset-anti-air", name: "対空" },
  { id: "preset-sa1", name: "SA1" },
  { id: "preset-sa2", name: "SA2" },
  { id: "preset-sa3", name: "SA3" },
  { id: "preset-throw", name: "投げ" },
  { id: "preset-od", name: "OD使用" },
] as const;
```

プリセットタグは `prisma/seed.ts` で DB に初期投入する。`id` を固定文字列にすることで、seed 再実行時の冪等性を確保する。

---

## 5. API設計

Next.js App Router の Route Handlers で実装する。全 API は JSON リクエスト/レスポンス。

### 5.1 認証 API

#### POST /api/auth/register

ユーザー新規登録。Auth.js の管理外エンドポイント。

- **認証:** 不要
- **リクエスト:**
  ```typescript
  {
    email: string;       // 必須、メール形式
    password: string;    // 必須、8文字以上
    name?: string;       // 任意
  }
  ```
- **レスポンス (201 Created):**
  ```typescript
  {
    id: string;
    email: string;
    name: string | null;
  }
  ```
- **エラーコード:**
  - 400: バリデーションエラー（メール形式不正、パスワード短すぎ）
  - 409: メールアドレス重複

#### Auth.js エンドポイント (/api/auth/[...nextauth])

Auth.js が自動生成するエンドポイント群。

- `POST /api/auth/callback/credentials` -- ログイン
- `POST /api/auth/signout` -- ログアウト
- `GET /api/auth/session` -- セッション取得

### 5.2 キャラクター API

#### GET /api/characters

キャラクター一覧取得。JSON マスタデータを返す。

- **認証:** 必須
- **クエリパラメータ:** なし
- **レスポンス (200):**
  ```typescript
  {
    characters: Array<{
      id: string;
      name: string;
      nameEn: string;
      status: "active" | "upcoming";
      comboCount: number; // ログインユーザーの登録コンボ数
    }>;
  }
  ```

### 5.3 コンボ API

#### GET /api/characters/[characterId]/combos

キャラクター別コンボ一覧取得。

- **認証:** 必須
- **クエリパラメータ:**
  - `tags` (任意): カンマ区切りのタグID。OR条件でフィルタ
- **レスポンス (200):**
  ```typescript
  {
    combos: Array<{
      id: string;
      characterId: string;
      name: string | null;
      sequence: ComboSequence; // JSON パース済み
      notation: string;
      damage: number | null;
      memo: string | null;
      tags: Array<{ id: string; name: string; isPreset: boolean }>;
      createdAt: string; // ISO 8601
      updatedAt: string;
    }>;
  }
  ```

#### POST /api/characters/[characterId]/combos

コンボ新規登録。

- **認証:** 必須
- **リクエスト:**
  ```typescript
  {
    name?: string;              // 任意、最大100文字
    sequence: ComboSequence;    // 必須、1ステップ以上
    damage?: number;            // 任意、0以上の整数
    memo?: string;              // 任意、最大1000文字
    tagIds?: string[];          // 任意、タグIDの配列
  }
  ```
- **レスポンス (201 Created):** コンボ詳細（GET /api/combos/[comboId] と同形式）
- **エラーコード:**
  - 400: バリデーションエラー
  - 404: キャラクターIDが不正

#### GET /api/combos/[comboId]

コンボ詳細取得。

- **認証:** 必須（所有者チェック）
- **レスポンス (200):**
  ```typescript
  {
    id: string;
    userId: string;
    characterId: string;
    name: string | null;
    sequence: ComboSequence;
    notation: string;
    damage: number | null;
    memo: string | null;
    tags: Array<{ id: string; name: string; isPreset: boolean }>;
    createdAt: string;
    updatedAt: string;
  }
  ```
- **エラーコード:**
  - 404: コンボが存在しない、または他ユーザーのコンボ

#### PUT /api/combos/[comboId]

コンボ更新。

- **認証:** 必須（所有者チェック）
- **リクエスト:** POST と同形式（全フィールド任意、指定したフィールドのみ更新）
- **レスポンス (200):** 更新後のコンボ詳細
- **エラーコード:**
  - 400: バリデーションエラー
  - 403: 他ユーザーのコンボを更新しようとした
  - 404: コンボが存在しない

#### DELETE /api/combos/[comboId]

コンボ削除。

- **認証:** 必須（所有者チェック）
- **レスポンス (204 No Content):** ボディなし
- **エラーコード:**
  - 403: 他ユーザーのコンボを削除しようとした
  - 404: コンボが存在しない

### 5.4 タグ API

#### GET /api/tags

タグ一覧取得（プリセット + ユーザー定義）。

- **認証:** 必須
- **レスポンス (200):**
  ```typescript
  {
    tags: Array<{
      id: string;
      name: string;
      isPreset: boolean;
    }>;
  }
  ```

#### POST /api/tags

ユーザー定義タグ作成。

- **認証:** 必須
- **リクエスト:**
  ```typescript
  {
    name: string; // 必須、1〜30文字
  }
  ```
- **レスポンス (201 Created):**
  ```typescript
  {
    id: string;
    name: string;
    isPreset: false;
  }
  ```
- **エラーコード:**
  - 400: バリデーションエラー（名前が空、30文字超過）
  - 409: 同名タグ既存

### 5.5 認証ミドルウェア

Next.js の `middleware.ts`（ルートレベル）で認証チェックを実装する。

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");

  // 未認証で認証必須ページにアクセス → ログインへリダイレクト
  if (!isLoggedIn && !isAuthPage && !isApiAuth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 認証済みでログイン/登録ページにアクセス → トップへリダイレクト
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons).*)"],
};
```

### 5.6 API 共通パターン

#### 所有者チェック

コンボ・タグの操作時は、必ずログインユーザーの ID と所有者 ID を比較する。

```typescript
// 共通パターン（Route Handler 内）
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const combo = await prisma.combo.findUnique({ where: { id: comboId } });
if (!combo || combo.userId !== session.user.id) {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
```

#### エラーレスポンス形式

```typescript
{
  error: string;           // エラーメッセージ
  details?: ZodError[];    // バリデーションエラーの詳細（400 の場合）
}
```

---

## 6. 状態管理設計

### Server Components vs Client Components の使い分け

| コンポーネント                                 | 種別                              | 理由                                                                    |
| ---------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| RootLayout, AuthenticatedLayout                | Server                            | 静的レイアウト。認証状態はサーバーで判定                                |
| AppHeader                                      | Server                            | セッション情報をサーバーで取得。ログアウトボタンのみ Client             |
| AppFooter                                      | Server                            | 静的コンテンツ                                                          |
| キャラクター一覧ページ                         | Server                            | キャラクターデータの読み込みとコンボ数集計をサーバーで実行              |
| CharacterCard                                  | Server                            | 静的表示。クリックは `<Link>` で実現                                    |
| コンボ一覧ページ                               | Server                            | コンボデータ取得をサーバーで実行                                        |
| ComboCard                                      | Server                            | コンボデータの静的表示                                                  |
| TagFilterBar                                   | Client                            | タグフィルタのインタラクティブな切り替え。URLクエリパラメータで状態管理 |
| コンボ登録/編集ページ                          | Server (外枠) + Client (フォーム) | 外枠は Server Component。フォーム全体は Client Component                |
| ComboInputUI                                   | Client                            | 複雑なインタラクティブ状態（ドラフト・ステップ管理）                    |
| ComboTextInput                                 | Client                            | リアルタイムパース・プレビュー連携                                      |
| CommandListPanel                               | Client                            | コマンドリスト読み込み・技選択インタラクション（ISSUE-001 追加）        |
| ComboSequencePreview                           | Client                            | ドラフト状態のリアルタイム反映                                          |
| ComboForm                                      | Client                            | react-hook-form によるフォーム管理                                      |
| DirectionPad, ButtonPalette, ConnectorSelector | Client                            | クリックイベントハンドリング                                            |
| TagSelector                                    | Client                            | タグのトグル・新規作成インタラクション                                  |
| ConfirmDialog                                  | Client                            | モーダルの表示/非表示状態管理                                           |
| Toast                                          | Client                            | 表示/非表示のタイマー管理                                               |

### コンボ入力UIの状態管理

コンボ入力 UI は `ComboForm`（Client Component）に状態を集約する。Context は使用せず、Props のバケツリレーで子コンポーネントに渡す。コンポーネント数が限定的（1画面のみで使用）であり、Context のオーバーヘッドは不要。

```
ComboForm (状態の所有者)
  ├── state: committedSteps: ComboStep[]     -- 確定済みステップ
  ├── state: draft: DraftStep                 -- 方向選択中のドラフト
  ├── state: inputMode: "commandList" | "visual" | "text"  -- 入力モード（デフォルト: "commandList"）
  ├── state: textInput: string                -- テキスト入力内容
  ├── state: isOD: boolean                    -- ODトグル状態
  │
  ├── ComboSequencePreview (props: steps, draft)
  ├── InputModeSwitcher (props: inputMode, onSwitch)
  │
  ├── [コマンドリスト入力モード]（デフォルト）
  │   └── CommandListPanel (props: characterId, onMoveSelect, onConnectorSelect, onUndo, onReset)
  │
  ├── [ビジュアル入力モード]
  │   ├── DirectionPad (props: onDirectionClick)
  │   ├── ButtonPalette (props: onButtonClick)
  │   ├── ConnectorSelector (props: onConnectorClick)
  │   └── ModifierControls (props: isOD, onODToggle)
  │
  ├── [テキスト入力モード]
  │   └── ComboTextInput (props: value, onChange, parseError)
  │
  ├── [メタデータ]
  │   ├── InputField (コンボ名)
  │   ├── InputField (ダメージ値)
  │   ├── TagSelector (props: tags, selectedIds, onToggle, onCreate)
  │   └── Textarea (メモ)
  │
  └── ActionButtons (元に戻す / リセット / キャンセル / 保存)
```

### タグフィルタの状態管理

コンボ一覧画面のタグフィルタは URL のクエリパラメータ（`?tags=preset-bnb,preset-corner`）で状態を管理する。これにより:

- ブラウザの戻る/進むボタンでフィルタ状態が復元される
- フィルタ状態を URL で共有可能（将来の共有機能に対応）
- Server Component でフィルタ済みデータを取得可能

```typescript
// コンボ一覧ページの Server Component
export default async function CombosPage({
  params,
  searchParams,
}: {
  params: { characterId: string };
  searchParams: { tags?: string };
}) {
  const tagIds = searchParams.tags?.split(",").filter(Boolean) ?? [];
  // tagIds を使って Prisma クエリにフィルタ条件を追加
}
```

---

## 7. 認証・認可設計

### Auth.js 設定

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Credentials Provider は JWT セッション必須
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash,
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

### セッション管理戦略

- **セッション方式:** JWT（JSON Web Token）
  - Credentials Provider は Auth.js の仕様上、JWT セッション戦略が必須
  - JWT は HTTPOnly Cookie に格納される
- **セッション有効期限:** 30日（Auth.js のデフォルト）
  - 個人利用前提のため、長めの有効期限で利便性を優先
- **セッション更新:** ユーザーのリクエストごとに自動延長（sliding session）

### パスワードハッシュ化

- **アルゴリズム:** bcrypt（bcryptjs ライブラリ）
- **ソルトラウンド:** 12（bcryptjs のデフォルト10から引き上げ、セキュリティ強化）
- **登録時のフロー:**
  1. パスワードバリデーション（8文字以上）
  2. `bcryptjs.hash(password, 12)` でハッシュ化
  3. ハッシュ値を `passwordHash` カラムに保存

### Auth.js セッション型の拡張

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
```

---

## 8. エラーハンドリング方針

### クライアントサイド

| エラー種別                   | 処理方法                           | UI表現                                         |
| ---------------------------- | ---------------------------------- | ---------------------------------------------- |
| バリデーションエラー         | react-hook-form + Zod で即時検出   | フィールド下の赤文字エラーメッセージ           |
| API レスポンスエラー (4xx)   | fetch のレスポンスステータスで判定 | フォーム上部のエラーバナー                     |
| ネットワークエラー           | try-catch で捕捉                   | トーストで「通信エラーが発生しました」         |
| パースエラー（テンキー表記） | parseNotation の結果チェック       | テキスト入力下の黄色警告メッセージ             |
| コマンドリスト読み込み失敗   | dynamic import の catch で捕捉     | パネル内に「読み込みに失敗しました」メッセージ |

### サーバーサイド

| エラー種別                   | HTTPステータス | レスポンス                                                 |
| ---------------------------- | -------------- | ---------------------------------------------------------- |
| バリデーションエラー         | 400            | `{ error: "Validation Error", details: [...] }`            |
| 認証エラー                   | 401            | `{ error: "Unauthorized" }`                                |
| 認可エラー（所有者不一致）   | 403 or 404     | `{ error: "Not Found" }`（情報漏洩防止のため 404 を返す）  |
| リソース不存在               | 404            | `{ error: "Not Found" }`                                   |
| 重複エラー（メール・タグ名） | 409            | `{ error: "Conflict", message: "..." }`                    |
| サーバー内部エラー           | 500            | `{ error: "Internal Server Error" }`（詳細はサーバーログ） |

### 認可エラーの方針

他ユーザーのリソースにアクセスしようとした場合は、リソースの存在自体を隠すために **404 Not Found** を返す（403 Forbidden ではなく）。これにより、攻撃者がリソースの存在を推測できないようにする。ただしコンボ更新（PUT）・削除（DELETE）でリソースが存在するがユーザーが異なる場合は 403 を返す。

---

## 9. テスト戦略

| テスト種別           | ツール                         | カバレッジ目標     | 対象                                                                                    |
| -------------------- | ------------------------------ | ------------------ | --------------------------------------------------------------------------------------- |
| ユニットテスト       | Vitest                         | 90%以上            | notation-converter (parseNotation, serializeNotation)、バリデーションスキーマ (Zod)     |
| 統合テスト           | Vitest + Prisma (テスト用DB)   | 主要パス           | Route Handlers (API)、認証フロー、コンボCRUD                                            |
| コンポーネントテスト | Vitest + React Testing Library | 主要コンポーネント | ComboInputUI (ドラフト状態管理)、DirectionPad, ButtonPalette、TagSelector, TagFilterBar |
| E2Eテスト            | 対象外（MVP）                  | -                  | MVP ではコストに見合わないため省略                                                      |

### テスト方針

- PoC で検証済みの `notation-converter.test.mjs`（16件）を Vitest に移行し、テストケースを拡充する
- API テストは Prisma のテスト用 SQLite DB（`:memory:` または一時ファイル）を使用する
- コンポーネントテストは `@testing-library/react` を使用し、ユーザー操作のシミュレーション（クリック・入力）で動作を検証する
- テスト実行コマンド: `npm test`（Vitest）

---

## 10. 実装順序・依存関係

```
実装フェーズ 1: プロジェクト基盤
  └─ TASK-001: プロジェクト初期化（Next.js + TypeScript + Tailwind CSS）（依存なし）
  └─ TASK-002: Prisma スキーマ定義 + マイグレーション + シードデータ（TASK-001 完了後）
  └─ TASK-003: Auth.js 設定 + 認証 API（register, login, logout）（TASK-002 完了後）
  └─ TASK-004: 認証ミドルウェア + セッション管理（TASK-003 完了後）
  └─ TASK-005: docker-compose + Dockerfile 定義（TASK-001 完了後）

実装フェーズ 2: 共通UIコンポーネント + 静的データ
  └─ TASK-006: 共通レイアウト（RootLayout, AuthenticatedLayout, AppHeader, AppFooter）（TASK-004 完了後）
  └─ TASK-007: 共通UIコンポーネント（InputField, Button, ConfirmDialog, Toast）（TASK-001 完了後）
  └─ TASK-008: キャラクターマスタデータ（characters.json）+ プリセットタグ定義（TASK-001 完了後）
  └─ TASK-009: アイコンコンポーネント（DirectionIcon, ButtonIcon）（TASK-001 完了後）

実装フェーズ 3: 認証画面
  └─ TASK-010: ログイン画面（SCR-001）（TASK-006, TASK-007 完了後）
  └─ TASK-011: ユーザー登録画面（SCR-002）（TASK-006, TASK-007 完了後）

実装フェーズ 4: コアデータモデル + API
  └─ TASK-012: コンボ型定義の移植（PoCから src/lib/combo/types.ts）（TASK-001 完了後）
  └─ TASK-013: テンキー表記変換ロジックの移植（notation-converter.ts）+ テスト（TASK-012 完了後）
  └─ TASK-014: バリデーションスキーマ定義（Zod: combo, auth, tag）（TASK-012 完了後）
  └─ TASK-015: コンボ CRUD API（Route Handlers）（TASK-002, TASK-004, TASK-014 完了後）
  └─ TASK-016: タグ API（Route Handlers）（TASK-002, TASK-004, TASK-014 完了後）
  └─ TASK-017: キャラクター API（Route Handler）（TASK-004, TASK-008 完了後）

実装フェーズ 5: 画面実装（一覧系）
  └─ TASK-018: キャラクター一覧画面（SCR-003）（TASK-006, TASK-008, TASK-017 完了後）
  └─ TASK-019: コンボ一覧画面（SCR-004）+ タグフィルタ（TASK-006, TASK-015, TASK-016 完了後）

実装フェーズ 6: コンボ入力UIコンポーネント
  └─ TASK-020: DirectionPad コンポーネント（TASK-009, TASK-012 完了後）
  └─ TASK-021: ButtonPalette コンポーネント（TASK-009, TASK-012 完了後）
  └─ TASK-022: ConnectorSelector コンポーネント（TASK-012 完了後）
  └─ TASK-023: ComboSequencePreview コンポーネント（TASK-009, TASK-012 完了後）
  └─ TASK-024: ComboInputUI（ビジュアル入力）統合コンポーネント（TASK-020〜023 完了後）
  └─ TASK-025: ComboTextInput（テキスト入力）コンポーネント（TASK-013, TASK-023 完了後）
  └─ TASK-026: TagSelector コンポーネント（TASK-007, TASK-008 完了後）

実装フェーズ 7: 画面実装（登録・編集・詳細）
  └─ TASK-027: ComboForm 統合コンポーネント（TASK-024, TASK-025, TASK-026 完了後）
  └─ TASK-028: コンボ登録画面（SCR-005）（TASK-027, TASK-015 完了後）
  └─ TASK-029: コンボ詳細画面（SCR-006）（TASK-009, TASK-015 完了後）
  └─ TASK-030: コンボ編集画面（SCR-007）（TASK-027, TASK-015 完了後）

実装フェーズ 8: テスト + 仕上げ
  └─ TASK-031: ユニットテスト（notation-converter, バリデーション）（TASK-013, TASK-014 完了後）
  └─ TASK-032: API 統合テスト（コンボ CRUD, タグ, 認証）（TASK-015, TASK-016 完了後）
  └─ TASK-033: コンポーネントテスト（ComboInputUI, TagFilterBar）（TASK-024, TASK-019 完了後）
  └─ TASK-034: Tailwind カスタムアニメーション + トースト統合（TASK-007 完了後）
  └─ TASK-035: アクセシビリティ対応（aria-label, キーボード操作, フォーカス管理）（全画面実装完了後）

実装フェーズ 9: コマンドリスト入力モード（ISSUE-001）
  └─ TASK-036: コマンドリスト型定義 + リュウのデータ作成（TASK-012 完了後）
  └─ TASK-037: CommandListPanel コンポーネント（TASK-036, TASK-022 完了後）
  └─ TASK-038: ComboForm 3タブ化 + CommandListPanel 統合（TASK-037, TASK-027 完了後）
  └─ TASK-039: コマンドリスト入力のテスト（TASK-037, TASK-038 完了後）

実装フェーズ 10: 派生技（follow-up moves）対応（ISSUE-009）
  └─ TASK-A: CommandMove 型に followUps フィールドを追加 + 単体テスト
           （TASK-036 完了後 / ISSUE-001 実装完了が前提）
  └─ TASK-B: CommandListPanel の展開 UI 拡張 + 派生コネクター（~）自動挿入ロジック
           （TASK-A 完了後）
  └─ TASK-C: キンバリー JSON に疾駆け派生 3 件を追加（special 配下）
           （TASK-A 完了後。TASK-B と並行可）
  └─ TASK-D: キンバリー JSON の風車（kimberly-4hk, unique）に派生 2 段目を追加
           （TASK-A 完了後。TASK-B と並行可）
  └─ TASK-E: CommandListPanel のコンポーネントテスト拡張（special / unique 両カテゴリの派生表示・コネクター挿入）
           （TASK-B, TASK-C, TASK-D 完了後）
```

### タスク依存関係図（簡略版）

```
TASK-001 (初期化)
  ├── TASK-002 (Prisma) ──┐
  ├── TASK-005 (Docker)   │
  ├── TASK-007 (共通UI)   │
  ├── TASK-008 (マスタ)   │
  ├── TASK-009 (アイコン)  │
  └── TASK-012 (型定義)   │
       ├── TASK-013 (変換) │
       ├── TASK-014 (Zod) │
       └── TASK-036 (コマンドリスト型) ──┐
                          │              │
  TASK-003 (Auth.js) ─────┤              │
  TASK-004 (ミドルウェア) ─┤              │
                          │              │
  TASK-006 (レイアウト) ──┐│              │
                          ││              │
  TASK-010/011 (認証画面) ←┘│              │
                            │              │
  TASK-015 (コンボAPI) ←────┘              │
  TASK-016 (タグAPI)                       │
  TASK-017 (キャラAPI)                     │
       │                                  │
       v                                  │
  TASK-018〜019 (一覧画面)                 │
       │                                  │
  TASK-020〜026 (入力コンポーネント)       │
       │                                  │
  TASK-027 (ComboForm)                    │
       │                                  │
  TASK-028〜030 (登録/詳細/編集)           │
       │                                  │
  TASK-031〜035 (テスト/仕上げ)            │
                                          │
  TASK-037 (CommandListPanel) ←────────────┘
       │
  TASK-038 (ComboForm 3タブ化)
       │
  TASK-039 (コマンドリストテスト)
       │
  TASK-A (followUps 型追加) ←─ ISSUE-009 実装フェーズ 10 開始
       │
       ├── TASK-B (CommandListPanel 派生 UI 拡張)
       ├── TASK-C (キンバリー疾駆け派生データ)
       └── TASK-D (キンバリー風車派生データ)
             │
             v
       TASK-E (コンポーネントテスト拡張) ←─ TASK-B / TASK-C / TASK-D 完了後
```

---

## 11. 環境・設定

### 環境変数一覧

| 変数名            | 説明                           | 例                               |
| ----------------- | ------------------------------ | -------------------------------- |
| `DATABASE_URL`    | Prisma 接続文字列              | `file:../data/sf6combo.db`       |
| `NEXTAUTH_URL`    | Auth.js のベース URL           | `http://localhost:3000`          |
| `NEXTAUTH_SECRET` | Auth.js のセッション暗号化キー | `openssl rand -base64 32` で生成 |

### .env.example

```
# Database
DATABASE_URL="file:../data/sf6combo.db"

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 設定ファイル一覧

| ファイル               | 用途                                                |
| ---------------------- | --------------------------------------------------- |
| `next.config.ts`       | Next.js 設定（output: standalone for Docker）       |
| `tailwind.config.ts`   | Tailwind CSS 設定（カスタムカラー・アニメーション） |
| `tsconfig.json`        | TypeScript 設定（strict: true, paths: @/\*）        |
| `prisma/schema.prisma` | データベーススキーマ                                |
| `.eslintrc.json`       | ESLint 設定（next/core-web-vitals）                 |
| `.prettierrc`          | Prettier 設定                                       |
| `docker-compose.yml`   | ローカル開発環境                                    |
| `Dockerfile`           | コンテナイメージ                                    |

### docker-compose.yml 構成

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data # SQLite DB の永続化
    environment:
      - DATABASE_URL=file:/app/data/sf6combo.db
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped
```

### Dockerfile 構成（概要）

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# 実行ステージ
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node server.js"]
```

---

## 12. 既知のリスクと対策

| リスク                                        | 影響度 | 対策                                                                                                                                                      |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth.js v5 がベータ版                         | 中     | API が安定しているバージョンを固定する。Breaking Change 時は `package-lock.json` で固定して回避                                                           |
| SQLite の JSON クエリ制限                     | 低     | コンボの検索は `notation` カラム（テキスト）で行い、`sequence` JSON の直接クエリは避ける。PostgreSQL 移行時に JSONB クエリを活用                          |
| Prisma の SQLite における Json 型の非サポート | 低     | `String` 型で格納し、アプリケーション層で JSON.parse/stringify する。移行時は schema.prisma の型を `Json` に変更するだけで済む                            |
| コンボ入力UIの複雑な状態管理                  | 中     | PoC で操作フローが検証済み。状態を ComboForm に集約し、子コンポーネントは純粋な表示/イベント発火に限定する                                                |
| SVGアイコンの制作                             | 低     | MVPでは Unicode 矢印文字をフォールバックとして使用。SVG アイコンは後から差し替え可能な設計（DirectionIcon / ButtonIcon コンポーネントの中身を変えるだけ） |
| キャラクターデータの手動更新                  | 低     | JSON マスタファイルの手動編集で対応。active/upcoming ステータスフラグで新キャラのリリースタイミングを管理                                                 |
| コマンドリストデータの整備コスト              | 中     | 初期は リュウ のみ作成。他キャラクターはコマンドリスト未登録状態を許容するUI設計。段階的に追加可能（ISSUE-001）                                           |
| 派生技（followUps）の再帰構造による無限ループ | 低     | 再帰レンダリング時は `expandedMoveId` を「親直下 / 派生直下」で名前空間を分けて保持する（例: `expandedPath: string[]`）。データ側でも循環参照は JSON 構造上作らない運用で担保（ADR 参照） |

---

## 13. 設計判断の記録（ADR）

### ADR-001: フルスタックモノリス（Next.js App Router）の採用

- **状況:** フロントエンド（ビジュアルコンボ入力UI）とバックエンド（コンボCRUD API、認証）を構築する必要がある
- **決定:** Next.js App Router によるフルスタックモノリスを採用する
- **理由:**
  1. PoC が React + TypeScript で実装済みであり、移植コストが最小
  2. Server Components と Client Components の使い分けにより、データフェッチとインタラクティブUIを最適に分離できる
  3. Route Handlers でバックエンド API を同一プロジェクトに統合でき、デプロイ構成がシンプル（Docker コンテナ1つ）
  4. Auth.js との統合が最も成熟している
  5. 個人利用のローカル環境前提であり、マイクロサービス化のメリットがない
- **却下した代替案:**
  - **FastAPI + React SPA 分離型:** フロントとバックのデプロイが別になり構成が複雑化。CORS 設定も必要。個人利用のモノリスでは過剰
  - **Remix:** App Router と同等の機能を持つが、Auth.js（NextAuth）の統合が Next.js ほど成熟していない
  - **SvelteKit:** PoC が React で実装済みのため移植コストが発生する

### ADR-002: JWT セッション戦略の採用

- **状況:** Auth.js の Credentials Provider でセッション管理方法を選択する必要がある
- **決定:** JWT セッション戦略を採用する
- **理由:**
  1. Auth.js の Credentials Provider は仕様上 JWT セッションのみをサポートする（データベースセッションは非対応）
  2. 個人利用のため、セッション無効化（ログアウト後の即時無効化）の厳密性は優先度が低い
  3. DB への問い合わせなしでセッション検証できるため、パフォーマンスが良好
- **却下した代替案:**
  - **データベースセッション:** Credentials Provider との組み合わせが Auth.js で非サポート

### ADR-003: SQLite + String 型によるコンボシーケンス格納

- **状況:** コンボシーケンス（ComboSequence）を DB に格納する方法を決定する必要がある
- **決定:** SQLite の TEXT カラム（Prisma では `String` 型）に JSON 文字列として格納する
- **理由:**
  1. SQLite は JSON 型をネイティブサポートしない（Prisma の `Json` 型は SQLite では使用不可）
  2. コンボシーケンスに対する DB レベルの JSON クエリは不要（検索は `notation` カラムで行う）
  3. PostgreSQL 移行時は `String` → `Json` に変更するだけで済む（Prisma のマイグレーションで自動対応）
  4. アプリケーション層での `JSON.parse()` / `JSON.stringify()` は十分に高速（個人利用のデータ量）
- **却下した代替案:**
  - **PostgreSQL を初期から採用:** Docker 構成が複雑化する。ローカル開発環境の軽量さを優先
  - **別テーブルにステップを正規化:** コンボの意味的な構造（ステップの順序・ネスト）を RDB で表現すると複雑化する。JSON の方がドメインモデルとの対応が直感的

### ADR-004: react-hook-form + Zod によるフォーム管理

- **状況:** コンボ登録/編集フォームとユーザー認証フォームのバリデーション・状態管理方法を決定する必要がある
- **決定:** react-hook-form + Zod + @hookform/resolvers を採用する
- **理由:**
  1. Zod スキーマをサーバーサイド（Route Handler のリクエストバリデーション）とクライアントサイド（フォームバリデーション）で共有できる
  2. react-hook-form は非制御コンポーネントベースで再レンダリングが最小限
  3. TypeScript との統合が優れており、フォームデータの型安全性が確保される
- **却下した代替案:**
  - **React の useState のみで管理:** バリデーションロジックの重複が発生する
  - **Formik:** react-hook-form の方がバンドルサイズが小さく、パフォーマンスが良好

### ADR-005: タグフィルタの URL クエリパラメータ管理

- **状況:** コンボ一覧画面のタグフィルタ状態をどこで管理するかを決定する必要がある
- **決定:** URL のクエリパラメータ（`?tags=preset-bnb,preset-corner`）で管理する
- **理由:**
  1. ブラウザの戻る/進むボタンでフィルタ状態が復元される
  2. Server Component でフィルタ済みデータを直接フェッチできる（クライアント→サーバーの不要な往復を避ける）
  3. 将来の共有機能で URL でフィルタ状態を共有可能
- **却下した代替案:**
  - **React の useState:** Server Component でのデータフェッチ時にフィルタを適用できない。クライアント側でフィルタするとデータ量が増えた場合に非効率
  - **Zustand 等のクライアントストア:** SSR との統合が複雑になる

### ADR-006: コマンドリストデータの静的 JSON ファイル管理

> ISSUE-001 (2026-04-12) で追加

- **状況:** キャラクター別のコマンドリスト（必殺技・特殊技・SA等の技一覧）データをどこにどう格納するかを決定する必要がある
- **決定:** `src/data/command-lists/{characterId}.json` として静的 JSON ファイルで管理し、Next.js の dynamic import で遅延読み込みする
- **理由:**
  1. コマンドリストはゲームのバージョン更新時にのみ変更される参照データであり、ユーザーが CRUD するデータではない。DB に格納する必然性がない
  2. JSON ファイルなら Git で差分管理でき、レビュー・修正が容易
  3. キャラクター別に分割することで、選択中のキャラクターのデータのみを読み込む遅延ロードが可能（30キャラクター分の全データをバンドルに含めない）
  4. 既存の `characters.json` や `preset-tags.ts` と同様の静的データ管理パターンに合致する
  5. 将来 API 化が必要になった場合でも、JSON ファイルの内容をそのまま API レスポンスとして返せる
- **却下した代替案:**
  - **DB テーブルで管理:** 管理画面が必要になる。ゲームデータのメンテナンスは JSON 編集の方が効率的
  - **1つの大きな JSON ファイルに全キャラクター分を格納:** バンドルサイズが増大する。遅延ロードの粒度が荒くなる
  - **TypeScript ファイル（.ts）で定義:** 型安全になるがファイルごとのビルドが必要。JSON の方がデータ追加時の手軽さが上

### ADR-007: コマンドリストのステップ事前定義

> ISSUE-001 (2026-04-12) で追加

- **状況:** コマンドリストの各技（CommandMove）にはテンキー表記（notation）と、それに対応する ComboStep[] が必要。ランタイムで notation から parseNotation で変換するか、事前に steps を JSON に含めるかを決定する必要がある
- **決定:** 各技の `steps` フィールドに `ComboStep[]` を事前定義して JSON に含める
- **理由:**
  1. `parseNotation()` は汎用パーサーであり、コマンドリスト固有の技名略称（例: SA1, DI）を含む表記を正しくパースできることは保証されているが、ランタイムパースのコストが技クリックのたびに発生する
  2. 事前定義なら技クリック時に即座に steps を追加でき、50ms 以内のレスポンス要件（SPEC 非機能要件）を容易に満たせる
  3. JSON データ作成時に手作業で steps を定義することで、パースの曖昧さ（例: 4HP が「後ろ入れ強P」か「4方向+HP」か）を排除できる
  4. データ量はキャラクターあたり数十技であり、事前定義のオーバーヘッドは軽微
- **却下した代替案:**
  - **ランタイムパース:** notation フィールドのみ持ち、クリック時に parseNotation で変換。シンプルだがパフォーマンスと正確性で劣る

### ADR-008: 派生技（follow-up moves）の再帰型による表現

> ISSUE-009 (2026-04-18) で追加

- **状況:** 特定の技から派生して発生する技（キンバリー疾駆け派生、キャミィ フーリガン派生、ジェイミー酔拳中技、ケン奔雷脚 2 段目、ターゲットコンボ等）を、コマンドリストのデータモデルと UI で表現する必要がある。派生は `special` だけでなく `unique` / `command-normal` / `normal` など全カテゴリで発生しうる。
- **決定:** `CommandMove` 型に再帰的なオプショナルフィールド `followUps?: CommandMove[]` を追加する。`followUps` の要素も `CommandMove` 型とし、強度バリアント（`variants`）やさらなる派生（`followUps`）を入れ子に表現できるようにする。
- **理由:**
  1. **カテゴリ非依存**: `followUps` を `CommandMove` のベース型に追加するため、親のカテゴリを問わず同一の構造で派生を表現できる。
  2. **再帰で将来拡張に対応**: 派生の派生（ジェイミー酔拳 → 構え中技）や、派生側が弱/中/強を持つケース（変拳系）にも自然に対応できる。
  3. **既存データに破壊的変更なし**: オプショナルフィールドのため、既存の 29 キャラクター分 JSON を変更せずに済む。
  4. **UI 実装の一元化**: `variants` の展開と同じ「親ボタン → 展開エリア」パターンで派生を描画でき、レンダリングロジックを再利用できる。
  5. **バックエンドへの影響ゼロ**: 派生を選択した結果は `ComboStep[]` にフラット化されて `ComboSequence` に統合されるため、Prisma スキーマも `parseNotation` / `serializeNotation` も変更不要。
- **却下した代替案:**
  - **別型 `FollowUpMove` を新設**: 再帰・強度バリアントの二重実装が必要になる。UI の分岐も増える。
  - **トップレベルに独立 `CommandMove` として配置し `parentId` で紐付け**: フラット検索は容易だが、UI 上で親配下に展開する実装が煩雑。JSON の可読性も低下する。
  - **カテゴリに `"followup"` を追加**: カテゴリは技の分類軸。親子関係を混ぜると責務が重くなる。

---

## 14. Tailwind CSS カスタム設定

UI_SPEC.md で定義されたカスタムアニメーションとフォント設定を `tailwind.config.ts` に反映する。

```typescript
// tailwind.config.ts の extend 内容（主要部分）
{
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 300ms ease-out",
        "fade-out": "fade-out 300ms ease-in",
        "scale-in": "scale-in 200ms ease-out",
      },
    },
  },
}
```

---

## 15. コマンドリスト入力モード設計（ISSUE-001 / UC-013）

> 追加: 2026-04-12
> 2026-04-18 更新: ISSUE-009 に基づき、派生技（follow-up moves）の型・UI・ルールを追加
> 参照: SPEC.md UC-013, UI_SPEC.md セクション 9.6

### 15.1 データ構造設計

#### 型定義 (`src/lib/combo/command-list-types.ts`)

```typescript
import type { ComboStep, Direction, ButtonInput } from "./types";

/**
 * 技のカテゴリ分類
 * UI_SPEC.md のカテゴリ見出し順に定義
 */
export type CommandCategory =
  | "normal" // 通常技（立ち/しゃがみ）
  | "unique" // 特殊技（固有技）
  | "special" // 必殺技
  | "super" // スーパーアーツ
  | "throw" // 投げ
  | "drive" // ドライブ系システム技
  | "target-combo"; // ターゲットコンボ

/**
 * カテゴリの表示名マッピング
 */
export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  normal: "通常技",
  unique: "特殊技",
  special: "必殺技",
  super: "スーパーアーツ",
  throw: "投げ",
  drive: "ドライブ系",
  "target-combo": "ターゲットコンボ",
};

/**
 * カテゴリの表示順序
 * UI_SPEC.md セクション 9.6 のレイアウトに準拠
 */
export const CATEGORY_ORDER: CommandCategory[] = [
  "normal",
  "unique",
  "special",
  "super",
  "throw",
  "drive",
  "target-combo",
];

/** 強度ラベル（弱/中/強/OD） */
export type StrengthLevel = "L" | "M" | "H" | "OD";

/** 強度バリアント（弱/中/強で異なるボタンの技に使用） */
export interface StrengthVariant {
  strength: StrengthLevel;
  notation: string;
  steps: ComboStep[];
}

/**
 * コマンドリスト上の1つの技を表す型
 *
 * - 強度バリアントがある技: variants に弱/中/強を定義。steps は未使用
 * - 強度バリアントがない技: variants は undefined。steps をそのまま使用
 * - 派生技（follow-up）を持つ技: followUps に子 CommandMove 配列を格納
 *   派生技自身もさらに variants / followUps を持てる（再帰構造）
 *
 * カテゴリ非依存:
 *   followUps は CommandMove のベースフィールドに付くため、
 *   親の category が special / unique / command-normal / normal いずれでも同じ構造で派生を保持できる。
 */
export interface CommandMove {
  /** 一意ID（キャラクター内でユニーク）
   *
   * 命名規則:
   *   - トップレベル技: "{characterId}-{技の英略}"（例: "kimberly-shikkuke"）
   *   - 派生技: "{characterId}-{parent}-{derivation}"
   *            （例: "kimberly-shikkuke-bushin-shoha", "kimberly-4hk-followup"）
   */
  id: string;
  /** 技名（日本語） */
  name: string;
  /** 技名（英語） */
  nameEn: string;
  /** カテゴリ（派生技は親と独立した値を持てる） */
  category: CommandCategory;
  /** テンキー表記（表示用。例: "236+P", "5MP"） */
  notation: string;
  /** パース済み ComboStep 配列（バリアントなしの技で使用） */
  steps: ComboStep[];
  /** 強度バリアント（弱/中/強がある技のみ） */
  variants?: StrengthVariant[];
  /**
   * 派生技（follow-up moves）
   * ISSUE-009 (2026-04-18) で追加
   *
   * 親技から発生する派生技の配列。要素も CommandMove 型であり、
   * 派生技自身がさらに variants / followUps を持つ再帰構造を許容する。
   * カテゴリに依存せず、親が special / unique / command-normal / normal の
   * いずれでも使用できる汎用フィールド。
   */
  followUps?: CommandMove[];
}

/**
 * 1キャラクター分のコマンドリスト
 */
export interface CharacterCommandList {
  characterId: string;
  characterName: string;
  moves: CommandMove[];
}
```

#### JSON スキーマ (`src/data/command-lists/{characterId}.json`)

```json
{
  "characterId": "kimberly",
  "characterName": "キンバリー",
  "moves": [
    {
      "id": "kimberly-shikkuke",
      "name": "疾駆け",
      "nameEn": "Shikkuke",
      "category": "special",
      "notation": "236+K",
      "steps": [],
      "variants": [
        { "strength": "L", "notation": "236LK", "steps": [ /* ... */ ] },
        { "strength": "M", "notation": "236MK", "steps": [ /* ... */ ] },
        { "strength": "H", "notation": "236HK", "steps": [ /* ... */ ] },
        { "strength": "OD", "notation": "OD236HK", "steps": [ /* ... */ ] }
      ],
      "followUps": [
        {
          "id": "kimberly-shikkuke-stop",
          "name": "急停止",
          "nameEn": "Shikkuke Stop",
          "category": "special",
          "notation": "K (停止)",
          "steps": [ /* ... */ ]
        },
        {
          "id": "kimberly-shikkuke-kage-sukui",
          "name": "影すくい",
          "nameEn": "Kage Sukui",
          "category": "special",
          "notation": "中K派生",
          "steps": [ /* ... */ ]
        },
        {
          "id": "kimberly-shikkuke-bushin-shoha",
          "name": "武神翔霸",
          "nameEn": "Bushin Shoha",
          "category": "special",
          "notation": "P派生",
          "steps": [ /* ... */ ]
        }
      ]
    }
  ]
}
```

**JSON 設計の方針:**

- `steps` フィールドは `ComboStep[]` 型に準拠する。ボタン強度が複数ある技（例: 波動拳の LP/MP/HP 版）は `variants` で保持する。
- `id` は `{characterId}-{技の英語略称}` 形式、派生技は `{characterId}-{parent}-{derivation}` 形式で命名する。キャラクター内でユニークであること（派生技も含めて）。
- ドライブ系技（DI, DR, DP, DRev）は全キャラクター共通だが、キャラクターごとの JSON に含める（キャラクター切り替え時に別データとして読み込まれるため、共通化の複雑さを避ける）。
- `followUps` はオプショナルフィールドであり、省略時は空（= 派生なし）として扱う。既存の 29 キャラ分 JSON には影響しない。

### 15.2 リュウのコマンドリスト初期データ

リファレンス実装として `src/data/command-lists/ryu.json` を作成する。含める技の一覧:

| カテゴリ | 技                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------- |
| normal   | 5LP, 5MP, 5HP, 5LK, 5MK, 5HK, 2LP, 2MP, 2HP, 2LK, 2MK, 2HK                                     |
| unique   | 6HP (鎖骨割り), 4HP (鳩尾砕き), 6MK (旋風キック)                                               |
| special  | 236P (波動拳), 623P (昇龍拳), 214K (竜巻旋風脚), 236K (足刀蹴り), 214P (波掌撃)                |
| super    | 236236K (SA1 真空波動拳), 236236P (SA2 真・昇龍拳), 236236K (SA3 真・波動拳)                   |
| throw    | Throw (投げ)                                                                                   |
| drive    | DI (ドライブインパクト), DR (ドライブラッシュ), DP (ドライブパリィ), DRev (ドライブリバーサル) |

注: ターゲットコンボはリュウには存在しないため空。

### 15.3 遅延読み込み設計

コマンドリストの JSON データは Next.js の `dynamic import` を使用して遅延読み込みする。

```typescript
/**
 * キャラクター別コマンドリストを遅延読み込みする
 * JSON ファイルが存在しない場合は null を返す
 */
export async function loadCommandList(
  characterId: string,
): Promise<CharacterCommandList | null> {
  try {
    const data = await import(`@/data/command-lists/${characterId}.json`);
    return data.default as CharacterCommandList;
  } catch {
    // JSON ファイルが存在しない場合（コマンドリスト未登録キャラクター）
    return null;
  }
}
```

**読み込み戦略:**

1. `CommandListPanel` のマウント時（または `characterId` の変更時）に `loadCommandList()` を呼び出す
2. 読み込み中は軽量なローディングインジケーター（スピナー）を表示
3. `null` が返された場合は未登録メッセージを表示（UI_SPEC.md セクション 9.6 の「コマンドリストデータ未登録時」レイアウト）
4. 読み込み済みデータは React の `useState` でキャッシュする（同一キャラクターの再読み込みを防止）
5. Next.js のウェブパック設定により、`import()` のパスパターンに一致する JSON がチャンクとして自動分割される

**バンドルサイズへの影響:**

- 各キャラクターの JSON は約 5-10KB（推定、派生技含みでも微増）
- dynamic import により初期バンドルには含まれない
- コマンドリストモードを選択し、キャラクターのデータが初めて必要になった時点でネットワーク取得される

### 15.4 CommandListPanel コンポーネント設計

**ファイル:** `src/components/input/CommandListPanel.tsx`

```typescript
interface CommandListPanelProps {
  /** キャラクターID（コマンドリストの読み込みに使用） */
  characterId: string;
  /** 現在の確定済みステップ（コネクター自動挿入判定に使用） */
  committedSteps: ComboStep[];
  /** 技選択時のコールバック（ステップ配列を渡す） */
  onMoveSelect: (steps: ComboStep[]) => void;
  /** コネクター選択時のコールバック */
  onConnectorSelect: (symbol: ConnectorStep["symbol"]) => void;
  /** 元に戻す */
  onUndo: () => void;
  /** リセット */
  onReset: () => void;
  className?: string;
}
```

**内部状態:**

- `commandList: CharacterCommandList | null` -- 読み込み済みコマンドリスト
- `isLoading: boolean` -- 読み込み中フラグ
- `loadError: boolean` -- 読み込みエラーフラグ
- `expandedMoveId: string | null` -- 展開中の技 ID（variants / followUps のどちらを持っていてもトリガーとなる）
- `lastSelectedMoveId: string | null` -- 直近に選択された親技の ID（派生コネクター判定用、ISSUE-009 追加）

**展開条件（ISSUE-009 更新）:**

- `move.variants` が 1 件以上、**または** `move.followUps` が 1 件以上存在するとき、親ボタンは展開可能となる。
- 展開条件は**親のカテゴリに依存しない**。`followUps` を持つ技であれば `special` / `unique` / `command-normal` / `normal` のどのカテゴリでも同じ展開 UI を適用する。
- 例1（special 配下）: 疾駆け（236+K, special）→ 強度バリアント行 + 派生行 [ 急停止 / 影すくい / 武神翔霸 ]
- 例2（unique 配下）: 風車（4+HK, unique）→ 強度バリアントなし / 派生行 [ 風車派生 2 段目 ]

**展開エリアの構造:**

```
[ 親技ボタン（▼） ]
 ├ 強度バリアント行: [ 弱 ] [ 中 ] [ 強 ] [ OD ]  （variants がある場合のみ）
 └ 派生セクション: "派生:" [ 派生技1 ] [ 派生技2 ] ... （followUps がある場合のみ）
```

- 派生技ボタンは親技と同じ `CommandMoveButton` スタイルを再利用し、紫系（`bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700`）で視覚的に区別する。UI_SPEC.md セクション 9.6 を参照。
- 派生技自身が `variants` / `followUps` を持つ場合、クリックでさらに展開されるネスト UI を許容する（再帰レンダリング）。ネスト展開状態は `expandedMoveId` 単一では衝突するため、必要に応じて展開パス（例: `expandedPath: string[]`）で管理する。実装判断は developer に委ねる。

**コネクター自動挿入ロジック（ISSUE-009 拡張）:**

```typescript
/**
 * 技がクリックされたときのハンドラー
 *
 * 通常技（親技またはバリアント）: シーケンス末尾がステップなら ">" を挿入、
 *                                 コネクターなら何も挿入せず technique ステップを追加
 * 派生技（followUp）: 「親技が直前に選択されたか」に応じてコネクターを決定する
 *   - 親技の直後（lastSelectedMoveId === 親ID）: コネクター "~" を挿入
 *   - それ以外: 通常ルール（">"）を適用
 */
function handleMoveClick(move: CommandMove, opts?: { isFollowUp?: boolean; parentId?: string }) {
  const lastStep = committedSteps[committedSteps.length - 1];
  const isFollowUpAfterParent =
    opts?.isFollowUp === true && lastSelectedMoveId === opts.parentId;

  if (committedSteps.length === 0) {
    onMoveSelect(move.steps);
  } else if (lastStep && lastStep.type === "connector") {
    onMoveSelect(move.steps);
  } else if (isFollowUpAfterParent) {
    // 派生コネクター ~ を挿入
    onMoveSelect([{ type: "connector", symbol: "~" }, ...move.steps]);
  } else {
    // 通常の > コネクターを挿入
    onMoveSelect([{ type: "connector", symbol: ">" }, ...move.steps]);
  }

  setLastSelectedMoveId(move.id);
}
```

**コンポーネント構造:**

```
CommandListPanel
  ├── [isLoading] ローディングスピナー
  ├── [loadError] エラーメッセージ
  ├── [commandList === null] 未登録メッセージ + ビジュアル入力切替ボタン
  └── [commandList !== null]
      ├── ヘッダー: "コマンドリスト: {characterName}"
      ├── CATEGORY_ORDER.map(category =>
      │   ├── カテゴリ見出し（text-xs text-gray-400 font-semibold）
      │   └── 技ボタングリッド（flex flex-wrap gap-2）
      │       └── CommandMoveButton.map(move =>
      │           ├── 親技ボタン: クリックで展開トグル（variants or followUps がある場合）
      │           ├── 強度バリアント行（variants がある場合）
      │           └── 派生セクション（followUps がある場合、再帰的にレンダリング）
      │       )
      │   )
      ├── コネクターセレクター（接続: > xx ~ ,）
      └── アクションボタン（元に戻す / リセット）
```

**スタイリング（UI_SPEC.md 準拠）:**

- 技ボタン: `bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded px-3 py-1.5 text-sm`
- テンキー表記: `font-mono text-xs text-gray-400`（左側）
- 技名: `text-sm text-white`（右側）
- クリックフィードバック: `border-cyan-500 bg-gray-600`（短時間のハイライト）
- カテゴリ見出し: `text-xs text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-700 pb-1 mb-2`
- 派生技ボタン（ISSUE-009 追加）: `bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700 rounded`
- 派生ラベル "派生:" : `text-xs text-purple-300 font-semibold`

### 15.5 派生技（follow-up moves）の扱い

> 追加: 2026-04-18 / ISSUE-009

コマンドリスト上の「派生技」は、親技から発生する追加入力技（キンバリー疾駆け派生、キャミィ フーリガン派生、ジェイミー酔拳中技、ケン奔雷脚 2 段目等）を指す。本項ではデータモデル・UI・コネクター挿入・バリアントとの共存ルールをまとめる。

#### 15.5.1 データモデル上の再帰構造

- `CommandMove.followUps?: CommandMove[]` として表現する。要素は通常の `CommandMove` と同一型。
- 再帰構造を許容する:
  - 派生技自身が `variants` を持つ（弱/中/強の派生）
  - 派生技自身が `followUps` を持つ（派生の派生 / 構え系）
- **カテゴリ非依存**: `followUps` は `CommandMove` のベース型フィールドのため、親の `category` が何であっても利用可能。
- **循環参照の禁止**: JSON データ上で派生 ID の循環参照を作成してはならない。ビルド時のテストで検出する（TASK-A 単体テストで確認）。

#### 15.5.2 ID 命名規則

- トップレベル技: `{characterId}-{技の英略}`（例: `kimberly-shikkuke`, `kimberly-4hk`）
- 派生技: `{characterId}-{parent}-{derivation}`（例: `kimberly-shikkuke-bushin-shoha`, `kimberly-4hk-followup`）
- 派生技の ID もキャラクター内で一意であること。重複は禁止し、単体テストで検出する。

#### 15.5.3 コネクター自動挿入ルール

派生技を選択したときに親技とどのコネクターで繋ぐかを以下のルールで決定する。

| 状況                                                       | 挿入されるコネクター |
| ---------------------------------------------------------- | -------------------- |
| `committedSteps` が空                                      | なし                 |
| 末尾が `ConnectorStep`                                     | なし（重複回避）     |
| 派生技クリック **かつ** 直前に選択された技が親技である場合 | `~`                  |
| 派生技クリックだが直前の技が親技でない                     | `>`（通常ルール）    |
| 通常技・バリアントクリック                                 | `>`                  |

- 「直前に選択された技が親技か」の判定は `lastSelectedMoveId` というローカル状態で追跡する。
- 親技の選択直後 → 派生技クリック で `~` が挿入され、`236HK ~ HP` のようなシーケンスになる。
- 親技 + 別の技 + 派生技、というように間に別の技を挟んだ場合は、派生コネクターを強制せず `>` を挿入する（UI の自由度を優先）。

#### 15.5.4 強度バリアント（variants）との共存

- `variants` と `followUps` は独立したフィールドで、**両方共存可能**。
- 疾駆け（`kimberly-shikkuke`）のように、親技がバリアントを持ちつつ派生も持つケースでは、展開時に強度バリアント行 **および** 派生行の両方を表示する。
- 強度バリアントクリック後に派生技をクリックした場合の扱い:
  - 直近選択された親技 ID は「バリアントクリック時の親技 ID」として記録する。これにより、バリアント選択直後の派生クリックでも `~` が挿入される。
  - 実装詳細: `handleVariantClick` 内で `setLastSelectedMoveId(move.id)` を実行する（親の ID）。

#### 15.5.5 派生技自身が variants / followUps を持つ場合の再帰展開

- 派生技自身に `variants` がある場合: 派生行の派生ボタンをクリックで更に強度バリアント行を展開する。
- 派生技自身に `followUps` がある場合: 派生行の派生ボタンをクリックで更に 2 段目の派生行を展開する（派生の派生）。
- 展開状態管理:
  - 単純な `expandedMoveId: string | null` では同時に複数階層の展開状態を保持できない。
  - 推奨実装: `expandedPath: string[]` のようなパス配列で、階層ごとの展開中 ID を保持する。
  - developer は要件（現状 1 段階のみ）を満たす最小実装で開始し、将来の再帰拡張に耐える形にすること。
- ISSUE-009 のスコープでは 1 段階の派生のみを実データで検証する。2 段以上の派生は将来追加時に再帰ロジックが活きる前提で設計する（データは現状なし）。

### 15.6 ComboForm 統合設計

**変更対象:** `src/components/combo/ComboForm.tsx`

#### InputMode 型の拡張

```typescript
// 変更前
type InputMode = "visual" | "text";

// 変更後
type InputMode = "commandList" | "visual" | "text";
```

#### デフォルトモードの変更

```typescript
// 変更前
const [inputMode, setInputMode] = useState<InputMode>("visual");

// 変更後
const [inputMode, setInputMode] = useState<InputMode>("commandList");
```

#### characterId プロパティの追加

```typescript
// ComboFormProps に characterId を追加
interface ComboFormProps {
  /** キャラクターID（コマンドリストの読み込みに使用） */
  characterId: string;
  mode: "create" | "edit";
  availableTags: TagResponse[];
  initialData?: ComboResponse;
  onSubmit: (data: { ... }) => Promise<void>;
  onCancel: () => void;
  onTagCreate?: (tagName: string) => Promise<TagResponse | null>;
  submitLabel?: string;
}
```

`characterId` は SCR-005 (new/page.tsx) と SCR-007 (edit/page.tsx) の両方から URL パラメータ経由で取得済み。ComboForm に prop として渡す。

#### タブ UI の3タブ化

タブの順序: コマンドリスト / ビジュアル入力 / テキスト入力

```typescript
const INPUT_MODES: { value: InputMode; label: string }[] = [
  { value: "commandList", label: "コマンドリスト" },
  { value: "visual", label: "ビジュアル入力" },
  { value: "text", label: "テキスト入力" },
];
```

#### CommandListPanel の技選択ハンドラー

ComboForm 内で、CommandListPanel からの技選択を処理するハンドラーを追加する。

```typescript
/** コマンドリストの技選択ハンドラー */
const handleMoveSelect = useCallback((steps: ComboStep[]) => {
  setSequence((prev) => {
    const newSteps = [...prev.steps, ...steps];
    return {
      steps: newSteps,
      notation: serializeNotation({ steps: newSteps, notation: "" }),
    };
  });
}, []);
```

注: コネクター自動挿入は CommandListPanel 側で行い、ComboForm には挿入済みの steps が渡される。ComboForm はそれを sequence に追加するだけ。

#### 3モード間のデータ相互変換

既存の実装で `ComboInputUI` と `ComboTextInput` はどちらも `ComboSequence` を中間表現として共有している。`CommandListPanel` も同じ `ComboSequence` を操作するため、3モード間のデータ相互変換は自動的に成立する。

- コマンドリスト → ビジュアル: `sequence.steps` がそのまま `ComboInputUI` の `initialSequence` として渡される
- コマンドリスト → テキスト: `sequence.notation` がそのまま `ComboTextInput` の初期テキストとして使われる
- ビジュアル/テキスト → コマンドリスト: 共有の `sequence` 状態が更新されているため、コマンドリストパネルは参照しない（追加のみの操作のため）

### 15.7 ページコンポーネントの変更

**変更対象:**

- `src/app/(authenticated)/characters/[characterId]/combos/new/page.tsx` (SCR-005)
- `src/app/(authenticated)/characters/[characterId]/combos/[comboId]/edit/page.tsx` (SCR-007)

両ページとも既に `characterId` を URL パラメータから取得しているため、`ComboForm` に `characterId` prop を追加するだけで対応可能。

```typescript
// new/page.tsx の変更箇所
<ComboForm
  characterId={characterId}  // 追加
  mode="create"
  availableTags={availableTags}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  onTagCreate={handleTagCreate}
  submitLabel="このコンボを保存"
/>
```

---

## 16. ISSUE-001 実装フェーズ詳細

### TASK-036: コマンドリスト型定義 + リュウのデータ作成

**対象ファイル:**

- `src/lib/combo/command-list-types.ts` (新規)
- `src/data/command-lists/ryu.json` (新規)

**作業内容:**

1. `CommandMove`, `CommandCategory`, `CharacterCommandList` 型の定義
2. `CATEGORY_LABELS`, `CATEGORY_ORDER` 定数の定義
3. `loadCommandList()` 遅延読み込み関数の実装
4. リュウのコマンドリスト JSON データ作成（通常技12種 + 特殊技3種 + 必殺技5種 + SA3種 + 投げ1種 + ドライブ系4種 = 計28技）
5. `steps` フィールドは既存の `ComboStep` 型に厳密に準拠させる

**依存:** TASK-012（コンボ型定義）完了後

### TASK-037: CommandListPanel コンポーネント

**対象ファイル:**

- `src/components/input/CommandListPanel.tsx` (新規)

**作業内容:**

1. CommandListPanel コンポーネントの実装（Props インターフェースはセクション 15.4 参照）
2. `loadCommandList()` による遅延読み込みと状態管理（ローディング / エラー / 未登録 / 表示）
3. カテゴリ別セクション表示（CATEGORY_ORDER 順）
4. 技ボタンクリック時のコネクター自動挿入ロジック
5. ConnectorSelector（既存コンポーネント）の再利用
6. 元に戻す / リセットボタン
7. UI_SPEC.md セクション 9.6 に準拠したスタイリング

**依存:** TASK-036（型定義+データ）, TASK-022（ConnectorSelector）完了後

### TASK-038: ComboForm 3タブ化 + CommandListPanel 統合

**対象ファイル:**

- `src/components/combo/ComboForm.tsx` (変更)
- `src/app/(authenticated)/characters/[characterId]/combos/new/page.tsx` (変更)
- `src/app/(authenticated)/characters/[characterId]/combos/[comboId]/edit/page.tsx` (変更)

**作業内容:**

1. `InputMode` 型に `"commandList"` を追加
2. デフォルト入力モードを `"commandList"` に変更
3. タブ UI を3タブ構成に変更（コマンドリスト / ビジュアル入力 / テキスト入力）
4. `characterId` prop を ComboFormProps に追加
5. コマンドリスト入力モードの tab panel に CommandListPanel をマウント
6. 技選択ハンドラー `handleMoveSelect` の実装
7. SCR-005, SCR-007 のページコンポーネントから ComboForm に characterId を渡す
8. 3モード間のデータ相互変換が正しく動作することを確認

**依存:** TASK-037（CommandListPanel）, TASK-027（ComboForm 既存実装）完了後

### TASK-039: コマンドリスト入力のテスト

**対象ファイル:**

- `src/components/input/__tests__/CommandListPanel.test.tsx` (新規)
- `src/lib/combo/__tests__/command-list-types.test.ts` (新規)

**作業内容:**

1. `loadCommandList()` のユニットテスト（正常読み込み / 未登録キャラクター / エラーハンドリング）
2. CommandListPanel のコンポーネントテスト:
   - 技リストのカテゴリ別表示
   - 技クリック時の onMoveSelect コールバック呼び出し
   - コネクター自動挿入ロジック（空シーケンス / ステップ後 / コネクター後）
   - 未登録キャラクターの空状態メッセージ表示
   - ローディング状態の表示
3. ComboForm の3タブ切替テスト（既存テストがあれば拡張）

**依存:** TASK-037, TASK-038 完了後

---

## 17. ISSUE-009 実装フェーズ詳細（派生技 follow-up moves 対応）

> 追加: 2026-04-18 / 参照: ISSUE-009, SPEC.md UC-013 AC9/AC10, UI_SPEC.md セクション 9.6

### キンバリー JSON 調査結果（TASK-D 前提）

`src/data/command-lists/kimberly.json` を調査した結果（2026-04-18 時点）:

- `kimberly-4hk`（風車, unique, `4HK`）は **既に登録済み**（steps: `[{ type: "normal", directions: ["4"], button: "HK" }]`）。
- ただし `followUps` フィールドは未定義（現行型では該当フィールドがないため）。
- したがって TASK-D は「風車技そのものの新規追加」ではなく、既存 `kimberly-4hk` オブジェクトに `followUps` 配列を追加する形で実装する。

`kimberly-shikkuke`（疾駆け, special, `236+K`）も既に登録済みで、`variants`（L/M/H/OD）あり、`followUps` 未定義。TASK-C は既存 `kimberly-shikkuke` オブジェクトに `followUps` 配列を追加する形で実装する。

### TASK-A: CommandMove 型に `followUps` フィールドを追加 + 単体テスト

**対象ファイル:**

- `src/lib/combo/command-list-types.ts`（変更）
- `src/lib/combo/__tests__/command-list-types.test.ts`（拡張）

**作業内容:**

1. `CommandMove` インターフェースに再帰型のオプショナルフィールド `followUps?: CommandMove[]` を追加する。
2. JSDoc コメントで「カテゴリ非依存」「再帰構造を許容」「ID 命名規則」を記述する（セクション 15.1 参照）。
3. 単体テスト:
   - `followUps` を持つ `CommandMove` が型エラーなくパースできること
   - `followUps` を持たない既存の `CommandMove` が引き続き正しく扱えること（後方互換性）
   - ネストした `followUps`（派生の派生）が型上許容されること
   - ID の一意性: キャラクター内で `moves` ツリー全体（派生含む）の ID に重複がないことを検証するヘルパー（例: `collectAllMoveIds`）を追加し、テストで使用する。
   - 循環参照の検出: `followUps` が自身または祖先を参照するデータは不正として扱う（簡易 DFS チェック）。

**依存:** TASK-036（既存のコマンドリスト型）完了後。ISSUE-001 の実装完了が前提。

### TASK-B: CommandListPanel の展開 UI 拡張 + コネクター自動挿入ロジック

**対象ファイル:**

- `src/components/input/CommandListPanel.tsx`（変更）

**作業内容:**

1. `hasVariants || hasFollowUps` のいずれかで親ボタンを展開可能にするロジックへ拡張（セクション 15.4 参照）。親カテゴリには依存しない。
2. 展開時に「強度バリアント行」と「派生セクション」の両方、もしくはどちらかをレンダリングする。`followUps` セクションには `派生:` ラベルを付ける。
3. 派生技ボタンのスタイリング: `bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700 rounded`（UI_SPEC.md 9.6 準拠）。
4. `lastSelectedMoveId: string | null` 状態を追加し、親技・バリアント選択時に親の ID を記録する。
5. コネクター自動挿入ロジックを拡張:
   - 通常のクリック: 既存ルール（末尾がステップなら `>` 挿入）
   - 派生技クリック: `lastSelectedMoveId === 親ID` なら `~` を挿入、それ以外は `>` 挿入
   - 空シーケンス / 末尾コネクター時はコネクター挿入なし（既存ルール）
6. 派生技自身の `variants` / `followUps` に対応する再帰レンダリングを実装。展開状態管理は `expandedPath: string[]` でパスベースに拡張することを推奨（単一 `expandedMoveId` では多階層で衝突する）。
7. アクセシビリティ: 派生技ボタンに `aria-label="{親技名} 派生: {派生技名}（{notation}）"` を付与。展開ボタンは `aria-expanded` を維持。

**依存:** TASK-A 完了後。

### TASK-C: キンバリー JSON に疾駆け派生（special 配下 3 件）を追加

**対象ファイル:**

- `src/data/command-lists/kimberly.json`（変更）

**作業内容:**

1. 既存の `kimberly-shikkuke` オブジェクトに `followUps` 配列を追加する（既存の `variants` は維持）。
2. 追加する 3 派生技:
   - `kimberly-shikkuke-stop`（急停止 / Shikkuke Stop）
   - `kimberly-shikkuke-kage-sukui`（影すくい / Kage Sukui）
   - `kimberly-shikkuke-bushin-shoha`（武神翔霸 / Bushin Shoha）
3. 各派生技の `category` は `special`（親と同じ）、`steps` は SF6 公式コマンド表を参照して確定する。
4. `notation` は派生入力を表す簡潔な表記（例: `K (停止)`, `中K派生`, `P派生`）とする。表示の一貫性は UI_SPEC.md レビュー後に微調整可。
5. データ整合性の確認: TASK-A の ID 重複チェック・循環参照チェックに通ること。

**依存:** TASK-A 完了後（型が利用可能になっていること）。TASK-B と並行可。

### TASK-D: キンバリー JSON の風車（4+HK, unique）に派生 2 段目を追加

**対象ファイル:**

- `src/data/command-lists/kimberly.json`（変更）

**作業内容:**

1. 既存の `kimberly-4hk`（風車, unique, `4HK`）オブジェクトに `followUps` 配列を追加する（既存の `steps` は維持）。
2. 追加する派生技:
   - `kimberly-4hk-followup`（風車派生 2 段目 / Kazaguruma Followup）
3. `category` は `unique`（親と同じ）、`steps` は SF6 公式コマンド表を参照して確定する。
4. `notation` は 2 段目を表す簡潔な表記（例: `HK派生`）。
5. データ整合性の確認: TASK-A の ID 重複チェックに通ること。

**依存:** TASK-A 完了後。TASK-B / TASK-C と並行可。

### TASK-E: コンポーネントテスト拡張（special / unique 両カテゴリの派生表示・コネクター挿入）

**対象ファイル:**

- `src/components/input/__tests__/CommandListPanel.test.tsx`（拡張）
- 必要に応じて `src/lib/combo/__tests__/command-list-types.test.ts`（拡張）

**作業内容:**

1. `special` 配下のテスト: 疾駆け（`kimberly-shikkuke`）を展開すると、強度バリアント行と派生セクション（急停止 / 影すくい / 武神翔霸）が両方表示されること。
2. `unique` 配下のテスト: 風車（`kimberly-4hk`）を展開すると、派生セクション（風車派生 2 段目）が表示されること。強度バリアントは表示されないこと。
3. 派生技クリックで `onMoveSelect` が呼ばれ、先頭にコネクター `~` が付与されたステップ配列が渡されること（親技選択直後の場合）。
4. 親技以外を経由した後に派生技をクリックした場合、コネクターが `>` になること。
5. 親技が `variants` と `followUps` を両方持つ場合の展開挙動（両セクションが同時にレンダリングされる）。
6. 派生技自身が variants を持つ場合の再帰展開（現状はテストデータがないため mock データで検証）。
7. 未登録・ローディング・エラー状態は既存テスト（TASK-039）を踏襲。

**依存:** TASK-B, TASK-C, TASK-D 完了後。

### 依存関係サマリー

```
TASK-A (型拡張 + テスト)
  ├── TASK-B (UI 拡張 + コネクター挿入)
  ├── TASK-C (疾駆け派生 JSON)
  └── TASK-D (風車派生 JSON)
       │
       v
  TASK-E (コンポーネントテスト拡張) ← TASK-B / TASK-C / TASK-D 全て完了後
```

- TASK-A は他すべてのブロッカー。最優先で着手する。
- TASK-B / TASK-C / TASK-D は TASK-A 完了後に並行着手可能。レビューの単位を分けるためタスク単位で PR を分割することを推奨する。
- TASK-E は動作検証のため、B/C/D 完了後に実施する。

### developer への引き継ぎ内容

実装者（developer エージェントまたは人間開発者）へ。以下の設計上の制約を遵守して実装すること。

1. **型定義（TASK-A）の後方互換性を守る**:
   - `followUps?` はオプショナル。既存の 29 キャラ分 JSON は一切変更しないこと（`kimberly.json` だけが変更対象）。
2. **カテゴリ非依存の原則**:
   - CommandListPanel の展開判定・派生レンダリングロジックは `move.category` で分岐してはならない。常に `move.followUps` の有無だけで判定する。
3. **コネクター `~` 挿入は派生コンテキスト限定**:
   - `~` は派生技クリック、かつ直前選択が親技の場合のみ。それ以外（ランダムな技間で `~` を付ける）は禁止。
4. **lastSelectedMoveId の扱い**:
   - 親技クリック時・親技のバリアントクリック時に `setLastSelectedMoveId(親技の id)` を呼ぶ。
   - 派生技クリック時にも `setLastSelectedMoveId(派生技の id)` を呼び、次の派生の派生（もしあれば）に備える。
5. **再帰レンダリング / 展開状態**:
   - 単純な単一 `expandedMoveId` のままで実装しても、ISSUE-009 スコープ（1 段階の派生のみ）では動作する。ただしコメントで「2 段以上の派生に拡張する際は `expandedPath` 等への変更が必要」と明記すること。
6. **テストデータとしての Kimberly**:
   - TASK-C / TASK-D で追加した疾駆け派生・風車派生は、TASK-E の E2E 相当のコンポーネントテストで実際に使用する。手動確認時のテスト手順を TASK.md に残すこと（例: `/characters/kimberly/combos/new` でコマンドリストから疾駆け → 武神翔霸 を選択し `236HK ~ HP` と notation が組み立てられることを確認）。
7. **派生技の実際の notation / steps**:
   - SF6 公式コマンド表を参照し、不明点があれば `blocked` ステータスで architect に相談すること（キンバリー派生の正確な入力については攻略サイトや公式動作表を参考にする）。
8. **PR 粒度**:
   - TASK-A と TASK-B は別 PR を推奨（型 + ロジック変更は影響範囲が異なる）。
   - TASK-C / TASK-D はデータのみなので 1 PR にまとめても可。
9. **コミットメッセージ**:
   - 例: `feat: add followUps field to CommandMove type (TASK-A)` / `feat: extend CommandListPanel for follow-up moves (TASK-B)` / `feat: add Kimberly shikkuke follow-ups (TASK-C)` 等。
10. **Docker ビルド再確認**:
    - 画面変更を含む TASK-B / TASK-E 完了後は `docker compose up --build` で動作確認する（ユーザー MEMORY に基づく）。
11. **セキュリティ観点**:
    - 本タスクは純粋な静的 JSON データとクライアント UI の変更であり、新しい入力処理・DB 書き込み・認証経路の変更は発生しない。ただし追加する JSON に外部起因のデータが混ざらないこと（手入力のみ）を確認する。
