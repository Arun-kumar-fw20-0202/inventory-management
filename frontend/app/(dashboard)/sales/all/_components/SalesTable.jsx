"use client"
import React from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { User } from "@heroui/user";
import { Chip } from "@heroui/chip";

import { Button } from '@heroui/button'
import { useFetchSales } from '@/libs/mutation/sales/sales-mutations'
import { useSelector } from 'react-redux';
import { Avatar } from '@heroui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@heroui/popover';
import { Radio, RadioGroup } from '@heroui/radio';
import { EllipsisVertical, Thermometer } from 'lucide-react';
import { EyeIcon } from '@/components/icons';
import Link from 'next/link';

export const columns = [
  { name: 'ORDER', uid: 'order' },
  { name: 'SALE TO', uid: 'customer' },
  { name: 'ITEMS', uid: 'items' },
  { name: 'TOTAL', uid: 'total' },
  { name: 'STATUS', uid: 'status' },
  { name: 'PAYMENT', uid: 'payment' },
  { name: 'CREATED', uid: 'created' },
  { name: 'ACTIONS', uid: 'actions' },
];

const statusColorMap = {
  submitted: 'warning',
  processing: 'primary',
  completed: 'success',
  cancelled: 'danger',
  draft: 'default',
  approved: 'success',
};

const paymentColor = (status) => (status === 'paid' ? 'success' : status == 'partial' ? 'warning' : 'danger');

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return dateString
  }
}

export default function SalesTable({ initialFilters = { page: 1, limit: 20 }, actions = {} }) {
    const { SubmitSale, submetting, ApproveSale, approving, approved, RejectSale, rejecting, rejected, CompleteSale, completing, completed, MarkOrderAsPaid, markingAsPaid, markedAsPaid } = actions
    const [filters, setFilters] = React.useState(initialFilters)
    const { data, isLoading, refetch } = useFetchSales(filters)
    const user = useSelector((state) => state.auth.user);


    const HandleUpdatePayment = async (status, id) => {
        if (markingAsPaid) return;
        await MarkOrderAsPaid({ id, status })
    }


    React.useEffect(() => { refetch() }, [filters])

    const items = data?.data?.items || []

    const renderCell = React.useCallback((order, columnKey) => {

        switch (columnKey) {
        case 'order':
            return (
            <div className="flex flex-col">
                <div className="font-medium">{order?.orderNo}</div>
                {/* <div className="text-xs text-default-400">Org: {order?.orgNo || '-'}</div> */}
            </div>
            )
        case 'customer':
            return (
            <User
                avatarProps={{ radius: 'lg', name: order?.customerId?.name?.charAt(0) }}
                name={order?.customerId?.name || '-'}
                description={order?.customerId?.email || order?.customerId?.phone || '-'}
            />
            )
        case 'items':
            return (
            <div className="flex flex-col">
                <div className="font-medium">{order?.items?.length || 0} item(s)</div>
                <div className="text-xs text-default-400">{order?.items?.[0]?.stockId?.productName || ''}</div>
            </div>
            )
        case 'total':
            return (
            <div className="text-right">
                <div className="font-semibold">₹{(order?.grandTotal || 0).toFixed(2)}</div>
                <div className="text-xs text-default-400">Sub: ₹{(order?.subTotal || 0).toFixed(2)}</div>
            </div>
            )
        case 'status':
            return (
            <Chip className="capitalize" color={statusColorMap[order?.status] || 'default'} size="sm" variant="flat">
                {order?.status}
            </Chip>
            )
        case 'payment':
            return (
            <Chip className="capitalize" color={paymentColor(order?.paymentStatus)} size="sm" variant="flat">
                {order?.paymentStatus}
            </Chip>
            )
        case 'created':
            return (
            <div className="text-xs">
                <div>{formatDate(order?.createdAt)}</div>
                <div className="text-default-400 flex items-center">By: <Avatar className='h-4 w-4 ml-2 mr-1.5' /> {order?.createdBy?.name} {order?.createdBy?._id == user?.data?.id && '( You )'}</div>
            </div>
            )
        case 'actions':
            return (
            <div className="flex items-center gap-2 justify-center">
                <Button 
                    isIconOnly
                    size='sm'
                    as={Link}
                    href={`/sales/${order?._id}`}
                    startContent={<EyeIcon size={18} />}
                />
                <Popover showArrow>
                    <PopoverTrigger>
                        <Button isIconOnly size='sm' startContent={<EllipsisVertical size={18} />} />
                    </PopoverTrigger>
                    <PopoverContent>
                        <div className='w-full flex flex-col gap-3'>
                            <h1 className='font-extrabold'>Actions</h1>

                            <div className="flex gap-2">
                                {order?.status === 'draft' && (
                                    <Button size="sm" color="secondary" onPress={() => SubmitSale(order?._id)} disabled={submetting}> {submetting ? 'Submitting...' : 'Submit'} </Button>
                                )}

                                {order?.status === 'submitted' && (
                                    <Button size="sm" color="primary" onPress={() => ApproveSale(order?._id)} disabled={approving}>{approving ? 'Approving...' : 'Approve'}</Button>
                                )}

                                {['draft','submitted'].includes(order?.status) && (
                                    <Button size="sm" color="danger" variant="solid" onPress={() => {
                                    const reason = window.prompt('Reason for rejection (optional)') || ''
                                    RejectSale({ id: order?._id, reason })
                                }} disabled={rejecting}>{rejecting ? 'Rejecting...' : 'Reject'}</Button>
                                )}

                                {order?.status === 'approved' && (
                                    <Button size="sm" color="success" onPress={() => CompleteSale(order?._id)} disabled={completing}>{completing ? 'Completing...' : 'Complete'}</Button>
                                )}
                            </div>
                            <RadioGroup label='Payment Status' orientation="horizontal" defaultValue={order?.paymentStatus || 'unpaid'}>
                                {["unpaid", "partial", "paid"].map(status => (
                                    <Radio key={status} value={status} onChange={() => HandleUpdatePayment(status, order?._id)}>{status}</Radio>
                                ))}
                            </RadioGroup>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            )
        default:
            return '-'
        }
    }, [SubmitSale, ApproveSale, RejectSale, CompleteSale, submetting, approving, rejecting, completing])


    if(isLoading) {
        return <LoadingState />
    }

  return (
    <div>
      {items.length === 0 ? (
        <div className="text-center text-default-400">No sales found.</div>
      ) : (
        <Table aria-label="Sales table" isStriped>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={items}>
            {(order) => (
              <TableRow key={order?._id}>
                {(columnKey) => <TableCell>{renderCell(order, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}


const LoadingState = () => {
    return (
        <div className="space-y-4">
            <Table aria-label="Loading sales table" isStriped>
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                            {columns.map((column) => (
                                <TableCell key={column.uid}>
                                    <div className="animate-pulse">
                                        {column.uid === 'customer' ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="space-y-1">
                                                    <div className="w-20 h-3 bg-gray-200 rounded"></div>
                                                    <div className="w-24 h-2 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>
                                        ) : column.uid === 'status' || column.uid === 'payment' ? (
                                            <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                                        ) : column.uid === 'actions' ? (
                                            <div className="flex gap-2 justify-center">
                                                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                            </div>
                                        ) : column.uid === 'created' ? (
                                            <div className="space-y-1">
                                                <div className="w-24 h-3 bg-gray-200 rounded"></div>
                                                <div className="w-20 h-2 bg-gray-200 rounded"></div>
                                            </div>
                                        ) : (
                                            <div className="w-20 h-4 bg-gray-200 rounded"></div>
                                        )}
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}