"use client";

import { ChatInterface } from "@/features/chat/components/chat-interface";

export default function ChatPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Chat de WhatsApp</h2>
      </div>
      <ChatInterface />
    </div>
  );
}
