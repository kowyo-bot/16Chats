import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { auth } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

function uiMessageToText(message: UIMessage) {
  const parts = message.parts ?? [];
  const text = parts
    .filter((p: any) => p?.type === 'text')
    .map((p: any) => p.text)
    .join('');
  return text || (message as any).content || '';
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: new Headers(req.headers),
  });
  if (!session?.user?.id) {
    return new Response('unauthorized', { status: 401 });
  }

  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } =
    await req.json();

  // Persist the latest user message (best-effort)
  if (chatId && messages?.length) {
    const last = messages[messages.length - 1];
    if (last?.role === 'user') {
      const pool = getDbPool();
      await pool.query(
        `insert into chat_messages (chat_id, role, content)
         values ($1, $2, $3)`,
        [chatId, 'user', uiMessageToText(last)]
      );
      await pool.query(`update chats set updated_at = now() where id = $1`, [
        chatId,
      ]);
    }
  }

  const result = streamText({
    model: 'anthropic/claude-haiku-4.5',
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (!chatId) return;
      const pool = getDbPool();
      await pool.query(
        `insert into chat_messages (chat_id, role, content)
         values ($1, $2, $3)`,
        [chatId, 'assistant', text]
      );
      await pool.query(`update chats set updated_at = now() where id = $1`, [
        chatId,
      ]);
    },
  });

  return result.toUIMessageStreamResponse();
}
