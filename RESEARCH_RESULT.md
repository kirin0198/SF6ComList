# Research Result: SF6 コンボ帳

> 参照元: INTERVIEW_RESULT.md
> 調査日: 2026-04-08
> 更新履歴:
>   - 2026-04-08: 初回作成

## 1. キャラクターデータ

### 外部APIの調査結果

SF6のキャラクターデータ（名前・アイコン等）を提供する公式APIは存在しない。以下の非公式リソースが確認された。

| リソース | 種別 | 内容 | 制約 | 参考URL |
|---|---|---|---|---|
| FAT (Frame Assistant Tool) | OSS (GPL-3.0) | SF6全キャラのフレームデータをJSON形式で内包。Ionic React + TypeScript製 | GPL-3.0のため派生物もOSS化・クレジット必須。公開APIなし（データはリポジトリ内JSONから直接取得） | https://github.com/D4RKONION/FAT |
| sf6fd | Java ライブラリ | SF6のフレームデータをスクレイピングで取得 | 1コミットのみ。ライセンス不明。メンテナンス不安 | https://github.com/sagansfault/sf6fd |
| SF6-FrameData | iOS アプリ (SwiftUI) | SF6全キャラのフレームデータ | MITライセンスだが実態はiOSアプリ。データ形式はSwiftUI向け | https://github.com/racpsjcsp/SF6-FrameData |
| Ultimate Frame Data | Webサイト | SF6全キャラのフレームデータ（モバイル対応） | Webスクレイピングによる取得が必要。APIなし | https://ultimateframedata.com/sf6/ |
| FAT Online | Webサイト | SF6, 2XKO, GGST のフレームデータをブラウザで閲覧 | APIなし。Full Meter Apps提供 | https://fullmeter.com/fatonline/ |
| CAPCOM公式 | Webサイト | 各キャラのフレームデータページを公式提供 | APIなし。個別ページをスクレイピングする必要がある | https://www.streetfighter.com/6/en-us/character |

### 推奨アプローチ

**手動管理（JSONファイルによるマスタデータ管理）を推奨する。**

理由:
1. 公式APIが存在せず、非公式APIも安定性・ライセンスに課題がある
2. キャラクターデータ（名前・アイコン識別子）は30件程度で変更頻度が低い（年4キャラ追加程度）
3. 本プロジェクトはコンボ管理が主目的であり、フレームデータの網羅は将来検討（FR-014）
4. ローカル環境前提のため、外部API依存を最小化すべきという制約に合致する
5. FATのGPL-3.0ライセンスは本プロジェクトに制約を課す可能性がある

具体的には:
- `characters.json` にキャラクター名・ID・表示名を手動管理する
- キャラクターアイコンは自作SVGアイコンまたはプレースホルダーを使用する（著作権問題の回避）
- 新キャラ追加時はJSONファイルを更新する運用とする

### キャラクター一覧（2026年4月時点: 全30キャラクター）

#### ベースロスター（18キャラクター）
| # | キャラクター名 | 英語名 |
|---|---|---|
| 1 | リュウ | Ryu |
| 2 | ルーク | Luke |
| 3 | ジェイミー | Jamie |
| 4 | 春麗 | Chun-Li |
| 5 | ガイル | Guile |
| 6 | キンバリー | Kimberly |
| 7 | ジュリ | Juri |
| 8 | ケン | Ken |
| 9 | エドモンド本田 | E. Honda |
| 10 | ダルシム | Dhalsim |
| 11 | ブランカ | Blanka |
| 12 | マノン | Manon |
| 13 | マリーザ | Marisa |
| 14 | リリー | Lily |
| 15 | JP | JP |
| 16 | ディージェイ | Dee Jay |
| 17 | キャミィ | Cammy |
| 18 | ザンギエフ | Zangief |

#### Year 1 DLC（4キャラクター）
| # | キャラクター名 | 英語名 |
|---|---|---|
| 19 | ラシード | Rashid |
| 20 | A.K.I. | A.K.I. |
| 21 | エド | Ed |
| 22 | 豪鬼 | Akuma |

