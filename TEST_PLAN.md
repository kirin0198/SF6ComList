# テスト計画書: SF6 コンボ帳

> 参照元: SPEC.md (2026-04-08)
> 参照元: ARCHITECTURE.md (2026-04-08)
> 参照元: UI_SPEC.md (2026-04-08)
> 作成日: 2026-04-08
> 最終更新: 2026-04-12
> 更新履歴:
>   - 2026-04-08: 初版作成
>   - 2026-04-12: E2E テスト設計セクション (セクション 9) を追加

---

## 1. テスト方針

### テスト戦略

- テストフレームワーク: Vitest 4.x + @testing-library/react 16.x + @testing-library/user-event 14.x
- カバレッジ目標: ビジネスロジック（notation-converter, validation）90%以上 / 全体は目安として主要パスのカバーを優先
- テスト環境: jsdom（Vitest 設定済み）、API テストは Prisma モック / 認証モック
- E2E テスト: Playwright によるブラウザ E2E テスト（セクション 9 参照）
- 方針: 個人プロジェクトのため過度なテストは避け、ビジネスロジック > バリデーション > アイコン/データ整合性 > コンポーネント の優先度で実装する

### テスト依存パッケージ

| パッケージ | 用途 | 状態 |
|-----------|------|------|
| vitest | テストランナー | 導入済み (^4.1.3) |
| @vitejs/plugin-react | React コンポーネントの JSX 変換 | 導入済み (^6.0.1) |
| jsdom | ブラウザ DOM エミュレーション | 導入済み (^29.0.2) |
| @testing-library/react | React コンポーネントテスト | 導入済み (^16.3.2) |
| @testing-library/jest-dom | カスタムマッチャー | 導入済み (^6.9.1) |
| @testing-library/user-event | ユーザー操作シミュレーション | 導入済み (^14.6.1) |

---

## 2. 既存テストのカバレッジ評価

### 実装済みテスト一覧（102件 全件パス）

| ファイル | テスト件数 | カバー範囲 | 評価 |
|---------|-----------|-----------|------|
| `src/lib/combo/__tests__/notation-converter.test.ts` | 28件 | parseNotation（13件）, serializeNotation（7件）, ラウンドトリップ（6件） | 良好。主要パターン（通常入力、溜め入力、OD、修飾子、コネクター全種、空文字列、不正トークン）を網羅 |
| `src/lib/combo/__tests__/validation.test.ts` | 22件 | comboCreateSchema（14件）, comboUpdateSchema（6件） | 良好。正常系・境界値・全ステップ型をカバー |
| `src/lib/validators/__tests__/auth.test.ts` | 16件 | loginSchema（6件）, registerSchema（10件） | 良好。必須チェック・形式・境界値（8文字/100文字/50文字）を網羅 |
| `src/app/api/__tests__/characters.test.ts` | 6件 | characters.json の構造検証 | 良好。件数・必須フィールド・ユニーク性・ステータス値・スラッグ形式を検証 |
| `src/data/__tests__/preset-tags.test.ts` | 11件 | PRESET_TAGS 定数、PRESET_TAG_NAMES、getPresetTagLabel | 良好。12種の存在・必須フィールド・カテゴリ値・ユニーク性を検証 |
| `src/components/icons/__tests__/DirectionIcon.test.tsx` | 9件 | DirectionIcon コンポーネント | 良好。全方向・サイズ3種・ニュートラル円形・className をカバー |
| `src/components/icons/__tests__/ButtonIcon.test.tsx` | 10件 | ButtonIcon コンポーネント | 良好。全15ボタン・ラベル表示・aria-label・サイズ3種・色分け・className をカバー |

### 既存テストでカバーされていない領域

以下は未テストの実装コードとその重要度評価。

| 対象 | ファイル | 重要度 | 理由 |
|------|---------|--------|------|
| タグバリデーション | `src/lib/validators/tag.ts` | 高 | tagCreateSchema のバリデーションロジックが未テスト |
| キャラクターヘルパー | `src/lib/characters.ts` | 高 | getActiveCharacters, getCharacterById, getCharacterInitials が未テスト。ビジネスロジック |
| ConnectorIcon | `src/components/icons/ConnectorIcon.tsx` | 中 | 他のアイコンは全テスト済みだがこれだけ未テスト |
| API Route Handlers | `src/app/api/` 配下全般 | 低（本計画では対象外） | DB 依存のため統合テストが必要。個人PJではコスト高 |
| ページコンポーネント | `src/app/**/*.tsx` | 低（本計画では対象外） | Server Components 中心でテストが困難。E2E 向き |
| 複合コンポーネント | `src/components/combo/*.tsx`, `src/components/input/*.tsx` | 中 | ComboInputUI 等のインタラクティブコンポーネントは状態管理が複雑 |

---

## 3. 追加テストケース一覧

### 優先度 A: tagCreateSchema バリデーション

対象ファイル: `src/lib/validators/tag.ts`

#### 正常系

| TC番号 | テストケース名 | 種別 | 入力 | 期待値 |
|--------|-------------|------|------|--------|
| TC-T01 | 有効なタグ名を受け入れる | 単体 | `{ name: "BnB" }` | success: true |
| TC-T02 | 1文字のタグ名を受け入れる（最小境界） | 単体 | `{ name: "A" }` | success: true |
| TC-T03 | 30文字のタグ名を受け入れる（最大境界） | 単体 | `{ name: "a".repeat(30) }` | success: true |
| TC-T04 | 日本語タグ名を受け入れる | 単体 | `{ name: "画面端コンボ" }` | success: true |

#### 異常系・境界値

| TC番号 | テストケース名 | 種別 | 入力 | 期待値 |
|--------|-------------|------|------|--------|
| TC-T05 | タグ名が空文字の場合は失敗する | 単体 | `{ name: "" }` | success: false, メッセージ「タグ名を入力してください」 |
| TC-T06 | タグ名が31文字以上の場合は失敗する | 単体 | `{ name: "a".repeat(31) }` | success: false, メッセージ「タグ名は30文字以内で入力してください」 |
| TC-T07 | name フィールドがない場合は失敗する | 単体 | `{}` | success: false |

### 優先度 A: キャラクターヘルパー関数

対象ファイル: `src/lib/characters.ts`

#### 正常系

| TC番号 | テストケース名 | 種別 | 入力 | 期待値 |
|--------|-------------|------|------|--------|
| TC-C01 | getActiveCharacters が active ステータスのキャラクターのみ返す | 単体 | (引数なし) | upcoming を含まない配列。全件の status が "active" |
| TC-C02 | getActiveCharacters が upcoming を除外する | 単体 | (引数なし) | id="ingrid" のキャラクターが含まれない |
| TC-C03 | getCharacterById で存在するキャラクターを取得する | 単体 | `"ryu"` | `{ id: "ryu", name: "Ryu", ... }` |
| TC-C04 | getCharacterById で存在しない ID は undefined を返す | 単体 | `"nonexistent"` | undefined |
| TC-C05 | getCharacterInitials が日本語名の先頭2文字を返す | 単体 | `{ displayName: "リュウ", ... }` | "リュ" |
| TC-C06 | getCharacterInitials が英数字名をそのまま返す | 単体 | `{ displayName: "JP", ... }` | "JP" |
| TC-C07 | getCharacterInitials がスペース区切りの英語名からイニシャルを返す | 単体 | `{ displayName: "E. Honda", ... }` | "EH" |

