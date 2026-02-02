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
import type { DbMessage } from '@/lib/chat-types';

type MessagePart = { type: string; text?: string };

function getMessageText(parts: MessagePart[]): string {
  return parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('');
}

function renderMessageParts(
  parts: MessagePart[],
  keyPrefix: string
): React.ReactNode[] {
  return parts
    .filter((p) => p.type === 'text')
    .map((part, i) => (
      <MessageResponse key={`${keyPrefix}-${i}`}>{part.text}</MessageResponse>
    ));
}

function getToolbarClassName(isLatest: boolean, isLoading: boolean): string {
  if (isLatest && isLoading) {
    return 'mt-0 hidden';
  }
  if (!isLatest) {
    return 'mt-0 opacity-0 transition-opacity group-hover:opacity-100';
  }
  return 'mt-0';
}

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
                    branches.map((branch: any) => {
                      const parts: MessagePart[] = branch.parts || [
                        { type: 'text', text: branch.content },
                      ];
                      return (
                        <MessageContent key={branch.id} className="pb-1">
                          {renderMessageParts(parts, branch.id)}
                        </MessageContent>
                      );
                    })
                  ) : (
                    <MessageContent
                      key={`${message.id}-content`}
                      className="pb-1"
                    >
                      {renderMessageParts(
                        message.parts as MessagePart[],
                        message.id
                      )}
                    </MessageContent>
                  )}
                </MessageBranchContent>

                <MessageToolbar
                  className={getToolbarClassName(isLatest, isLoading ?? false)}
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
                        onClick={() =>
                          navigator.clipboard.writeText(
                            getMessageText(message.parts as MessagePart[])
                          )
                        }
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
                        onClick={() =>
                          navigator.clipboard.writeText(
                            getMessageText(message.parts as MessagePart[])
                          )
                        }
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
