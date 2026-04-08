# セキュリティ監査レポート: SF6 コンボ帳

> 参照元: SPEC.md, ARCHITECTURE.md
> 監査日: 2026-04-08
> 監査範囲: 59 ファイル (src/**/*.ts, src/**/*.tsx)

## 総合評価
**CRITICAL 2件 / WARNING 4件 / INFO 3件**

---

## CRITICAL（即時修正必須）

### [SEC-001] .gitignore が不十分 -- 機密ファイル・不要ディレクトリがコミット対象
- **カテゴリ:** OWASP A05 (Security Misconfiguration) / CWE-798
- **ファイル:** `.gitignore:1`
- **問題:** `.gitignore` の内容が `.claude` の1行のみであり、`.env.local`、`node_modules/`、`data/`（SQLiteデータベース）、`.next/`、`*.db` などの標準的な除外対象が記載されていない。git status の出力でも `.env.local` と `node_modules/` がuntracked fileとして表示されており、コミット可能な状態にある。
- **攻撃シナリオ:** `.env.local` には `AUTH_SECRET="dev-secret-key-change-in-production"` が含まれている。`git add -A` や `git add .` で誤ってコミットされた場合、認証シークレットが Git 履歴に永続的に記録される。リポジトリが公開された場合、攻撃者は AUTH_SECRET を使って任意ユーザーの JWT を偽造し、全ユーザーのデータにアクセスできる。また `node_modules/` のコミットはリポジトリサイズの肥大化と依存パッケージ経由の情報漏洩リスクを伴う。
- **修正方針:** `.gitignore` に以下を追加する:
  ```
  node_modules/
  .next/
  .env
  .env.local
  .env.production
  data/
  *.db
  ```
- **参考:** https://owasp.org/Top10/A05_2021-Security_Misconfiguration/

### [SEC-002] ユーザー登録 API にレート制限がない
- **カテゴリ:** OWASP A07 (Identification and Authentication Failures) / CWE-307
- **ファイル:** `src/app/api/auth/register/route.ts`
- **問題:** `POST /api/auth/register` エンドポイントにレート制限が実装されていない。同様に `POST /api/auth/callback/credentials`（ログインエンドポイント、Auth.js 管理）にもレート制限がない。SPEC.md のセキュリティ要件にはレート制限の記載がないが、認証エンドポイントには必須のセキュリティ対策である。
- **攻撃シナリオ:** 攻撃者がブルートフォース攻撃でログインエンドポイントに大量のリクエストを送信し、パスワードを推測する。また、登録エンドポイントに大量のリクエストを送信し、大量のダミーアカウントを作成してデータベースを肥大化させる（DoS）。ローカル環境前提だが、ネットワーク経由でアクセス可能な場合にリスクがある。
- **修正方針:** ミドルウェアまたは API ルートレベルで IP ベースのレート制限を実装する。軽量な実装として `Map` ベースのインメモリレート制限を設けるか、`next-rate-limit` などのライブラリを導入する。認証エンドポイントは 1IP あたり 5回/分 程度が目安。
- **参考:** https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/

---

## WARNING（推奨修正）

### [SEC-003] docker-compose.yml に AUTH_SECRET のデフォルト値がハードコードされている
- **カテゴリ:** OWASP A02 (Cryptographic Failures) / CWE-798
- **ファイル:** `docker-compose.yml:15`
- **問題:** `AUTH_SECRET: "${AUTH_SECRET:-dev-secret-key-change-in-production}"` のように、環境変数が未設定の場合のデフォルト値として `dev-secret-key-change-in-production` がハードコードされている。この値は推測可能であり、JWT の署名鍵としてセキュリティ上脆弱である。
- **修正方針:** デフォルト値を削除し、`.env` ファイルからのみ読み込む構成にする。起動時に AUTH_SECRET が未設定の場合はエラーで停止するのが望ましい。`docker-compose.yml` では `AUTH_SECRET: "${AUTH_SECRET}"` とし、`.env` に `openssl rand -base64 32` で生成した値を設定する運用を README 等で案内する。

