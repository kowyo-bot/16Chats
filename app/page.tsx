'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Conversation,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { ChatSidebar } from '@/components/chat-sidebar';
import { useSession } from '@/lib/auth-client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useChats } from '@/hooks/use-chats';
import { ChatMessageList } from '@/components/chat-message-list';
import { dbMessagesToUiMessages, type DbMessage } from '@/lib/chat-types';

export default function ConversationDemo() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const {
    chats,
    currentChatId,
    setCurrentChatId,
    fetchChats,
    handleNewChat,
    handleDeleteChat,
  } = useChats(session, isPending);

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

  const { messages, sendMessage, status, setMessages, regenerate } = useChat({
    transport,
  });

  const currentChatTitle = useMemo(
    () => chats.find((c) => c.id === currentChatId)?.title,
    [chats, currentChatId]
  );

  useEffect(() => {
    if (!isPending && !session) router.push('/login');
  }, [session, isPending, router]);

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

  const handleChatSelect = async (chatId: string) => {
    if (chatId === currentChatId) return;
    setCurrentChatId(chatId);
    setMessages([]);
  };

  const onNewChatButtonClick = async () => {
    await handleNewChat();
    setMessages([]);
  };

  const handleSendMessage = async ({ text }: { text: string }) => {
    if (!text.trim()) return;

    let chatId = currentChatId;
    if (!chatId) {
      const chat = await handleNewChat();
      if (!chat) return;
      chatId = chat.id;
      currentChatIdRef.current = chatId;
      setMessages([]);
    }

    sendMessage({ text });
  };

  if (isPending || !session) return null;

  return (
    <ChatSidebar
      chats={chats}
      currentChatId={currentChatId}
      onChatSelect={handleChatSelect}
      onNewChat={onNewChatButtonClick}
      onDeleteChat={handleDeleteChat}
    >
      <div className="relative h-[calc(100vh-3.5rem)] w-full">
        <Conversation className="absolute inset-0 overflow-y-auto">
          <ChatMessageList
            messages={messages}
            currentChatTitle={currentChatTitle}
            onRegenerate={regenerate}
            isLoading={status !== 'ready'}
          />
          <ConversationScrollButton className="bottom-44" />
        </Conversation>

        <div className="from-background via-background/80 pointer-events-none absolute right-0 bottom-0 left-0 bg-linear-to-t to-transparent px-4 pt-20 pb-8">
          <div className="bg-background pointer-events-auto mx-auto max-w-4xl">
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
