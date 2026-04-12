# 運用計画書: SF6 ComboList

> 参照元: Dockerfile, docker-compose.yml, .github/workflows/deploy.yml, .github/workflows/ci.yml, .env.example
> 作成日: 2026-04-12

---

## 1. 初回デプロイ手順

### 前提条件

- Google Cloud アカウントと課金設定が有効であること
- `gcloud` CLI がインストール・認証済みであること（`gcloud auth login`）
- GitHub リポジトリ `kirin0198/SF6ComList` への管理者権限があること
- Node.js 20 LTS がローカルにインストールされていること

### Step 1: GCP プロジェクトの作成と初期設定

```bash
# プロジェクト作成（既存プロジェクトを使う場合はスキップ）
gcloud projects create YOUR_PROJECT_ID --name="SF6 ComboList"

# プロジェクトをデフォルトに設定
gcloud config set project YOUR_PROJECT_ID

# 必要な API を有効化
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com

# リージョンのデフォルト設定
gcloud config set run/region asia-northeast1
```

> **ロールバックポイント 1:** ここまでの設定は GCP コンソールからプロジェクトを削除すれば完全にリセットできる。

### Step 2: Artifact Registry リポジトリの作成

```bash
gcloud artifacts repositories create sf6comlist \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="SF6 ComboList Docker images"
```

### Step 3: サービスアカウントの作成と権限付与

2 つのサービスアカウントを使い分ける（最小権限の原則）:

- **sf6comlist-deployer**: GitHub Actions からのデプロイ専用
- **sf6comlist-runner**: Cloud Run 実行時のランタイム専用

```bash
PROJECT_ID=$(gcloud config get-value project)

# --- デプロイ用サービスアカウント ---
gcloud iam service-accounts create sf6comlist-deployer \
  --display-name="SF6ComList Deployer"

DEPLOYER_SA="sf6comlist-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Artifact Registry への push 権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/artifactregistry.writer"

# Cloud Run へのデプロイ権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/run.developer"

# --- Cloud Run ランタイム用サービスアカウント ---
gcloud iam service-accounts create sf6comlist-runner \
  --display-name="SF6ComList Cloud Run Runtime"

RUNNER_SA="sf6comlist-runner@${PROJECT_ID}.iam.gserviceaccount.com"

# Secret Manager へのアクセス権限（AUTH_SECRET の読み取り）
gcloud secrets add-iam-policy-binding AUTH_SECRET \
  --member="serviceAccount:${RUNNER_SA}" \
  --role="roles/secretmanager.secretAccessor"

# GCS へのアクセス権限は Step 5 でバケット作成後にバケットレベルで付与する
# （プロジェクトレベルでの storage.objectAdmin 付与は過剰権限のため非推奨）

# deployer が runner SA として Cloud Run をデプロイできるようにする
gcloud iam service-accounts add-iam-policy-binding ${RUNNER_SA} \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/iam.serviceAccountUser"
```

> **注意:** デフォルトの Compute Engine SA (`PROJECT_NUMBER-compute@developer.gserviceaccount.com`) は使用しない。Editor ロールを持つため過剰権限となる。

### Step 4: Workload Identity Federation の設定

```bash
# Workload Identity Pool 作成
gcloud iam workload-identity-pools create github-pool \
  --location=global \
  --display-name="GitHub Actions Pool"

# OIDC Provider 作成
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository == 'kirin0198/SF6ComList'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Pool ID を取得
POOL_ID=$(gcloud iam workload-identity-pools describe github-pool \
  --location=global --format="value(name)")

# サービスアカウントに Workload Identity User ロールを付与
gcloud iam service-accounts add-iam-policy-binding ${SA_EMAIL} \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/kirin0198/SF6ComList"

# Provider のリソース名を取得（GitHub Secrets に設定する値）
gcloud iam workload-identity-pools providers describe github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --format="value(name)"
```

> **ロールバックポイント 2:** IAM 設定を誤った場合は、サービスアカウントを削除して Step 3 からやり直す。

### Step 5: GCS バケットの作成（SQLite 永続化用）

