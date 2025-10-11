"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
   ChartConfig,
   ChartContainer,
   ChartLegend,
   ChartLegendContent,
   ChartTooltip,
   ChartTooltipContent,
} from "@/components/ui/chart"


export function RevenueTrendsGraph({ chartData = [], chartConfig = {} }) {
   const [timeRange, setTimeRange] = React.useState('90d')

   const filteredData = React.useMemo(() => {
      // chartData expected shape: [{ period: '2025-09-29T00:00:00.000Z', revenue: 1000, orders: 1 }, ...]
      const now = new Date()
      let days = 90
      if (timeRange === '30d') days = 30
      if (timeRange === '7d') days = 7

      const start = new Date(now)
      start.setDate(start.getDate() - days)

      const mapped = (chartData || []).map((item) => {
         const date = item.period ? new Date(item.period) : item.date ? new Date(item.date) : null
         return {
            period: date ? date.toISOString() : null,
            revenue: Number(item.revenue || 0),
            orders: Number(item.orders || 0),
         }
      }).filter(d => d.period && new Date(d.period) >= start)

      // ensure sorted by period asc
      mapped.sort((a, b) => new Date(a.period) - new Date(b.period))
      return mapped
   }, [chartData, timeRange])

   const revenueColor = chartConfig?.revenue?.color || 'var(--color-primary, #6a1a4c)'
   const ordersColor = chartConfig?.orders?.color || 'var(--color-secondary, #1a73e8)'

   return (
      <ChartContainer config={chartConfig} className="aspect-auto h-[230px] w-full">
         {/* <div className="flex items-center justify-end gap-2 mb-2">
            <button className={`text-sm px-2 py-1 rounded ${timeRange==='7d'?'bg-gray-200':''}`} onClick={()=>setTimeRange('7d')}>7d</button>
            <button className={`text-sm px-2 py-1 rounded ${timeRange==='30d'?'bg-gray-200':''}`} onClick={()=>setTimeRange('30d')}>30d</button>
            <button className={`text-sm px-2 py-1 rounded ${timeRange==='90d'?'bg-gray-200':''}`} onClick={()=>setTimeRange('90d')}>90d</button>
         </div> */}
         <AreaChart data={filteredData}>
            <defs>
               <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={revenueColor} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={revenueColor} stopOpacity={0.08} />
               </linearGradient>
                <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ordersColor} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={ordersColor} stopOpacity={0.08} />
                </linearGradient>
            </defs>
            {/* <CartesianGrid vertical={false} horizontal={true} color strokeDasharray="0 0" /> */}
            <XAxis
                dataKey="period"
                tickLine={true}
                axisLine={true}
                tickMargin={8}
                minTickGap={20}
                tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
            />
            <YAxis hide />
            <ChartTooltip
                cursor={{ stroke: '#e6e6e6', strokeWidth: 1 }}
                content={<ChartTooltipContent labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} indicator="dot" />}
            />
            <Area name={chartConfig?.revenue?.label || 'Revenue'} dot dataKey="revenue" type="monotone" stroke={revenueColor} fill="url(#fillRevenue)" strokeWidth={2} />
            <Area name={chartConfig?.orders?.label || 'Orders'} dot dataKey="orders" type="monotone" stroke={ordersColor} fill="url(#fillOrders)" strokeWidth={2} />
            <ChartLegend content={<ChartLegendContent />} />
         </AreaChart>
      </ChartContainer>
   )
}