'use client';

import { useState, useEffect } from 'react';
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
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { MessageSquare } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { nanoid } from 'nanoid';
import { ChatSidebar, type Chat } from '@/components/chat-sidebar';
import { useSession } from '@/lib/auth-client';

interface ChatSession {
  id: string;
  messages: any[];
}

const ConversationDemo = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>(
    {}
  );

  const { messages, sendMessage, status, setMessages } = useChat();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  const handleNewChat = () => {
    const newChatId = nanoid();
    const newChat: Chat = {
      id: newChatId,
      title: `Chat ${chats.length + 1}`,
      createdAt: new Date(),
    };

    setChats((prev) => [newChat, ...prev]);
    setChatSessions((prev) => ({
      ...prev,
      [newChatId]: { id: newChatId, messages: [] },
    }));
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  const handleChatSelect = (chatId: string) => {
    const session = chatSessions[chatId];
    if (session) {
      setCurrentChatId(chatId);
      setMessages(session.messages);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    setChatSessions((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });

    if (currentChatId === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      if (remainingChats.length > 0) {
        const nextChat = remainingChats[0];
        setCurrentChatId(nextChat.id);
        setMessages(chatSessions[nextChat.id]?.messages || []);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  };

  const handleSendMessage = ({ text }: { text: string }) => {
    if (!text.trim()) return;

    if (!currentChatId) {
      handleNewChat();
    }

    sendMessage({ text });

    if (currentChatId) {
      setTimeout(() => {
        setChatSessions((prev) => ({
          ...prev,
          [currentChatId]: {
            ...prev[currentChatId],
            messages: [...(prev[currentChatId]?.messages || []), { role: 'user', content: text }],
          },
        }));
      }, 0);
    }
  };

  if (isPending || !session) {
    return null;
  }

  return (
    <ChatSidebar
      chats={chats}
      currentChatId={currentChatId}
      onChatSelect={handleChatSelect}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
    >
      <div className="flex flex-col w-full h-[calc(100vh-3.5rem)]">
        <Conversation className="flex-1 overflow-y-auto">
          <ConversationContent className="pb-4 w-full">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
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
          <ConversationScrollButton />
        </Conversation>
        <div className="shrink-0 w-full pt-4 pb-8 px-4 bg-background">
          <div className="max-w-4xl mx-auto">
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
};

export default ConversationDemo;