#### 異常系・境界値

| TC番号 | テストケース名 | 種別 | 入力 | 期待値 |
|--------|-------------|------|------|--------|
| TC-C08 | getCharacterById に空文字列を渡すと undefined | 単体 | `""` | undefined |

### 優先度 B: ConnectorIcon コンポーネント

対象ファイル: `src/components/icons/ConnectorIcon.tsx`

#### 正常系

| TC番号 | テストケース名 | 種別 | 入力 | 期待値 |
|--------|-------------|------|------|--------|
| TC-CI01 | ">" シンボルがレンダリングされる | コンポーネント | `symbol=">"` | テキスト ">" が表示、aria-label="リンク" |
| TC-CI02 | "xx" シンボルがレンダリングされる | コンポーネント | `symbol="xx"` | テキスト "xx" が表示、aria-label="キャンセル" |
| TC-CI03 | "~" シンボルがレンダリングされる | コンポーネント | `symbol="~"` | テキスト "~" が表示、aria-label="ディレイ/派生" |
| TC-CI04 | "," シンボルがレンダリングされる | コンポーネント | `symbol=","` | テキスト "," が表示、aria-label="コマンド区切り" |
| TC-CI05 | カスタム className が適用される | コンポーネント | `symbol=">" className="test"` | className に "test" が含まれる |
| TC-CI06 | title 属性にラベルが設定される | コンポーネント | `symbol="xx"` | title="キャンセル" |

### 優先度 B: notation-converter 追加テストケース

対象ファイル: `src/lib/combo/notation-converter.ts`

既存テストは良好だが、以下のエッジケースを追加で検証する。

| TC番号 | テストケース名 | 種別 | 入力 | 期待値 |
|--------|-------------|------|------|--------|
| TC-NC01 | 全6ボタン（LP/MP/HP/LK/MK/HK）が単独でパースされる | 単体 | "LP", "MP", ... | 各ボタンの NormalInput（directions: []） |
| TC-NC02 | 全ドライブアクション（DI/DR/DP/PP/DRev/OD）がパースされる | 単体 | "DI", "DP", ... | 各アクションの NormalInput |
| TC-NC03 | Throw がパースされる | 単体 | "Throw" | NormalInput, button: "Throw" |
| TC-NC04 | 複数の修飾子（cl./cr./st.）がパースされる | 単体 | "cl.HP", "cr.MK", "st.HP" | 各修飾子付き NormalInput |
| TC-NC05 | コンマ区切りコンボのラウンドトリップ | 単体 | "5LP , 5MP" をパース→シリアライズ | "5LP , 5MP"（スペース付き） |
| TC-NC06 | 長い実戦コンボのパース | 単体 | "j.HP > 5HP xx 236HP xx DR > 5MP > 2MK xx 214MK > SA2" | 13ステップ（7入力 + 6コネクター） |

### 優先度 C: comboCreateSchema 追加エッジケース

対象ファイル: `src/lib/combo/validation.ts`

| TC番号 | テストケース名 | 種別 | 入力 | 期待値 |
|--------|-------------|------|------|--------|
| TC-V01 | ダメージ値 99999（高い値）が受け入れられる | 単体 | damage: 99999 | success: true |
| TC-V02 | tagIds に文字列配列を受け入れる | 単体 | tagIds: ["id1", "id2"] | success: true |
| TC-V03 | 複数ステップを持つ sequence が受け入れられる | 単体 | 7ステップのフルコンボシーケンス | success: true |
| TC-V04 | 不正な step type を含む sequence は失敗する | 単体 | steps: [{ type: "unknown" }] | success: false |

---

## 4. テストファイル構成

```
src/
├── test/
│   └── setup.ts                                  # 共通セットアップ（導入済み）
├── lib/
│   ├── combo/
│   │   └── __tests__/
│   │       ├── notation-converter.test.ts         # 既存（28件）+ 追加（6件）
│   │       └── validation.test.ts                 # 既存（22件）+ 追加（4件）
│   ├── validators/
│   │   └── __tests__/
│   │       ├── auth.test.ts                       # 既存（16件）
│   │       └── tag.test.ts                        # 新規（7件）
│   └── __tests__/
│       └── characters.test.ts                     # 新規（8件）
├── data/
│   └── __tests__/
│       └── preset-tags.test.ts                    # 既存（11件）
├── app/
│   └── api/
│       └── __tests__/
│           └── characters.test.ts                 # 既存（6件）
└── components/
    └── icons/
        └── __tests__/
            ├── DirectionIcon.test.tsx              # 既存（9件）
            ├── ButtonIcon.test.tsx                 # 既存（10件）
            └── ConnectorIcon.test.tsx              # 新規（6件）
```

---

## 5. テストデータ

### フィクスチャ・テストデータ

| データ名 | 内容 | 使用テスト |
|---------|------|----------|
| validSequence | 有効な ComboSequence（236HP） | TC-V01〜V04, 既存 validation テスト |
| validComboCreate | 有効なコンボ作成データ（名前・シーケンス・ダメージ・メモ・タグ付き） | TC-V01〜V04, 既存 validation テスト |
| characters.json | 全30キャラクターの静的マスタデータ | TC-C01〜C08, 既存 characters テスト |
| PRESET_TAGS | プリセットタグ12種の定数 | 既存 preset-tags テスト |

### テストデータの管理方針

- バリデーションテスト: テストファイル内にインラインで定義する（現行方式を踏襲）
- characters.json: 実データをそのまま使用する（モック不要）
- API テスト（将来）: Prisma モック or テスト用 SQLite を使用する

---

## 6. 実行手順

### テスト実行コマンド

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# 特定ファイルのみ実行
npx vitest run src/lib/validators/__tests__/tag.test.ts

