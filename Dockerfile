# Dockerfile — SF6 コンボ帳
# Node.js 20 LTS マルチステージビルド

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
RUN npm run build

# ============================================================
# Stage 3: runner — 実行
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# セキュリティ: 非 root ユーザーで実行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

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
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder /app/package.json ./package.json

# エントリポイントスクリプトをコピー
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# SQLite データベースの格納ディレクトリ
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "docker-entrypoint.sh"]