```bash
# バケット名はグローバルに一意にする必要があるため、適宜サフィックスを変更する
BUCKET_NAME="sf6comlist-db-$(openssl rand -hex 4)"

gsutil mb -l asia-northeast1 "gs://${BUCKET_NAME}"

# バケットのバージョニングを有効化（誤上書き防止）
gsutil versioning set on "gs://${BUCKET_NAME}"

# ランタイム用サービスアカウントにバケットレベルで権限を付与（最小権限の原則）
RUNNER_SA="sf6comlist-runner@$(gcloud config get-value project).iam.gserviceaccount.com"
gsutil iam ch "serviceAccount:${RUNNER_SA}:roles/storage.objectUser" "gs://${BUCKET_NAME}"

echo "バケット名: ${BUCKET_NAME}"
echo "この値を GitHub Secrets の GCS_BUCKET_NAME に設定すること"
```

### Step 6: Secret Manager に AUTH_SECRET を登録

```bash
# ランダムなシークレットを生成して登録
openssl rand -base64 32 | \
  gcloud secrets create AUTH_SECRET --data-file=- --replication-policy=automatic

# サービスアカウントにアクセス権限を付与（Step 3 で一括付与済みの場合はスキップ）
gcloud secrets add-iam-policy-binding AUTH_SECRET \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 7: GitHub Secrets の設定

GitHub リポジトリの Settings > Secrets and variables > Actions で以下を設定する。

| Secret 名                        | 値                    | 取得方法                                                 |
| -------------------------------- | --------------------- | -------------------------------------------------------- |
| `GCP_PROJECT_ID`                 | GCP プロジェクト ID   | `gcloud config get-value project`                        |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Provider リソース名   | Step 4 の最終コマンド出力                                |
| `GCP_SERVICE_ACCOUNT`            | デプロイ用 SA Email   | `sf6comlist-deployer@PROJECT_ID.iam.gserviceaccount.com` |
| `GCP_CLOUD_RUN_SA`               | ランタイム用 SA Email | `sf6comlist-runner@PROJECT_ID.iam.gserviceaccount.com`   |
| `GCS_BUCKET_NAME`                | GCS バケット名        | Step 5 で出力された値                                    |

> **ロールバックポイント 3:** GitHub Secrets の設定ミスはデプロイ失敗として検知される。値を修正して再度 push すれば良い。

### Step 8: 初回デプロイの実行

```bash
# main ブランチに push するとデプロイワークフローが自動実行される
git push origin main

# GitHub Actions の実行状況を確認
# https://github.com/kirin0198/SF6ComList/actions
```

または手動で Cloud Run にデプロイする場合:

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast1"

# Artifact Registry リポジトリを作成（初回のみ）
gcloud artifacts repositories create sf6comlist \
  --repository-format=docker \
  --location=${REGION} \
  --description="SF6 ComboList Docker images"

# Docker イメージをビルド
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist:latest .

# Artifact Registry にプッシュ
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist:latest

# Cloud Run にデプロイ
gcloud run deploy sf6comlist \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist:latest \
  --region=asia-northeast1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --concurrency=80 \
  --timeout=60s \
  --execution-environment=gen2 \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,DATABASE_URL=file:/app/data/sf6combo.db,GCS_BUCKET_NAME=${BUCKET_NAME}" \
  --set-secrets="AUTH_SECRET=AUTH_SECRET:latest"
```

> **重要:** `--max-instances=1` を推奨する。SQLite はファイルベース DB であり、複数インスタンスが同時に書き込むとデータ破損のリスクがある。deploy.yml のデフォルトは `max-instances=3` だが、個人利用であれば `1` に変更すること。

### Step 9: 初回デプロイの確認

```bash
# デプロイされたサービスの URL を取得
gcloud run services describe sf6comlist \
  --region=asia-northeast1 \
  --format="value(status.url)"

# ヘルスチェック（トップページへのアクセス）
curl -o /dev/null -s -w "%{http_code}" $(gcloud run services describe sf6comlist \
  --region=asia-northeast1 --format="value(status.url)")
# 期待値: 200

# GCS に初期 DB がアップロードされたか確認
gsutil ls gs://${BUCKET_NAME}/
# sf6combo.db が存在すること
```