### [SEC-004] CSRF 対策の不足
- **カテゴリ:** OWASP A01 (Broken Access Control) / CWE-352
- **ファイル:** `src/app/api/auth/register/route.ts`, `src/app/api/combos/[comboId]/route.ts`, `src/app/api/characters/[characterId]/combos/route.ts`, `src/app/api/tags/route.ts`
- **問題:** SPEC.md に「CSRF対策: フォーム送信時にCSRFトークンを検証する」と明記されているが、実装では CSRF トークンの検証が行われていない。Auth.js の認証エンドポイント（`/api/auth/*`）は Auth.js 自体が CSRF 保護を提供するが、`/api/auth/register`、`/api/combos/*`、`/api/tags/*` などのカスタム API ルートには CSRF 保護が実装されていない。
- **修正方針:** Next.js の API ルートで `Origin` / `Referer` ヘッダーの検証を行うミドルウェアを追加するか、Auth.js の CSRF トークンをカスタム API ルートでも検証する仕組みを導入する。SPA 構成（同一オリジンからの fetch）であるため、リスクは限定的だが仕様との乖離がある。

### [SEC-005] セキュリティヘッダーの未設定
- **カテゴリ:** OWASP A05 (Security Misconfiguration)
- **ファイル:** `next.config.ts`
- **問題:** `next.config.ts` にセキュリティ関連の HTTP ヘッダー設定がない。`X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security`、`Content-Security-Policy` などのヘッダーが未設定。Next.js はデフォルトでいくつかのヘッダーを設定するが、明示的な設定が推奨される。
- **修正方針:** `next.config.ts` の `headers` 関数で以下のセキュリティヘッダーを追加する:
  ```typescript
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  }
  ```

### [SEC-006] エラーログに潜在的な機密情報漏洩リスク
- **カテゴリ:** OWASP A09 (Security Logging and Monitoring Failures) / CWE-532
- **ファイル:** `src/app/api/auth/register/route.ts:60`
- **問題:** `console.error("ユーザー登録エラー:", error)` で、キャッチした error オブジェクトをそのまま出力している。Prisma のエラーオブジェクトにはクエリ内容やデータベースの構造情報が含まれる場合がある。本番環境でのログ収集時にこれらの情報が外部に露出するリスクがある。
- **修正方針:** エラーログの出力時に、エラーメッセージのみを出力し、スタックトレースや内部データは開発環境でのみ出力するよう条件分岐する。

---

## INFO（情報・推奨事項）

### [SEC-007] Auth.js v5 (beta) の使用
- **内容:** `next-auth` パッケージが `"beta"` バージョンで指定されている。Auth.js v5 はベータ版であり、セキュリティパッチが安定版と同じ頻度で提供されない可能性がある。ARCHITECTURE.md の ADR でこのリスクは認識済みであり、パッケージバージョンを固定する方針が記載されている。`package-lock.json` でバージョンが固定されていることを確認済み。定期的な更新確認を推奨する。

### [SEC-008] JSON.parse の型安全性
- **内容:** `src/app/api/combos/[comboId]/route.ts:52`、`src/app/(authenticated)/characters/[characterId]/combos/[comboId]/page.tsx:49` など複数箇所で `JSON.parse(combo.sequence) as ComboSequence` が使用されている。データベースに格納された JSON 文字列を `as` でキャストしており、実行時の型検証が行われていない。データベースの値が不正な場合にランタイムエラーが発生する。Zod スキーマ（`comboSequenceSchema`）による検証を読み出し時にも適用することを推奨する。

### [SEC-009] Prisma の開発環境ログ設定
- **内容:** `src/lib/prisma.ts:16` で開発環境では `["query", "error", "warn"]` のログレベルが設定されている。`query` ログには SQL クエリ全体が出力されるため、開発環境のログにユーザーデータ（メールアドレス等）が含まれる可能性がある。ローカル開発環境前提のため実質的なリスクは低いが、認識しておくべき事項。

---

## 監査チェックリスト

### OWASP Top 10
| # | カテゴリ | 結果 | 備考 |
|---|---------|------|------|
| A01 | Broken Access Control | ✅ | 全APIで認証チェック + 所有者チェック実装済み。IDOR対策あり。CSRF は WARNING で指摘 |
| A02 | Cryptographic Failures | ✅ | bcrypt (cost 12) でパスワードハッシュ化。平文保存なし。docker-compose のデフォルト値は WARNING で指摘 |
| A03 | Injection | ✅ | Prisma ORM 使用によりSQL Injection 対策済み。パラメータバインディング |
| A04 | Insecure Design | ✅ | 認証・認可設計が ARCHITECTURE.md に文書化済み |
| A05 | Security Misconfiguration | ❌ | .gitignore 不備 (CRITICAL)、セキュリティヘッダー未設定 (WARNING) |
| A06 | Vulnerable Components | ✅ | npm audit 実行不可（Bash権限なし）。手動確認で既知の脆弱性は未発見。Auth.js beta は INFO で記載 |
| A07 | Auth Failures | ❌ | レート制限なし (CRITICAL) |
| A08 | Data Integrity Failures | ✅ | デシリアライゼーションは JSON.parse のみで安全。Zod バリデーション適用済み |
| A09 | Logging Failures | ✅ | エラーログの機密情報漏洩リスクは WARNING で指摘。監査ログ自体は個人利用前提のため不要 |
| A10 | SSRF | ✅ | 外部URLへのサーバーサイドリクエストなし |

