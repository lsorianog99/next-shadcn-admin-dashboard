'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Server Actions para integración con n8n
 */

interface N8NWebhookPayload {
    event_type: string;
    data: unknown;
}

/**
 * Envía un mensaje a n8n para procesamiento por el agente IA
 */
export async function sendMessageToN8N(params: {
    chatId: string;
    phone: string;
    message: string;
}) {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

        if (!webhookUrl) {
            throw new Error('N8N_WEBHOOK_URL no está configurado');
        }

        const payload = {
            event_type: 'message_received',
            chat_id: params.chatId,
            phone: params.phone,
            message: params.message,
            timestamp: new Date().toISOString(),
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(webhookSecret && { 'X-Webhook-Secret': webhookSecret }),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`N8N webhook failed: ${response.statusText}`);
        }

        // Log del webhook
        await logWebhook({
            event_type: 'message_sent_to_n8n',
            payload,
            status: 'success',
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending message to n8n:', error);

        await logWebhook({
            event_type: 'message_sent_to_n8n',
            payload: params,
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Sincroniza un mensaje recibido desde n8n a la base de datos
 */
export async function syncMessageFromN8N(params: {
    chatId: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    messageType?: string;
    metadata?: Record<string, unknown>;
}) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('messages')
            .insert({
                chat_id: params.chatId,
                content: params.content,
                role: params.role,
                message_type: params.messageType || 'text',
                metadata: params.metadata || {},
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, message: data };
    } catch (error) {
        console.error('Error syncing message from n8n:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Registra eventos de webhooks para debugging
 */
export async function logWebhook(params: {
    event_type: string;
    payload: unknown;
    status: 'success' | 'error';
    error_message?: string;
}) {
    try {
        const supabase = await createClient();

        await supabase.from('webhooks_log').insert({
            event_type: params.event_type,
            payload: params.payload as never,
            status: params.status,
            error_message: params.error_message || null,
        });

        return { success: true };
    } catch (error) {
        console.error('Error logging webhook:', error);
        return { success: false };
    }
}

/**
 * Crea una cotización desde n8n
 */
export async function createQuoteFromN8N(params: {
    chatId: string;
    products: Array<{
        sku: string;
        name: string;
        quantity: number;
        unit_price: number;
        unit_cost: number;
    }>;
    notes?: string;
}) {
    try {
        const supabase = await createClient();

        // Calcular totales
        const subtotal = params.products.reduce(
            (sum, p) => sum + p.quantity * p.unit_price,
            0
        );
        const tax = subtotal * 0.16; // IVA 16%
        const total = subtotal + tax;

        // Crear la cotización
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
                chat_id: params.chatId,
                subtotal,
                tax,
                total,
                status: 'draft',
                notes: params.notes,
            })
            .select()
            .single();

        if (quoteError) throw quoteError;

        // Crear los items de la cotización
        const items = params.products.map((product) => ({
            quote_id: quote.id,
            product_sku: product.sku,
            product_name: product.name,
            quantity: product.quantity,
            unit_price: product.unit_price,
            unit_cost: product.unit_cost,
            subtotal: product.quantity * product.unit_price,
        }));

        const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(items);

        if (itemsError) throw itemsError;

        // Log del evento
        await logWebhook({
            event_type: 'quote_created',
            payload: { quoteId: quote.id, chatId: params.chatId },
            status: 'success',
        });

        return { success: true, quote };
    } catch (error) {
        console.error('Error creating quote from n8n:', error);

        await logWebhook({
            event_type: 'quote_created',
            payload: params,
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Obtiene el catálogo de productos para el agente IA
 */
export async function getProductsCatalog(filters?: {
    category?: string;
    searchTerm?: string;
    limit?: number;
}) {
    try {
        const supabase = await createClient();

        let query = supabase
            .from('products')
            .select('*')
            .eq('is_active', true);

        if (filters?.category) {
            query = query.eq('category', filters.category);
        }

        if (filters?.searchTerm) {
            query = query.or(
                `name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
            );
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, products: data };
    } catch (error) {
        console.error('Error getting products catalog:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            products: [],
        };
    }
}