### デプロイ確認チェックリスト

- [ ] GitHub Actions のワークフローが正常完了した
- [ ] Cloud Run サービスの URL にアクセスできる
- [ ] ログイン画面が表示される
- [ ] ユーザー登録とログインが動作する
- [ ] コンボの作成・表示が動作する
- [ ] Cloud Run のログにエラーが出ていない
- [ ] GCS バケットに sf6combo.db が保存されている

---

## 2. 通常デプロイフロー（2回目以降）

### 自動デプロイの流れ

```
1. feature ブランチで開発
   git checkout -b feature/xxx

2. PR を作成
   → CI ワークフロー (.github/workflows/ci.yml) が自動実行
     - ESLint
     - Prettier チェック
     - TypeScript 型チェック
     - Vitest ユニットテスト
     - Docker ビルド確認（push なし）

3. CI 通過 & レビュー後、main にマージ
   → デプロイワークフロー (.github/workflows/deploy.yml) が自動実行
     - Lint & Test（品質ゲート）
     - Docker ビルド → Artifact Registry にプッシュ
     - Cloud Run にデプロイ（コミット SHA タグ + latest タグ）

4. デプロイ完了
   → GitHub Actions の実行ログでデプロイ URL を確認
```

### 手動デプロイ（緊急時）

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast1"

# Artifact Registry リポジトリが未作成の場合は先に作成する
# gcloud artifacts repositories create sf6comlist \
#   --repository-format=docker \
#   --location=${REGION} \
#   --description="SF6 ComboList Docker images"

# 最新コードで Docker イメージをビルド & プッシュ
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist:hotfix .
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist:hotfix

# Cloud Run に即時デプロイ
gcloud run deploy sf6comlist \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist:hotfix \
  --region=asia-northeast1
```

---

## 3. ロールバック手順

### トリガー条件

以下のいずれかに該当する場合、ロールバックを実行する:

- デプロイ後にアプリケーションが起動しない（Cloud Run のログに起動エラー）
- トップページやログイン画面が表示されない（HTTP 5xx）
- コンボの CRUD 操作でエラーが発生する
- DB 接続エラーが継続して発生する

### ロールバック手順

#### 方法 A: Cloud Run のリビジョンを切り戻す（推奨）

```bash
# 現在のリビジョン一覧を確認
gcloud run revisions list \
  --service=sf6comlist \
  --region=asia-northeast1 \
  --format="table(metadata.name, status.conditions[0].status, metadata.creationTimestamp)"

# 前のリビジョンにトラフィックを 100% ルーティング
gcloud run services update-traffic sf6comlist \
  --region=asia-northeast1 \
  --to-revisions=PREVIOUS_REVISION_NAME=100
```

#### 方法 B: 特定のイメージタグで再デプロイ

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast1"

# Artifact Registry のイメージ一覧を確認（タグはコミット SHA）
gcloud artifacts docker images list \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist \
  --format="table(version, createTime)" \
  --sort-by="~createTime" \
  --limit=10

# 特定のコミット SHA のイメージで再デプロイ
gcloud run deploy sf6comlist \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist:COMMIT_SHA \
  --region=asia-northeast1
```

### DB のロールバック（必要な場合）

スキーマ変更を伴うデプロイで問題が発生した場合、GCS のオブジェクトバージョニングを利用して DB を復元する。

```bash
BUCKET_NAME="<your-bucket-name>"

# バージョン付きの DB ファイル一覧を取得
gsutil ls -la gs://${BUCKET_NAME}/sf6combo.db

# 特定バージョンの DB を復元
gsutil cp gs://${BUCKET_NAME}/sf6combo.db#GENERATION_NUMBER gs://${BUCKET_NAME}/sf6combo.db

# Cloud Run のインスタンスを再起動して復元した DB を読み込ませる
gcloud run services update sf6comlist \
  --region=asia-northeast1 \
  --update-env-vars="RESTART_TRIGGER=$(date +%s)"
```

