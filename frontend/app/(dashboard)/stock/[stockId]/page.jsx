'use client'
import { useFetchStockById } from '@/libs/query/stock/stock-query'
import { formatCurrency } from '@/libs/utils'
import ContentProvider from '@/providers/content-provider'
import { Card } from '@heroui/card'
import { IndianRupee } from 'lucide-react'
import React from 'react'

const Index = (stockId) => {
    const id = stockId?.params?.stockId
    const {data: stockData, isLoading, error} = useFetchStockById({id, includeAnalytics: true, includeHistory: true})
    
    if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>
    if (error) return <div className="text-red-500 text-center">Error loading stock data</div>
    
    const stock = stockData?.data
    if (!stock) return <div className="text-center">No stock data found</div>

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
    })

    const getStatusColor = (status) => {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'inactive': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStockStatusColor = (status) => {
        switch(status) {
            case 'In Stock': return 'bg-green-100 text-green-800'
            case 'Low Stock': return 'bg-yellow-100 text-yellow-800'
            case 'Out of Stock': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <ContentProvider title={`Stock Details - ${stock?.productName || 'Item'}`} description={`Detailed view of stock item: ${stock?.productName || ''}`}>
            <div className="max-w-7xl w-full mx-auto p-6 space-y-6">
                {/* Header */}
                <Card className=" rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{stock?.productName}</h1>
                            <p className="text-gray-600 mb-4 dark:text-gray-400">{stock?.description}</p>
                            <div className="flex gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(stock?.status)}`}>
                                    {stock?.status}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStockStatusColor(stock?.stockStatus)}`}>
                                    {stock?.stockStatus}
                                </span>
                                {stock?.isLowStock && (
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                        Low Stock Alert
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">SKU</p>
                            <p className="text-lg font-semibold">{stock?.sku}</p>
                        </div>
                    </div>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">Current Stock</p>
                                <p className="text-2xl font-bold text-blue-600">{stock?.quantity} {stock?.unit}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className=" rounded-lg p-6 ">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium">Total Value</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(stock?.totalValue, 'INR')}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <IndianRupee 
                                    className="w-6 h-6 text-green-600"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className=" rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium">Profit Margin</p>
                                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stock?.profitMargin, 'INR')}</p>
                                <p className="text-sm text-purple-600">({stock?.profitPercentage}%)</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className=" rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium">Low Stock Alert</p>
                                <p className="text-2xl font-bold text-orange-600">{stock?.lowStockThreshold} {stock?.unit}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Detailed Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Details */}
                    <Card className="rounded-lg p-5 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Product Details</h2>
                        </div>
                        <div className=" space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Purchase Price</p>
                                    <p className="font-semibold">{formatCurrency(stock?.purchasePrice, 'INR')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Selling Price</p>
                                    <p className="font-semibold">{formatCurrency(stock?.sellingPrice, 'INR')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Total Cost</p>
                                    <p className="font-semibold">{formatCurrency(stock?.totalCost, 'INR')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Unit</p>
                                    <p className="font-semibold">{stock?.unit}</p>
                                </div>
                            </div>
                            {/* <div>
                                <p className="text-sm text-gray-500">Organization No</p>
                                <p className="font-semibold">{stock?.orgNo}</p>
                            </div> */}
                        </div>
                    </Card>

                    {/* Category Analytics */}
                    <Card className="rounded-lg shadow-sm p-5">
                        <div className="mb-5 ">
                            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Category Analytics</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
                                    <p className="font-semibold">{stock?.categoryAnalytics?.totalItems || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</p>
                                    <p className="font-semibold">{stock?.categoryAnalytics?.totalQuantity || 0}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Average Price</p>
                                    <p className="font-semibold">{formatCurrency(stock?.categoryAnalytics?.avgPrice)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Category Value</p>
                                    <p className="font-semibold">{formatCurrency(stock?.categoryAnalytics?.totalValue,'INR')}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* User Information */}
                <Card className=" rounded-lg shadow-sm p-5">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Management Information</h2>
                    </div>
                    <div className="">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-3">Created By</h3>
                                <div className="space-y-1">
                                    <p className="font-medium">{stock?.createdBy?.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{stock?.createdBy?.email}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Role: {stock?.createdBy?.role?.join(', ')}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Date: {formatDate(stock?.createdAt)}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-3">Last Updated By</h3>
                                <div className="space-y-1">
                                    <p className="font-medium">{stock?.updatedBy?.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{stock?.updatedBy?.email}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Role: {stock?.updatedBy?.role?.join(', ')}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Date: {formatDate(stock?.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </ContentProvider>
    )
}

export default Index