# カバレッジ付き実行
npx vitest run --coverage
```

### 実行順序の制約

テスト間に実行順序の依存関係はない。全テストは独立して実行可能。

---

## 7. UC-テストケース トレーサビリティマトリクス

| UC番号 | 受け入れ条件 | テストケース | 種別 | 状態 |
|--------|------------|------------|------|------|
| UC-001 (ユーザー登録) | AC1: 有効なメール/パスワードで登録可能 | 既存 auth.test.ts: registerSchema 正常系 | 単体 | 実装済み |
| UC-001 | AC2: パスワードがハッシュ化保存 | API統合テスト対象（本計画対象外） | 統合 | 対象外 |
| UC-001 | AC3: 重複メール拒否 | API統合テスト対象（本計画対象外） | 統合 | 対象外 |
| UC-001 (例外) | E2: パスワード8文字未満 | 既存 auth.test.ts: TC「パスワードが7文字以下」 | 単体 | 実装済み |
| UC-001 (例外) | E1/E3: メール形式不正、パスワード不一致 | 既存 auth.test.ts: TC「無効なメールアドレス形式」 | 単体 | 実装済み |
| UC-002 (ログイン) | AC1/AC3: 正しい認証情報/不正な認証情報 | 既存 auth.test.ts: loginSchema 正常系・異常系 | 単体 | 実装済み |
| UC-004 (キャラ一覧) | AC1: 全30キャラ(active)表示 | TC-C01, TC-C02 + 既存 characters.test.ts | 単体 | TC-C01,C02 追加 |
| UC-004 | AC4: upcoming 非表示 | TC-C02 | 単体 | 追加 |
| UC-005 (ビジュアル入力) | AC1: 9方向選択 | 既存 DirectionIcon.test.tsx: 全方向テスト | コンポーネント | 実装済み |
| UC-005 | AC2: 全ボタン選択 | 既存 ButtonIcon.test.tsx: 全15ボタンテスト | コンポーネント | 実装済み |
| UC-005 | AC3: コネクター選択 | TC-CI01〜CI04 | コンポーネント | 追加 |
| UC-005 | AC6: テンキー表記生成 | 既存 notation-converter.test.ts: serializeNotation テスト | 単体 | 実装済み |
| UC-006 (テキスト入力) | AC2: テンキー表記パース | 既存 notation-converter.test.ts: parseNotation テスト | 単体 | 実装済み |
| UC-006 | AC5: 相互変換 | 既存 notation-converter.test.ts: ラウンドトリップテスト | 単体 | 実装済み |
| UC-005/006 共通 | コンボバリデーション | 既存 validation.test.ts: comboCreateSchema テスト | 単体 | 実装済み |
| UC-009 (コンボ編集) | AC2: 全フィールド編集可 | 既存 validation.test.ts: comboUpdateSchema テスト | 単体 | 実装済み |
| UC-011 (タグフィルタ) | AC1: プリセットタグ12種 | 既存 preset-tags.test.ts | 単体 | 実装済み |
| UC-012 (タグ作成) | AC2: タグ名1〜30文字 | TC-T02, TC-T03, TC-T05, TC-T06 | 単体 | 追加 |
| UC-012 (例外) | E1: タグ名空 | TC-T05 | 単体 | 追加 |

### カバレッジ概要

- **バリデーションスキーマによるカバー（単体テスト）:** UC-001, UC-002, UC-005, UC-006, UC-009, UC-012 の入力検証
- **静的データ・ヘルパーによるカバー:** UC-004, UC-011
- **アイコンコンポーネントによるカバー:** UC-005 のビジュアル入力要素
- **API 統合テスト対象外（DB 依存）:** UC-001 AC2/AC3, UC-003, UC-007 AC1, UC-008 E1, UC-009 AC3/AC4, UC-010, UC-011 AC3/AC5, UC-012 AC3/AC4

> 注: API 統合テストは DB（Prisma）への依存が大きく、テスト環境のセットアップコストが高い。個人プロジェクトでは、バリデーションスキーマの単体テストでリクエスト/レスポンスの正当性を担保し、実際の DB 操作は手動テストでカバーする方針とする。

---

## 8. テスト追加の実装サマリー

| 優先度 | 対象 | 新規ファイル | 追加テスト件数 |
|--------|------|------------|-------------|
| A | tagCreateSchema | `src/lib/validators/__tests__/tag.test.ts` | 7件 |
| A | characters ヘルパー | `src/lib/__tests__/characters.test.ts` | 8件 |
| B | ConnectorIcon | `src/components/icons/__tests__/ConnectorIcon.test.tsx` | 6件 |
| B | notation-converter 追加 | 既存ファイルに追加 | 6件 |
| C | validation 追加 | 既存ファイルに追加 | 4件 |
| **合計** | | | **31件** |

テスト総数（既存 + 追加）: 102 + 31 = **133件**

---

## 9. E2E テスト設計

### 9.1 E2E テスト環境

| 項目 | 値 |
|------|-----|
| ツール | Playwright (`@playwright/test`) |
| ブラウザ | Chromium（CI 標準）、Firefox / WebKit（オプション） |
| 実行モード | headless（CI / 通常実行）、headed（デバッグ時） |
| ベース URL | `http://localhost:3000`（Next.js dev server） |
| テスト用 DB | テスト専用 SQLite ファイル (`data/test-e2e.db`)。テスト起動前にマイグレーション + シードを実行し、テスト終了後に削除する |
| 解像度 | 1280x720（デスクトップ前提。UI_SPEC.md のブレークポイント >= 1024px を満たす） |
| タイムアウト | テスト単位 30 秒、ナビゲーション待機 10 秒 |

### 9.2 E2E テスト依存パッケージ

| パッケージ | 用途 | 備考 |
|-----------|------|------|
| `@playwright/test` | E2E テストフレームワーク | `npm i -D @playwright/test` |
| Playwright ブラウザ | Chromium / Firefox / WebKit | `npx playwright install --with-deps chromium`（CI は Chromium のみで十分） |

### 9.3 E2E テストファイル構成

```
tests/
└── e2e/
    ├── playwright.config.ts       # Playwright 設定（ベースURL、ブラウザ、webServer 起動等）
    ├── global-setup.ts            # テスト用 DB 初期化（マイグレーション + シード）
    ├── global-teardown.ts         # テスト用 DB クリーンアップ
    ├── fixtures/
    │   ├── auth.fixture.ts        # 認証済みコンテキスト生成ヘルパー
    │   └── test-data.ts           # テスト用定数（メールアドレス、パスワード、コンボデータ等）
    ├── pages/                     # Page Object Model
    │   ├── login.page.ts          # SCR-001: ログイン画面 POM
    │   ├── register.page.ts       # SCR-002: ユーザー登録画面 POM
    │   ├── character-list.page.ts # SCR-003: キャラクター一覧 POM
    │   ├── combo-list.page.ts     # SCR-004: コンボ一覧 POM
    │   ├── combo-new.page.ts      # SCR-005: コンボ登録 POM
    │   ├── combo-detail.page.ts   # SCR-006: コンボ詳細 POM
    │   └── combo-edit.page.ts     # SCR-007: コンボ編集 POM
    ├── auth.spec.ts               # 認証フロー（UC-001, UC-002, UC-003）
    ├── character-list.spec.ts     # キャラクター一覧（UC-004）
    ├── combo-crud.spec.ts         # コンボ CRUD（UC-005, UC-006, UC-007, UC-008, UC-009, UC-010）
    ├── combo-input.spec.ts        # コンボ入力 UI 詳細（UC-005, UC-006）
    ├── tag-filter.spec.ts         # タグフィルタ + ユーザータグ作成（UC-011, UC-012）
    └── navigation.spec.ts         # 画面遷移・認証ガード・パンくず
```

### 9.4 テストデータ戦略

#### DB セットアップ

1. `global-setup.ts` で以下を実行する:
   - 環境変数 `DATABASE_URL` をテスト専用パス (`file:./data/test-e2e.db`) に設定
   - `npx prisma migrate deploy` でスキーマを適用
   - `npx prisma db seed` でプリセットタグ 12 種を投入
2. `global-teardown.ts` でテスト用 DB ファイルを削除する

#### テスト用ユーザー

