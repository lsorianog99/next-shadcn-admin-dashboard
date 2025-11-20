'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string | number;
    previousValue?: number;
    icon?: React.ReactNode;
    description?: string;
    format?: 'number' | 'currency' | 'percentage';
}

export function MetricCard({
    title,
    value,
    previousValue,
    icon,
    description,
    format = 'number',
}: MetricCardProps) {
    const formattedValue = formatValue(value, format);
    const trend = previousValue !== undefined ? getTrend(value, previousValue) : null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{formattedValue}</div>
                {trend && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <TrendIcon trend={trend.direction} />
                        <span className={cn(getTrendColor(trend.direction))}>
                            {trend.percentage}%
                        </span>
                        <span>vs ayer</span>
                    </div>
                )}
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

function formatValue(
    value: string | number,
    format: 'number' | 'currency' | 'percentage'
): string {
    if (typeof value === 'string') return value;

    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
            }).format(value);
        case 'percentage':
            return `${value.toFixed(1)}%`;
        default:
            return new Intl.NumberFormat('es-MX').format(value);
    }
}

function getTrend(
    current: string | number,
    previous: number
): { direction: 'up' | 'down' | 'neutral'; percentage: string | number } {
    const currentNum = typeof current === 'string' ? parseFloat(current) : current;

    if (previous === 0) {
        return {
            direction: currentNum > 0 ? 'up' : 'neutral',
            percentage: currentNum > 0 ? 100 : 0,
        } as const;
    }

    const diff = currentNum - previous;
    const percentage = Math.abs((diff / previous) * 100);

    return {
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
        percentage: percentage.toFixed(1),
    } as const;
}

function getTrendColor(direction: 'up' | 'down' | 'neutral'): string {
    switch (direction) {
        case 'up':
            return 'text-green-600 dark:text-green-400';
        case 'down':
            return 'text-red-600 dark:text-red-400';
        default:
            return 'text-gray-600 dark:text-gray-400';
    }
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
    const className = 'h-4 w-4';

    switch (trend) {
        case 'up':
            return <ArrowUp className={cn(className, 'text-green-600 dark:text-green-400')} />;
        case 'down':
            return <ArrowDown className={cn(className, 'text-red-600 dark:text-red-400')} />;
        default:
            return <Minus className={cn(className, 'text-gray-600 dark:text-gray-400')} />;
    }
}
