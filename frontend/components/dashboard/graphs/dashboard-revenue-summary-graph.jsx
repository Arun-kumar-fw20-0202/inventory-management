"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { Chip } from "@heroui/chip"
import { Divider } from "@heroui/divider"
import { formatCurrency } from "@/libs/utils"

export const description = "A beautiful daily revenue pie chart"

export function DashboardRevenueSummaryGraph({ 
    data = [], 
    title = 'Daily Revenue', 
    descriptionText = 'Revenue breakdown by day' 
}) {
    const id = 'pie-daily-revenue'

    // Enhanced color palette for daily data
    const chartColors = [
        '#6366F1', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6',
        '#EC4899', '#22D3EE', '#F97316', '#14B8A6', '#84CC16', '#F43F5E',
        '#8B5A2B', '#6B7280', '#DC2626', '#059669', '#7C3AED', '#DB2777',
        '#0891B2', '#EA580C', '#65A30D', '#4338CA', '#BE123C', '#0D9488',
        '#7E22CE', '#C2410C', '#166534', '#1E40AF', '#BE185D', '#0F766E'
    ]

    const chartData = React.useMemo(() => {
        return data.map((d, idx) => {
            // Parse the date string "2025-10-22"
            const date = new Date(d._id)
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
            const dayMonth = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            
            return {
                date: d._id,
                day: dayName,
                dayMonth: dayMonth,
                fullLabel: `${dayName}, ${dayMonth}`,
                revenue: Number(d.revenue) || 0,
                fill: chartColors[idx % chartColors.length],
                percentage: 0 // Will be calculated below
            }
        })
    }, [data])

    // Calculate percentages
    const total = React.useMemo(() => 
        chartData.reduce((sum, item) => sum + item.revenue, 0), [chartData]
    )

    const chartDataWithPercentages = React.useMemo(() => 
        chartData.map(item => ({
            ...item,
            percentage: total > 0 ? ((item.revenue / total) * 100).toFixed(1) : 0
        })), [chartData, total]
    )

    const [activeIndex, setActiveIndex] = React.useState(0)

    React.useEffect(() => {
        if (chartDataWithPercentages && chartDataWithPercentages.length) {
            setActiveIndex(0)
        }
    }, [data?.length])

    const activeData = chartDataWithPercentages[activeIndex]

    return (
        <Card className="w-full shadow-lg border border-default-100 bg-gradient-to-br from-background to-default-50">
            <CardHeader className="pb-2">
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center w-full gap-1 justify-between">
                        <h3 className="text-xl font-bold text-foreground">{title}</h3>
                        <Chip 
                            size="sm" 
                            color="primary" 
                            variant="flat"
                            className="font-semibold"
                        >
                            {chartDataWithPercentages.length} Days
                        </Chip>
                    </div>
                    {descriptionText && (
                        <p className="text-sm text-default-600 dark:text-gray-300">{descriptionText}</p>
                    )}
                </div>
            </CardHeader>

            <Divider className="mx-4" />

            <CardBody className="">
                <div className="">
                    {/* Chart Section */}
                    <div className="flex justify-center">
                        <ChartContainer 
                            id={id} 
                            config={{}} 
                            className="aspect-square w-full max-w-[400px]"
                        >
                            {data && data.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-default-600 dark:text-gray-400">No data available</p>
                                </div>
                            ) : (
                                <PieChart>
                                    <ChartTooltip 
                                        cursor={false} 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload[0]) {
                                                const data = payload[0].payload
                                                return (
                                                    <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                                                        <p className="font-semibold text-sm">{data.fullLabel}</p>
                                                        <p className="text-primary font-bold">
                                                            {formatCurrency(data.revenue)}
                                                        </p>
                                                        <p className="text-xs text-default-600">
                                                            {data.percentage}% of total
                                                        </p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Pie
                                        data={chartDataWithPercentages}
                                        dataKey="revenue"
                                        nameKey="fullLabel"
                                        innerRadius={70}
                                        outerRadius={140}
                                        strokeWidth={2}
                                        stroke="hsl(var(--background))"
                                        activeIndex={activeIndex}
                                        onMouseEnter={(_, index) => setActiveIndex(index)}
                                        activeShape={({ outerRadius = 0, ...props }) => (
                                            <g>
                                                <Sector 
                                                    {...props} 
                                                    outerRadius={outerRadius + 8} 
                                                    stroke={props.fill}
                                                    strokeWidth={3}
                                                />
                                            </g>
                                        )}
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && 'cx' in viewBox && 'cy' in viewBox && activeData) {
                                                    return (
                                                        <text 
                                                            x={viewBox.cx} 
                                                            y={viewBox.cy} 
                                                            textAnchor="middle" 
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan 
                                                                x={viewBox.cx} 
                                                                y={viewBox.cy - 10} 
                                                                className="text-2xl font-bold fill-foreground"
                                                            >
                                                                {formatCurrency(activeData.revenue)}
                                                            </tspan>
                                                            <tspan 
                                                                x={viewBox.cx} 
                                                                y={(viewBox.cy || 0) + 15} 
                                                                className="text-sm fill-default-600"
                                                            >
                                                                {activeData.fullLabel}
                                                            </tspan>
                                                            <tspan 
                                                                x={viewBox.cx} 
                                                                y={(viewBox.cy || 0) + 35} 
                                                                className="text-xs fill-primary font-semibold"
                                                            >
                                                                {activeData.percentage}% of total
                                                            </tspan>
                                                        </text>
                                                    )
                                                }
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            )}
                        </ChartContainer>
                    </div>
                    <div className="">
                        <div className="bg-default-100/50 rounded-lg p-4">
                            <h4 className="font-semibold text-sm text-default-700 dark:text-gray-300 mb-2">Total Revenue</h4>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
                            <p className="text-xs text-default-600 mt-1">
                                Across {chartDataWithPercentages.length} days
                            </p>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