#### Year 2 DLC（4キャラクター）
| # | キャラクター名 | 英語名 |
|---|---|---|
| 23 | ベガ | M. Bison |
| 24 | テリー・ボガード | Terry Bogard |
| 25 | 不知火舞 | Mai Shiranui |
| 26 | エレナ | Elena |

#### Year 3 DLC（4キャラクター）
| # | キャラクター名 | 英語名 | リリース日 |
|---|---|---|---|
| 27 | サガット | Sagat | 2025年8月5日 |
| 28 | C.ヴァイパー | C. Viper | 2025年10月15日 |
| 29 | アレックス | Alex | 2026年3月17日 |
| 30 | イングリッド | Ingrid | 2026年春（未リリース） |

> **注意:** イングリッドは2026年4月8日時点では未リリース。「Late Spring 2026」にリリース予定。キャラクターマスタデータには含めておき、リリース後に有効化する運用が望ましい。

### キャラクターアイコン画像について

CAPCOMの著作物であるキャラクターの公式画像・アイコンの使用には制約がある。

- CAPCOMはファンコンテンツについてビデオポリシーを公開しているが、静的アセット（画像・アイコン）の使用に関する明確なガイドラインは限定的
- 「ファンコンテンツを公式CAPCOMコンテンツとして宣伝してはならない」が基本ルール
- ゲーム要素を分離して独立して投稿することは禁止されている

**推奨:**
- 個人利用・ローカル環境の範囲では実質的なリスクは低いが、将来の公開を見据え、自作のシンプルなアイコン（イニシャルやシルエット）をデフォルトとする
- ユーザーが自分で画像を設定できる機能を用意する（カスタムアイコンURL）
- 公開時はCAPCOMのファンコンテンツガイドラインに従う

## 2. ビジュアルコンボ入力UI

### SF6の入力体系

#### 操作タイプ

SF6には2つの操作タイプが存在する。本プロジェクトのコンボ表記は**クラシック操作を基本とし、モダン操作への対応は将来検討**とすることを推奨する。

| 操作タイプ | 特徴 | ボタン体系 |
|---|---|---|
| クラシック (Classic) | 従来のSFシリーズと同じ6ボタン体系 | LP, MP, HP, LK, MK, HK |
| モダン (Modern) | 簡易入力。パンチ/キック区別なし | Light, Medium, Heavy, Special, Assist |

#### クラシック操作のボタン一覧

| カテゴリ | ボタン | 略称 | 入力 |
|---|---|---|---|
| パンチ | 弱パンチ | LP | Light Punch |
| パンチ | 中パンチ | MP | Medium Punch |
| パンチ | 強パンチ | HP | Heavy Punch |
| キック | 弱キック | LK | Light Kick |
| キック | 中キック | MK | Medium Kick |
| キック | 強キック | HK | Heavy Kick |

#### ドライブシステム入力

| アクション | 入力 (クラシック) | ドライブゲージ消費 | 略称 |
|---|---|---|---|
| ドライブインパクト (Drive Impact) | HP+HK | 1本 | DI |
| ドライブパリィ (Drive Parry) | MP+MK（長押し可） | 継続消費 | DP / Parry |
| パーフェクトパリィ (Perfect Parry) | 被弾2F以内にMP+MK | - | PP |
| ドライブラッシュ (Drive Rush) | MP+MK後に66 または キャンセル66 | パリィから1本 / キャンセルから3本 | DR |
| ドライブリバーサル (Drive Reversal) | ガード中に6+HP+HK | 2本 | DRev |
| オーバードライブ (Overdrive) | 同種ボタン2つ同時押し（例: LP+MP） | 2本 | OD |

#### その他の入力

