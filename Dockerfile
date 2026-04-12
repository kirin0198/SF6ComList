# Dockerfile — SF6 コンボ帳
# Node.js 20 LTS マルチステージビルド
# Cloud Run (gen2) 対応: GCS を使った SQLite 永続化

# ============================================================
# Stage 1: builder — ビルド + 初期 DB 作成
# ============================================================
# runner と同じ debian-slim を使用（Prisma バイナリターゲットを一致させる）
FROM node:20-slim AS builder

WORKDIR /app

# Prisma に必要な OpenSSL をインストール
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# package.json と lock ファイルをコピー
COPY package.json package-lock.json ./

# 全依存関係をインストール（devDependencies を含む）
RUN npm ci

# ソースコードをコピー
COPY . .

# Prisma Client を生成
RUN npx prisma generate

# Next.js をビルド（standalone モード）
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build \
    && mkdir -p /app/public

# 初期 DB をビルド時に作成（ランタイムでの Prisma CLI 実行を不要にする）
ENV DATABASE_URL="file:/app/data/sf6combo.db"
RUN mkdir -p /app/data \
    && npx prisma db push --skip-generate \
    && npx prisma db seed || echo "シード実行をスキップしました"

# ============================================================
# Stage 2: runner — 実行
# Google Cloud SDK (gsutil) を含む Debian ベースイメージを使用
# ※ alpine では gcloud SDK のインストールが複雑なため debian-slim を使用
# ============================================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# gsutil のみインストール（GCS と SQLite を同期するため）
# google-cloud-sdk 全体（約 400MB）ではなく gsutil のみで軽量化
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ca-certificates \
    && pip3 install --no-cache-dir --break-system-packages gsutil \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# セキュリティ: 非 root ユーザーで実行
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# standalone ビルドの成果物をコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma Client をコピー（ランタイムの ORM クエリに必要）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# ビルド時に作成した初期 DB をフォールバック用にコピー
COPY --from=builder /app/data/sf6combo.db /app/data/sf6combo.db.init

# エントリポイントスクリプトをコピー
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# SQLite データベースの格納ディレクトリ
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ヘルスチェック（Cloud Run は独自のヘルスチェックを使用、ローカル確認用）
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["sh", "docker-entrypoint.sh"]
