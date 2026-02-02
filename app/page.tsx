'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { ChatSidebar, type Chat } from '@/components/chat-sidebar';
import { useSession } from '@/lib/auth-client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageSquare } from 'lucide-react';
import type { UIMessage } from 'ai';

type DbChat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type DbMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

function dbMessagesToUiMessages(rows: DbMessage[]): UIMessage[] {
  return rows.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.content }],
  }));
}

export default function ConversationDemo() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const currentChatIdRef = useRef<string | null>(null);
  currentChatIdRef.current = currentChatId;

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, chatId: currentChatIdRef.current },
      }),
    });
  }, []);

  const { messages, sendMessage, status, setMessages } = useChat({ transport });

  const currentChatTitle = useMemo(
    () => chats.find((c) => c.id === currentChatId)?.title,
    [chats, currentChatId]
  );

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
    if (!isPending && !session) router.push('/login');
  }, [session, isPending, router]);

  useEffect(() => {
    fetchChats().then((nextChats) => {
      // Auto-select the most recent chat (if any)
      if (nextChats && nextChats.length > 0 && !currentChatId) {
        setCurrentChatId(nextChats[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isPending]);

  // Refresh chats list when status changes to ready (to pick up auto-generated titles)
  useEffect(() => {
    if (status === 'ready' && currentChatId) {
      fetchChats();
    }
  }, [status, currentChatId, fetchChats]);

  // Load messages whenever current chat changes
  useEffect(() => {
    if (!session || !currentChatId) return;

    (async () => {
      const res = await fetch(`/api/chats/${currentChatId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: DbMessage[] };
      if (currentChatIdRef.current === currentChatId) {
        setMessages(dbMessagesToUiMessages(data.messages ?? []));
      }
    })();
  }, [session, currentChatId, setMessages]);

  const handleNewChat = async () => {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: `Chat ${chats.length + 1}` }),
    });

    if (!res.ok) return;

    const data = (await res.json()) as { chat: DbChat };
    const chat: Chat = {
      id: data.chat.id,
      title: data.chat.title,
      createdAt: new Date(data.chat.createdAt),
    };

    setChats((prev) => [chat, ...prev]);
    setCurrentChatId(chat.id);
    setMessages([]);
  };

  const handleChatSelect = async (chatId: string) => {
    if (chatId === currentChatId) return;
    setCurrentChatId(chatId);
    setMessages([]);
  };

  const handleDeleteChat = async (chatId: string) => {
    await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });

    setChats((prev) => prev.filter((c) => c.id !== chatId));

    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async ({ text }: { text: string }) => {
    if (!text.trim()) return;

    let chatId = currentChatId;
    if (!chatId) {
      // Create on-demand
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: `Chat ${chats.length + 1}` }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { chat: DbChat };
      const chat: Chat = {
        id: data.chat.id,
        title: data.chat.title,
        createdAt: new Date(data.chat.createdAt),
      };
      setChats((prev) => [chat, ...prev]);
      chatId = chat.id;
      currentChatIdRef.current = chatId;
      setCurrentChatId(chatId);
      setMessages([]);
    }

    // transport will include { chatId } in the request body
    sendMessage({ text });
  };

  if (isPending || !session) return null;

  return (
    <ChatSidebar
      chats={chats}
      currentChatId={currentChatId}
      onChatSelect={handleChatSelect}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
    >
      <div className="relative h-[calc(100vh-3.5rem)] w-full">
        <Conversation className="absolute inset-0 overflow-y-auto">
          <ConversationContent className="mx-auto max-w-4xl pb-40">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title={
                  currentChatTitle
                    ? `Start: ${currentChatTitle}`
                    : 'Start a conversation'
                }
                description="Type a message below to begin chatting"
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part: any, i: number) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <MessageResponse key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          );
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton className="bottom-36" />
        </Conversation>

        <div className="pointer-events-none absolute right-0 bottom-0 left-0 px-4 pt-4 pb-8">
          <div className="bg-background pointer-events-auto mx-auto max-w-4xl rounded-lg">
            <PromptInput onSubmit={handleSendMessage}>
              <PromptInputTextarea placeholder="Say something..." />
              <PromptInputFooter>
                <div />
                <PromptInputSubmit
                  status={status === 'streaming' ? 'streaming' : 'ready'}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </ChatSidebar>
  );
}