| 変数名 | メールアドレス | パスワード | 用途 |
|--------|-------------|-----------|------|
| `TEST_USER_A` | `e2e-user-a@test.local` | `TestPass123!` | メインテストユーザー（コンボ登録・編集・削除等） |
| `TEST_USER_B` | `e2e-user-b@test.local` | `TestPass456!` | データ分離テスト用（他ユーザーのコンボが見えないことの検証） |

#### テスト間の独立性

- 各テストファイルは `test.describe` 内で必要なデータを API 経由で作成し、テスト後にクリーンアップする
- 認証状態は Playwright の `storageState` を活用してログイン済みコンテキストを共有する（テストファイルごとにログインを繰り返さない）
- コンボの CRUD テストは各テストケース冒頭で API 直接呼び出しによりデータを準備する

### 9.5 Page Object Model 設計

| ページクラス | 対応画面 | 主要セレクタ | 主要アクション |
|------------|---------|------------|-------------|
| `LoginPage` | SCR-001 `/login` | `form[aria-label="ログインフォーム"]`, `label:text("メールアドレス")`, `label:text("パスワード")`, `button:text("ログイン")`, `a:text("新規登録はこちら")`, `[role="alert"]` | `login(email, password)`, `clickRegisterLink()`, `getErrorMessage()` |
| `RegisterPage` | SCR-002 `/register` | `form[aria-label="ユーザー登録フォーム"]`, `label:text("メールアドレス")`, `label:text("パスワード（8文字以上）")`, `label:text("パスワード（確認）")`, `button:text("アカウントを作成")`, `a:text("ログインはこちら")` | `register(email, password, confirmPassword)`, `clickLoginLink()`, `getErrorMessage()`, `getFieldError(field)` |
| `CharacterListPage` | SCR-003 `/` | `h1:text("キャラクター一覧")` 付近, キャラカード群（`[cursor-pointer]` カード要素）, ヘッダーのログアウトボタン | `getCharacterCards()`, `getCharacterCardByName(name)`, `clickCharacter(name)`, `getComboCount(name)`, `logout()` |
| `ComboListPage` | SCR-004 `/characters/[id]/combos` | パンくず `a:text("キャラクター一覧")`, 新規登録ボタン `button:text("新しいコンボを登録")` or `a:text("新しいコンボを登録")`, タグフィルタバー, コンボカード群, 空状態メッセージ | `clickNewCombo()`, `getComboCards()`, `clickCombo(name)`, `toggleTagFilter(tagName)`, `clearTagFilter()`, `getEmptyMessage()`, `goBackToCharacterList()` |
| `ComboNewPage` | SCR-005 `/characters/[id]/combos/new` | 入力モードタブ `[role="tab"]`, 方向パッド `[aria-label="方向入力パッド"]`, ボタンパレット `[aria-label="ボタン選択パレット"]`, コネクター `[aria-label="コネクター選択"]`, プレビューエリア, コンボ名入力, ダメージ入力, メモ textarea `#combo-memo`, タグ選択, 保存ボタン | `inputVisualCombo(steps)`, `inputTextCombo(notation)`, `switchToTextMode()`, `switchToVisualMode()`, `fillMetadata(name, damage, memo)`, `selectTag(name)`, `createTag(name)`, `clickSave()`, `clickCancel()`, `getPreviewNotation()` |
| `ComboDetailPage` | SCR-006 `/characters/[id]/combos/[comboId]` | コンボ名見出し, ビジュアルシーケンス表示, テンキー表記テキスト, ダメージ値, タグバッジ, メモ, 編集ボタン `button:text("編集")` or `a:text("編集")`, 削除ボタン `[aria-label="コンボを削除"]`, 確認ダイアログ `[role="dialog"]` | `getComboName()`, `getNotation()`, `getDamage()`, `getTags()`, `getMemo()`, `clickEdit()`, `clickDelete()`, `confirmDelete()`, `cancelDelete()` |
| `ComboEditPage` | SCR-007 `/characters/[id]/combos/[comboId]/edit` | SCR-005 と同じセレクタ。ページタイトル「コンボを編集」、保存ボタン「変更を保存」 | `getPrefilledName()`, `getPrefilledDamage()`, `updateMetadata(name, damage, memo)`, `clickSave()`, `clickCancel()` |

#### セレクタ戦略

実装コードに `data-testid` が存在しないため、以下の優先順位でセレクタを選択する:

1. **aria-label / role ベース（最優先）:** `[aria-label="ログインフォーム"]`, `[role="alert"]`, `[role="dialog"]`, `[role="tab"]`
2. **テキストコンテンツベース:** `button:has-text("ログイン")`, `a:has-text("新規登録はこちら")`
3. **HTML ラベル連携:** `label` テキストから紐づく `input` を特定（`page.getByLabel("メールアドレス")`）
4. **CSS セレクタ（最終手段）:** `#combo-memo`, `form`, カード要素の構造セレクタ

> **推奨:** 将来的に `data-testid` 属性を主要なインタラクティブ要素に追加することで E2E テストの安定性が向上する。現時点では aria-label とテキストベースのセレクタで十分にテスト可能。

### 9.6 E2E テストケース一覧

#### 9.6.1 認証フロー (`auth.spec.ts`)

