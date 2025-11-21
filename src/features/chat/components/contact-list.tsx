"use client";

import { useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Search, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { ChatWithLastMessage } from "../types";

interface ContactListProps {
  chats: ChatWithLastMessage[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ContactList({ chats, selectedChatId, onSelectChat }: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter(
    (chat) =>
      (chat.contact_name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
      chat.whatsapp_phone.includes(searchQuery),
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="mb-2 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Conversaciones</h3>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder="Buscar contacto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {filteredChats.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    "hover:bg-accent w-full rounded-lg p-3 text-left transition-colors",
                    selectedChatId === chat.id && "bg-accent",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate font-medium">{chat.contact_name ?? chat.whatsapp_phone}</p>
                        <StatusBadge status={chat.status} />
                      </div>
                      {chat.lastMessage && (
                        <p className="text-muted-foreground truncate text-sm">
                          {chat.lastMessage.role === "user" ? "👤 " : "🤖 "}
                          {chat.lastMessage.content.slice(0, 50)}
                          {chat.lastMessage.content.length > 50 ? "..." : ""}
                        </p>
                      )}
                    </div>
                    {chat.last_message_at && (
                      <span className="text-muted-foreground flex-shrink-0 text-xs">
                        {formatDistanceToNow(new Date(chat.last_message_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{chat.whatsapp_phone}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center">
              <p className="text-sm">
                {searchQuery ? "No se encontraron conversaciones" : "No hay conversaciones aún"}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    active: { label: "Activo", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
    archived: { label: "Archivado", className: "bg-gray-500/10 text-gray-700 dark:text-gray-400" },
    closed: { label: "Cerrado", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
  };

  const variant = variants[status] || variants.active;

  return (
    <Badge variant="outline" className={cn("px-1.5 py-0 text-xs", variant.className)}>
      {variant.label}
    </Badge>
  );
}