### ロールバック確認

- [ ] 前バージョンのリビジョンが SERVING 状態になっている
- [ ] アプリケーションにアクセスできる
- [ ] ログイン・コンボ操作が正常に動作する
- [ ] Cloud Run のログにエラーが出ていない

---

## 4. DB バックアップ・リストア

### バックアップ戦略

| 種類             | タイミング                              | 方法                              | 保持期間                 |
| ---------------- | --------------------------------------- | --------------------------------- | ------------------------ |
| 自動バックアップ | Cloud Run インスタンス停止時（SIGTERM） | docker-entrypoint.sh の cleanup() | GCS バージョニングで保持 |
| 手動バックアップ | スキーマ変更前 / 重要データ変更前       | gsutil cp で手動取得              | 任意                     |

### 手動バックアップの実行

```bash
BUCKET_NAME="<your-bucket-name>"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# GCS 上の最新 DB をローカルにダウンロード
gsutil cp gs://${BUCKET_NAME}/sf6combo.db ./backup/sf6combo_${BACKUP_DATE}.db

# 任意: 名前付きバックアップを GCS に保存
gsutil cp gs://${BUCKET_NAME}/sf6combo.db gs://${BUCKET_NAME}/backups/sf6combo_${BACKUP_DATE}.db
```

### リストア手順

```bash
BUCKET_NAME="<your-bucket-name>"

# 1. 現在の DB をバックアップ（上書き防止）
gsutil cp gs://${BUCKET_NAME}/sf6combo.db gs://${BUCKET_NAME}/backups/sf6combo_before_restore.db

# 2. リストア対象のバックアップファイルを本番パスに上書き
gsutil cp gs://${BUCKET_NAME}/backups/sf6combo_YYYYMMDD_HHMMSS.db gs://${BUCKET_NAME}/sf6combo.db

# 3. Cloud Run インスタンスを再起動して復元した DB を読み込ませる
gcloud run services update sf6comlist \
  --region=asia-northeast1 \
  --update-env-vars="RESTART_TRIGGER=$(date +%s)"

# 4. 動作確認
curl -s $(gcloud run services describe sf6comlist \
  --region=asia-northeast1 --format="value(status.url)") | head -20
```

### GCS バージョニングによる復旧

```bash
BUCKET_NAME="<your-bucket-name>"

# 全バージョンの一覧を表示
gsutil ls -la gs://${BUCKET_NAME}/sf6combo.db

# 出力例:
#   123456  2026-04-10T10:00:00Z  gs://bucket/sf6combo.db#1712736000000000  ...
#   234567  2026-04-11T10:00:00Z  gs://bucket/sf6combo.db#1712822400000000  ...

# 特定バージョンを復元
gsutil cp "gs://${BUCKET_NAME}/sf6combo.db#GENERATION_NUMBER" gs://${BUCKET_NAME}/sf6combo.db
```

### SQLite DB の整合性チェック

```bash
# ローカルにダウンロードしてチェック
gsutil cp gs://${BUCKET_NAME}/sf6combo.db /tmp/sf6combo_check.db
sqlite3 /tmp/sf6combo_check.db "PRAGMA integrity_check;"
# 期待値: ok

# テーブル一覧の確認
sqlite3 /tmp/sf6combo_check.db ".tables"

# レコード数の確認
sqlite3 /tmp/sf6combo_check.db "SELECT 'users:', COUNT(*) FROM users UNION ALL SELECT 'combos:', COUNT(*) FROM combos UNION ALL SELECT 'tags:', COUNT(*) FROM tags;"
```

---

## 5. インシデント対応プレイブック

### 重篤度定義

| レベル | 定義                                 | 対応時間目標     | 備考                       |
| ------ | ------------------------------------ | ---------------- | -------------------------- |
| P1     | サービス全面停止                     | 1時間以内        | 個人プロジェクトのため目安 |
| P2     | 主要機能の障害（コンボ登録不可など） | 当日中           |                            |
| P3     | 一部機能の障害（表示崩れなど）       | 1週間以内        |                            |
| P4     | 軽微な問題                           | 次回リリースまで |                            |

