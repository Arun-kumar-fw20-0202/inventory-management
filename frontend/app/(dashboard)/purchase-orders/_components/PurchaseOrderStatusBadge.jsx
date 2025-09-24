'use client'
import React from 'react'
import { Chip } from '@heroui/chip'

const PurchaseOrderStatusBadge = ({ status, size = "sm" }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Draft':
        return {
          color: 'default',
          variant: 'flat',
          className: 'bg-gray-100 text-gray-700'
        }
      case 'PendingApproval':
        return {
          color: 'warning',
          variant: 'flat',
          className: 'bg-yellow-100 text-yellow-700'
        }
      case 'Approved':
        return {
          color: 'primary',
          variant: 'flat',
          className: 'bg-blue-100 text-blue-700'
        }
      case 'PartiallyReceived':
        return {
          color: 'secondary',
          variant: 'flat',
          className: 'bg-orange-100 text-orange-700'
        }
      case 'Completed':
        return {
          color: 'success',
          variant: 'flat',
          className: 'bg-green-100 text-green-700'
        }
      case 'Cancelled':
        return {
          color: 'danger',
          variant: 'flat',
          className: 'bg-red-100 text-red-700'
        }
      default:
        return {
          color: 'default',
          variant: 'flat',
          className: 'bg-gray-100 text-gray-700'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Chip
      size={size}
      variant={config.variant}
      className={config.className}
    >
      {status}
    </Chip>
  )
}

export default PurchaseOrderStatusBadge