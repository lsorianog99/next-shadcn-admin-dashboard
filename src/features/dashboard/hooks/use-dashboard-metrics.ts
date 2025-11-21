"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [conversationStats, quoteStats, conversionRate, chartsData] = await Promise.all([
        getConversationStats(today, yesterday),
        getQuoteStats(today, yesterday),
        getConversionRate(),
        getChartsData(thirtyDaysAgo),
      ]);

      return {
        ...conversationStats,
        ...quoteStats,
        conversionRate,
        ...chartsData,
      };
    },
    refetchInterval: 30000, // Refetch cada 30 segundos
  });
}

async function getConversationStats(today: Date, yesterday: Date) {
  const { count: newConversationsToday } = await supabase
    .from("chats")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  const { count: newConversationsYesterday } = await supabase
    .from("chats")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterday.toISOString())
    .lt("created_at", today.toISOString());

  return {
    newConversationsToday: newConversationsToday ?? 0,
    newConversationsYesterday: newConversationsYesterday ?? 0,
  };
}

async function getQuoteStats(today: Date, yesterday: Date) {
  const [sentStats, acceptedStats] = await Promise.all([
    getQuotesSent(today, yesterday),
    getQuotesAccepted(today, yesterday),
  ]);

  return {
    ...sentStats,
    ...acceptedStats,
  };
}

async function getQuotesSent(today: Date, yesterday: Date) {
  const { count: quotesSentToday } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", today.toISOString());

  const { count: quotesSentYesterday } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", yesterday.toISOString())
    .lt("sent_at", today.toISOString());

  return {
    quotesSentToday: quotesSentToday ?? 0,
    quotesSentYesterday: quotesSentYesterday ?? 0,
  };
}

async function getQuotesAccepted(today: Date, yesterday: Date) {
  const { data: quotesAcceptedTodayData } = await supabase
    .from("quotes")
    .select("total")
    .eq("status", "accepted")
    .gte("accepted_at", today.toISOString());

  const quotesAcceptedToday = quotesAcceptedTodayData?.length ?? 0;
  const totalRevenueToday = quotesAcceptedTodayData?.reduce((sum, q) => sum + (q.total ?? 0), 0) ?? 0;

  const { data: quotesAcceptedYesterdayData } = await supabase
    .from("quotes")
    .select("total")
    .eq("status", "accepted")
    .gte("accepted_at", yesterday.toISOString())
    .lt("accepted_at", today.toISOString());

  const quotesAcceptedYesterday = quotesAcceptedYesterdayData?.length ?? 0;
  const totalRevenueYesterday = quotesAcceptedYesterdayData?.reduce((sum, q) => sum + (q.total ?? 0), 0) ?? 0;

  return {
    quotesAcceptedToday,
    quotesAcceptedYesterday,
    totalRevenueToday,
    totalRevenueYesterday,
  };
}

async function getConversionRate() {
  const { count: totalQuotesSent } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent");

  const { count: totalQuotesAccepted } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted");

  return totalQuotesSent && totalQuotesSent > 0 ? ((totalQuotesAccepted ?? 0) / totalQuotesSent) * 100 : 0;
}

async function getChartsData(thirtyDaysAgo: Date) {
  // Conversaciones por día
  const { data: chatsData } = await supabase
    .from("chats")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const conversationsByDay = groupByDay(chatsData ?? []);

  // Cotizaciones por estado
  const { data: quotesData } = await supabase.from("quotes").select("status");
  const quotesByStatus = countByStatus(quotesData ?? []);

  // Top 5 productos más cotizados
  const { data: quoteItemsData } = await supabase.from("quote_items").select("product_sku, product_name");
  const topQuotedProducts = getTopProducts(quoteItemsData ?? [], 5);

  // Top 5 productos más vendidos
  const { data: soldItemsData } = await supabase
    .from("quote_items")
    .select("product_sku, product_name, quantity, unit_price, quote_id")
    .in("quote_id", (await supabase.from("quotes").select("id").eq("status", "accepted")).data?.map((q) => q.id) ?? []);

  const topSoldProducts = getTopSoldProducts(soldItemsData ?? [], 5);

  return {
    conversationsByDay,
    quotesByStatus,
    topQuotedProducts,
    topSoldProducts,
  };
}

// Helpers para procesar datos

function groupByDay(data: Array<{ created_at: string }>) {
  const grouped: Record<string, number> = {};

  for (const item of data) {
    const date = new Date(item.created_at).toISOString().split("T")[0];
    grouped[date] = (grouped[date] || 0) + 1;
  }

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

function countByStatus(data: Array<{ status: string }>) {
  const counted: Record<string, number> = {};

  for (const item of data) {
    const countedStatus = item.status || "unknown";
    counted[countedStatus] = (counted[countedStatus] || 0) + 1;
  }

  return Object.entries(counted).map(([status, count]) => ({ status, count }));
}

function getTopProducts(data: Array<{ product_sku: string; product_name: string }>, limit: number) {
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
  limit: number,
) {
  const aggregated: Record<string, { name: string; quantity: number; revenue: number }> = {};

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
