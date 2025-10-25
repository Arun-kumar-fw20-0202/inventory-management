'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import DashboardTopProducts from './TopProducts'
import DashboardLowStockProducts from './LowStockProducts'
import DashboardRecentSales from './RecentSales'
import DashboardRevenueSummary from './RevenueSummary'
import DashboardSalesSummary from './SalesSummary'
import DashPurchaseOrderSummary from './dash-purchase-order-summary'
import DashPendingPurchaseOrders from './dash-pending-purchase-orders'
import DashTopCustomers from './dash-top-customers'
import { useHasPermission } from '@/libs/utils/check-permission'
import { PERMISSION_MODULES } from '@/libs/utils'
import { Divider } from '@heroui/divider'

const Dashboard = () => {
    const user = useSelector((state) => state.auth.user)
    const activeRole = user?.data?.activerole
    const hasSalePermission = useHasPermission(PERMISSION_MODULES.SALES, 'read')
    const hasStockPermission = useHasPermission(PERMISSION_MODULES.STOCK, 'read')
    const hasPurchasePermission = useHasPermission(PERMISSION_MODULES.PURCHASES, 'read')
    const hasCustomerPermission = useHasPermission(PERMISSION_MODULES.CUSTOMER, 'read')

    return (
        <div className="p-0">
            <div className="">
                <h1 className="text-xl md:text-2xl font-bold mb-4 break-words">
                    Welcome back : {user?.data?.name}
                </h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 gap-4 md:gap-8 flex flex-col">
                        {hasSalePermission && (
                            <DashboardRecentSales params={{ months: 1 }} options={{ enabled: hasSalePermission }} />
                        )}
                        <Divider className="hidden lg:block" />
                        {hasStockPermission && (
                            <DashboardLowStockProducts params={{ months: 1 }} options={{ enabled: hasStockPermission }} />
                        )}
                        <Divider className="hidden lg:block" />
                        {hasPurchasePermission && (
                            <DashPendingPurchaseOrders params={{ months: 1 }} options={{ enabled: hasPurchasePermission }} />
                        )}
                    </div>
                    <div className="lg:col-span-1 gap-4 flex flex-col">
                        {hasSalePermission && (
                            <>
                                <DashboardRevenueSummary params={{ months: 1 }} options={{ enabled: hasSalePermission }} />
                                <Divider className="hidden lg:block" />
                                <DashboardSalesSummary params={{ months: 1 }} options={{ enabled: hasSalePermission }} />
                                <Divider className="hidden lg:block" />
                                <DashboardTopProducts params={{ months: 1 }} options={{ enabled: hasSalePermission }} />
                                <Divider className="hidden lg:block" />
                            </>
                        )}
                        
                        {hasPurchasePermission &&  (
                            <DashPurchaseOrderSummary params={{ months: 1 }} options={{ enabled: hasPurchasePermission }} />
                        )}
                        
                        <Divider className="hidden lg:block" />

                        {hasCustomerPermission &&  (
                            <DashTopCustomers params={{ months: 1 }} options={{ enabled: hasCustomerPermission }} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard