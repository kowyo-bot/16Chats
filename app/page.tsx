'use client';

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

const ConversationDemo = () => {
  const { messages, sendMessage, status } = useChat();

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto min-h-screen">
      <Conversation className="flex-1">
        <ConversationContent>
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
                  {message.parts.map((part, i) => {
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
      <div className="fixed bottom-0 w-full max-w-4xl mb-8 px-4">
        <PromptInput
          onSubmit={({ text }) => {
            if (text.trim()) {
              sendMessage({ text });
            }
          }}
        >
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
  );
};

export default ConversationDemo;
