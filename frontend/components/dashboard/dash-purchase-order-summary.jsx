import { useDashboardPurchaseOrderSummary } from '@/libs/query/dashboard/dashboard-queries'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Progress } from '@heroui/progress'
import { Skeleton } from '@heroui/skeleton'
import { Divider } from '@heroui/divider'
import React from 'react'
import { 
    ShoppingCart, 
    TrendingUp, 
    Clock, 
    CheckCircle2, 
    Package, 
    XCircle, 
    AlertCircle,
    FileX
} from 'lucide-react'

const DashPurchaseOrderSummary = ({params, options}) => {
    const { data, isLoading, error } = useDashboardPurchaseOrderSummary(params, options)

    if (isLoading) {
        return (
            <Card className="w-full shadow-sm border-0">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32 rounded-lg" />
                            <Skeleton className="h-3 w-48 rounded-lg" />
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="pt-0">
                    <div className="grid gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="p-4 bg-default-50 rounded-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-6 w-6 rounded-full" />
                                        <Skeleton className="h-5 w-20 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-6 w-8 rounded-lg" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="w-full shadow-sm border-danger-200 bg-gradient-to-br from-danger-50 to-danger-100/50">
                <CardBody className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-danger-100 rounded-2xl mb-4">
                        <AlertCircle className="h-8 w-8 text-danger-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-danger-700 mb-2">Unable to Load Data</h3>
                    <p className="text-danger-500 text-sm">There was an error loading purchase order summary</p>
                </CardBody>
            </Card>
        )
    }

    const purchaseOrderData = data?.data
    const totalOrders = purchaseOrderData?.totalPurchaseOrders || 0
    
    const statusConfig = {
        'Completed': { 
            color: 'success', 
            icon: CheckCircle2,
            gradient: 'from-success-100 to-success-50'
        },
        'PendingApproval': { 
            color: 'warning', 
            icon: Clock,
            gradient: 'from-warning-100 to-warning-50'
        },
        'PartiallyReceived': { 
            color: 'secondary', 
            icon: Package,
            gradient: 'from-secondary-100 to-secondary-50'
        },
        'Approved': { 
            color: 'primary', 
            icon: CheckCircle2,
            gradient: 'from-primary-100 to-primary-50'
        },
        'Cancelled': { 
            color: 'danger', 
            icon: XCircle,
            gradient: 'from-danger-100 to-danger-50'
        },
    }

    const formatStatusName = (status) => {
        return status.replace(/([A-Z])/g, ' $1').trim()
    }

    const getPercentage = (count) => {
        return totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : 0
    }

    return (
        <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-background to-default-50/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-400/20 rounded-2xl blur-lg"></div>
                            <div className="relative p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
                                <ShoppingCart className="h-7 w-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                Purchase Orders
                            </h3>
                            <p className="text-sm text-default-500 flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                Status overview and analytics
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-foreground">{totalOrders}</div>
                        <Chip 
                            size="sm" 
                            variant="flat" 
                            color="primary"
                            className="font-medium"
                        >
                            Total Orders
                        </Chip>
                    </div>
                </div>
            </CardHeader>

            <Divider className="mx-6" />

            <CardBody className="pt-6">
                {purchaseOrderData?.byStatus && Object.keys(purchaseOrderData.byStatus).length > 0 ? (
                    <div className="grid gap-4">
                        {Object.entries(purchaseOrderData.byStatus).map(([status, count]) => {
                            const config = statusConfig[status] || { 
                                color: 'default', 
                                icon: FileX,
                                gradient: 'from-default-100 to-default-50'
                            }
                            const percentage = getPercentage(count)
                            const IconComponent = config.icon
                            
                            return (
                                <Card 
                                    key={status} 
                                    className={`group relative p-5 border border-default-200/50 rounded-lg hover:border-default-300 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
                                >
                                    {/* <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div> */}
                                    
                                    <div className="relative flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 bg-${config.color}-500/10 rounded-xl border border-${config.color}-200`}>
                                                <IconComponent className={`h-5 w-5 text-${config.color}-600`} />
                                            </div>
                                            <div>
                                                <Chip 
                                                    size="md" 
                                                    color={config.color} 
                                                    variant="flat"
                                                    className="font-semibold"
                                                >
                                                    {formatStatusName(status)}
                                                </Chip>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-foreground">{count}</div>
                                            <div className="text-xs text-default-600 font-medium">{percentage}% of total</div>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <Progress 
                                            value={parseFloat(percentage)} 
                                            color={config.color}
                                            size="md"
                                            className="group-hover:scale-[1.01] transition-transform"
                                            classNames={{
                                                track: "border border-default-200/50",
                                                indicator: "shadow-sm"
                                            }}
                                        />
                                        {/* <div className="text-xs font-semibold text-default-700">
                                            {percentage}%
                                        </div> */}
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-default-200/30 rounded-3xl blur-2xl"></div>
                            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-default-100 to-default-200 rounded-3xl">
                                <ShoppingCart className="h-10 w-10 text-default-400" />
                            </div>
                        </div>
                        <h4 className="text-xl font-bold text-default-600 mb-3">No Purchase Orders Found</h4>
                        <p className="text-default-500 max-w-sm mx-auto leading-relaxed">
                            Get started by creating your first purchase order to track your procurement process
                        </p>
                    </div>
                )}
            </CardBody>
        </Card>
    )
}

export default DashPurchaseOrderSummary