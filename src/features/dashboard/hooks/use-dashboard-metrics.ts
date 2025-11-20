'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

const supabase = createClient();

type Quote = Database['public']['Tables']['quotes']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type QuoteItem = Database['public']['Tables']['quote_items']['Row'];

export interface DashboardMetrics {
    newConversationsToday: number;
    newConversationsYesterday: number;
    quotesSentToday: number;
    quotesSentYesterday: number;
    quotesAcceptedToday: number;
    quotesAcceptedYesterday: number;
    totalRevenueToday: number;
    totalRevenueYesterday: number;
    conversionRate: number;
    conversationsByDay: Array<{ date: string; count: number }>;
    quotesByStatus: Array<{ status: string; count: number }>;
    topQuotedProducts: Array<{ sku: string; name: string; count: number }>;
    topSoldProducts: Array<{
        sku: string;
        name: string;
        quantity: number;
        revenue: number;
    }>;
}

/**
 * Hook para obtener todas las métricas del dashboard
 * Actualiza cada 30 segundos para mantener datos frescos
 */
export function useDashboardMetrics() {
    return useQuery<DashboardMetrics>({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Conversaciones nuevas hoy
            const { count: newConversationsToday } = await supabase
                .from('chats')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            // Conversaciones nuevas ayer
            const { count: newConversationsYesterday } = await supabase
                .from('chats')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', yesterday.toISOString())
                .lt('created_at', today.toISOString());

            // Cotizaciones enviadas hoy
            const { count: quotesSentToday } = await supabase
                .from('quotes')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'sent')
                .gte('sent_at', today.toISOString());

            // Cotizaciones enviadas ayer
            const { count: quotesSentYesterday } = await supabase
                .from('quotes')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'sent')
                .gte('sent_at', yesterday.toISOString())
                .lt('sent_at', today.toISOString());

            // Cotizaciones aceptadas hoy
            const { data: quotesAcceptedTodayData } = await supabase
                .from('quotes')
                .select('total')
                .eq('status', 'accepted')
                .gte('accepted_at', today.toISOString());

            const quotesAcceptedToday = quotesAcceptedTodayData?.length || 0;
            const totalRevenueToday =
                quotesAcceptedTodayData?.reduce((sum, q) => sum + (q.total || 0), 0) ||
                0;

            // Cotizaciones aceptadas ayer
            const { data: quotesAcceptedYesterdayData } = await supabase
                .from('quotes')
                .select('total')
                .eq('status', 'accepted')
                .gte('accepted_at', yesterday.toISOString())
                .lt('accepted_at', today.toISOString());

            const quotesAcceptedYesterday = quotesAcceptedYesterdayData?.length || 0;
            const totalRevenueYesterday =
                quotesAcceptedYesterdayData?.reduce(
                    (sum, q) => sum + (q.total || 0),
                    0
                ) || 0;

            // Tasa de conversión
            const { count: totalQuotesSent } = await supabase
                .from('quotes')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'sent');

            const { count: totalQuotesAccepted } = await supabase
                .from('quotes')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'accepted');

            const conversionRate =
                totalQuotesSent && totalQuotesSent > 0
                    ? ((totalQuotesAccepted || 0) / totalQuotesSent) * 100
                    : 0;

            // Conversaciones por día (últimos 30 días)
            const { data: chatsData } = await supabase
                .from('chats')
                .select('created_at')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            const conversationsByDay = groupByDay(chatsData || []);

            // Cotizaciones por estado
            const { data: quotesData } = await supabase
                .from('quotes')
                .select('status');

            const quotesByStatus = countByStatus(quotesData || []);

            // Top 5 productos más cotizados
            const { data: quoteItemsData } = await supabase
                .from('quote_items')
                .select('product_sku, product_name');

            const topQuotedProducts = getTopProducts(quoteItemsData || [], 5);

            // Top 5 productos más vendidos
            const { data: soldItemsData } = await supabase
                .from('quote_items')
                .select('product_sku, product_name, quantity, unit_price, quote_id')
                .in(
                    'quote_id',
                    (
                        await supabase
                            .from('quotes')
                            .select('id')
                            .eq('status', 'accepted')
                    ).data?.map((q) => q.id) || []
                );

            const topSoldProducts = getTopSoldProducts(soldItemsData || [], 5);

            return {
                newConversationsToday: newConversationsToday || 0,
                newConversationsYesterday: newConversationsYesterday || 0,
                quotesSentToday: quotesSentToday || 0,
                quotesSentYesterday: quotesSentYesterday || 0,
                quotesAcceptedToday,
                quotesAcceptedYesterday,
                totalRevenueToday,
                totalRevenueYesterday,
                conversionRate,
                conversationsByDay,
                quotesByStatus,
                topQuotedProducts,
                topSoldProducts,
            };
        },
        refetchInterval: 30000, // Refetch cada 30 segundos
    });
}

// Helpers para procesar datos

function groupByDay(data: Array<{ created_at: string }>) {
    const grouped: Record<string, number> = {};

    for (const item of data) {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        grouped[date] = (grouped[date] || 0) + 1;
    }

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

function countByStatus(data: Array<{ status: string }>) {
    const counted: Record<string, number> = {};

    for (const item of data) {
        counted[item.status] = (counted[item.status] || 0) + 1;
    }

    return Object.entries(counted).map(([status, count]) => ({ status, count }));
}

function getTopProducts(
    data: Array<{ product_sku: string; product_name: string }>,
    limit: number
) {
    const counted: Record<string, { name: string; count: number }> = {};

    for (const item of data) {
        if (!counted[item.product_sku]) {
            counted[item.product_sku] = { name: item.product_name, count: 0 };
        }
        counted[item.product_sku].count++;
    }

    return Object.entries(counted)
        .map(([sku, { name, count }]) => ({ sku, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function getTopSoldProducts(
    data: Array<{
        product_sku: string;
        product_name: string;
        quantity: number;
        unit_price: number;
    }>,
    limit: number
) {
    const aggregated: Record<
        string,
        { name: string; quantity: number; revenue: number }
    > = {};

    for (const item of data) {
        if (!aggregated[item.product_sku]) {
            aggregated[item.product_sku] = {
                name: item.product_name,
                quantity: 0,
                revenue: 0,
            };
        }
        aggregated[item.product_sku].quantity += item.quantity;
        aggregated[item.product_sku].revenue += item.quantity * item.unit_price;
    }

    return Object.entries(aggregated)
        .map(([sku, { name, quantity, revenue }]) => ({
            sku,
            name,
            quantity,
            revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
}
