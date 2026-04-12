# Operations Result: SF6 ComboList

> 作成日: 2026-04-12
> Operations プラン: Light

## 成果物一覧

| ファイル | 内容 | 状態 |
|---------|------|------|
| Dockerfile | マルチステージビルド (node:20-alpine/slim, GCS SDK 込み) | あり |
| docker-compose.yml | ローカル開発用コンテナ構成 | あり |
| docker-entrypoint.sh | GCS 連携 DB 初期化 + SIGTERM ハンドラー | あり |
| .github/workflows/ci.yml | PR 時: ESLint + Prettier + tsc + Vitest + Docker ビルド確認 | あり |
| .github/workflows/deploy.yml | main マージ時: Lint/Test → Artifact Registry → Cloud Run デプロイ | あり |
| .env.example | 環境変数テンプレート (DATABASE_URL, AUTH_SECRET, GCS_BUCKET_NAME 等) | あり |
| DB_OPS.md | DB 運用ガイド（独立ドキュメント） | なし (OPS_PLAN.md セクション4に統合) |
| OBSERVABILITY.md | 可観測性設計 | なし (個人利用のため Cloud Run 標準ログで十分) |
| OPS_PLAN.md | 運用計画書 (デプロイ手順/ロールバック/インシデント対応/メンテナンス/コスト) | あり |

## デプロイ準備状態

- [x] Dockerfile / docker-compose 作成済み
- [x] CI/CD パイプライン構築済み (ci.yml + deploy.yml)
- [x] 環境変数テンプレート作成済み (.env.example)
- [x] DB 運用ガイド作成済み (OPS_PLAN.md セクション4: DB バックアップ・リストア)
- [ ] 可観測性設計完了 (個人利用のため Cloud Run 標準ログで対応。専用設計はスキップ)
- [x] デプロイ手順書作成済み (OPS_PLAN.md セクション1-2)
- [x] ロールバック手順策定済み (OPS_PLAN.md セクション3)
- [x] インシデント対応プレイブック作成済み (OPS_PLAN.md セクション5)

## 未対応事項

- **max-instances の調整**: deploy.yml では `max-instances=3` に設定されているが、SQLite の同時書き込み制限を考慮すると `max-instances=1` への変更を推奨。初回デプロイ時に手動で調整するか、deploy.yml を修正すること
- **AUTH_URL の動的設定**: deploy.yml 内の AUTH_URL がサービス名ベースの推定値になっている。初回デプロイ後に実際の Cloud Run URL を確認し、必要に応じて修正すること
- **カスタムドメインの設定**: 必要に応じて Cloud Run にカスタムドメインをマッピングする。個人利用であればデフォルトの `.run.app` ドメインで十分
- **定期バックアップの自動化**: 現状は SIGTERM 時の自動バックアップのみ。Cloud Scheduler + Cloud Functions で定期バックアップを設定する選択肢もあるが、個人利用の規模では過剰
