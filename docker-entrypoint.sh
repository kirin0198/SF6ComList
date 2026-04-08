#!/bin/sh
# docker-entrypoint.sh — DB初期化 + アプリ起動

set -e

# SQLite DBファイルが存在しない場合、スキーマを作成してシードを実行
if [ ! -f /app/data/sf6combo.db ]; then
  echo "データベースを初期化しています..."
  npx prisma db push --skip-generate
  echo "シードデータを投入しています..."
  npx prisma db seed || echo "シード実行をスキップしました"
  echo "データベース初期化完了"
else
  echo "既存データベースを使用します"
  # マイグレーションがあれば適用
  npx prisma db push --skip-generate 2>/dev/null || true
fi

# Next.js サーバーを起動
exec node server.js
