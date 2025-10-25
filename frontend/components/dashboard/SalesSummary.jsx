'use client'
import React from 'react'
import { useSalesSummary } from '@/libs/query/dashboard/dashboard-queries'
import { Card, CardBody } from '@heroui/card'
import { TrendingUp, ShoppingCart, DollarSign, IndianRupee } from 'lucide-react'
import { formatCurrency } from '@/libs/utils'

export default function DashboardSalesSummary({ params, options }) {
    const { data, isLoading, error } = useSalesSummary(params, options)
    const summary = data?.data || data || { totalSales: 0, revenue: 0 }



    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num)
    }

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardBody className="p-6">
                    <div className="flex items-center space-x-4 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="w-full border-red-200">
                <CardBody className="p-6">
                    <div className="text-center text-red-500">
                        <div className="text-sm font-medium">Failed to load sales data</div>
                        <div className="text-xs text-red-400 mt-1">Please try again later</div>
                    </div>
                </CardBody>
            </Card>
        )
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Sales Overview</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Orders Card */}
                <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Orders</span>
                                </div>
                                <div className="text-3xl font-bold">
                                    {formatNumber(summary.totalSales)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Orders completed
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Revenue Card */}
                <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <IndianRupee className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue</span>
                                </div>
                                <div className="text-3xl font-bold">
                                    {formatCurrency(summary.revenue)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Gross sales revenue
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Summary Stats */}
            {/* <Card className="">
                <CardBody className="p-4">
                    <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            Average Order Value: <span className="font-semibold text-gray-800 dark:text-white">
                                {formatCurrency(summary.totalSales > 0 ? summary.revenue / summary.totalSales : 0)}
                            </span>
                        </div>
                    </div>
                </CardBody>
            </Card> */}
        </div>
    )
}
