# テスト計画書: SF6 コンボ帳

> 参照元: SPEC.md (2026-04-08)
> 参照元: ARCHITECTURE.md (2026-04-08)
> 作成日: 2026-04-08

---

## 1. テスト方針

### テスト戦略

- テストフレームワーク: Vitest 4.x + @testing-library/react 16.x + @testing-library/user-event 14.x
- カバレッジ目標: ビジネスロジック（notation-converter, validation）90%以上 / 全体は目安として主要パスのカバーを優先
- テスト環境: jsdom（Vitest 設定済み）、API テストは Prisma モック / 認証モック
- E2E テスト: MVP 対象外（将来検討）
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
