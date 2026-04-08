# TASK.md

> 参照元: ARCHITECTURE.md (2026-04-08)

## フェーズ: Delivery — Implementation
最終更新: 2026-04-09
ステータス: 完了（Phase 4 developer 全タスク完了）

## Delivery トリアージ
プラン: Light（個人サイドPJ + UI あり）
エージェント順: spec-designer → ux-designer → architect → developer → test-designer → tester → security-auditor → reviewer

## 完了済み Delivery フェーズ
- [x] Phase 1: spec-designer → SPEC.md
- [x] Phase 2: ux-designer → UI_SPEC.md
- [x] Phase 3: architect → ARCHITECTURE.md
- [ ] Phase 4: developer（未着手 — ここから再開）
- [ ] Phase 5: test-designer
- [ ] Phase 6: tester
- [ ] Phase 7: security-auditor
- [ ] Phase 8: reviewer

## タスク一覧

### Phase 1: 基盤セットアップ
- [x] TASK-001: プロジェクト初期化 | 対象: package.json, tsconfig.json 等
- [x] TASK-002: Prisma スキーマ定義 + マイグレーション + シードデータ | 対象: prisma/schema.prisma, prisma/seed.ts
- [x] TASK-003: Auth.js 設定 + 認証 API | 対象: src/lib/auth.ts, src/app/api/auth/
- [x] TASK-004: 認証ミドルウェア + セッション管理 | 対象: src/middleware.ts, src/types/next-auth.d.ts
- [x] TASK-005: docker-compose + Dockerfile | 対象: docker-compose.yml, Dockerfile

### Phase 2: 共通UIコンポーネント + 静的データ
- [x] TASK-006: 共通レイアウト | 対象: src/app/layout.tsx, src/app/(authenticated)/layout.tsx, src/components/layout/
- [x] TASK-007: 共通UIコンポーネント | 対象: src/components/ui/
- [x] TASK-008: キャラクターマスタデータ + プリセットタグ | 対象: src/data/characters.json, src/data/preset-tags.ts
- [x] TASK-009: アイコンコンポーネント | 対象: src/components/icons/

### Phase 3: 認証画面
- [x] TASK-010: ログイン画面 (SCR-001) | 対象: src/app/login/page.tsx
- [x] TASK-011: ユーザー登録画面 (SCR-002) | 対象: src/app/register/page.tsx

### Phase 4: コアデータモデル + API
- [x] TASK-012: コンボ型定義の移植 | 対象: src/lib/combo/types.ts
- [x] TASK-013: テンキー表記変換ロジックの移植 + テスト | 対象: src/lib/combo/notation-converter.ts
- [x] TASK-014: バリデーションスキーマ定義 | 対象: src/lib/combo/validation.ts, src/lib/validators/
- [x] TASK-015: コンボ CRUD API | 対象: src/app/api/characters/[characterId]/combos/, src/app/api/combos/[comboId]/
- [x] TASK-016: タグ API | 対象: src/app/api/tags/route.ts
- [x] TASK-017: キャラクター API | 対象: src/app/api/characters/route.ts

### Phase 5: 画面実装（一覧系）
- [x] TASK-018: キャラクター一覧画面 (SCR-003) | 対象: src/app/(authenticated)/page.tsx
- [x] TASK-019: コンボ一覧画面 (SCR-004) + タグフィルタ | 対象: src/app/(authenticated)/characters/[characterId]/combos/page.tsx

### Phase 6: コンボ入力UIコンポーネント
- [x] TASK-020: DirectionPad コンポーネント | 対象: src/components/input/DirectionPad.tsx
- [x] TASK-021: ButtonPalette コンポーネント | 対象: src/components/input/ButtonPalette.tsx
- [x] TASK-022: ConnectorSelector コンポーネント | 対象: src/components/input/ConnectorSelector.tsx
- [x] TASK-023: ComboSequencePreview コンポーネント | 対象: src/components/combo/ComboSequencePreview.tsx
- [x] TASK-024: ComboInputUI 統合コンポーネント | 対象: src/components/combo/ComboInputUI.tsx
- [x] TASK-025: ComboTextInput コンポーネント | 対象: src/components/combo/ComboTextInput.tsx
- [x] TASK-026: TagSelector コンポーネント | 対象: src/components/tag/TagSelector.tsx

### Phase 7: 画面実装（登録・編集・詳細）
- [x] TASK-027: ComboForm 統合コンポーネント | 対象: src/components/combo/ComboForm.tsx
- [x] TASK-028: コンボ登録画面 (SCR-005) | 対象: src/app/(authenticated)/characters/[characterId]/combos/new/page.tsx
- [x] TASK-029: コンボ詳細画面 (SCR-006) | 対象: src/app/(authenticated)/characters/[characterId]/combos/[comboId]/page.tsx
- [x] TASK-030: コンボ編集画面 (SCR-007) | 対象: src/app/(authenticated)/characters/[characterId]/combos/[comboId]/edit/page.tsx

### Phase 8: テスト + 仕上げ
- [x] TASK-031: ユニットテスト | 対象: src/lib/combo/__tests__/, src/lib/validators/__tests__/
- [x] TASK-032: API 統合テスト | 対象: src/app/api/__tests__/, src/data/__tests__/
- [x] TASK-033: コンポーネントテスト | 対象: src/components/icons/__tests__/
- [x] TASK-034: Tailwind カスタムアニメーション + トースト統合
- [x] TASK-035: アクセシビリティ対応

## 直近のコミット
- bac3e94 feat: Tailwind カスタムアニメーション + トーストスライドイン実装 (TASK-034)
- e2b556b test: Vitest セットアップ + ユニット/統合/コンポーネントテスト実装 (TASK-031〜033)
- 17ac27d feat: コンボ登録・詳細・編集画面を実装 (TASK-028〜030)

## 中断時のメモ
- 2026-04-09: TASK-006〜011 完了（Phase 2: 共通UI + Phase 3: 認証画面）
- 次は TASK-012: コンボ型定義の移植（src/lib/combo/types.ts）から再開
- 全設計ドキュメント（SPEC.md, UI_SPEC.md, ARCHITECTURE.md）は完成済み
