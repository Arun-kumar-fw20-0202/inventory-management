import { useFetchPurchaseOrderById } from '@/libs/mutation/purchase-order/purchase-order-mutation'
import React from 'react'
import PurchaseOrderDetailsModal from '../_components/PurchaseOrderDetailsModal'

const Index = (params) => {
  const orderId = params?.params?.orderId

  return (
    <PurchaseOrderDetailsModal orderId={orderId} />
  )
}

export default Index