| アクション | 入力 | 略称 |
|---|---|---|
| 投げ (Throw) | LP+LK | Throw |
| スーパーアーツ1 (Super Art 1) | キャラ固有コマンド | SA1 |
| スーパーアーツ2 (Super Art 2) | キャラ固有コマンド | SA2 |
| スーパーアーツ3 (Critical Art) | キャラ固有コマンド | SA3 / CA |
| バーンアウト (Burnout) | ドライブゲージ枯渇状態 | - |

#### 方向入力（テンキー表記）

```
7(上後) 8(上)   9(上前)
4(後)   5(N)    6(前)
1(下後) 2(下)   3(下前)
```

### コンボ表記の標準形式

格闘ゲームコミュニティ（FGC）では**テンキー表記（Numpad Notation）**が国際標準として広く採用されている。

#### テンキー表記の基本ルール

- 方向をPCキーボードのテンキー配置に対応する数字で表記する
- 5はニュートラル（方向入力なし）
- キャラクターが右向き（1P側）を基準とする
- 方向の後にボタン名を記述する

#### よく使うコマンドの表記例

| コマンド名 | テンキー表記 | 日本語名 | 説明 |
|---|---|---|---|
| Quarter Circle Forward | 236 | 波動拳コマンド | 下→下前→前 |
| Quarter Circle Back | 214 | 竜巻コマンド | 下→下後→後 |
| Dragon Punch | 623 | 昇龍拳コマンド | 前→下→下前 |
| Half Circle Forward | 41236 | 半回転前 | 後→下後→下→下前→前 |
| Half Circle Back | 63214 | 半回転後 | 前→下前→下→下後→後 |
| Charge Back-Forward | [4]6 | 溜め（後→前） | 後ろ溜め→前 |
| Charge Down-Up | [2]8 | 溜め（下→上） | 下溜め→上 |
| Double Quarter Circle Forward | 236236 | 真空波動拳コマンド | SA等の超必殺技 |
| 360 | 63214789 / 360 | スクリューコマンド | 一回転 |

#### コンボ表記に使う記号

| 記号 | 意味 | 例 |
|---|---|---|
| > | リンク（つなぎ） | 5MP > 5HP |
| xx | キャンセル | 5HP xx 236HP |
| ~ | ディレイ / 派生 | 236HK ~ delay |
| , | コマンドの区切り | 2MK, 236LP |
| [ ] | 溜め入力 | [4]6P |
| j. | ジャンプ攻撃 | j.HP |
| cl. | 近距離 | cl.HP |
| cr. | しゃがみ（2と同義） | cr.MK |
| st. | 立ち（5と同義） | st.HP |
| DR | ドライブラッシュ | DR > 5MP |
| DI | ドライブインパクト | DI |
| OD | オーバードライブ | OD 236PP |
| SA1/SA2/SA3 | スーパーアーツ | SA1 |

### アイコン素材

#### 利用可能な素材

| 素材 | 内容 | ライセンス | 形式 | 参考URL |
|---|---|---|---|---|
| Fighting Game Input Icons Pack | 8方向+溜め・5モーション（QCF, DP, HCF, 360等）・攻撃高さフラグ（上中下） | CC-BY-4.0 | 128x128px (ZIP) | https://andreajens.itch.io/fighting-game-input-icons-pack |
| OpenGameArt Input Icons | ゲームパッド・キーボード・マウスのアイコン | 各種OSSライセンス | 各種 | https://opengameart.org/content/input-icons |
| Flaticon | 汎用格闘ゲームアイコン 2,821点 | Flaticon License（要帰属表示） | SVG/PNG/EPS | https://www.flaticon.com/free-icons/fighting-game |
| Noun Project | 格闘ゲームアイコン 534点 | ロイヤリティフリー（有料プランまたは帰属表示） | PNG/SVG | https://thenounproject.com/browse/icons/term/fighting-game/ |

