/**
 * Tipos compartidos para el feature de Chat
 */

import type { Database } from "@/types/database.types";

export type Chat = Database["public"]["Tables"]["chats"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

export interface ChatWithLastMessage extends Chat {
  lastMessage?: Message;
  unreadCount?: number;
}

export interface MessageWithSender extends Message {
  senderName?: string;
}

export type ChatStatus = "active" | "archived" | "closed";
export type MessageRole = "user" | "assistant" | "system";
export type MessageType = "text" | "image" | "audio" | "quote" | "product";
