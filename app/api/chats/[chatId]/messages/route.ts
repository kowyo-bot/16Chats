import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function POST(
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
  const body = (await req.json()) as { role: string; content: string };
  const role = body.role;
  const content = body.content;
  if (!role || !content) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const pool = getDbPool();

  // Ensure ownership
  const chat = await pool.query(
    `select id from chats where id = $1 and user_id = $2`,
    [chatId, session.user.id]
  );
  if (chat.rowCount === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  await pool.query(
    `insert into chat_messages (chat_id, role, content)
     values ($1, $2, $3)`,
    [chatId, role, content]
  );
  await pool.query(`update chats set updated_at = now() where id = $1`, [
    chatId,
  ]);

  return NextResponse.json({ ok: true });
}
