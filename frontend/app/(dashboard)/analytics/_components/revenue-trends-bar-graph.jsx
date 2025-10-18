"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export function RevenueTrendsBarGraph({ chartData, chartConfig }) {
    
   const revenueColor = chartConfig?.revenue?.color || 'var(--color-primary, #6a1a4c)'
   const ordersColor = chartConfig?.orders?.color || 'var(--color-secondary, #1a73e8)'
    
    return (
        <ChartContainer config={chartConfig} className="aspect-auto h-[230px] w-full">
            <BarChart data={chartData} margin={{ top: 30, bottom: 30 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--foreground)", fontSize: 12 }}
                    tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
                />
                <ChartTooltip 
                    cursor={false} 
                    content={<ChartTooltipContent labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} indicator="dot" />} 
                />
                <Bar dataKey="revenue" fill={revenueColor} radius={4} />
                <Bar dataKey="orders" fill={ordersColor} radius={4} />
                <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
        </ChartContainer>
    )
}