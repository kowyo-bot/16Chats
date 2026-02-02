import { MessageSquare, RefreshCcwIcon, CopyIcon } from 'lucide-react';
import {
  ConversationEmptyState,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
  MessageBranch,
  MessageBranchContent,
  MessageBranchSelector,
  MessageBranchPrevious,
  MessageBranchNext,
  MessageBranchPage,
  MessageToolbar,
} from '@/components/ai-elements/message';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import type { DbMessage } from '@/lib/chat-types';

interface ChatMessageListProps {
  messages: UIMessage[];
  allMessages?: DbMessage[];
  currentChatTitle?: string;
  onRegenerate?: (options?: { messageId?: string }) => void;
  onBranchChange?: (messageId: string) => void;
  isLoading?: boolean;
}

export function ChatMessageList({
  messages,
  allMessages,
  currentChatTitle,
  onRegenerate,
  onBranchChange,
  isLoading,
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
        messages.map((message, index) => {
          const isLatest = index === messages.length - 1;

          // Find branches for this message
          // A branch is a message that has the same parent as this one
          const dbMessage = allMessages?.find((m) => m.id === message.id);
          const branches = dbMessage?.parentId
            ? (allMessages?.filter(
                (m) =>
                  m.parentId === dbMessage.parentId && m.role === message.role
              ) ?? [])
            : [message];

          const currentBranchIndex = branches.findIndex(
            (b) => b.id === message.id
          );

          return (
            <Message from={message.role} key={message.id}>
              <MessageBranch
                defaultBranch={
                  currentBranchIndex === -1 ? 0 : currentBranchIndex
                }
                onBranchChange={(newIndex) => {
                  const newBranch = branches[newIndex];
                  if (
                    newBranch &&
                    onBranchChange &&
                    newBranch.id !== message.id
                  ) {
                    onBranchChange(newBranch.id);
                  }
                }}
              >
                <MessageBranchContent>
                  {branches.length > 1 ? (
                    branches.map((branch: any) => (
                      <MessageContent key={branch.id} className="pb-1">
                        {(
                          branch.parts || [
                            { type: 'text', text: branch.content },
                          ]
                        ).map((part: any, i: number) => {
                          if (part.type === 'text') {
                            return (
                              <MessageResponse key={`${branch.id}-${i}`}>
                                {part.text}
                              </MessageResponse>
                            );
                          }
                          return null;
                        })}
                      </MessageContent>
                    ))
                  ) : (
                    <MessageContent
                      key={`${message.id}-content`}
                      className="pb-1"
                    >
                      {message.parts.map((part: any, i: number) => {
                        if (part.type === 'text') {
                          return (
                            <MessageResponse key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          );
                        }
                        return null;
                      })}
                    </MessageContent>
                  )}
                </MessageBranchContent>

                <MessageToolbar
                  className={cn(
                    'mt-0',
                    isLatest && isLoading
                      ? 'hidden'
                      : !isLatest &&
                          'opacity-0 transition-opacity group-hover:opacity-100'
                  )}
                >
                  {message.role === 'assistant' && (
                    <MessageActions>
                      {onRegenerate && isLatest && (
                        <MessageAction
                          onClick={() =>
                            onRegenerate({ messageId: message.id })
                          }
                          label="Retry"
                          tooltip="Regenerate response"
                        >
                          <RefreshCcwIcon className="size-3" />
                        </MessageAction>
                      )}
                      <MessageAction
                        onClick={() => {
                          const text = message.parts
                            .filter((p: any) => p.type === 'text')
                            .map((p: any) => p.text)
                            .join('');
                          navigator.clipboard.writeText(text);
                        }}
                        label="Copy"
                        tooltip="Copy message"
                      >
                        <CopyIcon className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  )}

                  <MessageBranchSelector from={message.role}>
                    <MessageBranchPrevious />
                    <MessageBranchPage />
                    <MessageBranchNext />
                  </MessageBranchSelector>

                  <div className="flex-1" />

                  {message.role === 'user' && (
                    <MessageActions>
                      <MessageAction
                        onClick={() => {
                          const text = message.parts
                            .filter((p: any) => p.type === 'text')
                            .map((p: any) => p.text)
                            .join('');
                          navigator.clipboard.writeText(text);
                        }}
                        label="Copy"
                        tooltip="Copy message"
                      >
                        <CopyIcon className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  )}
                </MessageToolbar>
              </MessageBranch>
            </Message>
          );
        })
      )}
    </ConversationContent>
  );
}
