#!/bin/sh
# docker-entrypoint.sh — DB初期化 + アプリ起動
#
# Cloud Run での SQLite 永続化戦略:
#   - 環境変数 GCS_BUCKET_NAME が設定されている場合、GCS から DB ファイルを取得する
#   - SIGTERM シグナル受信時（Cloud Run シャットダウン）に GCS へ DB をアップロードする
#   - ローカル開発時（GCS_BUCKET_NAME 未設定）は従来通りボリュームマウントを使用する
#
# GCS アクセス方法:
#   - Cloud Run のメタデータサーバーからアクセストークンを取得
#   - curl で GCS JSON API を直接呼び出す（gsutil / gcloud SDK 不要）

set -e

DB_PATH="/app/data/sf6combo.db"
DB_INIT_PATH="/app/data/sf6combo.db.init"
GCS_OBJECT="sf6combo.db"
METADATA_URL="http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"

# ─────────────────────────────────────
# GCS ヘルパー関数
# ─────────────────────────────────────

# メタデータサーバーからアクセストークンを取得
get_token() {
  curl -sf -H "Metadata-Flavor: Google" "${METADATA_URL}" | \
    node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).access_token))"
}

# GCS からファイルをダウンロード
gcs_download() {
  local token
  token=$(get_token) || return 1
  curl -sf \
    -H "Authorization: Bearer ${token}" \
    -o "${DB_PATH}" \
    "https://storage.googleapis.com/storage/v1/b/${GCS_BUCKET_NAME}/o/${GCS_OBJECT}?alt=media"
}

# GCS にファイルをアップロード
gcs_upload() {
  local token
  token=$(get_token) || return 1
  local response
  response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/octet-stream" \
    -X POST \
    --data-binary "@${DB_PATH}" \
    "https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET_NAME}/o?uploadType=media&name=${GCS_OBJECT}")
  local http_code
  http_code=$(echo "${response}" | tail -1)
  if [ "${http_code}" -ge 200 ] && [ "${http_code}" -lt 300 ]; then
    return 0
  else
    echo "GCS upload error (HTTP ${http_code}): $(echo "${response}" | head -1)" >&2
    return 1
  fi
}

# GCS 上のオブジェクト存在確認
gcs_exists() {
  local token
  token=$(get_token) || return 1
  curl -sf \
    -H "Authorization: Bearer ${token}" \
    "https://storage.googleapis.com/storage/v1/b/${GCS_BUCKET_NAME}/o/${GCS_OBJECT}" \
    > /dev/null 2>&1
}

# ─────────────────────────────────────
# GCS から DB ファイルを取得（Cloud Run 環境のみ）
# ─────────────────────────────────────
if [ -n "${GCS_BUCKET_NAME}" ]; then
  echo "GCS バケット: ${GCS_BUCKET_NAME} から DB を取得します..."
  if gcs_exists; then
    echo "既存の DB ファイルを GCS からダウンロードしています..."
    if gcs_download; then
      echo "DB ダウンロード完了"
    else
      echo "警告: DB ダウンロードに失敗しました。初期 DB を使用します"
    fi
  else
    echo "GCS に DB ファイルが見つかりません。新規初期化します"
  fi
else
  echo "GCS_BUCKET_NAME が未設定のため、ローカルモードで起動します"
fi

# ─────────────────────────────────────
# SIGTERM ハンドラー: Cloud Run シャットダウン時に GCS へ DB をバックアップ
# ─────────────────────────────────────
cleanup() {
  echo "シャットダウンシグナルを受信しました"
  if [ -n "${GCS_BUCKET_NAME}" ] && [ -f "${DB_PATH}" ]; then
    echo "DB ファイルを GCS にアップロードしています..."
    RETRY=0
    while [ $RETRY -lt 3 ]; do
      if gcs_upload > /dev/null; then
        echo "DB アップロード完了"
        break
      fi
      RETRY=$((RETRY + 1))
      echo "警告: DB アップロード失敗 (試行 ${RETRY}/3)。リトライ..."
      sleep 1
    done
    if [ $RETRY -eq 3 ]; then
      echo "エラー: DB アップロードに 3 回失敗しました。データロストの可能性があります"
    fi
  fi
  if [ -n "$SERVER_PID" ]; then
    kill -TERM "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  exit 0
}

trap cleanup TERM INT

# ─────────────────────────────────────
# DB 初期化（ビルド時に作成した初期 DB をコピー）
# ─────────────────────────────────────
if [ ! -f "${DB_PATH}" ]; then
  if [ -f "${DB_INIT_PATH}" ]; then
    echo "ビルド時に作成した初期 DB をコピーしています..."
    cp "${DB_INIT_PATH}" "${DB_PATH}"
    echo "データベース初期化完了"
  else
    echo "エラー: 初期 DB ファイルが見つかりません"
    exit 1
  fi

  # 初回作成した DB を GCS に即時バックアップ
  if [ -n "${GCS_BUCKET_NAME}" ]; then
    echo "初期 DB を GCS にアップロードしています..."
    if gcs_upload > /dev/null; then
      echo "初期 DB アップロード完了"
    else
      echo "警告: 初期 DB アップロードに失敗しました"
    fi
  fi
else
  echo "既存データベースを使用します"
fi

# ─────────────────────────────────────
# Next.js サーバーを起動（バックグラウンド）
# ─────────────────────────────────────
node server.js &
SERVER_PID=$!

echo "Next.js サーバーを起動しました (PID: ${SERVER_PID})"

wait "$SERVER_PID"
