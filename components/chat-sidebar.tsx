'use client';

import * as React from 'react';
import {
  MessageSquare,
  SquarePen,
  Settings,
  Trash2,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NavUser } from '@/components/nav-user';
import { useSession } from '@/lib/auth-client';

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
}

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  children: React.ReactNode;
}

function ChatSidebarContent({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
}: Omit<ChatSidebarProps, 'children'>) {
  const { isMobile } = useSidebar();
  const { data: session } = useSession();

  return (
    <>
      <SidebarHeader className="h-14 p-0 justify-center">
        <div className="flex items-center justify-between px-4 h-full group-data-[state=collapsed]:hidden">
          <h2 className="text-lg font-semibold flex items-center">16Chats</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={onNewChat}
              >
                <SquarePen className="size-4" />
                <span className="sr-only">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </div>
        <div className="hidden group-data-[state=collapsed]:flex items-center justify-center h-full">
          <span className="text-lg font-bold">16</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="group-data-[state=collapsed]:hidden">
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    isActive={currentChatId === chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    tooltip={chat.title}
                  >
                    <MessageSquare className="size-4" />
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    onClick={() => onDeleteChat(chat.id)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete chat</span>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        {session?.user && <NavUser user={session.user} />}
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

export function ChatSidebar({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  children,
}: ChatSidebarProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <ChatSidebarContent
          chats={chats}
          currentChatId={currentChatId}
          onChatSelect={onChatSelect}
          onNewChat={onNewChat}
          onDeleteChat={onDeleteChat}
        />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
