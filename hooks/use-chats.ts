import { useState, useCallback, useEffect } from 'react';
import type { Chat } from '@/components/chat-sidebar';
import type { DbChat } from '@/lib/chat-types';

export function useChats(session: any, isPending: boolean) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    if (isPending || !session) return;
    const res = await fetch('/api/chats');
    if (!res.ok) return;
    const data = (await res.json()) as { chats: DbChat[] };
    const nextChats: Chat[] = (data.chats ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: new Date(c.createdAt),
    }));
    setChats(nextChats);
    return nextChats;
  }, [isPending, session]);

  useEffect(() => {
    fetchChats().then((nextChats) => {
      if (nextChats && nextChats.length > 0 && !currentChatId) {
        setCurrentChatId(nextChats[0].id);
      }
    });
  }, [session, isPending, fetchChats, currentChatId]);

  const handleNewChat = useCallback(async () => {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: `Chat ${chats.length + 1}` }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { chat: DbChat };
    const chat: Chat = {
      id: data.chat.id,
      title: data.chat.title,
      createdAt: new Date(data.chat.createdAt),
    };

    setChats((prev) => [chat, ...prev]);
    setCurrentChatId(chat.id);
    return chat;
  }, [chats.length]);

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    },
    [currentChatId]
  );

  return {
    chats,
    setChats,
    currentChatId,
    setCurrentChatId,
    fetchChats,
    handleNewChat,
    handleDeleteChat,
  };
}