| TC番号 | テストケース名 | 対象画面 | 操作手順 | 期待結果 | 対応UC |
|--------|-------------|---------|---------|---------|--------|
| TC-E2E-001 | 新規ユーザー登録が成功する | SCR-002 | 1. `/register` にアクセス 2. メール `e2e-user-a@test.local` を入力 3. パスワード `TestPass123!` を入力 4. パスワード確認に同じ値を入力 5. 「アカウントを作成」をクリック | キャラクター一覧 (`/`) に遷移し、「キャラクター一覧」の見出しが表示される | UC-001 AC1, AC4 |
| TC-E2E-002 | パスワード不一致で登録が失敗する | SCR-002 | 1. `/register` にアクセス 2. メール入力 3. パスワード「TestPass123!」 4. 確認「DifferentPass!」 5. 「アカウントを作成」クリック | 「パスワードが一致しません」エラーが表示される。画面遷移しない | UC-001 E3 |
| TC-E2E-003 | パスワード7文字以下で登録が失敗する | SCR-002 | 1. `/register` にアクセス 2. メール入力 3. パスワード「short1!」（7文字） 4. 確認も同じ 5. 「アカウントを作成」クリック | 「パスワードは8文字以上で入力してください」エラーが表示される | UC-001 E2 |
| TC-E2E-004 | 無効なメール形式で登録が失敗する | SCR-002 | 1. `/register` にアクセス 2. メール「invalid-email」入力 3. パスワード入力 4. 「アカウントを作成」クリック | 「有効なメールアドレスを入力してください」エラーが表示される | UC-001 |
| TC-E2E-005 | 重複メールアドレスで登録が失敗する | SCR-002 | 1. TEST_USER_A で事前登録済み 2. `/register` にアクセス 3. 同じメールで登録 | 「このメールアドレスは既に登録されています」サーバーエラーが表示される | UC-001 AC3 |
| TC-E2E-006 | 正しい認証情報でログインが成功する | SCR-001 | 1. TEST_USER_A 事前登録済み 2. `/login` にアクセス 3. メール・パスワード入力 4. 「ログイン」クリック | キャラクター一覧 (`/`) に遷移する | UC-002 AC1 |
| TC-E2E-007 | 不正なパスワードでログインが失敗する | SCR-001 | 1. `/login` にアクセス 2. 正しいメール、間違ったパスワード入力 3. 「ログイン」クリック | 「メールアドレスまたはパスワードが正しくありません」エラーが表示される | UC-002 AC3 |
| TC-E2E-008 | 未登録メールでログインが失敗する | SCR-001 | 1. `/login` にアクセス 2. 未登録メール入力 3. 「ログイン」クリック | 「メールアドレスまたはパスワードが正しくありません」エラーが表示される | UC-002 AC3 |
| TC-E2E-009 | ログイン後にブラウザリロードしてもセッションが維持される | SCR-001, SCR-003 | 1. ログイン成功 → `/` に遷移 2. ブラウザリロード (page.reload) | `/` にとどまり、キャラクター一覧が表示される（ログイン画面に飛ばされない） | UC-002 AC2 |
| TC-E2E-010 | ログアウトが成功しログイン画面に遷移する | SCR-003 | 1. ログイン済み状態で `/` にアクセス 2. ヘッダーのログアウトボタンをクリック | `/login` に遷移する | UC-003 AC1, AC2 |
| TC-E2E-011 | ログアウト後に認証画面へのアクセスがリダイレクトされる | SCR-003 | 1. ログアウト完了 2. `/` に直接アクセス | `/login` にリダイレクトされる | UC-003 AC3 |
| TC-E2E-012 | ログイン画面から登録画面へ遷移できる | SCR-001 | 1. `/login` にアクセス 2. 「新規登録はこちら」リンクをクリック | `/register` に遷移する | UC-002 AC4 |
| TC-E2E-013 | 登録画面からログイン画面へ遷移できる | SCR-002 | 1. `/register` にアクセス 2. 「ログインはこちら」リンクをクリック | `/login` に遷移する | UC-002 AC4 |
| TC-E2E-014 | Enter キーでログインフォームを送信できる | SCR-001 | 1. `/login` でメール・パスワード入力 2. パスワードフィールドで Enter キー押下 | ログインが実行される（成功時は `/` に遷移） | UC-002 |
| TC-E2E-015 | 必須フィールド空でログインが失敗する | SCR-001 | 1. `/login` にアクセス 2. 何も入力せず「ログイン」クリック | 「メールアドレスを入力してください」「パスワードを入力してください」エラーが表示される | UC-002 |
| TC-E2E-016 | パスワード表示/非表示トグルが動作する | SCR-001 | 1. `/login` にアクセス 2. パスワード入力 3. 目アイコンをクリック | パスワードが平文で表示される（input type が text になる）。再クリックで password に戻る | UC-002 |

#### 9.6.2 キャラクター一覧 (`character-list.spec.ts`)

| TC番号 | テストケース名 | 対象画面 | 操作手順 | 期待結果 | 対応UC |
|--------|-------------|---------|---------|---------|--------|
| TC-E2E-017 | 全30キャラクターが一覧表示される | SCR-003 | 1. ログイン済み状態で `/` にアクセス | 30 枚のキャラクターカードが表示される。各カードにキャラクター名が表示される | UC-004 AC1 |
| TC-E2E-018 | 各キャラクターにコンボ数が表示される | SCR-003 | 1. ログイン済み状態で `/` にアクセス | 各カードに「N combos」形式のコンボ数が表示される（初期状態は全て 0） | UC-004 AC2 |
| TC-E2E-019 | キャラクターカードクリックでコンボ一覧に遷移する | SCR-003 | 1. `/` でリュウ（ryu）のカードをクリック | `/characters/ryu/combos` に遷移し、コンボ一覧画面が表示される | UC-004 AC3 |
| TC-E2E-020 | upcoming ステータスのキャラクターが表示されない | SCR-003 | 1. `/` にアクセス 2. 全カードのテキストを取得 | upcoming ステータスのキャラクター名が一覧に含まれない | UC-004 AC4 |
| TC-E2E-021 | ヘッダーにロゴとユーザー情報が表示される | SCR-003 | 1. `/` にアクセス | ヘッダーに「SF6」を含むロゴテキスト、ログアウトボタンが表示される | UC-004 |

#### 9.6.3 コンボ CRUD (`combo-crud.spec.ts`)

