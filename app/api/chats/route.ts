import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: new Headers(req.headers),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const pool = getDbPool();
  const { rows } = await pool.query(
    `select id, title, created_at as "createdAt", updated_at as "updatedAt"
     from chats
     where user_id = $1
     order by updated_at desc
     limit 50`,
    [session.user.id]
  );

  return NextResponse.json({ chats: rows });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: new Headers(req.headers),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const title = (body.title ?? 'New chat').slice(0, 200);

  const pool = getDbPool();
  const { rows } = await pool.query(
    `insert into chats (user_id, title)
     values ($1, $2)
     returning id, title, created_at as "createdAt", updated_at as "updatedAt"`,
    [session.user.id, title]
  );

  return NextResponse.json({ chat: rows[0] });
}
