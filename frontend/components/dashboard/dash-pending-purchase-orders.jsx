import { useDashboardPendingPurchaseOrders } from '@/libs/query/dashboard/dashboard-queries'
import React from 'react'
import { 
    Card, 
    CardBody, 
    CardHeader, 
} from '@heroui/card'
import { Divider } from '@heroui/divider'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/table'
import { Chip } from '@heroui/chip'
import { Badge } from '@heroui/badge'

import { BookAIcon, CalendarIcon, ChevronRight, ShoppingCartIcon, UserIcon } from 'lucide-react'
import { formatCurrency, formatDateRelative } from '@/libs/utils'
import { Button } from '@heroui/button'
import Link from 'next/link'

const DashPendingPurchaseOrders = ({params, options}) => {
    const {data: pendingsData, isLoading, error} = useDashboardPendingPurchaseOrders(params, options)

    const data = pendingsData?.data || pendingsData || []


    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getStatusColor = (status) => {
        switch(status) {
            case 'PendingApproval': return 'warning'
            case 'Approved': return 'success'
            case 'Rejected': return 'danger'
            case 'PartiallyReceived': return 'secondary'
            default: return 'default'
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-default-200 rounded animate-pulse" />
                    <div className="h-8 w-64 bg-default-200 rounded animate-pulse" />
                    <div className="w-8 h-6 bg-default-200 rounded-full animate-pulse" />
                </div>

                {[1, 2, 3].map((item) => (
                    <Card key={item} className="shadow-lg">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start w-full">
                                <div className="flex flex-col gap-2">
                                    <div className="h-6 w-40 bg-default-200 rounded animate-pulse" />
                                    <div className="h-4 w-32 bg-default-200 rounded animate-pulse" />
                                </div>
                                <div className="h-6 w-20 bg-default-200 rounded-full animate-pulse" />
                            </div>
                        </CardHeader>

                        <Divider />

                        <CardBody className="pt-4">
                            {/* Summary skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {[1, 2, 3].map((col) => (
                                    <div key={col} className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-default-200 rounded animate-pulse" />
                                        <div className="space-y-1 flex-1">
                                            <div className="h-3 w-24 bg-default-200 rounded animate-pulse" />
                                            <div className="h-5 w-32 bg-default-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Table skeleton */}
                            <div className="mb-4">
                                <div className="h-5 w-24 bg-default-200 rounded animate-pulse mb-3" />
                                <Card className="shadow-none border border-divider">
                                    <CardBody className="p-0">
                                        {/* Table header */}
                                        <div className="flex border-b border-divider p-3 bg-default-50">
                                            {[1, 2, 3, 4, 5].map((col) => (
                                                <div key={col} className="flex-1">
                                                    <div className="h-4 w-20 bg-default-200 rounded animate-pulse" />
                                                </div>
                                            ))}
                                        </div>
                                        {/* Table rows */}
                                        {[1, 2].map((row) => (
                                            <div key={row} className="flex border-b border-divider p-3 last:border-b-0">
                                                {[1, 2, 3, 4, 5].map((col) => (
                                                    <div key={col} className="flex-1">
                                                        <div className="h-4 w-16 bg-default-200 rounded animate-pulse" />
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </CardBody>
                                </Card>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="p-4">
                <CardBody>
                    <p className="text-red-500">Error loading pending purchase orders</p>
                </CardBody>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <ShoppingCartIcon className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Pending Purchase Orders</h2>
                <Badge content={data?.length || 0} color="primary" variant="flat" />
            </div>

            {data?.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <ShoppingCartIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-default-500 mb-2">No Pending Orders</h3>
                        <p className="text-default-400">All purchase orders have been processed</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {data?.map((order) => (
                        <Card key={order?._id} className="shadow-lg">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-bold text-foreground">
                                            Order #{order?.orderNumber}
                                            {"  .  "}<Chip color={getStatusColor(order?.status)} variant="solid" className='rounded-md' size="sm">{order?.status}</Chip>
                                        </h3>
                                        <p className="text-sm text-default-500">
                                            Created {formatDateRelative(order?.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <Button size="sm" variant="light" className="ml-2" as={Link} href={`/purchase-orders/${order?._id}`}>
                                            View Details <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <Divider />

                            <CardBody className="pt-4">
                                {/* Order Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <CalendarIcon className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-default-500 uppercase tracking-wide">
                                                Expected Delivery
                                            </p>
                                            <p className="font-semibold">
                                                {formatDate(order?.expectedDeliveryDate)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <UserIcon className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-default-500 uppercase tracking-wide">
                                                Supplier Name
                                            </p>
                                            <p className="font-semibold text-sm">
                                                {order?.supplierId?.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <BookAIcon className="w-5 h-5 text-success" />
                                        <div>
                                            <p className="text-xs text-default-500 uppercase tracking-wide">
                                                Total Amount
                                            </p>
                                            <p className="font-bold text-lg text-success">
                                                {formatCurrency(order?.totalAmount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="mb-4">
                                    <h4 className="font-semibold mb-3 text-default-700">Order Items</h4>
                                    <Table 
                                        aria-label="Order items table"
                                        classNames={{
                                            wrapper: "shadow-none border border-divider",
                                        }}
                                    >
                                        <TableHeader>
                                            <TableColumn>PRODUCT ID</TableColumn>
                                            <TableColumn>QUANTITY</TableColumn>
                                            <TableColumn>UNIT PRICE</TableColumn>
                                            <TableColumn>RECEIVED</TableColumn>
                                            <TableColumn>TOTAL</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {order?.items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <code className="text-xs bg-default-100 px-2 py-1 rounded">
                                                            {item.productId.slice(-8)}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            color={item.receivedQuantity > 0 ? "success" : "default"} 
                                                            size="sm" 
                                                            variant="flat"
                                                        >
                                                            {item.receivedQuantity}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        {formatCurrency(item.total)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Notes */}
                                {order?.notes && (
                                    <Card className="bg-default-50">
                                        <CardBody className="py-3">
                                            <div className="flex gap-3">
                                                <BookAIcon className="w-5 h-5 text-default-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-default-500 uppercase tracking-wide mb-1">
                                                        Notes
                                                    </p>
                                                    <p className="text-sm text-default-700">{order?.notes}</p>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default DashPendingPurchaseOrders