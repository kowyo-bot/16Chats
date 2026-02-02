# Architecture

## Overview

16Chats 是一个典型的 Next.js App Router 项目：

- 前端：`app/page.tsx`
  - 使用 `@ai-sdk/react` 的 `useChat()` 发起消息
  - 左侧侧边栏展示聊天列表（来自 DB）
  - 切换聊天会话时，从 DB 拉取历史消息并渲染

- 后端：
  - `app/api/chat/route.ts`
    - 使用 `ai` 包的 `streamText()` 进行流式生成
    - 在请求开始时持久化 user message（best-effort）
    - 在生成结束时持久化 assistant message（`onFinish`）
  - `app/api/chats/*`
    - 提供 chat list / chat detail / delete / append message 等 REST API

- 登录：
  - `better-auth` + `better-auth/next-js`
  - API route：`app/api/auth/[...all]/route.ts`
  - 前端 hook：`lib/auth-client.ts`

## Request flow (chat)

1. 用户在 UI 输入消息
2. 前端调用 `/api/chat`（带上 `chatId`）
3. API:
   - 校验 session
   - 写入 `chat_messages`（role=user）
   - 调用模型流式生成
   - 结束后写入 `chat_messages`（role=assistant）
4. 前端收到流式内容并实时渲染

## Notes

- 当前实现把 `chatId` 作为请求体的一部分传到 `/api/chat`。
- 表结构与迁移见 `docs/database.md`。