### シナリオ 1: アプリケーションが起動しない

**症状:** Cloud Run のサービス URL にアクセスすると HTTP 5xx が返る

**初動手順:**

```bash
# 1. Cloud Run のログを確認
gcloud run services logs read sf6comlist \
  --region=asia-northeast1 \
  --limit=50

# 2. 最新リビジョンの状態を確認
gcloud run revisions list \
  --service=sf6comlist \
  --region=asia-northeast1

# 3. 直前のデプロイが原因であれば、前リビジョンにロールバック
gcloud run services update-traffic sf6comlist \
  --region=asia-northeast1 \
  --to-revisions=PREVIOUS_REVISION=100
```

**想定される原因と対処:**

| 原因                        | ログの特徴                      | 対処                                   |
| --------------------------- | ------------------------------- | -------------------------------------- |
| Node.js アプリのクラッシュ  | `Error: ...` + スタックトレース | コードの修正とホットフィックスデプロイ |
| 環境変数の設定ミス          | `AUTH_SECRET is not set` など   | Cloud Run の環境変数を修正             |
| Docker イメージのビルド不良 | コンテナ起動直後にクラッシュ    | Dockerfile を修正して再ビルド          |
| メモリ不足                  | `OOMKilled`                     | `--memory` を 1Gi に増量               |

### シナリオ 2: DB 接続障害 / データ破損

**症状:** アプリは起動するが、コンボ一覧が表示されない、操作時にエラーが発生する

**初動手順:**

```bash
# 1. GCS 上の DB ファイルの存在と更新日時を確認
gsutil ls -l gs://${BUCKET_NAME}/sf6combo.db

# 2. DB をローカルにダウンロードして整合性チェック
gsutil cp gs://${BUCKET_NAME}/sf6combo.db /tmp/sf6combo_check.db
sqlite3 /tmp/sf6combo_check.db "PRAGMA integrity_check;"

# 3. 破損している場合は GCS バージョニングから復元
gsutil ls -la gs://${BUCKET_NAME}/sf6combo.db
gsutil cp "gs://${BUCKET_NAME}/sf6combo.db#GENERATION_NUMBER" gs://${BUCKET_NAME}/sf6combo.db

# 4. Cloud Run を再起動
gcloud run services update sf6comlist \
  --region=asia-northeast1 \
  --update-env-vars="RESTART_TRIGGER=$(date +%s)"
```

**想定される原因と対処:**

| 原因                               | 対処                                         |
| ---------------------------------- | -------------------------------------------- |
| GCS からの DB ダウンロード失敗     | GCS バケットの権限とサービスアカウントを確認 |
| 複数インスタンスによる同時書き込み | `max-instances=1` に設定変更                 |
| SIGTERM 中の DB アップロード失敗   | GCS のバージョン一覧から最新の正常版を復元   |
| スキーマ変更のマイグレーション失敗 | 前バージョンの DB に戻してロールバック       |

### シナリオ 3: 認証障害

**症状:** ログインできない、セッションが突然切れる

**初動手順:**

```bash
# 1. Secret Manager の AUTH_SECRET が正しいか確認
gcloud secrets versions list AUTH_SECRET

# 2. Cloud Run の環境変数 AUTH_URL が正しいか確認
gcloud run services describe sf6comlist \
  --region=asia-northeast1 \
  --format="yaml(spec.template.spec.containers[0].env)"

# 3. AUTH_URL がサービスの実際の URL と一致しているか確認
gcloud run services describe sf6comlist \
  --region=asia-northeast1 \
  --format="value(status.url)"
```

**想定される原因と対処:**

| 原因                                 | 対処                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| AUTH_SECRET が変更された             | Secret Manager で新しいバージョンを作成し、Cloud Run を再デプロイ |
| AUTH_URL がサービス URL と不一致     | deploy.yml の AUTH_URL 環境変数を修正                             |
| Cookie の SameSite/Secure 設定の問題 | HTTPS が強制されているか確認（Cloud Run はデフォルトで HTTPS）    |

### シナリオ 4: デプロイパイプラインの障害

