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
   const revenueColor = chartConfig?.revenue?.color || 'var(--color-primary, #6a1a4c)'
   const ordersColor = chartConfig?.orders?.color || 'var(--color-secondary, #1a73e8)'

   return (
      <ChartContainer config={chartConfig} className="aspect-auto h-[230px] w-full">
         <AreaChart data={chartData}>
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