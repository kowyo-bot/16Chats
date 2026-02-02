# Deployment

## Vercel

项目通过 Vercel 部署，常用域名示例：

- `https://16-chats.vercel.app`

### 必要环境变量

在 Vercel (Production / Preview) 环境都需要配置：

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`（建议设置为线上域名，例如 `https://16-chats.vercel.app`）
- `NEXT_PUBLIC_BETTER_AUTH_URL`（同上）
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## GitHub Actions

仓库包含：

- `.github/workflows/build.yml`
  - push 到 `main`：跑 build，然后用 Vercel CLI 进行 production deploy

- `.github/workflows/preview.yml`
  - PR：跑 preview deploy（或在没 token 时仅 build）

- `.github/workflows/migrate.yml`
  - 手动触发：执行 `pnpm run db:migrate:all`（Better Auth + chat tables）

### GitHub Secrets

需要在 repo secrets 中设置：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

以及 DB/Auth 相关：

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