| TC番号 | テストケース名 | 対象画面 | 操作手順 | 期待結果 | 対応UC |
|--------|-------------|---------|---------|---------|--------|
| TC-E2E-022 | コンボが0件の場合に空状態メッセージが表示される | SCR-004 | 1. コンボ未登録状態で `/characters/ryu/combos` にアクセス | 「コンボが登録されていません」メッセージが表示される。新規登録へのリンクが表示される | UC-007 E1 |
| TC-E2E-023 | ビジュアル入力でコンボを新規登録する | SCR-005, SCR-004 | 1. コンボ一覧で「新しいコンボを登録」クリック 2. 方向パッドで 2（下）クリック 3. ボタンパレットで MK クリック 4. コネクター「xx」クリック 5. 方向 2, 1, 4 を順にクリック 6. MK クリック 7. コンボ名「テスト BnB」入力 8. ダメージ「2800」入力 9. 「このコンボを保存」クリック | コンボ一覧画面に遷移し、「テスト BnB」コンボが一覧に表示される | UC-005 AC1-AC9 |
| TC-E2E-024 | テキスト入力でコンボを新規登録する | SCR-005, SCR-004 | 1. コンボ登録画面で「テキスト入力」タブをクリック 2. テキストフィールドに「5MP > 2MK xx 236HP」を入力 3. コンボ名「テキスト入力テスト」入力 4. 「このコンボを保存」クリック | コンボ一覧に遷移し、「テキスト入力テスト」が表示される。テンキー表記が「5MP > 2MK xx 236HP」で表示される | UC-006 AC1-AC5 |
| TC-E2E-025 | リアルタイムプレビューが更新される（ビジュアル入力） | SCR-005 | 1. コンボ登録画面で方向 5（ニュートラル）→ MP クリック | プレビューエリアにビジュアル表記が表示される。テンキー表記テキスト「5MP」が表示される | UC-005 AC5, AC6 |
| TC-E2E-026 | リアルタイムプレビューが更新される（テキスト入力） | SCR-005 | 1. テキスト入力モードに切替 2. 「2MK xx 236HP」を入力 | プレビューエリアにビジュアルアイコンが表示される | UC-006 AC2 |
| TC-E2E-027 | コンボ一覧に登録済みコンボが表示される | SCR-004 | 1. API でコンボを1件登録済み 2. コンボ一覧にアクセス | コンボカードが表示される。コンボ名、ビジュアル表記、テンキー表記、ダメージ値が表示される | UC-007 AC2-AC5 |
| TC-E2E-028 | コンボカードクリックで詳細画面に遷移する | SCR-004, SCR-006 | 1. コンボ一覧でコンボカードをクリック | コンボ詳細画面に遷移する。コンボ名、シーケンス、ダメージ、タグ、メモが表示される | UC-008 AC1-AC3 |
| TC-E2E-029 | コンボ詳細画面に全属性が表示される | SCR-006 | 1. 全メタデータ付きコンボを API で登録 2. 詳細画面にアクセス | コンボ名、ビジュアル表記、テンキー表記、ダメージ値、タグバッジ、メモ、作成日・更新日が表示される | UC-008 AC1, AC2 |
| TC-E2E-030 | コンボ詳細画面から編集画面に遷移する | SCR-006, SCR-007 | 1. コンボ詳細画面で「編集」ボタンをクリック | 編集画面に遷移する。既存のコンボデータがプリセットされている | UC-008 AC3, UC-009 AC1 |
| TC-E2E-031 | コンボ編集で名前を変更して保存する | SCR-007, SCR-004 | 1. 編集画面で既存コンボ名を「更新後コンボ名」に変更 2. 「変更を保存」クリック | コンボ一覧に遷移し、更新後のコンボ名が表示される | UC-009 AC2 |
| TC-E2E-032 | コンボ編集で既存データがプリセットされている | SCR-007 | 1. コンボ名「テスト」、ダメージ 2800 のコンボを API で登録 2. 編集画面にアクセス | コンボ名フィールドに「テスト」、ダメージフィールドに「2800」がプリセットされている。プレビューに既存シーケンスが表示される | UC-009 AC1 |
| TC-E2E-033 | コンボ削除の確認ダイアログが表示される | SCR-006 | 1. コンボ詳細画面で「削除」ボタンをクリック | 確認ダイアログ「コンボを削除しますか？」が表示される。「削除する」「キャンセル」ボタンがある | UC-010 AC1 |
| TC-E2E-034 | コンボ削除を確認すると削除されコンボ一覧に遷移する | SCR-006, SCR-004 | 1. 削除ボタンクリック 2. 確認ダイアログで「削除する」クリック | コンボ一覧に遷移する。削除したコンボが一覧に表示されない | UC-010 AC2, AC3 |
| TC-E2E-035 | コンボ削除をキャンセルするとコンボが残る | SCR-006 | 1. 削除ボタンクリック 2. 確認ダイアログで「キャンセル」クリック | ダイアログが閉じる。コンボ詳細画面にとどまる | UC-010 E2 |
| TC-E2E-036 | コンボシーケンスが空の場合は保存ボタンが非活性 | SCR-005 | 1. コンボ登録画面にアクセス（初期状態） | 「このコンボを保存」ボタンが `disabled` 状態である | UC-005 E1 |
| TC-E2E-037 | 元に戻すボタンで最後の入力を取り消せる | SCR-005 | 1. 方向 2 → MK 入力で1ステップ確定 2. 「元に戻す」クリック | プレビューが空に戻る | UC-005 AC7 |
| TC-E2E-038 | リセットボタンで全入力をクリアする | SCR-005 | 1. 複数ステップ入力後 2. 「リセット」クリック | プレビューが空になる。保存ボタンが disabled に戻る | UC-005 AC8 |

#### 9.6.4 コンボ入力 UI 詳細 (`combo-input.spec.ts`)

| TC番号 | テストケース名 | 対象画面 | 操作手順 | 期待結果 | 対応UC |
|--------|-------------|---------|---------|---------|--------|
| TC-E2E-039 | 方向パッドの全9方向が選択できる | SCR-005 | 1. 方向パッドの各ボタン (1-9) を順にクリックし、都度ボタン(LP等)で確定 | 各方向のステップがプレビューに追加される | UC-005 AC1 |
| TC-E2E-040 | ボタンパレットの全ボタンが選択できる | SCR-005 | 1. LP, MP, HP, LK, MK, HK を順にクリック（方向なし = ニュートラル） | 各ボタンのステップがプレビューに追加される | UC-005 AC2 |
| TC-E2E-041 | ドライブアクションボタン (DI/DR/DP/DRev) が選択できる | SCR-005 | 1. ボタンパレットで DI, DR, DP, DRev を順にクリック | 各アクションのステップがプレビューに追加される | UC-005 AC2 |
| TC-E2E-042 | スーパーアーツ (SA1/SA2/SA3) が選択できる | SCR-005 | 1. ボタンパレットで SA1, SA2, SA3 を順にクリック | 各 SA のステップがプレビューに追加される | UC-005 AC2 |
| TC-E2E-043 | Throw が選択できる | SCR-005 | 1. Throw ボタンをクリック | Throw ステップがプレビューに追加される | UC-005 AC2 |
| TC-E2E-044 | 4種のコネクターが選択できる | SCR-005 | 1. ステップ入力後にコネクター >, xx, ~, , を順にクリック | 各コネクターがプレビューに表示される | UC-005 AC3 |
| TC-E2E-045 | OD トグルで OD 技を入力できる | SCR-005 | 1. OD トグルを ON にする 2. 方向 236 → HP クリック | プレビューに OD マーク付きの 236HP が表示される | UC-005 AC4 |
| TC-E2E-046 | 入力モード切替でビジュアルからテキストに切り替わる | SCR-005 | 1. ビジュアルモードで 5MP を入力 2. 「テキスト入力」タブをクリック | テキスト入力フィールドが表示され、「5MP」がテキストとして表示される。ビジュアルパネルは非表示になる | UC-006 AC4, AC5 |
| TC-E2E-047 | テキスト入力のパースエラーで警告が表示される | SCR-005 | 1. テキスト入力モードに切替 2. 「INVALID_TOKEN」を入力 | パースエラー警告メッセージが表示される | UC-006 AC3 |
| TC-E2E-048 | 複数方向入力（コマンド入力）が可能 | SCR-005 | 1. 方向 2, 3, 6 を順にクリック 2. HP をクリック | 「236HP」のステップがプレビューに追加される。テンキー表記に「236HP」が表示される | UC-005 AC1 |
| TC-E2E-049 | コンボ名が空でも保存できる（無題のコンボ） | SCR-005 | 1. 1ステップ以上入力 2. コンボ名を空のまま保存 | 保存が成功する。コンボ一覧で「無題のコンボ」として表示される | UC-005 |
| TC-E2E-050 | ダメージ値に負数を入力するとバリデーションエラー | SCR-005 | 1. ダメージフィールドに「-100」を入力 2. 保存クリック | 「0以上の整数を入力してください」エラーが表示される | UC-005 |

#### 9.6.5 タグフィルタ + ユーザータグ作成 (`tag-filter.spec.ts`)

