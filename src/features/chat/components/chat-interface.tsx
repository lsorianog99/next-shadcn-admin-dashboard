'use client';

import { useState } from 'react';
import { useChats } from '../hooks/use-chat';
import { ContactList } from './contact-list';
import { ChatWindow } from './chat-window';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
                <ContactList
                    chats={chats ?? []}
                    selectedChatId={selectedChatId}
                    onSelectChat={setSelectedChatId}
                />
            </div>

            {/* Área Principal - Chat */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {selectedChatId ? (
                    <ChatWindow chatId={selectedChatId} />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium">
                                Selecciona una conversación
                            </p>
                            <p className="text-sm">
                                Elige un contacto de la lista para ver el chat
                            </p>
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
