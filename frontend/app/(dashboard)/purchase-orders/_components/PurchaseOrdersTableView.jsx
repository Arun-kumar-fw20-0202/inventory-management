'use client'
import React, { useCallback } from 'react'
import { Card } from '@heroui/card'
import { Table, TableHeader, TableBody, TableRow, TableCell, TableColumn } from '@heroui/table'
import { Button } from '@heroui/button'
import PurchaseOrderStatusBadge from './PurchaseOrderStatusBadge'
import { formatCurrency, formatDate } from '@/libs/utils'
import { Box, Calendar, EllipsisVertical, LocateFixedIcon, MapPinHouse, ShieldUser, Truck, Warehouse } from 'lucide-react'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { useSelector } from 'react-redux'
import { Pagination } from '@heroui/pagination'


export const columns = [
  { name: 'Order #', uid: 'orderNumber' },
  { name: 'Supplier', uid: 'supplierId' },
  { name: 'Warehouse', uid: 'warehouseId' },
  { name: 'Amount', uid: 'totalAmount' },
  { name: 'Items', uid: 'items.length' },
  { name: 'Expected', uid: 'expectedDeliveryDate' },
  { name: 'CreatedAt', uid: 'createdAt' },
  { name: 'Created By', uid: 'createdBy' },
  { name: 'Status', uid: 'status' },
  { name: 'Actions', uid: 'actions' },
]

export default function PurchaseOrdersTableView({ orders = [], isLoading = false, pagination = {}, onViewDetails, getActionButtons, onPageChange }) {
  const mydata = useSelector((state) => state.auth.user);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No purchase orders found</p>
      </div>
    )
  }

  const renderCell = useCallback((user, columnKey) => {
    switch (columnKey) {
      case 'orderNumber':
        return (
          <button
            className="text-primary-600 dark:text-primary-400 flex items-center text-nowrap gap-2 font-medium hover:underline"
            onClick={() => onViewDetails(user)}
          >
            <div className="bg-primary-50 dark:bg-primary-950/30 rounded-lg p-1.5">
              <Box className="w-4 h-4 inline-block text-primary"/>
            </div>
            {user?.orderNumber}
          </button>
        )
      case 'supplierId':
        return (
          <div className="flex items-center text-nowrap gap-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.supplierId?.name || 'N/A'}</p>
              <p className="text-xs font-normal">{user?.supplierId?.phone || 'N/A'}</p>
            </div>
          </div>
        )
      case 'warehouseId':
        return (
          <div className="flex items-center text-nowrap gap-2">
            <div className="p-1.5 bg-success-50 dark:bg-success-950/30 rounded-lg">
              <MapPinHouse className="w-4 h-4 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.warehouseId?.name || 'N/A'}</p>
              <p className="text-xs font-normal">{user?.warehouseId?.location || 'N/A'}</p>

            </div>

          </div>
        )
      
      case 'createdBy':
        return (
          <div className="flex items-center text-nowrap gap-2">
            {/* <User 
              size='sm'
              name={`${user?.createdBy?.name || 'NA'} ${mydata?.data?.id == user?.createdBy?._id && '( You )'}`}
              description={user?.createdBy?.email || 'N/A'}
            /> */}
            <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <ShieldUser className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.createdBy?.name || 'N/A'} {mydata?.data?.id == user?.createdBy?._id && '( You )'}</p>
              <p className="text-xs font-normal">{user?.createdBy?.email || 'N/A'}</p>
            </div>
          </div>
        )
      case 'totalAmount':
        return formatCurrency(user?.totalAmount)
      case 'items.length':
        return user?.items?.length || 0
      case 'expectedDeliveryDate':
      case 'createdAt':
        return (
          <div className="flex text-nowrap items-center gap-2">
            <div className="p-1.5 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
              <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span>{formatDate(user[columnKey]) || 'N/A'}</span>
          </div>
        )
      case 'status':
        return <PurchaseOrderStatusBadge status={user?.status} />
      case 'actions': {
        const actions = (getActionButtons ? getActionButtons(user) : [])
        const first = actions[0]
        const rest = actions.slice(1)
        return (
          <div className='flex items-center text-nowrap gap-2'>
            {/* render primary action as a small icon button or text button */}
            {first ? (
              <Button onPress={first.onClick} isIconOnly size='sm'>
                {first.icon ? first.icon : <Eye className="w-4 h-4" />}
              </Button>
            ) : null}

            {/* <Dropdown>
              <DropdownTrigger>
                <Button variant='light' size='sm' isIconOnly><EllipsisVertical /></Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Actions">
                {rest.length === 0 ? (
                  <DropdownItem key="no-actions">No actions</DropdownItem>
                ) : rest.map((act) => (
                  <DropdownItem key={act.key} onClick={act.onClick} className={`${act.color === 'danger' ? 'text-danger' : ''}`}>
                    <div className="flex items-center gap-2">
                      {act.icon && <span className="w-4 h-4">{act.icon}</span>}
                      <span>{act.label}</span>
                    </div>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown> */}
          </div>
        )
      }
      default:
        return user[columnKey] || 'N/A'
    }
  }, [onViewDetails, getActionButtons])


  const StatusbasesBgColor = (status) => {
    switch (status) {
      case 'PendingApproval':
        return 'bg-warning/10 text-warning'
      case 'Approved':
        return 'bg-blue-500/10 text-blue-500'
      // case 'PartiallyReceived': 
      //   return 'bg-secondary/10 text-secondary'
      case 'Completed':
        return 'bg-success/10 text-success'
      case 'Cancelled':
        return 'bg-danger/10 text-danger'
    }
  }

  return (
    <div>
      <Table shadow='none' isCompact selectionMode='multiple'>
        <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
        <TableBody items={orders}>
          {(item) => (
            <TableRow key={item?._id} className={StatusbasesBgColor(item?.status)}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center overflow-hidden">
          <Pagination color="primary" isCompact page={pagination?.currentPage} total={pagination?.totalPages} onChange={onPageChange} showControls/>
          {/* <select onChange={(e) => setLimit(e.target.value)} value={limit} className='max-w-xs p-1 px-3 border border-default-100'>
            {[10, 20, 50, 100].map(l => (
                <option className='dark:text-black' key={l} value={l}>{l}</option>
            ))}
          </select> */}
        </div>
      )}
    </div>
  )
}