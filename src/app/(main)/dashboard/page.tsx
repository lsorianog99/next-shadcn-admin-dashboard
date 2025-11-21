"use client";

import { MessageSquare, FileText, CheckCircle, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConversationsChart } from "@/features/dashboard/components/conversations-chart";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { ProductsDistributionChart } from "@/features/dashboard/components/products-distribution-chart";
import { QuotesStatusChart } from "@/features/dashboard/components/quotes-status-chart";
import { useDashboardMetrics } from "@/features/dashboard/hooks/use-dashboard-metrics";

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!metrics) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No se pudieron cargar las métricas</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard - WhatsApp CRM</h2>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Conversaciones Nuevas"
          value={metrics.newConversationsToday}
          previousValue={metrics.newConversationsYesterday}
          icon={<MessageSquare className="h-4 w-4" />}
          description="Nuevas conversaciones hoy"
        />
        <MetricCard
          title="Cotizaciones Enviadas"
          value={metrics.quotesSentToday}
          previousValue={metrics.quotesSentYesterday}
          icon={<FileText className="h-4 w-4" />}
          description="Cotizaciones enviadas hoy"
        />
        <MetricCard
          title="Cotizaciones Cerradas"
          value={metrics.quotesAcceptedToday}
          previousValue={metrics.quotesAcceptedYesterday}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Cotizaciones aceptadas hoy"
        />
        <MetricCard
          title="Revenue Hoy"
          value={metrics.totalRevenueToday}
          previousValue={metrics.totalRevenueYesterday}
          icon={<TrendingUp className="h-4 w-4" />}
          format="currency"
          description={`Tasa de conversión: ${metrics.conversionRate.toFixed(1)}%`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-7">
        <ConversationsChart data={metrics.conversationsByDay} />
        <QuotesStatusChart data={metrics.quotesByStatus} />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <ProductsDistributionChart
          data={metrics.topQuotedProducts.map((p) => ({
            name: p.name,
            count: p.count,
          }))}
        />

        {/* Top Productos Vendidos */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top Productos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.topSoldProducts.length > 0 ? (
                  metrics.topSoldProducts.map((product) => (
                    <TableRow key={product.sku}>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("es-MX").format(product.quantity)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        }).format(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      No hay productos vendidos aún
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Top Productos Cotizados */}
      <Card>
        <CardHeader>
          <CardTitle>Top Productos Más Cotizados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posición</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Veces Cotizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.topQuotedProducts.length > 0 ? (
                metrics.topQuotedProducts.map((product, index) => (
                  <TableRow key={product.sku}>
                    <TableCell className="font-semibold">#{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat("es-MX").format(product.count)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No hay productos cotizados aún
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-7">
        <Skeleton className="col-span-4 h-[400px]" />
        <Skeleton className="col-span-3 h-[400px]" />
      </div>
    </div>
  );
}
