# まな式AIマネタイズ完全攻略プログラム 会員サイト

Next.js App Router で構築した会員向けコンテンツサイトです。

## 機能

- 会員ログイン（member）と管理者ログイン（admin）
- ウェルカム / 進捗トラッカー / 4設計メソッド
- セッション種別 / Module別スケジュール / カリキュラム詳細
- 教材・特典 / お知らせ / サポート導線
- 管理パネル（admin のみ）
  - 進捗更新 / お知らせ追加・削除
  - Discord・LINE リンク更新
  - 画像URL設定（7スロット）

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 で起動します。

## 初期ログイン

| ロール | ユーザー名 | パスワード |
|--------|-----------|-----------|
| 管理者 | admin | admin12345 |
| 会員 | member | member12345 |

## 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `JWT_SECRET` | JWT署名用シークレット | `mana-lp-default-secret-change-me` |
| `ADMIN_USER` | 管理者ユーザー名 | `admin` |
| `ADMIN_PASS` | 管理者パスワード | `admin12345` |
| `MEMBER_USER` | 会員ユーザー名 | `member` |
| `MEMBER_PASS` | 会員パスワード | `member12345` |

## デプロイ

Vercel にそのままデプロイできます。本番環境では `JWT_SECRET` を必ず設定してください。
