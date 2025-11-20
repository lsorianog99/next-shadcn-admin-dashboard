'use client';

import { useChatMessages, useSendMessage } from '../hooks/use-chat';
import { ChatMessage } from './chat-message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatWindowProps {
    chatId: string;
}

export function ChatWindow({ chatId }: ChatWindowProps) {
    const { data: messages, isLoading } = useChatMessages(chatId);
    const sendMessage = useSendMessage();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al final cuando hay mensajes nuevos
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        sendMessage.mutate(
            {
                chatId,
                content: input,
                role: 'user',
            },
            {
                onSuccess: () => {
                    setInput('');
                },
            }
        );
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (isLoading) {
        return <ChatWindowSkeleton />;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b px-6 py-4">
                <h3 className="font-semibold">Chat de WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                    {messages?.length ?? 0} mensajes
                </p>
            </div>

            {/* Mensajes */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-4">
                    {messages && messages.length > 0 ? (
                        messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No hay mensajes en esta conversación</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input de Mensaje */}
            <div className="border-t p-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Escribe un mensaje..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={sendMessage.isPending}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || sendMessage.isPending}
                        size="icon"
                    >
                        {sendMessage.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Presiona Enter para enviar
                </p>
            </div>
        </div>
    );
}

function ChatWindowSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <div className="border-b px-6 py-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex-1 p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
            <div className="border-t p-4">
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}
