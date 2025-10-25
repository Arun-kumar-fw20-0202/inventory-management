'use client'
import React from 'react'
import { useFetchStockById } from '@/libs/query/stock/stock-query';
import { formatCurrency } from '@/libs/utils';
import { Card } from '@heroui/card';
import { useDisclosure } from '@heroui/modal'
import { Button } from '@heroui/button';
import { AttachmentModal } from './_components/add-attachment-modal';

const Index = (params) => {
    const stockId = params?.params.stockId;
    const { isOpen , onOpen, onOpenChange } = useDisclosure();
    const { data: stockData, isLoading: getting} = useFetchStockById({id: stockId, includeAnalytics: false, includeHistory: false});
    
    if (getting) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    if (!stockData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📦</div>
                    <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">No product found</h2>
                </div>
            </div>
        );
    }
    
    const InfoItem = ({ label, children, className = "" }) => (
        <div className={` rounded-lg p-4 ${className}`}>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">{label}</dt>
            <dd className="text-lg font-semibold">{children}</dd>
        </div>
    );
    
    return (
        <>
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold">Product Details</h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">Comprehensive overview of stock item #{stockData?.data?.sku}</p>
                    </div>

                    {/* Product Details Card */}
                    <Card className="rounded-2xl shadow-xl border border-default-100 overflow-hidden mb-6">
                        {/* Product Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">{stockData?.data?.productName}</h2>
                                    <p className="text-blue-100">SKU: {stockData?.data?.sku}</p>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                        stockData?.data?.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                            stockData?.data?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
                                        {stockData?.data?.status?.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Description */}
                            {stockData?.data?.description && (
                                <div className="mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                    <h3 className="font-semibold mb-2">Description</h3>
                                    <p className="text-gray-700">{stockData?.data?.description}</p>
                                </div>
                            )}

                            {/* Stats Grid */}
                            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <InfoItem label="Current Stock">
                                    <div className="flex items-center gap-2">
                                        <span>{stockData?.data?.quantity}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-300">{stockData?.data?.unit}</span>
                                    </div>
                                </InfoItem>
                                
                                <InfoItem label="Stock Status">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        stockData?.data?.stockStatus?.toLowerCase() === 'in stock' 
                                            ? 'bg-green-100 text-green-700'
                                            : stockData?.data?.stockStatus?.toLowerCase() === 'low stock'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {stockData?.data?.stockStatus}
                                    </span>
                                </InfoItem>
                                
                                <InfoItem label="Total Value">
                                    <span className="text-blue-600">{formatCurrency(stockData?.data?.totalValue)}</span>
                                </InfoItem>
                                
                                <InfoItem label="Profit Percentage">
                                    <span className="text-green-600">{stockData?.data?.profitPercentage}%</span>
                                </InfoItem>
                            </dl>

                            {/* Financial Information */}
                            <div>
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 text-sm">💰</span>
                                    </div>
                                    Financial Details
                                </h3>
                                <dl className="space-y-2">
                                    <div className="flex justify-between items-center p-2 rounded-lg">
                                        <dt className="font-medium text-gray-600 dark:text-gray-300">Purchase Price</dt>
                                        <dd className="font-bold">{formatCurrency(stockData?.data?.purchasePrice)}</dd>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-lg">
                                        <dt className="font-medium text-gray-600 dark:text-gray-300">Selling Price</dt>
                                        <dd className="font-bold text-blue-600">{formatCurrency(stockData?.data?.sellingPrice)}</dd>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200">
                                        <dt className="font-medium text-green-700">Profit Margin</dt>
                                        <dd className="font-bold text-green-700">{formatCurrency(stockData?.data?.profitMargin)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </Card>

                    {/* Attachments Card */}
                    <Card className="rounded-2xl shadow-xl border border-default-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <span>📎</span>
                                Attachments
                            </h3>
                        </div>

                        <div className="p-8">
                            {(() => {
                                const attachments = stockData?.attachments ?? stockData?.data?.attachments ?? []
                                if (Array.isArray(attachments) && attachments.length > 0) {
                                    return (
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                {attachments.map((a) => {
                                                    const nested = a?.attachmentId || null
                                                    const att = nested || a || {}
                                                    const key = a?._id || nested?._id || a?.id || nested?.id
                                                    const name = att.name || att.title || 'Untitled Attachment'
                                                    const description = att.description
                                                    const qty = a?.quantity ?? a?.qty ?? att.qty ?? 0

                                                    return (
                                                        <div key={key} className="flex items-center justify-between p-4 rounded-lg border border-default-200 bg-default-50 hover:bg-default-100 transition-colors">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-lg">{name}</div>
                                                                {description && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>}
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-4">
                                                                Qty: {qty}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className="pt-4 border-t border-default-200">
                                                <Button variant='flat' color="primary" onPress={() => onOpen()}>
                                                    Manage Attachments
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                }

                                return (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-5xl mb-4">📎</div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">No attachments linked to this product.</p>
                                        <Button variant='flat' color="primary" onPress={() => onOpen()}>
                                            Add Attachments
                                        </Button>
                                    </div>
                                )
                            })()}
                        </div>
                    </Card>
                </div>
            </div>
            <AttachmentModal 
                stockData={stockData} 
                isOpen={isOpen} 
                onClose={onOpenChange}
            />
        </>
    );
}

export default Index