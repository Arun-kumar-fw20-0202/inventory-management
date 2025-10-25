'use client'
import React from 'react'
import { useRecentSales } from '@/libs/query/dashboard/dashboard-queries'
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card'
import { Button } from '@heroui/button'
import { formatCurrency, formatDateRelative } from '@/libs/utils'
import { Chip } from '@heroui/chip'
import { Skeleton } from '@heroui/skeleton'
import { Divider } from '@heroui/divider'
import Link from 'next/link'
import { 
    ChevronRight, 
    TrendingUp, 
    Users, 
    Package, 
    Calendar,
    ShoppingBag,
    Eye,
    AlertCircle,
    IndianRupee
} from 'lucide-react'
import { Avatar } from '@heroui/avatar'

export default function DashboardRecentSales({ params, options }) {
    const { data, isLoading, error } = useRecentSales(params, options)
    const salesData = data?.data?.recentSales ?? []
    const totalCount = data?.data?.totalCount ?? 0

    const statusConfig = {
        draft: { color: 'default', icon: '📝', bg: 'bg-default-50' },
        submitted: { color: 'warning', icon: '⏳', bg: 'bg-warning-50' },
        completed: { color: 'success', icon: '✅', bg: 'bg-success-50' },
        pending: { color: 'warning', icon: '🔄', bg: 'bg-warning-50' },
        cancelled: { color: 'danger', icon: '❌', bg: 'bg-danger-50' }
    }

    // Loading State
    if (isLoading) {
        return (
            <Card className="w-full max-w-full">
                <CardHeader className="pb-3 px-3 sm:px-6">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 rounded-lg" />
                                <Skeleton className="h-3 sm:h-4 w-32 sm:w-48 rounded-lg" />
                            </div>
                        </div>
                        <Skeleton className="h-8 sm:h-10 w-20 sm:w-28 rounded-lg" />
                    </div>
                </CardHeader>
                <CardBody className="pt-0 px-3 sm:px-6">
                    <div className="space-y-3 sm:space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="shadow-none border border-divider">
                                <CardBody className="p-3 sm:p-4">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 sm:h-5 w-3/4 rounded-lg" />
                                            <Skeleton className="h-3 sm:h-4 w-1/2 rounded-lg" />
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-lg" />
                                            <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 rounded-lg" />
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </CardBody>
            </Card>
        )
    }

    // Error State
    if (error) {
        return (
            <Card className="w-full max-w-full border-danger-200">
                <CardBody className="p-6 sm:p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-danger-50 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-danger-500" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-danger-700 mb-2">
                                Unable to load recent sales
                            </h3>
                            <p className="text-xs sm:text-sm text-danger-500">
                                Please try again later or contact support.
                            </p>
                        </div>
                        <Button color="danger" variant="flat" size="sm">
                            Try Again
                        </Button>
                    </div>
                </CardBody>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-full shadow-lg">
            {/* Enhanced Header */}
            <CardHeader className="flex-col items-start gap-3 sm:gap-4 pb-4 sm:pb-6 bg-gradient-to-br from-primary-50/70 to-secondary-50/50 px-3 sm:px-6">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                                <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-2xl font-bold text-foreground truncate">Recent Sales</h2>
                            <p className="text-xs sm:text-sm text-foreground-500 mt-1 flex items-center gap-1 sm:gap-2">
                                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                <span className="hidden sm:inline">Latest customer orders and transactions</span>
                                <span className="sm:hidden">Latest orders</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-xs sm:text-sm text-foreground-500 flex items-center justify-end gap-1">
                            <Package className="w-3 h-3 sm:w-4 sm:h-4" /> 
                            <span className="hidden sm:inline">Orders</span>
                        </p>
                        <p className="text-base sm:text-xl font-semibold text-foreground">
                            {salesData.length} / {totalCount}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardBody className="p-3 sm:p-6">
                {salesData.length === 0 ? (
                    // Empty State
                    <div className="text-center py-8 sm:py-12 px-4">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-default-100 to-default-200 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 sm:w-10 sm:h-10 text-default-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">No recent sales</h3>
                        <p className="text-foreground-500 text-xs sm:text-sm max-w-sm mx-auto mb-4 sm:mb-6">
                            Sales transactions will appear here once customers start placing orders
                        </p>
                        <Button 
                            color="primary" 
                            variant="flat" 
                            as={Link} 
                            href="/sales/new" 
                            size="sm"
                            startContent={<Package className="w-4 h-4" />}
                            className="w-full sm:w-auto"
                        >
                            Create First Sale
                        </Button>
                    </div>
                ) : (
                    // Sales List
                    <div className="space-y-2 sm:space-y-3">
                        {salesData.slice(0, 6).map((sale, index) => {
                            const statusInfo = statusConfig[sale.status] || statusConfig.draft
                            const isLatest = index === 0

                            return (
                                <Card
                                    key={sale._id}
                                    className={`
                                        transition-all duration-300 hover:shadow-md hover:scale-[1.01] 
                                        cursor-pointer group border-1
                                        ${isLatest 
                                            ? 'border-primary-200 shadow-md' 
                                            : 'border-divider hover:border-primary-200'
                                        }
                                    `}
                                    isPressable
                                    as={Link}
                                    href={`/sales/${sale._id}`}
                                >
                                    <CardBody className="p-3 sm:p-4">
                                        {/* Mobile Layout */}
                                        <div className="sm:hidden">
                                            <div className="flex items-start gap-3 mb-3">
                                                <Avatar 
                                                    name={sale.customerName}
                                                    className="bg-gradient-to-br from-primary-400 to-secondary-400 text-white"
                                                    size="md"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                            {sale.customerName}
                                                        </h4>
                                                        {isLatest && (
                                                            <Chip color="success" className='rounded-md' size="sm">Latest</Chip>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Chip 
                                                            variant="flat" 
                                                            size="sm" 
                                                            color={statusInfo.color}
                                                            className="shadow-sm rounded-md text-xs"
                                                            startContent={<span className="text-xs">{statusInfo.icon}</span>}
                                                        >
                                                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                        </Chip>
                                                        <span className="text-xs text-foreground-400 font-mono">
                                                            #{sale.orderNo}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-base font-bold text-foreground">
                                                        {formatCurrency(sale.grandTotal)}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between text-xs text-foreground-500">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <Package className="w-3 h-3" />
                                                        <span>{sale.itemCount}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{formatDateRelative(sale.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 opacity-60" />
                                            </div>
                                        </div>

                                        {/* Desktop Layout */}
                                        <div className="hidden sm:flex items-center gap-4">
                                            {/* Customer Avatar */}
                                            <div className="relative">
                                                <Avatar 
                                                    name={sale.customerName}
                                                    className="bg-gradient-to-br from-primary-400 to-secondary-400 text-white"
                                                    size="lg"
                                                />
                                            </div>

                                            {/* Sale Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                        {sale.customerName}
                                                    </h4>
                                                    <Chip 
                                                        variant="flat" 
                                                        size="sm" 
                                                        color={statusInfo.color}
                                                        className="shadow-sm rounded-md"
                                                        startContent={<span className="text-xs">{statusInfo.icon}</span>}
                                                    >
                                                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                    </Chip>
                                                    {isLatest && (
                                                        <Chip color="success" className='rounded-md' size="sm">Latest</Chip>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-6 text-sm text-foreground-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-4 h-4" />
                                                        <span className="truncate max-w-[150px]">{sale.customerEmail}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Package className="w-4 h-4" />
                                                        <span>{sale.itemCount} items</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDateRelative(sale.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Amount & Action */}
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-foreground">
                                                        {formatCurrency(sale.grandTotal)}
                                                    </div>
                                                    <div className="text-xs text-foreground-400 mt-0.5 font-mono">
                                                        # {sale.orderNo}
                                                    </div>
                                                </div>

                                                <Button 
                                                    isIconOnly 
                                                    variant="light" 
                                                    size="sm"
                                                    className="opacity-60 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </CardBody>

            {/* Enhanced Footer */}
            {salesData.length > 0 && (
                <CardFooter className="border-t border-divider bg-default-50/50 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground-500 min-w-0 flex-1">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate">
                                <span className="hidden sm:inline">Showing latest {salesData.length} sales</span>
                                <span className="sm:hidden">{salesData.length} sales</span>
                            </span>
                            {totalCount > salesData.length && (
                                <>
                                    <Divider orientation="vertical" className="h-3 sm:h-4" />
                                    <span className="text-warning-500 font-medium truncate">
                                        <span className="hidden sm:inline">{totalCount - salesData.length} more available</span>
                                        <span className="sm:hidden">+{totalCount - salesData.length}</span>
                                    </span>
                                </>
                            )}
                        </div>
                        <Button 
                            size='sm' 
                            color="primary" 
                            variant="light" 
                            as={Link} 
                            href="/sales/all" 
                            className="shadow-lg shrink-0" 
                            endContent={<ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                        >
                            <span className="hidden sm:inline">View All</span>
                            <span className="sm:hidden">All</span>
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
