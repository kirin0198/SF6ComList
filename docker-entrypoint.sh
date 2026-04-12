#!/bin/sh
# docker-entrypoint.sh — DB初期化 + アプリ起動
#
# Cloud Run での SQLite 永続化戦略:
#   - 環境変数 GCS_BUCKET_NAME が設定されている場合、GCS から DB ファイルを取得する
#   - SIGTERM シグナル受信時（Cloud Run シャットダウン）に GCS へ DB をアップロードする
#   - ローカル開発時（GCS_BUCKET_NAME 未設定）は従来通りボリュームマウントを使用する
#
# DB 初期化戦略:
#   - 初期 DB はビルド時に Prisma CLI で作成済み（/app/data/sf6combo.db.init）
#   - ランタイムでの Prisma CLI 実行は不要（依存関係を最小化）

set -e

DB_PATH="/app/data/sf6combo.db"
DB_INIT_PATH="/app/data/sf6combo.db.init"
GCS_DB_PATH="gs://${GCS_BUCKET_NAME}/sf6combo.db"

# ─────────────────────────────────────
# GCS から DB ファイルを取得（Cloud Run 環境のみ）
# ─────────────────────────────────────
if [ -n "${GCS_BUCKET_NAME}" ]; then
  echo "GCS バケット: ${GCS_BUCKET_NAME} から DB を取得します..."
  if gsutil -q stat "${GCS_DB_PATH}" 2>/dev/null; then
    echo "既存の DB ファイルを GCS からダウンロードしています..."
    gsutil cp "${GCS_DB_PATH}" "${DB_PATH}"
    echo "DB ダウンロード完了"
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
    # リトライ付きアップロード（Cloud Run の猶予時間内に完了を試みる）
    RETRY=0
    while [ $RETRY -lt 3 ]; do
      if gsutil cp "${DB_PATH}" "${GCS_DB_PATH}"; then
        echo "DB アップロード完了: ${GCS_DB_PATH}"
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
  # Node.js サーバープロセスに SIGTERM を転送
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
    gsutil cp "${DB_PATH}" "${GCS_DB_PATH}" && \
      echo "初期 DB アップロード完了" || \
      echo "警告: 初期 DB アップロードに失敗しました"
  fi
else
  echo "既存データベースを使用します"
fi

# ─────────────────────────────────────
# Next.js サーバーを起動（バックグラウンド）
# シグナルハンドラーが動作するよう exec ではなくバックグラウンドで起動
# ─────────────────────────────────────
node server.js &
SERVER_PID=$!

echo "Next.js サーバーを起動しました (PID: ${SERVER_PID})"

# サーバーの終了を待機
wait "$SERVER_PID"