**推奨:**
- 方向キー（矢印）やモーション入力のアイコンは **Fighting Game Input Icons Pack（CC-BY-4.0）** をベースとする
- SF6固有のボタン（LP, MP, HP, LK, MK, HK）アイコンは**自作SVG**で作成する（シンプルな円形+テキストラベルで十分）
- ドライブシステムのアイコン（DI, DR, OD等）も自作SVGで統一する
- CC-BY-4.0素材使用時はクレジット表記を忘れずに記載する

### 既存事例（参考になるUI・ツール）

| ツール | UI の特徴 | 参考ポイント |
|---|---|---|
| Combolab | コンボをURL・テキスト・絵文字・画像で共有可能。複数の表記法に対応 | 複数フォーマットでの共有機能、ビジュアルエディタの存在 |
| ComboTier | テンキー表記+テキスト略称でコンボ表示。難易度・ダメージ値・動画リンク付き | テキストベースの表記法、メタデータ（ダメージ・難易度）の付与方法 |
| sf6combo.kagewebsite.com | ビジュアルアイコンでコンボ入力を表示。ビジュアルエディタでコンボ投稿可能 | ビジュアルアイコンによる入力表示、コミュニティ投稿機能 |
| comboNotes (OSS) | テキスト表記をゲーム固有のアイコンに変換するアプリ。SF6対応済み | テキスト→アイコン変換のロジック、JS/CSS/HTML実装 |
| Training Mode | インタラクティブなコンボシミュレータ。テンキー表記の学習用 | インタラクティブな入力UI、チュートリアル的UX |
| FG-Notation (OSS) | テンキー表記と略語表記を相互変換 | 表記法間の変換ロジック |

## 3. 競合・類似サービス分析

| サービス | 特徴 | 強み | 弱み | 参考URL |
|---|---|---|---|---|
| Combolab | SF6コンボ作成・共有ツール。URL/テキスト/絵文字/画像での共有に対応 | 複数フォーマット対応の共有機能、洗練されたUI | コンボ作成に特化しておりコンボ帳としての管理機能は限定的 | https://combolab.app/ |
| ComboTier | SF6含む格ゲーのコンボガイドDB。動画デモ・難易度評価・コミュニティ投稿 | 動画による分かりやすい解説、難易度表示、コミュニティ主導 | アイコン表示非対応（テキスト表記のみ）。個人のコンボ管理機能なし | https://combotier.com/sf6 |
| sf6combo.kagewebsite.com | コミュニティ主導のSF6コンボDB（247コンボ収録）。ビジュアルエディタ | ビジュアルアイコンによる入力表示。全32キャラ対応 | コミュニティ共有型で個人管理向けではない。認証機能なし | https://sf6combo.kagewebsite.com/ |
| FAT Online | SF6/2XKO/GGSTのフレームデータ閲覧ツール（ブラウザ版） | 世界で最も人気のフレームデータツール。データが豊富で正確 | フレームデータ閲覧が主目的。コンボ管理・登録機能なし | https://fullmeter.com/fatonline/ |
| SuperCombo Wiki | SF6全キャラの技表・コンボ・攻略情報をWiki形式で集約 | 網羅的な情報量。コミュニティによる継続的な更新 | Wiki形式のため個人のコンボ管理には不向き。UI/UXは旧式 | https://wiki.supercombo.gg/w/Street_Fighter_6 |

### 差別化ポイント

本プロジェクトが上記競合に対して差別化できる主要なポイント:

1. **個人専用のコンボ管理ツール** --- 既存ツールの多くはコミュニティ共有型であり、「自分だけのコンボ帳」として個人管理に特化したサービスは少ない
2. **ビジュアルコンボ入力UI + 個人管理** --- ビジュアルアイコンでの入力表示を備えつつ、ユーザー認証による個人データ管理を提供する組み合わせは競合にない
3. **タグベースの整理・検索** --- プリセットタグ + ユーザー定義タグで柔軟にコンボを分類・検索できる機能
4. **セルフホスト可能** --- ローカル環境で動作するため、データの完全な管理権をユーザーが保持できる

## 4. 外部依存の調査

### API・サービス

| API/サービス | 用途 | 料金体系 | 制約 | 代替案 |
|---|---|---|---|---|
| Google OAuth | ソーシャルログイン（Google） | 無料（Google Cloud Console） | OAuth同意画面の設定が必要。ローカル開発時はlocalhost対応可 | メール/パスワード認証のみにする |
| GitHub OAuth | ソーシャルログイン（GitHub） | 無料（GitHub Developer Settings） | OAuthアプリ登録が必要。ローカル開発時はlocalhost対応可 | メール/パスワード認証のみにする |

> **注記:** ローカル環境前提のため、OAuth設定は開発者自身がGoogle Cloud Console / GitHub Developer Settingsで行う運用となる。環境変数（.env）でクライアントID/シークレットを管理する。

### ライブラリ・フレームワーク（候補）

以下は調査で確認した候補であり、最終的な技術選定は architect が行う。

| ライブラリ | 用途 | ライセンス | メンテナンス状況 | 備考 |
|---|---|---|---|---|
| React | フロントエンドUI構築 | MIT | アクティブ（Meta管理） | ビジュアルコンボ入力UIの実装に適している |
| Next.js | フルスタックフレームワーク | MIT | アクティブ（Vercel管理） | SSR/APIルートでバックエンド統合が容易 |
| Tailwind CSS | UIスタイリング | MIT | アクティブ | ユーティリティファーストでカスタムUI構築に適合 |
| NextAuth.js (Auth.js) | 認証（OAuth + Credentials） | ISC | アクティブ | Google/GitHub OAuth + メール/パスワードを統一的に管理 |
| Prisma | ORM（DB操作） | Apache-2.0 | アクティブ | TypeScript対応。スキーマ駆動開発 |
| SQLite / PostgreSQL | データベース | パブリックドメイン / PostgreSQL License | アクティブ | ローカル環境ではSQLiteが手軽。将来のクラウド移行にはPostgreSQL |
| dnd-kit | ドラッグ&ドロップ | MIT | アクティブ | コンボ入力の並び替えUIに使用可能 |

## ユビキタス言語（ドメイン用語集）

| 用語 | 定義 | 備考 |
|---|---|---|
| コンボ (Combo) | 連続技。相手が反撃できない一連の攻撃入力のシーケンス | 本プロジェクトの主要管理対象 |
| フレームデータ (Frame Data) | 技の発生・持続・硬直等のフレーム（1/60秒）単位の数値情報 | 本プロジェクトのMVPスコープ外（FR-014: 将来検討） |
| テンキー表記 (Numpad Notation) | 方向入力をPCテンキーの数字で表記する国際標準記法 | 本プロジェクトの基本表記法 |
| BnB (Bread and Butter) | 基本コンボ。最も頻繁に使う実用的な連続技 | プリセットタグの候補 |
| ドライブシステム (Drive System) | SF6固有のリソース管理システム。6本のドライブゲージを消費して各種アクションを実行 | DI, DR, DP, DRev, OD の5種のアクションを含む |
| ドライブインパクト (Drive Impact / DI) | HP+HK同時押しで発動するアーマー付き攻撃。ドライブゲージ1本消費 | 壁際でヒット/ガードさせると壁やられ |
| ドライブラッシュ (Drive Rush / DR) | パリィまたは通常技からキャンセルして前方にダッシュする行動 | パリィから1本、キャンセルから3本消費 |
| オーバードライブ (Overdrive / OD) | 必殺技の強化版。同種ボタン2つ同時押しで発動。ドライブゲージ2本消費 | 旧作のEX技に相当 |
| スーパーアーツ (Super Arts / SA) | スーパーアーツゲージを消費して発動する超必殺技。SA1, SA2, SA3の3段階 | SA3はCritical Artとも呼ばれる |
| バーンアウト (Burnout) | ドライブゲージが0になった状態。ドライブ関連アクションが使用不能になる | ゲージ回復まで不利な状態が続く |
| クラシック操作 (Classic) | 従来のSFシリーズ準拠の6ボタン（LP/MP/HP/LK/MK/HK）操作体系 | 本プロジェクトの基本対応操作 |
| モダン操作 (Modern) | 簡易入力の操作体系。ボタン数が少なくアシスト機能あり | 将来対応検討 |
| リンク (Link) | フレーム有利を利用して技をつなげること。記号: > | 技の硬直差を利用した接続 |
| キャンセル (Cancel) | 技のモーション中に別の技で割り込むこと。記号: xx | 通常技→必殺技等 |
| パニッシュカウンター (Punish Counter) | 相手の技の隙に反撃でヒットさせた場合の特殊状態（+4F有利） | プリセットタグの候補 |
| カウンターヒット (Counter Hit) | 相手の攻撃動作中にヒットさせた場合の特殊状態（+2F有利） | プリセットタグの候補 |

## 技術的リスク

| リスク | 影響度 | 発生確率 | 対策案 |
|---|---|---|---|
| ビジュアルコンボ入力UIの複雑性 | 高 | 高 | PoC（技術検証）で入力UIプロトタイプを先行実装し、実現性と操作性を確認する。comboNotesのOSS実装を参考にする |
| キャラクターデータの更新漏れ | 中 | 中 | JSONマスタデータに「activeFrom」フィールドを設け、新キャラ追加時の更新手順をドキュメント化する |
| OAuth設定の複雑さ（ローカル環境） | 中 | 中 | NextAuth.js等の認証ライブラリを使用し、ローカル開発用のOAuth設定ガイドを用意する。メール/パスワード認証を先行実装し、OAuth対応は段階的に追加する |
| コンボ表記の表現力不足 | 中 | 低 | テンキー表記を基本としつつ、溜め入力・同時押し・ディレイ等の特殊表記にも対応するデータモデルを設計する |
| ボタンアイコン素材のライセンス問題 | 低 | 低 | CC-BY-4.0の素材をベースにしつつ、SF6固有ボタンは自作SVGで対応する。帰属表示を遵守する |
| イングリッド（未リリースキャラ）のデータ管理 | 低 | 高 | マスタデータにステータスフラグ（active/upcoming）を設け、リリース前キャラは非表示にする |
| CAPCOMの著作権に抵触するリスク | 中 | 低 | 公式画像を直接使用せず、自作アイコンとテキストベースの表示を基本とする。将来公開時はCAPCOMのファンコンテンツガイドラインに従う |

## 推奨事項

調査結果に基づく推奨事項:

- **コンボ入力UIのPoCを最優先で実施すべき** --- ビジュアルコンボ入力UIは本プロジェクト最大の技術的チャレンジであり、poc-engineerフェーズで入力UIのプロトタイプを検証すること
- **テンキー表記を基本表記法として採用する** --- FGCの国際標準であり、言語に依存しない。内部データモデルもテンキー表記ベースで設計する
- **キャラクターデータは手動JSON管理とする** --- 外部API依存を排除し、シンプルで安定したデータ管理を実現する
- **認証はメール/パスワードを先行実装し、OAuthは段階的に追加する** --- ローカル環境での開発効率を優先し、OAuth設定の複雑さを後回しにできるようにする
- **クラシック操作を基本対応とし、モダン操作対応は将来検討とする** --- クラシック操作（6ボタン体系）はFGCでの標準であり、コンボ表記の大半がクラシック前提
- **コンボのプリセットタグとして以下を初期定義する:**
  - BnB（基本コンボ）
  - 画面端（Corner）
  - 画面中央（Midscreen）
  - ドライブラッシュ（Drive Rush）
  - パニッシュカウンター始動（Punish Counter）
  - カウンターヒット始動（Counter Hit）
  - 対空（Anti-Air）
  - SA1始動 / SA1締め
  - SA2始動 / SA2締め
  - SA3始動 / SA3締め
  - 投げ（Throw）
  - OD使用（Overdrive）
