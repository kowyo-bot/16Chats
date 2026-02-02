import type { UIMessage } from 'ai';

export type DbChat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type DbMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export function dbMessagesToUiMessages(rows: DbMessage[]): UIMessage[] {
  return rows.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.content }],
  }));
}
