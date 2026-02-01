"use client";

import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputProvider,
} from "@/components/ai-elements/prompt-input";

export default function Home() {
  const { messages, input, setInput, handleSubmit, append, isLoading } = useChat({
    api: "/api/chat",
  });

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4 md:p-8">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">16Chats</h1>
        <p className="text-sm text-muted-foreground">MBTI Personality Chatbot</p>
      </header>

      <Conversation className="mb-4 rounded-xl border bg-background">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
              <p>Type something to start a conversation.</p>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>{m.content}</MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="relative">
        <PromptInputProvider initialInput={input}>
          <PromptInput
            onSubmit={(message) => {
              append({ role: "user", content: message.text });
            }}
            className="rounded-xl border bg-background p-2"
          >
            <PromptInputTextarea 
              placeholder="Message 16Chats..." 
              autoFocus 
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit status={isLoading ? "streaming" : "idle"} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </main>
  );
}