**症状:** GitHub Actions のワークフローが失敗する

**初動手順:**

```bash
# GitHub Actions のログを確認
# https://github.com/kirin0198/SF6ComList/actions

# Workload Identity Federation の設定を再確認
gcloud iam workload-identity-pools providers describe github-provider \
  --location=global \
  --workload-identity-pool=github-pool

# サービスアカウントの権限を確認
gcloud projects get-iam-policy $(gcloud config get-value project) \
  --flatten="bindings[].members" \
  --filter="bindings.members:sf6comlist-deployer" \
  --format="table(bindings.role)"
```

**想定される原因と対処:**

| 原因                                            | 対処                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| GitHub Secrets の設定ミス                       | リポジトリの Settings > Secrets を確認・修正                               |
| Workload Identity Federation のトークン取得失敗 | Pool/Provider の設定とリポジトリ名のマッピングを確認                       |
| Artifact Registry への push 失敗                | サービスアカウントの `artifactregistry.writer` 権限を確認                  |
| Cloud Run へのデプロイ失敗                      | サービスアカウントの `run.developer` + `iam.serviceAccountUser` 権限を確認 |

---

## 6. メンテナンスチェックリスト

### 日次（個人利用のため実質は使用時）

- [ ] アプリケーションにアクセスし、正常に動作することを確認
- [ ] コンボの登録・編集・削除が問題なく行えることを確認

### 週次

- [ ] Cloud Run のログに異常なエラーが出ていないか確認
  ```bash
  gcloud run services logs read sf6comlist \
    --region=asia-northeast1 --limit=100 \
    | grep -i "error\|warn\|fail"
  ```
- [ ] GCS バケットの DB ファイルが最新であるか確認
  ```bash
  gsutil ls -l gs://${BUCKET_NAME}/sf6combo.db
  ```
- [ ] Cloud Run のメトリクスを確認（GCP コンソール > Cloud Run > sf6comlist > メトリクス）
  - リクエスト数
  - レスポンス時間
  - エラー率

### 月次

- [ ] 依存パッケージの脆弱性チェック
  ```bash
  npm audit
  ```
- [ ] 依存パッケージのアップデート確認
  ```bash
  npm outdated
  ```
- [ ] GCS バケットの古いバージョンの整理（必要に応じて）
  ```bash
  # 古いバージョンの一覧確認
  gsutil ls -la gs://${BUCKET_NAME}/sf6combo.db | head -20
  ```
- [ ] Cloud Run のリビジョンの整理（古いリビジョンの削除）
  ```bash
  gcloud run revisions list \
    --service=sf6comlist \
    --region=asia-northeast1 \
    --format="table(metadata.name, status.conditions[0].status, metadata.creationTimestamp)"
  ```
- [ ] Artifact Registry の古いイメージの整理
  ```bash
  # 古いイメージの一覧
  gcloud artifacts docker images list \
    asia-northeast1-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist \
    --sort-by="~CREATE_TIME" --limit=20
  ```
- [ ] GCP の課金状況を確認（GCP コンソール > 課金 > レポート）

### 四半期

- [ ] Node.js ランタイムのバージョン確認（LTS サポート期限）
- [ ] Next.js のメジャーバージョンアップデートの検討
- [ ] Prisma のメジャーバージョンアップデートの検討
- [ ] Auth.js (NextAuth) の安定版リリース確認とアップデート検討

---

## 7. コスト概算

### Cloud Run 無料枠（月次）

| リソース   | 無料枠          | 超過時の料金        |
| ---------- | --------------- | ------------------- |
| CPU        | 180,000 vCPU 秒 | $0.00002400/vCPU 秒 |
| メモリ     | 360,000 GiB 秒  | $0.00000250/GiB 秒  |
| リクエスト | 200 万回        | $0.40/100 万回      |

### 個人利用での月額コスト見込み

前提: 1日あたり 10-50 リクエスト、月間 300-1,500 リクエスト程度

