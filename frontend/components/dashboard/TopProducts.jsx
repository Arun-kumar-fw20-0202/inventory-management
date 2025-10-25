'use client'
import React from 'react'
import { useTopProducts } from '@/libs/query/dashboard/dashboard-queries'
import { TrendingUp, Package, DollarSign, Hash, IndianRupee } from 'lucide-react'
import { formatCurrency } from '@/libs/utils'
import { Card } from '@heroui/card'

export default function DashboardTopProducts({ params , options }) {
    const { data, isLoading, error } = useTopProducts(params, options)
    const payload = data?.data ?? data ?? []

    if (isLoading) {
        return (
            <div className="rounded-xl shadow-sm border border-default-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-default-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-default-600" />
                    </div>
                    <h3 className="text-xl font-bold">Top Products</h3>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                </div>
                                <div className="text-right">
                                    <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl shadow-sm border border-red-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Top Products</h3>
                </div>
                <div className="text-center py-8">
                    <div className="text-red-500 text-sm font-medium">Error loading top products</div>
                    <div className="text-gray-400 text-xs mt-1">Please try again later</div>
                </div>
            </div>
        )
    }

    if (!payload || payload.length === 0) {
        return (
            <Card className=" rounded-xl shadow-sm border border-default-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold">Top Products</h3>
                </div>
                <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-gray-500 dark:text-gray-300 font-medium">No products found</div>
                    <div className="text-gray-400 text-sm mt-1">Start selling to see your top products here</div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="rounded-xl shadow-sm border border-default-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Top Products</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Best performing products by sales</p>
                </div>
            </div>

            <div className="space-y-4">
                {payload.map((product, index) => {
                    const rank = index + 1
                    const isTopRank = rank <= 3
                    
                    return (
                        <div
                            key={product._id || product.id}
                            className={`relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                                isTopRank
                                    ? 'bg-warning/10 border-warning-200 hover:from-warning-100 hover:to-orange-100'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {/* Rank Badge */}
                            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                rank === 1 ? 'bg-warning-500 text-white' :
                                rank === 2 ? 'bg-gray-400 text-white' :
                                rank === 3 ? 'bg-orange-500 text-white' :
                                'bg-gray-300 text-gray-700'
                            }`}>
                                {rank}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold truncate">
                                            {product.productName || product.name || product.product}
                                        </h4>
                                        {isTopRank && (
                                            <span className="px-2 py-1 bg-warning-100 text-warning-800 text-xs font-medium rounded-full">
                                                Top {rank}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {product.sku && (
                                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-300 text-sm">
                                            <Hash className="w-3 h-3" />
                                            <span>{product.sku}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-right space-y-1">
                                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                                        {/* <IndianRupee className="w-4 h-4" /> */}
                                        <span>{formatCurrency(product.revenue || 0)}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 text-sm">
                                        <Package className="w-3 h-3" />
                                        <span>{product.soldQty || product.soldQuantity || product.qty || 0} sold</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {payload[0] && (
                                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${
                                            isTopRank ? 'bg-gradient-to-r from-warning-400 to-orange-500' : 'bg-gray-400'
                                        }`}
                                        style={{
                                            width: `${Math.min((product.soldQty / payload[0].soldQty) * 100, 100)}%`
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {payload.length > 5 && (
                <div className="mt-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                        View All Products →
                    </button>
                </div>
            )}
        </Card>
    )
}