| TC番号 | テストケース名 | 対象画面 | 操作手順 | 期待結果 | 対応UC |
|--------|-------------|---------|---------|---------|--------|
| TC-E2E-051 | プリセットタグ12種がフィルタ選択肢に表示される | SCR-004 | 1. コンボ一覧画面にアクセス | タグフィルタ領域に BnB, 画面端, 画面中央, DR, パニカン, CH, 対空, SA1, SA2, SA3, 投げ, OD使用 の 12 種バッジが表示される | UC-011 AC1 |
| TC-E2E-052 | タグバッジクリックで一覧がフィルタされる | SCR-004 | 1. 「BnB」タグ付きコンボと「画面端」タグ付きコンボを事前登録 2. 「BnB」タグバッジをクリック | BnB タグが付いたコンボのみ表示される。画面端のみのコンボは非表示 | UC-011 AC3, AC5 |
| TC-E2E-053 | 複数タグを選択すると OR 条件で絞り込まれる | SCR-004 | 1. 「BnB」と「画面端」のタグバッジをクリック | BnB または画面端タグを持つコンボが全て表示される | UC-011 AC3 |
| TC-E2E-054 | フィルタクリアで全コンボが表示される | SCR-004 | 1. タグを選択してフィルタ適用中 2. 「クリア」ボタンをクリック | 全コンボが表示される。タグバッジが全て非選択状態に戻る | UC-011 AC4 |
| TC-E2E-055 | フィルタ結果が0件の場合にメッセージが表示される | SCR-004 | 1. コンボにタグを付けずに登録 2. タグで絞り込み | 「該当するコンボがありません」メッセージが表示される | UC-011 E1 |
| TC-E2E-056 | コンボ登録画面でプリセットタグを選択できる | SCR-005 | 1. コンボ登録画面でタグ選択エリアを確認 2. 「BnB」タグバッジをクリック | バッジが選択状態になる（スタイル変更） | UC-005 |
| TC-E2E-057 | コンボ登録画面で新しいユーザー定義タグを作成できる | SCR-005 | 1. タグ追加入力欄に「画面端コンボ」を入力 2. 追加ボタン（「+」）をクリック | 新しいタグバッジ「画面端コンボ」が追加される。選択状態になる | UC-012 AC1, AC2 |
| TC-E2E-058 | タグ付きコンボを保存すると一覧でタグが表示される | SCR-005, SCR-004 | 1. コンボにタグ「BnB」「SA2」を付けて保存 2. コンボ一覧で確認 | コンボカードにタグバッジ「BnB」「SA2」が表示される | UC-007 AC5 |
| TC-E2E-059 | ユーザー定義タグがフィルタ選択肢に表示される | SCR-004 | 1. ユーザー定義タグ付きコンボを登録 2. コンボ一覧のタグフィルタを確認 | プリセットタグ12種に加え、ユーザー定義タグもバッジとして表示される | UC-011 AC2 |

#### 9.6.6 画面遷移・ナビゲーション (`navigation.spec.ts`)

| TC番号 | テストケース名 | 対象画面 | 操作手順 | 期待結果 | 対応UC |
|--------|-------------|---------|---------|---------|--------|
| TC-E2E-060 | 未認証で `/` にアクセスするとログイン画面にリダイレクトされる | - | 1. 未ログイン状態で `/` にアクセス | `/login` にリダイレクトされる | UC-003 AC3 |
| TC-E2E-061 | 未認証で `/characters/ryu/combos` にアクセスするとリダイレクトされる | - | 1. 未ログイン状態で直接アクセス | `/login` にリダイレクトされる | UC-003 AC3 |
| TC-E2E-062 | コンボ一覧のパンくずリストでキャラクター一覧に戻れる | SCR-004 | 1. コンボ一覧の「キャラクター一覧」リンクをクリック | `/` に遷移する | UC-004 |
| TC-E2E-063 | コンボ登録画面のパンくずリストでコンボ一覧に戻れる | SCR-005 | 1. コンボ登録画面のパンくずリンクをクリック | `/characters/[characterId]/combos` に遷移する | UC-005 |
| TC-E2E-064 | コンボ詳細画面のパンくずリストでコンボ一覧に戻れる | SCR-006 | 1. コンボ詳細画面のパンくずリンクをクリック | `/characters/[characterId]/combos` に遷移する | UC-008 |
| TC-E2E-065 | ヘッダーロゴクリックでキャラクター一覧に遷移する | SCR-004 | 1. コンボ一覧画面でヘッダーのロゴをクリック | `/` に遷移する | UC-004 |
| TC-E2E-066 | コンボ登録のキャンセルでコンボ一覧に戻る | SCR-005 | 1. コンボ登録画面で「キャンセル」をクリック | コンボ一覧画面に遷移する | UC-005 |
| TC-E2E-067 | コンボ保存成功後にコンボ一覧に遷移する | SCR-005 | 1. コンボを入力して「このコンボを保存」をクリック | コンボ一覧画面に遷移する | UC-005 AC9 |
| TC-E2E-068 | 他ユーザーのコンボがコンボ一覧に表示されない | SCR-004 | 1. USER_A でコンボを登録 2. USER_B でログイン 3. 同じキャラクターのコンボ一覧にアクセス | USER_A のコンボが表示されない（空状態メッセージが表示される） | UC-007 AC1 |

### 9.7 E2E テスト実行コマンド

```bash
# Playwright と Chromium のインストール
npm i -D @playwright/test
npx playwright install --with-deps chromium

# 全 E2E テスト実行（headless）
npx playwright test

# 特定テストファイルのみ実行
npx playwright test tests/e2e/auth.spec.ts

# デバッグモード（headed / ステップ実行）
npx playwright test --headed --debug

# UI モード（インタラクティブ）
npx playwright test --ui

# トレース付き実行（失敗時の調査用）
npx playwright test --trace on

# テストレポート表示
npx playwright show-report
```

### 9.8 Playwright 設定ファイルの方針 (`playwright.config.ts`)

```
設定項目:
- testDir: "tests/e2e"
- baseURL: "http://localhost:3000"
- globalSetup: "tests/e2e/global-setup.ts"
- globalTeardown: "tests/e2e/global-teardown.ts"
- projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
- webServer:
    command: "npm run dev"
    url: "http://localhost:3000"
    reuseExistingServer: !process.env.CI
    env: { DATABASE_URL: "file:./data/test-e2e.db" }
- use:
    viewport: { width: 1280, height: 720 }
    screenshot: "only-on-failure"
    trace: "retain-on-failure"
    actionTimeout: 10000
- timeout: 30000
- retries: process.env.CI ? 1 : 0
```

### 9.9 E2E UC-テストケース トレーサビリティマトリクス

