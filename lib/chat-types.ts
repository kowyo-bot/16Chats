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
  parentId?: string | null;
  createdAt: string;
};

export function dbMessagesToUiMessages(
  rows: DbMessage[],
  selectedBranchIds: Record<string, string> = {}
): UIMessage[] {
  // To handle branching, we need to decide which "path" to show.
  const messagesByParent: Record<string, DbMessage[]> = {};
  const rootMessages: DbMessage[] = [];

  rows.forEach((m) => {
    if (!m.parentId) {
      rootMessages.push(m);
    } else {
      if (!messagesByParent[m.parentId]) {
        messagesByParent[m.parentId] = [];
      }
      messagesByParent[m.parentId].push(m);
    }
  });

  const path: DbMessage[] = [];
  if (rootMessages.length === 0) return [];

  // Start from the first root message
  let current: DbMessage | undefined = rootMessages[0];
  let rootIndex = 0;

  while (current) {
    path.push(current);
    const children: DbMessage[] | undefined = messagesByParent[current.id];

    if (children && children.length > 0) {
      // Pick the selected branch for this parent if it exists, otherwise the latest child
      const selectedId: string | undefined = selectedBranchIds[current.id];
      current =
        children.find((c: DbMessage) => c.id === selectedId) ||
        children[children.length - 1];
    } else {
      // If we've reached a leaf, check if there are more root messages.
      // We only pick the next root if it's NOT a duplicate of something already in our path.
      // This handles cases where user messages were incorrectly inserted as roots.
      rootIndex++;
      let nextRoot: DbMessage | undefined = rootMessages[rootIndex];
      while (
        nextRoot &&
        path.some(
          (m) => m.content === nextRoot!.content && m.role === nextRoot!.role
        )
      ) {
        rootIndex++;
        nextRoot = rootMessages[rootIndex];
      }
      current = nextRoot;
    }
  }

  return path.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.content }],
  }));
}