### 依存パッケージ脆弱性
- スキャンツール: npm audit（実行不可 -- Bash 権限が拒否されたため）
- 脆弱性件数: 未確認（手動チェックで代替）
- 詳細: package.json の依存パッケージを手動確認。`next-auth: "beta"` は既知の安定性リスクあり（INFO で記載）。その他の主要パッケージ（next, react, prisma, bcryptjs, zod）は広く採用されたメジャーバージョンを使用しており、手動確認の範囲では既知の重大な脆弱性は発見されなかった。**本番デプロイ前に `npm audit` の実行を強く推奨する。**

### 認証・認可
| エンドポイント | 認証 | 認可 | 備考 |
|---|---|---|---|
| POST /api/auth/register | 不要 | - | 公開エンドポイント。Zod バリデーション済み |
| POST /api/auth/callback/credentials | Auth.js管理 | - | Auth.js が処理 |
| POST /api/auth/signout | Auth.js管理 | - | Auth.js が処理 |
| GET /api/auth/session | Auth.js管理 | - | Auth.js が処理 |
| GET /api/characters | ✅ | ✅ (userId フィルタ) | コンボ数はログインユーザー分のみ |
| GET /api/characters/[characterId]/combos | ✅ | ✅ (userId フィルタ) | |
| POST /api/characters/[characterId]/combos | ✅ | ✅ (userId 紐付け) | タグ所有権チェックあり |
| GET /api/combos/[comboId] | ✅ | ✅ (所有者チェック) | 他ユーザーは404 |
| PUT /api/combos/[comboId] | ✅ | ✅ (所有者チェック) | 他ユーザーは403 |
| DELETE /api/combos/[comboId] | ✅ | ✅ (所有者チェック) | 他ユーザーは403 |
| GET /api/tags | ✅ | ✅ (プリセット+自分) | |
| POST /api/tags | ✅ | ✅ (userId 紐付け) | |

Server Component ページについても `auth()` による所有者チェックが実装されている（page.tsx、combos/page.tsx、[comboId]/page.tsx）。

### 機密情報ハードコード
- 検出件数: 0（src/ 配下）
- 検索対象外: .env, .env.example, .env.local, テストフィクスチャ
- 補足: docker-compose.yml のデフォルト値については WARNING [SEC-003] で指摘

### 入力値バリデーション
| 入力箇所 | バリデーション | 備考 |
|---|---|---|
| ユーザー登録（email, password, name） | ✅ Zod (registerSchema) | email形式検証、password 8-100文字、name 50文字以内 |
| ログイン（email, password） | ✅ Zod (loginSchema) | クライアント側バリデーション |
| コンボ作成（name, sequence, damage, memo, tagIds） | ✅ Zod (comboCreateSchema) | name 100文字、memo 1000文字、damage 0以上整数、sequence 1ステップ以上 |
| コンボ更新 | ✅ Zod (comboUpdateSchema) | 全フィールド optional |
| タグ作成（name） | ✅ Zod (tagCreateSchema) | 1-30文字 |
| タグフィルタ（tags クエリパラメータ） | 部分的 | カンマ区切りを split するのみ。不正な tagId は Prisma クエリで無視される |

### CWE チェック
| CWE | 結果 | 備考 |
|-----|------|------|
| CWE-89 (SQL Injection) | ✅ | Prisma ORM によるパラメータバインディング。生 SQL なし |
| CWE-79 (XSS) | ✅ | React の JSX エスケープにより対策済み。dangerouslySetInnerHTML 未使用 |
| CWE-352 (CSRF) | ✅ | Auth.js 管理エンドポイントは保護済み。カスタム API は SPA 構成で限定的リスク（WARNING で指摘） |
| CWE-798 (Hardcoded Credentials) | ✅ | src/ 内にハードコード検出なし。docker-compose のデフォルト値は WARNING で指摘 |
| CWE-22 (Path Traversal) | ✅ | ファイルシステム操作なし。characterId は JSON マスタデータとの突合で検証 |
| CWE-502 (Deserialization) | ✅ | JSON.parse のみ使用。信頼されたデータソース（自DB）からのデシリアライゼーション |
| CWE-918 (SSRF) | ✅ | サーバーサイドで外部URLへのリクエストなし |
