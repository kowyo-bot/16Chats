# 16Chats

一个带登录与聊天记录持久化的 AI 聊天应用（Next.js + Better Auth + PostgreSQL）。

> 最初的设想是“和不同 MBTI 的 AI 聊天 + 5 轮后做一个轻量 MBTI 评估”。目前代码层面已经具备：登录、聊天 UI、消息流式响应、以及把用户聊天记录存进数据库的能力；MBTI Persona/5 轮评估逻辑后续再补上。

## 技术栈

- **Next.js (App Router)**
- **Vercel AI SDK**（前端 `useChat` + 后端流式 `streamText`）
- **Better Auth**（Google OAuth 登录）
- **PostgreSQL / Supabase**（存储聊天会话与消息）
- **GitHub Actions + Vercel CLI**（CI / 预览 / 部署）

## 本地开发

### 1) 安装依赖

```bash
pnpm install
```

### 2) 配置环境变量

```bash
cp .env.example .env.local
```

需要至少填写：

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

本地回调 URL 默认是：

- `BETTER_AUTH_URL=http://localhost:3000`
- `NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000`

### 3) 迁移数据库

```bash
pnpm run db:migrate:chats
# （可选）如果你需要 Better Auth 的表：
# pnpm run db:migrate
```

### 4) 启动

```bash
pnpm dev
```

打开：http://localhost:3000

## 文档

- 技术文档入口：`docs/`
  - `docs/architecture.md`：整体架构
  - `docs/database.md`：表结构与迁移
  - `docs/deployment.md`：Vercel / GitHub Actions 部署说明
