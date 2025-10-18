import { useFetchSalesByRegion } from '@/libs/mutation/analytics/analytics-mutations'
import { formatCurrency } from '@/libs/utils'
import { Card } from '@heroui/card'
import React, { useMemo } from 'react'
import { MapPin, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'

const SalesByRegion = ({ params }) => {
    const { data: salesByRegion, isLoading } = useFetchSalesByRegion(params)
    const payload = salesByRegion?.data?.items || []

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num)
    }

    const getAverageOrderValue = (revenue, orders) => {
        return orders > 0 ? revenue / orders : 0
    }

    // Calculate totals and insights
    const analytics = useMemo(() => {
        const totalRevenue = payload.reduce((sum, r) => sum + r.revenue, 0)
        const totalOrders = payload.reduce((sum, r) => sum + r.orders, 0)
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
        
        const sortedByRevenue = [...payload].sort((a, b) => b.revenue - a.revenue)
        const topRegion = sortedByRevenue[0]
        
        return { totalRevenue, totalOrders, avgOrderValue, topRegion }
    }, [payload])

    if (isLoading) {
        return (
            <div className="rounded-lg shadow-sm border p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-100 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <Card className="border border-default-100">
            <div className="p-6 border-b border-default-100">
                <h2 className="text-xl font-semibold">
                    Sales by Region
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Revenue and order performance across regions
                </p>
            </div>

            <div className="p-6">
                {payload.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No data available</h3>
                        <p className="text-gray-500 dark:text-gray-400">Sales data will appear here once available</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Top Performing Region Highlight */}
                        {analytics.topRegion && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Top Performing Region</p>
                                        <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                                            {analytics.topRegion.region} - {formatCurrency(analytics.topRegion.revenue)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Regional Breakdown */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Regional Performance</h3>
                            
                            <div className="space-y-3">
                                {payload.map((region, index) => {
                                    const revenuePercentage = analytics.totalRevenue > 0 
                                        ? (region.revenue / analytics.totalRevenue) * 100 
                                        : 0
                                    const avgOrder = getAverageOrderValue(region.revenue, region.orders)

                                    return (
                                        <div 
                                            key={region.region || index}
                                            className="rounded-lg bg-primary/10 border-2 border-primary/20"
                                        >
                                            <div className="p-4">
                                                {/* Region Header */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <MapPin className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-primary">
                                                                {region.region}
                                                            </h4>
                                                            {region.subregion && (
                                                                <p className="text-sm">
                                                                    {region.subregion}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm">Revenue Share</p>
                                                        <p className="text-lg font-bold text-primary">
                                                            {revenuePercentage.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mb-3">
                                                    <div className="w-full bg-default-100 dark:bg-default-400 rounded-full h-2">
                                                        <div 
                                                            className="bg-primary h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${revenuePercentage}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Metrics Grid */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Revenue</p>
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatCurrency(region.revenue)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orders</p>
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatNumber(region.orders)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg. Order</p>
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatCurrency(avgOrder)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Recent Orders */}
                                                {Array.isArray(region.recentOrders) && region.recentOrders.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                                                            Recent Orders ({region.recentOrders.length})
                                                        </p>
                                                        <div className="space-y-1.5">
                                                            {region.recentOrders.slice(0, 3).map((order, idx) => (
                                                                <div 
                                                                    key={idx}
                                                                    className="flex justify-between items-center text-sm"
                                                                >
                                                                    <span className="text-gray-600 dark:text-gray-400 truncate pr-2">
                                                                        {order.orderNumber || order.name || `Order ${order._id || idx + 1}`}
                                                                    </span>
                                                                    <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                                        {formatCurrency(order.total || order.amount || 0)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default SalesByRegion