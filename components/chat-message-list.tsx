import { MessageSquare } from 'lucide-react';
import {
  ConversationEmptyState,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import type { UIMessage } from 'ai';

interface ChatMessageListProps {
  messages: UIMessage[];
  currentChatTitle?: string;
}

export function ChatMessageList({
  messages,
  currentChatTitle,
}: ChatMessageListProps) {
  return (
    <ConversationContent className="mx-auto max-w-4xl pb-64">
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
  );
}
