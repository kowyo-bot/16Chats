'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [allMessages, setAllMessages] = useState<DbMessage[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<
    Record<string, string>
  >({});
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

  // Track the parent message ID for new messages (last message in current branch)
  const parentMessageIdRef = useRef<string | null>(null);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          chatId: currentChatIdRef.current,
          parentMessageId: parentMessageIdRef.current,
        },
      }),
    });
  }, []);

  const { messages, sendMessage, status, setMessages, regenerate } = useChat({
    transport,
    onFinish: async () => {
      // Refresh messages after a response is finished to get the branching info from DB
      if (!currentChatId) return;
      const res = await fetch(`/api/chats/${currentChatId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: DbMessage[] };
      const dbMsgs = data.messages ?? [];
      setAllMessages(dbMsgs);
      // Sync useChat messages with DB messages to ensure IDs match for branching
      setMessages(dbMessagesToUiMessages(dbMsgs, selectedBranchIds));
    },
  });

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
        setAllMessages(data.messages ?? []);
        setMessages(dbMessagesToUiMessages(data.messages ?? []));
      }
    })();
  }, [session, currentChatId, setMessages]);

  const handleBranchChange = (messageId: string) => {
    const message = allMessages.find((m) => m.id === messageId);
    const parentId = message?.parentId || 'root';

    const newSelected = {
      ...selectedBranchIds,
      [parentId]: messageId,
    };
    setSelectedBranchIds(newSelected);
    setMessages(dbMessagesToUiMessages(allMessages, newSelected));
  };

  const resetMessageState = () => {
    setMessages([]);
    setAllMessages([]);
    setSelectedBranchIds({});
  };

  const handleChatSelect = async (chatId: string) => {
    if (chatId === currentChatId) return;
    setCurrentChatId(chatId);
    resetMessageState();
  };

  const onNewChatButtonClick = async () => {
    await handleNewChat();
    resetMessageState();
  };

  const handleSendMessage = async ({ text }: { text: string }) => {
    if (!text.trim()) return;

    let chatId = currentChatId;
    if (!chatId) {
      const chat = await handleNewChat();
      if (!chat) return;
      chatId = chat.id;
      currentChatIdRef.current = chatId;
      resetMessageState();
    }

    // Set the parent to the last message in the current branch before sending
    parentMessageIdRef.current =
      messages.length > 0 ? messages[messages.length - 1].id : null;

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
      <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        <Conversation className="absolute inset-0">
          <ChatMessageList
            messages={messages}
            allMessages={allMessages}
            onRegenerate={regenerate}
            onBranchChange={handleBranchChange}
            isLoading={status !== 'ready'}
          />
          <ConversationScrollButton className="bottom-44" />

          <div
            className={`pointer-events-none absolute right-0 left-0 px-4 transition-all duration-500 ease-out ${
              messages.length === 0
                ? 'top-1/2 -translate-y-1/2'
                : 'from-background via-background/80 top-auto bottom-0 translate-y-0 bg-linear-to-t to-transparent pt-20 pb-8'
            }`}
          >
            <div className="bg-background pointer-events-auto mx-auto max-w-4xl">
              {messages.length === 0 && (
                <div className="mb-8 flex flex-col items-center justify-center text-center">
                  <h1
                    className="text-foreground/90 text-4xl font-normal tracking-tight sm:text-5xl"
                    style={{
                      fontFamily:
                        'Playfair Display, Georgia, Cambria, Times New Roman, Times, serif',
                    }}
                  >
                    {session.user.name?.split(' ')[0] || 'Welcome'} returns!
                  </h1>
                </div>
              )}
              <PromptInput onSubmit={handleSendMessage}>
                <PromptInputTextarea placeholder="Say something..." />
                <PromptInputFooter>
                  <PromptInputSubmit
                    status={status === 'streaming' ? 'streaming' : 'ready'}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </Conversation>
      </div>
    </ChatSidebar>
  );
}
