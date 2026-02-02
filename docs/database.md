# Database

## Tables

项目新增两张表用于持久化聊天记录（见 `scripts/db/migrate-chats.js`）：

### `chats`

- `id` (uuid)
- `user_id` (text) — Better Auth 的 `session.user.id`
- `title` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

索引：`(user_id, created_at desc)`

### `chat_messages`

- `id` (uuid)
- `chat_id` (uuid) — 外键 -> `chats(id)`，`on delete cascade`
- `role` (text) — user/assistant/system
- `content` (text)
- `created_at` (timestamptz)

索引：`(chat_id, created_at asc)`

## Migrations

```bash
pnpm run db:migrate:chats
```

- 该迁移脚本会创建 `pgcrypto` extension（用于 `gen_random_uuid()`）。
- 需要 Postgres 允许创建 extension；Supabase 默认支持。

## Better Auth migrations

Better Auth 的 schema 由：

```bash
pnpm run db:migrate
```

生成。注意：如果数据库里已经存在相同表，可能会报重复创建错误。
