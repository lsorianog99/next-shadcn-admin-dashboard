"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bot, User, FileText, Package } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Message } from "../types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">{message.content}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
          <Bot className="text-primary h-4 w-4" />
        </div>
      )}

      <div className={cn("flex flex-col gap-1", isUser && "items-end")}>
        <Card
          className={cn(
            "max-w-[500px] px-4 py-2",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          <MessageContent message={message} />
        </Card>

        <span className="text-muted-foreground px-1 text-xs">
          {format(new Date(message.created_at), "HH:mm 'h'", { locale: es })}
        </span>
      </div>

      {isUser && (
        <div className="bg-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
          <User className="text-primary-foreground h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function MessageContent({ message }: { message: Message }) {
  switch (message.message_type) {
    case "quote":
      return <QuoteMessage message={message} />;
    case "product":
      return <ProductMessage message={message} />;
    default:
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  }
}

function QuoteMessage({ message }: { message: Message }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span className="text-sm font-semibold">Cotización</span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      {message.metadata && typeof message.metadata === "object" && "quote_id" in message.metadata && (
        <div className="mt-2 text-xs opacity-80">ID: {String(message.metadata.quote_id)}</div>
      )}
    </div>
  );
}

function ProductMessage({ message }: { message: Message }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <span className="text-sm font-semibold">Producto</span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
    </div>
  );
}
