'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuotesStatusChartProps {
    data: Array<{ status: string; count: number }>;
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviadas',
    accepted: 'Aceptadas',
    rejected: 'Rechazadas',
    expired: 'Expiradas',
};

const STATUS_COLORS: Record<string, string> = {
    draft: 'hsl(var(--muted))',
    sent: 'hsl(var(--primary))',
    accepted: 'hsl(142, 76%, 36%)',
    rejected: 'hsl(0, 84%, 60%)',
    expired: 'hsl(38, 92%, 50%)',
};

export function QuotesStatusChart({ data }: QuotesStatusChartProps) {
    const chartData = data.map((item) => ({
        ...item,
        label: STATUS_LABELS[item.status] || item.status,
        fill: STATUS_COLORS[item.status] || 'hsl(var(--primary))',
    }));

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Cotizaciones por Estado</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                            }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
