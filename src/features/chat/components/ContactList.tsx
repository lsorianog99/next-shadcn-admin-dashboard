'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ChatWithLastMessage } from '../types';
import { cn } from '@/lib/utils';

interface ContactListProps {
    chats: ChatWithLastMessage[];
    selectedChatId: string | null;
    onSelectChat: (chatId: string) => void;
}

export function ContactList({
    chats,
    selectedChatId,
    onSelectChat,
}: ContactListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = chats.filter(
        (chat) =>
            (chat.contact_name?.toLowerCase() || '').includes(
                searchQuery.toLowerCase()
            ) ||
            chat.whatsapp_phone.includes(searchQuery)
    );

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="font-semibold">Conversaciones</h3>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar contacto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                    {filteredChats.length > 0 ? (
                        <div className="space-y-1 p-2">
                            {filteredChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => onSelectChat(chat.id)}
                                    className={cn(
                                        'w-full text-left p-3 rounded-lg transition-colors hover:bg-accent',
                                        selectedChatId === chat.id && 'bg-accent'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium truncate">
                                                    {chat.contact_name || chat.whatsapp_phone}
                                                </p>
                                                <StatusBadge status={chat.status} />
                                            </div>
                                            {chat.lastMessage && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {chat.lastMessage.role === 'user' ? '👤 ' : '🤖 '}
                                                    {chat.lastMessage.content.slice(0, 50)}
                                                    {chat.lastMessage.content.length > 50 ? '...' : ''}
                                                </p>
                                            )}
                                        </div>
                                        {chat.last_message_at && (
                                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                                {formatDistanceToNow(new Date(chat.last_message_at), {
                                                    addSuffix: true,
                                                    locale: es,
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {chat.whatsapp_phone}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                            <p className="text-sm">
                                {searchQuery
                                    ? 'No se encontraron conversaciones'
                                    : 'No hay conversaciones aún'}
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
        active: { label: 'Activo', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
        archived: { label: 'Archivado', className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
        closed: { label: 'Cerrado', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
    };

    const variant = variants[status] || variants.active;

    return (
        <Badge variant="outline" className={cn('text-xs px-1.5 py-0', variant.className)}>
            {variant.label}
        </Badge>
    );
}
