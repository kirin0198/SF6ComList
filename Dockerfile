# Dockerfile — SF6 コンボ帳
# Node.js 20 LTS マルチステージビルド
# Cloud Run (gen2) 対応: GCS を使った SQLite 永続化

# ============================================================
# Stage 1: deps — 依存関係インストール
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

# package.json と lock ファイルをコピー
COPY package.json package-lock.json ./

# 依存関係をインストール（本番依存のみ）
RUN npm ci --omit=dev

# ============================================================
# Stage 2: builder — ビルド
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

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

# ============================================================
# Stage 3: runner — 実行
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

# Prisma 関連ファイルをコピー（CLI + Client + スキーマ + シード）
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# シード実行に必要な依存をコピー
COPY --from=builder /app/node_modules/ts-node ./node_modules/ts-node
COPY --from=builder /app/node_modules/typescript ./node_modules/typescript
COPY --from=builder /app/package.json ./package.json

# エントリポイントスクリプトをコピー
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# SQLite データベースの格納ディレクトリ
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ヘルスチェック（Cloud Run は /health エンドポイント不要だが、ローカル確認用）
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["sh", "docker-entrypoint.sh"]
