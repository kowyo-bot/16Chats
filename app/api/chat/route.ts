import {
  streamText,
  generateText,
  UIMessage,
  convertToModelMessages,
} from 'ai';
import { auth } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

function uiMessageToText(message: UIMessage): string {
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

  const {
    messages,
    chatId,
    parentMessageId,
  }: {
    messages: UIMessage[];
    chatId?: string;
    parentMessageId?: string;
  } = await req.json();

  let lastMessageId: string | null = null;

  // Persist the latest user message (best-effort)
  if (chatId && messages?.length) {
    const last = messages[messages.length - 1];
    if (last?.role === 'user') {
      const pool = getDbPool();
      const content = uiMessageToText(last);

      // 1. Try to find by ID if it's a valid UUID
      if (isValidUuid(last.id)) {
        const existing = await pool.query(
          `select id from chat_messages where id = $1 and chat_id = $2`,
          [last.id, chatId]
        );
        if (existing.rowCount && existing.rowCount > 0) {
          lastMessageId = existing.rows[0].id;
        }
      }

      // 2. Fallback to content matching if not found by ID
      if (!lastMessageId) {
        const existing = await pool.query(
          `select id from chat_messages 
           where chat_id = $1 and role = $2 and content = $3
           order by created_at desc limit 1`,
          [chatId, 'user', content]
        );

        if (existing.rowCount && existing.rowCount > 0) {
          lastMessageId = existing.rows[0].id;
        }
      }

      // 3. Insert new message if not found
      if (!lastMessageId) {
        // Use the client-provided parent ID if available, otherwise fall back to latest message
        let parentId: string | null = null;
        if (parentMessageId && isValidUuid(parentMessageId)) {
          // Verify the parent exists in this chat
          const parentExists = await pool.query(
            `select id from chat_messages where id = $1 and chat_id = $2`,
            [parentMessageId, chatId]
          );
          if (parentExists.rowCount && parentExists.rowCount > 0) {
            parentId = parentMessageId;
          }
        }
        // Fallback to the latest message if no valid parent was provided
        if (!parentId) {
          const lastInDb = await pool.query(
            `select id from chat_messages where chat_id = $1 order by created_at desc limit 1`,
            [chatId]
          );
          parentId = lastInDb.rows[0]?.id ?? null;
        }

        const result = await pool.query(
          `insert into chat_messages (chat_id, role, content, parent_id)
           values ($1, $2, $3, $4)
           returning id`,
          [chatId, 'user', content, parentId]
        );
        lastMessageId = result.rows[0].id;
      }

      await pool.query(`update chats set updated_at = now() where id = $1`, [
        chatId,
      ]);

      // Auto-generate title if this is the first message
      if (messages.length === 1) {
        (async () => {
          try {
            const { text: title } = await generateText({
              model: 'anthropic/claude-haiku-4.5',
              system:
                'You are a title generator. Create a concise, 3-5 word title for a chat based on the user message. Do not use quotes, bolding, or punctuation.',
              prompt: content,
            });
            await pool.query('update chats set title = $1 where id = $2', [
              title.trim().slice(0, 100) || 'New Chat',
              chatId,
            ]);
          } catch (error) {
            console.error('Title generation failed:', error);
          }
        })();
      }
    }
  }

  const result = streamText({
    model: 'anthropic/claude-haiku-4.5',
    system: 'You are a helpful assistant.',
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (!chatId) return;
      const pool = getDbPool();

      let parentId = lastMessageId;
      if (!parentId && parentMessageId && isValidUuid(parentMessageId)) {
        // Use client-provided parent as fallback
        const parentExists = await pool.query(
          `select id from chat_messages where id = $1 and chat_id = $2`,
          [parentMessageId, chatId]
        );
        if (parentExists.rowCount && parentExists.rowCount > 0) {
          parentId = parentMessageId;
        }
      }
      if (!parentId) {
        // Last resort: use the latest message in the chat
        const lastInDb = await pool.query(
          `select id from chat_messages where chat_id = $1 order by created_at desc limit 1`,
          [chatId]
        );
        parentId = lastInDb.rows[0]?.id ?? null;
      }

      await pool.query(
        `insert into chat_messages (chat_id, role, content, parent_id)
         values ($1, $2, $3, $4)`,
        [chatId, 'assistant', text, parentId]
      );
      await pool.query(`update chats set updated_at = now() where id = $1`, [
        chatId,
      ]);
    },
  });

  return result.toUIMessageStreamResponse();
}
