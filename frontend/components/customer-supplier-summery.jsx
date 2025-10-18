import { useSupplierCustomerAnalytics } from '@/libs/mutation/suppliser-customer/suppliser-customer-mutation-query'
import React from 'react'
import { Users, UserCheck, ShoppingCart, TrendingUp } from 'lucide-react'
import { Card } from '@heroui/card'
import { formatNumberShort } from '@/libs/utils'

const CustomerSupplierSummery = ({type='customer'}) => {
    const { data: analytics, isLoading: analyticsLoading } = useSupplierCustomerAnalytics(type)
    
    const analyticsData = analytics?.data?.summary || {}
    
    const cardData = [
        {
            title: `Total ${type === 'customer' ? 'Customers' : 'Suppliers'}`,
            value: analyticsData.totalContacts || 0,
            icon: Users,
            description: `All registered ${type}s in your system`,
            color: 'from-blue-500 to-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            title: `Active ${type === 'customer' ? 'Customers' : 'Suppliers'}`,
            value: analyticsData.activeContacts || 0,
            icon: UserCheck,
            description: `Currently active ${type}s`,
            color: 'from-green-500 to-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            title: 'Total Purchases',
            value: formatNumberShort(analyticsData.totalPurchases) || 0,
            icon: ShoppingCart,
            description: `All purchase orders from ${type}s`,
            color: 'from-purple-500 to-purple-600',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
        {
            title: 'Total Transactions',
            value: formatNumberShort(analyticsData.totalSales) || 0,
            icon: TrendingUp,
            description: `Complete transaction history`,
            color: 'from-orange-500 to-orange-600',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600'
        }
    ]

    const SkeletonCard = () => (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg w-12 h-12"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-4 h-4"></div>
            </div>
            <div className="space-y-3">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8 w-1/2"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-3 w-full"></div>
            </div>
        </Card>
    )

    if (analyticsLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[...Array(4)].map((_, index) => (
                    <SkeletonCard key={index} />
                ))}
            </div>
        )
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {cardData.map((card, index) => {
                const IconComponent = card.icon
                return (
                    <Card key={index} className="hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${card.iconBg} dark:bg-gray-700 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <IconComponent className={`w-6 h-6 ${card.iconColor} dark:text-gray-300`} />
                                </div>
                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color}`}></div>
                            </div>
                            
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                {card.title}
                            </h3>
                            
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                                {card.value.toLocaleString()}
                            </p>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                {card.description}
                            </p>
                        </div>
                        
                        <div className={`h-1 bg-gradient-to-r ${card.color} rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    </Card>
                )
            })}
        </div>
    )
}

export default CustomerSupplierSummery