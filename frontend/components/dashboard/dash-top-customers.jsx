import { useTopCustomers } from '@/libs/query/dashboard/dashboard-queries'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Avatar } from '@heroui/avatar'
import { Chip } from '@heroui/chip'
import { Skeleton } from '@heroui/skeleton'
import { ShoppingBag, TrendingUp, Users } from 'lucide-react'
import React from 'react'
import { formatCurrency } from '@/libs/utils'

const DashTopCustomers = ({params, options}) => {
    const { data: customers, isLoading, error } = useTopCustomers(params, options)
    const data = customers?.data || []
    
    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Top Customers</h3>
                    </div>
                </CardHeader>
                <CardBody className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                        </div>
                    ))}
                </CardBody>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="w-full">
                <CardBody className="text-center py-8">
                    <p className="text-danger">Failed to load customers data</p>
                </CardBody>
            </Card>
        )
    }


    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A'
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Top Customers</h3>
                    </div>
                    <Chip 
                        size="sm" 
                        color="primary" 
                        variant="flat"
                        startContent={<TrendingUp className="w-3 h-3" />}
                    >
                        Best Performers
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="space-y-4">
                {data?.length > 0 ? (
                    data.map((customer, index) => (
                        <div 
                            key={customer?._id} 
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-default-50 transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                    <Avatar 
                                        name={getInitials(customer?.name)}
                                        className="bg-gradient-to-r from-primary to-secondary text-white"
                                        size="md"
                                    />
                                    <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                        {index + 1}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-foreground">
                                        {customer?.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-default-500">
                                        <ShoppingBag className="w-3 h-3" />
                                        <span>{customer?.orders} orders</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-success text-lg">
                                    {formatCurrency(customer?.totalSpent)}
                                </p>
                                <p className="text-xs text-default-500">
                                    Total Spent
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <Users className="w-12 h-12 text-default-300 mx-auto mb-2" />
                        <p className="text-default-500">No customers data available</p>
                    </div>
                )}
            </CardBody>
        </Card>
    )
}

export default DashTopCustomers