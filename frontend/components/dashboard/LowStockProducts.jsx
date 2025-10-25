'use client'
import React from 'react'
import { useLowStockProducts } from '@/libs/query/dashboard/dashboard-queries'
import { 
    AlertTriangle, 
    Package, 
    TrendingDown, 
    Eye, 
    ShoppingCart,
    ArrowRight,
    BarChart3,
    PackageX
} from 'lucide-react'
import { formatCurrency } from '@/libs/utils'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Badge } from '@heroui/badge'
import { Progress } from '@heroui/progress'
import { Chip } from '@heroui/chip'
import { Divider } from '@heroui/divider'
import { Skeleton } from '@heroui/skeleton'
import Link from 'next/link'

export default function DashboardLowStockProducts({ params, options }) {
    const { data, isLoading, error } = useLowStockProducts(params, options)
    const items = data?.data ?? data ?? []

    const getStockStatus = (quantity = 0, threshold = 1) => {
        const pct = Math.round((quantity / threshold) * 100)
        if (pct <= 30) {
            return {
                level: 'critical',
                color: 'danger',
                progressColor: 'danger',
                bgColor: 'bg-danger-50',
                textColor: 'text-danger-600',
                icon: PackageX,
                urgency: 'Critical'
            }
        }
        if (pct <= 50) {
            return {
                level: 'low',
                color: 'warning',
                progressColor: 'warning',
                bgColor: 'bg-warning-50',
                textColor: 'text-warning-600',
                icon: AlertTriangle,
                urgency: 'Low'
            }
        }
        return {
            level: 'warning',
            color: 'warning',
            progressColor: 'warning',
            bgColor: 'bg-warning-50',
            textColor: 'text-warning-600',
            icon: TrendingDown,
            urgency: 'Warning'
        }
    }

    if (isLoading) {
        return (
            <Card className="w-full shadow-lg">
                <CardHeader className="pb-3 px-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 rounded-lg" />
                                <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 rounded-lg" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-16 sm:w-20 rounded-lg" />
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="pt-4 px-3 sm:px-6">
                    <div className="space-y-3 sm:space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="p-3 sm:p-4 border border-default-200 rounded-xl">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2 sm:space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2 flex-1 min-w-0">
                                                <Skeleton className="h-4 w-full max-w-[200px] rounded-lg" />
                                                <Skeleton className="h-3 w-24 sm:w-32 rounded-lg" />
                                            </div>
                                            <Skeleton className="h-8 w-8 rounded-lg ml-2" />
                                        </div>
                                        <Skeleton className="h-2 w-full rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="w-full shadow-lg border-danger-200">
                <CardBody className="p-4 sm:p-6">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-danger-600" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-danger-600 mb-2">
                                Failed to Load Stock Data
                            </h3>
                            <p className="text-xs sm:text-sm text-default-500 mb-4">
                                We couldn't retrieve the low stock information. Please check your connection and try again.
                            </p>
                            <Button color="danger" variant="flat" size="sm">
                                Try Again
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        )
    }

    return (
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Enhanced Header - Mobile Responsive */}
            <CardHeader className="pb-3 px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-danger-100 to-danger-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-danger-600" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-foreground">Low Stock Alert</h3>
                            <p className="text-xs sm:text-sm text-default-500 flex items-center gap-1">
                                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                                Products requiring immediate attention
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <Chip 
                            color="warning" 
                            variant="light" 
                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium"
                        >
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                        </Chip>
                        <Button 
                            color="primary" 
                            variant="light" 
                            size="sm" 
                            as={Link} 
                            href="/stock?lowStock=true"
                            endContent={<ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                            className="font-medium text-xs sm:text-sm"
                        >
                            <span className="hidden sm:inline">View All</span>
                            <span className="sm:hidden">All</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <Divider />

            {/* Enhanced Content - Mobile Responsive */}
            <CardBody className="pt-4 px-3 sm:px-6">
                {items.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-success-600" />
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                            All Products Well Stocked! 🎉
                        </h4>
                        <p className="text-sm sm:text-base text-default-500 max-w-sm mx-auto px-4">
                            Great news! All your inventory levels are healthy and no items require immediate restocking.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {items.slice(0, 6).map((item) => {
                            const status = getStockStatus(item.quantity, item.lowStockThreshold)
                            const pct = Math.round((item.quantity / Math.max(1, item.lowStockThreshold)) * 100)
                            const StatusIcon = status.icon
                            
                            return (
                                <div
                                    key={item._id}
                                    className="p-3 sm:p-4 border border-default-200 rounded-xl hover:border-default-300 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-background to-default-50"
                                >
                                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                        {/* Product Icon */}
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${status.bgColor} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                                            <Package className={`w-5 h-5 sm:w-6 sm:h-6 ${status.textColor}`} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            {/* Product Header - Mobile Layout */}
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 sm:mb-3 gap-2 sm:gap-0">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex sm:items-center gap-1 sm:gap-2 mb-1">
                                                            <h4 className="font-semibold text-foreground truncate text-base sm:text-lg">
                                                                {item.productName}
                                                            </h4>
                                                            <Chip 
                                                                color={status.color} 
                                                                variant="flat" 
                                                                size="sm"
                                                                startContent={<StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                                                className="font-medium text-xs w-fit"
                                                            >
                                                                {status.urgency}
                                                            </Chip>
                                                        </div>
                                                        <div className="">
                                                            <Button color="primary" variant="flat" size="sm" isIconOnly as={Link} href={`/stock/${item._id}`}>
                                                                <Eye className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-default-500 mb-2">
                                                        <span className="font-medium">SKU: {item.sku}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>Min Stock: {item.lowStockThreshold}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="font-semibold text-success-600">
                                                            {formatCurrency(item.sellingPrice)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Stock Level Display - Mobile Layout */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                                <Chip 
                                                    color={status.color} 
                                                    variant="dot" 
                                                    className="font-medium text-xs sm:text-sm w-fit"
                                                >
                                                    {item.quantity} {item.unit} remaining
                                                </Chip>
                                                <Chip 
                                                    color={status.color} 
                                                    variant="light" 
                                                    size="sm"
                                                    className="font-bold text-xs w-fit"
                                                >
                                                    {pct}% of minimum
                                                </Chip>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-default-500">
                                                    <span>Stock Level</span>
                                                    <span className="text-xs">{item.quantity} / {item.lowStockThreshold}</span>
                                                </div>
                                                <Progress
                                                    value={Math.min(Math.max(pct, 0), 100)}
                                                    color={status.progressColor}
                                                    className="h-1.5 sm:h-2"
                                                    classNames={{
                                                        track: "border border-default-200",
                                                        indicator: "shadow-sm"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        
                        {/* Show More Section */}
                        {items.length > 6 && (
                            <>
                                <Divider className="my-3 sm:my-4" />
                                <div className="text-center">
                                    <Button 
                                        variant="ghost" 
                                        className="w-full text-default-600 hover:text-primary text-sm"
                                        endContent={<ArrowRight className="w-4 h-4" />}
                                    >
                                        Show {items.length - 6} more low stock items
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    )
}