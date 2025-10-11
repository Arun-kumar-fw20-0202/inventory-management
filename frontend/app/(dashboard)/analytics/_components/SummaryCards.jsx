'use client'
import React from 'react'
import { Card, CardBody } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { useFetchSummary } from '@/libs/mutation/analytics/analytics-mutations'
import { formatCurrency } from '@/libs/utils'
import { ShoppingCart, DollarSign, TrendingUp, Receipt, Users, IndianRupee, CheckCircle, Clock, XCircle, FileText, Edit } from 'lucide-react'

const Stat = ({ title, value, hint, icon: Icon, iconColor, bgColor }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardBody>
            <div className="flex items-center gap-4 p-2">
                <div className={`${bgColor} p-3 rounded-full mb-3`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div>
                        <p className="text-sm text-gray-500 font-medium">{title}</p>
                        <h2 className="text-2xl font-bold mt-2">{value}</h2>
                </div>
            </div>
                {hint && (
                        <p className="text-center text-xs text-gray-400 mt-2 italic">{hint}</p>
                )}
        </CardBody>
    </Card>
)

const StatusCard = ({ status, count, icon: Icon, color, bgColor }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
        <CardBody className="p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`${bgColor} p-2 rounded-lg`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium capitalize">{status}</p>
                        <p className="text-xs text-gray-500">Sales</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-lg font-bold">{count}</span>
                </div>
            </div>
        </CardBody>
    </Card>
)

const getStatusConfig = (status) => {
    const configs = {
        completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
        approved: { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        submitted: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
        draft: { icon: Edit, color: 'text-gray-600', bgColor: 'bg-gray-100' }
    }
    return configs[status] || { icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' }
}

const SummaryCards = ({ params }) => {
    const { data, isLoading } = useFetchSummary(params, { staleTime: 1000 * 60 * 1 })
    const payload = data?.data || {}
    const salesSummary = payload.salesSummary || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 }
    const statusCounts = payload.statusCounts || []

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardBody>
                                <div className="h-32 bg-gray-200 rounded"></div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardBody>
                                <div className="h-20 bg-gray-200 rounded"></div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Stat 
                    title="Total Sale" 
                    value={salesSummary.totalOrders || 0}
                    icon={ShoppingCart}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-100"
                    hint={"Total Sale this period"}
                />
                <Stat 
                    title="Revenue" 
                    value={formatCurrency(salesSummary.totalRevenue || 0)}
                    icon={IndianRupee}
                    iconColor="text-green-600"
                    bgColor="bg-green-100"
                    hint={"Total revenue this period"}
                />
                <Stat 
                    title="Total Profit" 
                    value={formatCurrency(salesSummary.totalCOGS || 0)}
                    icon={TrendingUp}
                    iconColor="text-emerald-600"
                    bgColor="bg-emerald-100"
                    hint={"Total profit this period"}
                />
                <Stat 
                    title="Avg Sale Value" 
                    value={formatCurrency(salesSummary.avgOrderValue || 0)}
                    icon={Receipt}
                    iconColor="text-purple-600"
                    bgColor="bg-purple-100"
                    hint={"Average order value this period"}
                />
                <Stat 
                    title="Top Customers" 
                    value={payload.topCustomers?.[0]?.count || 0}
                    hint="Top customers this period"
                    icon={Users}
                    iconColor="text-orange-600"
                    bgColor="bg-orange-100"
                />
            </div>

            {/* Status Summary */}
            {statusCounts.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-400">Sales Status Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {statusCounts.map((statusItem) => {
                            const config = getStatusConfig(statusItem._id)
                            return (
                                <StatusCard
                                    key={statusItem._id}
                                    status={statusItem._id}
                                    count={statusItem.count}
                                    {...config}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SummaryCards