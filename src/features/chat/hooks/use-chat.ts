'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Chat, Message, ChatWithLastMessage } from '../types';
import { useEffect } from 'react';

const supabase = createClient();

/**
 * Hook para obtener todas las conversaciones
 */
export function useChats() {
    return useQuery({
        queryKey: ['chats'],
        queryFn: async (): Promise<ChatWithLastMessage[]> => {
            const { data: chats, error } = await supabase
                .from('chats')
                .select('*')
                .order('last_message_at', { ascending: false, nullsFirst: false });

            if (error) throw error;

            // Obtener el último mensaje de cada chat
            const chatsWithMessages = await Promise.all(
                (chats || []).map(async (chat) => {
                    const { data: messages } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('chat_id', chat.id)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    return {
                        ...chat,
                        lastMessage: messages?.[0],
                    };
                })
            );

            return chatsWithMessages;
        },
    });
}

/**
 * Hook para obtener los mensajes de un chat específico
 */
export function useChatMessages(chatId: string | null) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['messages', chatId],
        queryFn: async (): Promise<Message[]> => {
            if (!chatId) return [];

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        },
        enabled: !!chatId,
    });

    // Suscripción a mensajes nuevos en tiempo real
    useEffect(() => {
        if (!chatId) return;

        const channel = supabase
            .channel(`messages:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    queryClient.setQueryData<Message[]>(
                        ['messages', chatId],
                        (old = []) => [...old, payload.new as Message]
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, queryClient]);

    return query;
}

/**
 * Hook para enviar un mensaje
 */
export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            chatId,
            content,
            role,
            messageType = 'text',
        }: {
            chatId: string;
            content: string;
            role: 'user' | 'assistant' | 'system';
            messageType?: string;
        }) => {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    content,
                    role,
                    message_type: messageType,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
    });
}

/**
 * Hook para crear un nuevo chat
 */
export function useCreateChat() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            whatsappPhone,
            contactName,
            agentId,
        }: {
            whatsappPhone: string;
            contactName?: string;
            agentId?: string;
        }) => {
            const { data, error } = await supabase
                .from('chats')
                .insert({
                    whatsapp_phone: whatsappPhone,
                    contact_name: contactName,
                    agent_id: agentId,
                    status: 'active',
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
    });
}

/**
 * Hook para actualizar el estado de un chat
 */
export function useUpdateChatStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            chatId,
            status,
        }: {
            chatId: string;
            status: 'active' | 'archived' | 'closed';
        }) => {
            const { data, error } = await supabase
                .from('chats')
                .update({ status })
                .eq('id', chatId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
    });
}