- **自作SVGアイコンで統一的なビジュアルデザインを構築する** --- 方向キー、ボタン（LP/MP/HP/LK/MK/HK）、ドライブアクション（DI/DR/OD等）を自作SVGで統一し、著作権リスクを回避する

## 未解決事項

| # | 事項 | 備考 |
|---|---|---|
| 1 | ビジュアルコンボ入力UIの具体的なインタラクションデザイン | PoCで検証予定 |
| 2 | コンボのデータモデル詳細（command_sequenceの具体的なJSON構造） | architect / spec-designerで設計 |
| 3 | モダン操作への対応範囲と時期 | 将来検討 |
| 4 | Year 4 DLCキャラクターの追加対応（未発表） | キャラクター追加の運用フローで対応 |
| 5 | コンボの公開・共有機能の仕様詳細（FR-012） | 将来検討 |

## 出典・参考資料

| # | タイトル | URL | 取得日 |
|---|---|---|---|
| 1 | FAT - Frame Data App (GitHub) | https://github.com/D4RKONION/FAT | 2026-04-08 |
| 2 | sf6fd - SF6 Frame Data Library (GitHub) | https://github.com/sagansfault/sf6fd | 2026-04-08 |
| 3 | SF6-FrameData (GitHub) | https://github.com/racpsjcsp/SF6-FrameData | 2026-04-08 |
| 4 | Ultimate Frame Data - SF6 | https://ultimateframedata.com/sf6/ | 2026-04-08 |
| 5 | FAT Online - SF6 Frame Data | https://fullmeter.com/fatonline/ | 2026-04-08 |
| 6 | CAPCOM公式 - SF6キャラクターページ | https://www.streetfighter.com/6/en-us/character | 2026-04-08 |
| 7 | Combolab - SF6 Combo Maker | https://combolab.app/ | 2026-04-08 |
| 8 | ComboTier - SF6 Combo Guide | https://combotier.com/sf6 | 2026-04-08 |
| 9 | sf6combo.kagewebsite.com | https://sf6combo.kagewebsite.com/ | 2026-04-08 |
| 10 | comboNotes (GitHub) | https://github.com/daijoubu-dev/comboNotes | 2026-04-08 |
| 11 | FG-Notation (GitHub) | https://github.com/Clay-6/FG-Notation | 2026-04-08 |
| 12 | Fighting Game Input Icons Pack (CC-BY-4.0) | https://andreajens.itch.io/fighting-game-input-icons-pack | 2026-04-08 |
| 13 | Numpad Notation - Dustloop Wiki | https://www.dustloop.com/w/Notation | 2026-04-08 |
| 14 | Numpad Notation - Fighting Game Glossary (infil.net) | https://glossary.infil.net/?t=Numpad+Notation | 2026-04-08 |
| 15 | Numpad Notation - Fighting Game Collectors Wiki | https://fighting-game-collectors.fandom.com/wiki/Numpad_notation | 2026-04-08 |
| 16 | SF6 Control Type & Battle HUD | https://sf6combo.kagewebsite.com/page/control-type-battle-hud | 2026-04-08 |
| 17 | esports.gg - SF6 Full Roster | https://esports.gg/news/street-fighter-6/sf6-roster-explained/ | 2026-04-08 |
| 18 | Capcom Video Policy | https://www.capcomusa.com/video-policy/ | 2026-04-08 |
| 19 | Training Mode - Combo Simulator | https://trainingmode.pro/tutorial | 2026-04-08 |
| 20 | Street Fighter Wiki - Inputs | https://streetfighter.fandom.com/wiki/Inputs | 2026-04-08 |
| 21 | Red Bull - SF6 Drive System | https://www.redbull.com/ca-en/drive-system-street-fighter-6 | 2026-04-08 |
| 22 | Nintendo Life - Ingrid Release Date | https://www.nintendolife.com/news/2026/04/street-fighter-6s-next-dlc-fighter-joins-the-battle-in-late-spring-2026 | 2026-04-08 |
