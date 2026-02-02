import { Pool } from 'pg';

const SQL = `
create extension if not exists pgcrypto;

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chats_user_id_created_at_idx
  on chats (user_id, created_at desc);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_chat_id_created_at_idx
  on chat_messages (chat_id, created_at asc);
`;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_URL?.includes('supabase.co') ||
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

  await pool.query(SQL);
  console.log('✅ chat tables migrated');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
