'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Message } from '../types';
import { Bot, User, FileText, Package } from 'lucide-react';

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center">
                <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {message.content}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                </div>
            )}

            <div className={cn('flex flex-col gap-1', isUser && 'items-end')}>
                <Card
                    className={cn(
                        'px-4 py-2 max-w-[500px]',
                        isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                    )}
                >
                    <MessageContent message={message} />
                </Card>

                <span className="text-xs text-muted-foreground px-1">
                    {format(new Date(message.created_at), "HH:mm 'h'", { locale: es })}
                </span>
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                </div>
            )}
        </div>
    );
}

function MessageContent({ message }: { message: Message }) {
    switch (message.message_type) {
        case 'quote':
            return <QuoteMessage message={message} />;
        case 'product':
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
                <span className="font-semibold text-sm">Cotización</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            {message.metadata && typeof message.metadata === 'object' && 'quote_id' in message.metadata && (
                <div className="text-xs opacity-80 mt-2">
                    ID: {String(message.metadata.quote_id)}
                </div>
            )}
        </div>
    );
}

function ProductMessage({ message }: { message: Message }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="font-semibold text-sm">Producto</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
    );
}
