# アーキテクチャ設計書: SF6 コンボ帳

> 参照元: SPEC.md (2026-04-08), UI_SPEC.md (2026-04-08), DISCOVERY_RESULT.md (2026-04-08), POC_RESULT.md (2026-04-08)
> 作成日: 2026-04-08
> 更新履歴:
>
> - 2026-04-08: 初版作成

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
│   │   │   └── ConnectorSelector.tsx     # コネクターセレクター（Client Component）
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
│   │   └── preset-tags.ts        # プリセットタグ12種の定義（型付き）
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
  ├── state: inputMode: "visual" | "text"     -- 入力モード
  ├── state: textInput: string                -- テキスト入力内容
  ├── state: isOD: boolean                    -- ODトグル状態
  │
  ├── ComboSequencePreview (props: steps, draft)
  ├── InputModeSwitcher (props: inputMode, onSwitch)
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

| エラー種別                   | 処理方法                           | UI表現                                 |
| ---------------------------- | ---------------------------------- | -------------------------------------- |
| バリデーションエラー         | react-hook-form + Zod で即時検出   | フィールド下の赤文字エラーメッセージ   |
| API レスポンスエラー (4xx)   | fetch のレスポンスステータスで判定 | フォーム上部のエラーバナー             |
| ネットワークエラー           | try-catch で捕捉                   | トーストで「通信エラーが発生しました」 |
| パースエラー（テンキー表記） | parseNotation の結果チェック       | テキスト入力下の黄色警告メッセージ     |

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
       └── TASK-014 (Zod) │
                          │
  TASK-003 (Auth.js) ─────┤
  TASK-004 (ミドルウェア) ─┤
                          │
  TASK-006 (レイアウト) ──┐│
                          ││
  TASK-010/011 (認証画面) ←┘│
                            │
  TASK-015 (コンボAPI) ←────┘
  TASK-016 (タグAPI)
  TASK-017 (キャラAPI)
       │
       v
  TASK-018〜019 (一覧画面)
       │
  TASK-020〜026 (入力コンポーネント)
       │
  TASK-027 (ComboForm)
       │
  TASK-028〜030 (登録/詳細/編集)
       │
  TASK-031〜035 (テスト/仕上げ)
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
