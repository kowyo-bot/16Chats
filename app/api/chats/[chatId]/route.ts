import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const session = await auth.api.getSession({
    headers: new Headers(req.headers),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;
  const pool = getDbPool();

  // Ensure ownership
  const chat = await pool.query(
    `select id from chats where id = $1 and user_id = $2`,
    [chatId, session.user.id]
  );
  if (chat.rowCount === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { rows } = await pool.query(
    `select id, role, content, created_at as "createdAt"
     from chat_messages
     where chat_id = $1
     order by created_at asc`,
    [chatId]
  );

  return NextResponse.json({ messages: rows });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const session = await auth.api.getSession({
    headers: new Headers(req.headers),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;
  const pool = getDbPool();

  const res = await pool.query(
    `delete from chats where id = $1 and user_id = $2`,
    [chatId, session.user.id]
  );

  if (res.rowCount === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
