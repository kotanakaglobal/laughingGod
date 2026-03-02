# Laughing God MVP

セッション（集まり）ごとに面白かった投稿を集め、無認証で投票・締切・月間アーカイブ閲覧できる Next.js アプリです。

## 技術スタック
- Next.js 14 (App Router / TypeScript)
- Prisma + SQLite
- Zod（バリデーション）

## セットアップ
```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

起動後: `http://localhost:3000`

## 主要機能
- セッション作成/一覧
- セッション詳細で投稿作成
- 投票（自己投票禁止 / 1人最大2票 / 同一投稿への重複票禁止）
- PIN でセッション締切
- 締切後にポイント（得票数）表示
- 月別アーカイブとランキング表示

## API
- `POST /api/sessions`
- `GET /api/sessions`
- `GET /api/sessions/:id`
- `POST /api/posts`
- `POST /api/votes`
- `POST /api/sessions/:id/close`
- `GET /api/month/:yyyy-mm`
