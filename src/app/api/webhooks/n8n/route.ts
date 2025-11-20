import { NextRequest, NextResponse } from 'next/server';
import { syncMessageFromN8N, createQuoteFromN8N, logWebhook } from '@/actions/n8n';

/**
 * API Route para recibir webhooks de n8n
 * POST /api/webhooks/n8n
 */
export async function POST(request: NextRequest) {
    try {
        // Verificar el secret del webhook
        const webhookSecret = request.headers.get('x-webhook-secret');

        if (process.env.N8N_WEBHOOK_SECRET && webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const payload = await request.json();
        const { event_type, data } = payload;

        // Procesar según el tipo de evento
        switch (event_type) {
            case 'message_response':
                // Mensaje de respuesta del agente IA
                await syncMessageFromN8N({
                    chatId: data.chat_id,
                    content: data.message,
                    role: 'assistant',
                    messageType: data.message_type ?? 'text',
                    metadata: data.metadata,
                });
                break;

            case 'quote_generated':
                // Cotización generada por el agente IA
                await createQuoteFromN8N({
                    chatId: data.chat_id,
                    products: data.products,
                    notes: data.notes,
                });
                break;

            case 'user_message':
                // Mensaje de usuario nuevo (para sincronización)
                await syncMessageFromN8N({
                    chatId: data.chat_id,
                    content: data.message,
                    role: 'user',
                    metadata: data.metadata,
                });
                break;

            default:
                console.warn(`Unknown event type: ${event_type}`);
                await logWebhook({
                    event_type: 'unknown_event',
                    payload,
                    status: 'error',
                    error_message: `Unknown event type: ${event_type}`,
                });
        }

        // Log exitoso
        await logWebhook({
            event_type,
            payload,
            status: 'success',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing n8n webhook:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Método GET para verificar que el endpoint está activo
export async function GET() {
    return NextResponse.json({
        status: 'active',
        message: 'N8N Webhook endpoint is ready',
    });
}
