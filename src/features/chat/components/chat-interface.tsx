"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useChats } from "../hooks/use-chat";

import { ChatWindow } from "./chat-window";
import { ContactList } from "./contact-list";

export function ChatInterface() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { data: chats, isLoading } = useChats();

  if (isLoading) {
    return <ChatInterfaceSkeleton />;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar - Lista de Contactos */}
      <div className="w-80 flex-shrink-0">
        <ContactList chats={chats ?? []} selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
      </div>

      {/* Área Principal - Chat */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {selectedChatId ? (
          <ChatWindow chatId={selectedChatId} />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <div className="space-y-2 text-center">
              <p className="text-lg font-medium">Selecciona una conversación</p>
              <p className="text-sm">Elige un contacto de la lista para ver el chat</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ChatInterfaceSkeleton() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Skeleton className="w-80 flex-shrink-0" />
      <Skeleton className="flex-1" />
    </div>
  );
}