| UC番号 | 受け入れ条件 | E2E テストケース | 対象画面 |
|--------|------------|---------------|---------|
| UC-001 (ユーザー登録) | AC1: 有効なメール/パスワードで登録可能 | TC-E2E-001 | SCR-002 |
| UC-001 | AC3: 重複メール拒否 | TC-E2E-005 | SCR-002 |
| UC-001 | AC4: 登録後自動ログイン→キャラ一覧遷移 | TC-E2E-001 | SCR-002, SCR-003 |
| UC-001 | E2: パスワード8文字未満 | TC-E2E-003 | SCR-002 |
| UC-001 | E3: パスワード不一致 | TC-E2E-002 | SCR-002 |
| UC-002 (ログイン) | AC1: 正しい認証情報でログイン | TC-E2E-006 | SCR-001 |
| UC-002 | AC2: セッション維持 | TC-E2E-009 | SCR-001, SCR-003 |
| UC-002 | AC3: 不正認証で拒否 | TC-E2E-007, TC-E2E-008 | SCR-001 |
| UC-002 | AC4: ログイン/登録画面の相互リンク | TC-E2E-012, TC-E2E-013 | SCR-001, SCR-002 |
| UC-003 (ログアウト) | AC1: セッション無効化 | TC-E2E-010 | SCR-003 |
| UC-003 | AC2: ログイン画面へ遷移 | TC-E2E-010 | SCR-003, SCR-001 |
| UC-003 | AC3: 戻るボタンでアクセス不可 | TC-E2E-011 | - |
| UC-004 (キャラ一覧) | AC1: 全30キャラ表示 | TC-E2E-017 | SCR-003 |
| UC-004 | AC2: コンボ数表示 | TC-E2E-018 | SCR-003 |
| UC-004 | AC3: コンボ一覧へ遷移 | TC-E2E-019 | SCR-003, SCR-004 |
| UC-004 | AC4: upcoming 非表示 | TC-E2E-020 | SCR-003 |
| UC-005 (ビジュアル入力) | AC1: 9方向選択 | TC-E2E-039, TC-E2E-048 | SCR-005 |
| UC-005 | AC2: 全ボタン選択 | TC-E2E-040, TC-E2E-041, TC-E2E-042, TC-E2E-043 | SCR-005 |
| UC-005 | AC3: コネクター選択 | TC-E2E-044 | SCR-005 |
| UC-005 | AC4: OD トグル | TC-E2E-045 | SCR-005 |
| UC-005 | AC5: リアルタイムプレビュー | TC-E2E-025 | SCR-005 |
| UC-005 | AC6: テンキー表記生成 | TC-E2E-025 | SCR-005 |
| UC-005 | AC7: 元に戻す | TC-E2E-037 | SCR-005 |
| UC-005 | AC8: リセット | TC-E2E-038 | SCR-005 |
| UC-005 | AC9: 保存後コンボ一覧遷移 | TC-E2E-023, TC-E2E-067 | SCR-005, SCR-004 |
| UC-005 | E1: 空シーケンスで保存不可 | TC-E2E-036 | SCR-005 |
| UC-006 (テキスト入力) | AC1: テキストフィールド | TC-E2E-024, TC-E2E-026 | SCR-005 |
| UC-006 | AC2: リアルタイムプレビュー変換 | TC-E2E-026 | SCR-005 |
| UC-006 | AC3: パースエラー警告 | TC-E2E-047 | SCR-005 |
| UC-006 | AC4: モード切替 | TC-E2E-046 | SCR-005 |
| UC-006 | AC5: 相互変換 | TC-E2E-046 | SCR-005 |
| UC-007 (コンボ一覧) | AC1: 自分のコンボのみ表示 | TC-E2E-068 | SCR-004 |
| UC-007 | AC2: ビジュアル表記 | TC-E2E-027 | SCR-004 |
| UC-007 | AC3: テンキー表記 | TC-E2E-027 | SCR-004 |
| UC-007 | AC4: ダメージ値 | TC-E2E-027 | SCR-004 |
| UC-007 | AC5: タグバッジ | TC-E2E-058 | SCR-004 |
| UC-007 | AC6: 新規登録への導線 | TC-E2E-022 | SCR-004 |
| UC-007 | E1: 空状態メッセージ | TC-E2E-022 | SCR-004 |
| UC-008 (コンボ詳細) | AC1: 全属性表示 | TC-E2E-029 | SCR-006 |
| UC-008 | AC2: 大サイズビジュアル | TC-E2E-029 | SCR-006 |
| UC-008 | AC3: 編集への導線 | TC-E2E-030 | SCR-006 |
| UC-008 | AC4: 削除操作 | TC-E2E-033 | SCR-006 |
| UC-009 (コンボ編集) | AC1: 既存データプリセット | TC-E2E-032 | SCR-007 |
| UC-009 | AC2: 全フィールド編集可 | TC-E2E-031 | SCR-007 |
| UC-010 (コンボ削除) | AC1: 確認ダイアログ | TC-E2E-033 | SCR-006 |
| UC-010 | AC2: 物理削除 | TC-E2E-034 | SCR-006 |
| UC-010 | AC3: 削除後コンボ一覧遷移 | TC-E2E-034 | SCR-006, SCR-004 |
| UC-010 | E2: キャンセル | TC-E2E-035 | SCR-006 |
| UC-011 (タグフィルタ) | AC1: プリセットタグ12種表示 | TC-E2E-051 | SCR-004 |
| UC-011 | AC2: ユーザー定義タグ表示 | TC-E2E-059 | SCR-004 |
| UC-011 | AC3: OR 条件フィルタ | TC-E2E-052, TC-E2E-053 | SCR-004 |
| UC-011 | AC4: フィルタ解除 | TC-E2E-054 | SCR-004 |
| UC-011 | AC5: 即時反映 | TC-E2E-052 | SCR-004 |
| UC-011 | E1: フィルタ0件 | TC-E2E-055 | SCR-004 |
| UC-012 (ユーザータグ作成) | AC1: 任意テキストでタグ作成 | TC-E2E-057 | SCR-005 |
| UC-012 | AC2: タグ名1〜30文字 | TC-E2E-057 | SCR-005 |

### 9.10 E2E 画面カバレッジサマリー

| 画面ID | 画面名 | E2E テストケース数 | 対応テストケース |
|--------|--------|-------------------|----------------|
| SCR-001 | ログイン画面 | 10件 | TC-E2E-006〜009, 012〜016 |
| SCR-002 | ユーザー登録画面 | 6件 | TC-E2E-001〜005, 013 |
| SCR-003 | キャラクター一覧画面 | 6件 | TC-E2E-010, 017〜021 |
| SCR-004 | コンボ一覧画面 | 12件 | TC-E2E-022, 027, 028, 034, 051〜055, 058, 059, 068 |
| SCR-005 | コンボ登録画面 | 18件 | TC-E2E-023〜026, 036〜050, 056, 057, 066, 067 |
| SCR-006 | コンボ詳細画面 | 5件 | TC-E2E-028〜030, 033〜035 |
| SCR-007 | コンボ編集画面 | 2件 | TC-E2E-031, 032 |
| **合計** | | **68件** | |

> 全 7 画面を網羅。SCR-005（コンボ登録画面）はインタラクションの複雑性が高いため、最もテストケースが多い。

### 9.11 E2E テスト実行順序の依存関係

E2E テストは原則として独立して実行可能だが、以下の依存関係を考慮した実行順序を推奨する:

1. **`auth.spec.ts`** -- 最初に実行。テストユーザーの登録とログインが他のテストの前提
2. **`character-list.spec.ts`** -- 認証済み状態のテスト。データ依存なし
3. **`combo-crud.spec.ts`** -- コンボの CRUD 操作。API で事前データ投入
4. **`combo-input.spec.ts`** -- コンボ入力 UI の詳細テスト
5. **`tag-filter.spec.ts`** -- タグ関連。事前にコンボとタグのデータが必要
6. **`navigation.spec.ts`** -- ナビゲーションと認証ガード。最後に実行

各テストファイルは `test.beforeAll` / `test.beforeEach` で必要なデータを API 呼び出しで準備する設計のため、単体でも実行可能。ただし CI では上記の順序で実行することで、認証フローの失敗を早期に検知できる。