| 項目              | 見込み                | 月額コスト                       |
| ----------------- | --------------------- | -------------------------------- |
| Cloud Run         | 無料枠内              | $0                               |
| Artifact Registry | ストレージ 0.5GB 以下 | $0（0.5GB まで無料）             |
| Cloud Storage     | 数 MB（SQLite DB）    | $0（5GB まで無料）               |
| Secret Manager    | 1 シークレット        | $0（6 バージョンまで無料）       |
| ネットワーク      | 外向き 1GB 以下       | $0                               |
| **合計**          |                       | **$0（無料枠内で収まる見込み）** |

### コストが増加するケース

- `min-instances=1` に設定した場合: 常時起動のため約 $10-15/月
- `max-instances` を増やした場合: トラフィック次第だが個人利用では不要
- DB ファイルが大きくなった場合（数百 MB 以上）: GCS の無料枠を超える可能性

### コスト最適化のポイント

- `min-instances=0`（デフォルト）を維持する: アクセスがないときはインスタンスが 0 になりコストが発生しない
- `max-instances=1` を推奨: SQLite の制約上、複数インスタンスは不要
- コールドスタートは数秒の遅延があるが、個人利用であれば許容範囲

---

## 8. 環境変数一覧

| 変数名                    | 用途                     | 設定場所           | 値の例                           |
| ------------------------- | ------------------------ | ------------------ | -------------------------------- |
| `DATABASE_URL`            | Prisma の DB 接続先      | Cloud Run 環境変数 | `file:/app/data/sf6combo.db`     |
| `AUTH_SECRET`             | JWT 署名・暗号化キー     | Secret Manager     | (ランダム文字列)                 |
| `AUTH_URL`                | Auth.js のベース URL     | Cloud Run 環境変数 | `https://sf6comlist-xxx.run.app` |
| `GCS_BUCKET_NAME`         | SQLite 永続化用バケット  | Cloud Run 環境変数 | `sf6comlist-db-abc123`           |
| `NODE_ENV`                | 実行環境                 | Cloud Run 環境変数 | `production`                     |
| `NEXT_TELEMETRY_DISABLED` | Next.js テレメトリ無効化 | Cloud Run 環境変数 | `1`                              |

---

## 9. 連絡先・エスカレーション

| 役割           | 連絡先             | 備考                                   |
| -------------- | ------------------ | -------------------------------------- |
| 開発・運用     | kirin0198 (GitHub) | 個人プロジェクトのため単独管理         |
| GCP サポート   | GCP コンソール     | 無料枠の場合はコミュニティサポートのみ |
| GitHub Actions | GitHub Status Page | https://www.githubstatus.com/          |

---

## 付録: よく使うコマンド集

```bash
# --- Cloud Run 関連 ---

# サービスの URL を取得
gcloud run services describe sf6comlist --region=asia-northeast1 --format="value(status.url)"

# ログの閲覧
gcloud run services logs read sf6comlist --region=asia-northeast1 --limit=50

# リビジョン一覧
gcloud run revisions list --service=sf6comlist --region=asia-northeast1

# サービスの詳細確認
gcloud run services describe sf6comlist --region=asia-northeast1

# インスタンスの強制再起動（環境変数を更新してトリガー）
gcloud run services update sf6comlist --region=asia-northeast1 --update-env-vars="RESTART_TRIGGER=$(date +%s)"

# --- GCS 関連 ---

# DB ファイルの確認
gsutil ls -l gs://${BUCKET_NAME}/sf6combo.db

# DB のダウンロード
gsutil cp gs://${BUCKET_NAME}/sf6combo.db ./sf6combo_backup.db

# DB のアップロード（手動リストア）
gsutil cp ./sf6combo_restored.db gs://${BUCKET_NAME}/sf6combo.db

# --- Artifact Registry 関連 ---

# イメージ一覧
gcloud artifacts docker images list asia-northeast1-docker.pkg.dev/${PROJECT_ID}/sf6comlist/sf6comlist --sort-by="~CREATE_TIME" --limit=5

# --- Secret Manager 関連 ---

# シークレットのバージョン一覧
gcloud secrets versions list AUTH_SECRET

# シークレットの値を確認（本番環境では慎重に）
gcloud secrets versions access latest --secret=AUTH_SECRET
```
