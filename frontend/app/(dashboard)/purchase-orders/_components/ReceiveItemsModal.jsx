'use client'
import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Card, CardBody } from '@heroui/card'
import { Package, AlertCircle } from 'lucide-react'
import { useReceivePurchaseOrder } from '@/libs/mutation/purchase-order/purchase-order-mutation'
import { formatCurrency } from '@/libs/utils'

const ReceiveItemsModal = ({ isOpen, onClose, order }) => {
  const [receivingItems, setReceivingItems] = useState({})
  const [errors, setErrors] = useState({})

  const receivePurchaseOrder = useReceivePurchaseOrder()

  // Reset form when modal opens/closes or order changes
  useEffect(() => {
    if (isOpen && order) {
      const initialItems = {}
      order.items?.forEach(item => {
        const maxReceivable = item.quantity - item.receivedQuantity
        if (maxReceivable > 0) {
          initialItems[item.productId._id] = ''
        }
      })
      setReceivingItems(initialItems)
      setErrors({})
    } else {
      setReceivingItems({})
      setErrors({})
    }
  }, [isOpen, order])

  const handleQuantityChange = (productId, value) => {
    setReceivingItems(prev => ({
      ...prev,
      [productId]: value
    }))

    // Clear error when user starts typing
    if (errors[productId]) {
      setErrors(prev => ({
        ...prev,
        [productId]: null
      }))
    }
  }

  const validateQuantities = () => {
    const newErrors = {}
    let hasErrors = false

    Object.entries(receivingItems).forEach(([productId, quantity]) => {
      const item = order.items.find(item => item.productId._id === productId)
      const maxReceivable = item.quantity - item.receivedQuantity
      const numQuantity = parseInt(quantity) || 0

      if (quantity !== '' && (numQuantity <= 0 || numQuantity > maxReceivable)) {
        newErrors[productId] = `Must be between 1 and ${maxReceivable}`
        hasErrors = true
      }
    })

    setErrors(newErrors)
    return !hasErrors
  }

  const handleReceiveItems = async () => {
    if (!validateQuantities()) {
      return
    }

    const receivedItems = Object.entries(receivingItems)
      .filter(([_, quantity]) => quantity && parseInt(quantity) > 0)
      .map(([productId, receivedQuantity]) => ({
        productId,
        receivedQuantity: parseInt(receivedQuantity)
      }))

    if (receivedItems.length === 0) {
      setErrors({ general: 'Please specify quantities to receive' })
      return
    }

    try {
      await receivePurchaseOrder.mutateAsync({
        id: order._id,
        receivedItems
      })
      onClose()
    } catch (error) {
      console.error('Failed to receive items:', error)
      setErrors({ general: 'Failed to receive items. Please try again.' })
    }
  }

  const getTotalReceivingValue = () => {
    return Object.entries(receivingItems).reduce((total, [productId, quantity]) => {
      const item = order?.items?.find(item => item.productId._id === productId)
      const numQuantity = parseInt(quantity) || 0
      return total + (numQuantity * (item?.unitPrice || 0))
    }, 0)
  }

  const getReceivableItems = () => {
    return order?.items?.filter(item => {
      const maxReceivable = item.quantity - item.receivedQuantity
      return maxReceivable > 0
    }) || []
  }

  if (!isOpen || !order) return null

  const receivableItems = getReceivableItems()

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Receive Items</h2>
              <p className="text-sm text-gray-600">
                Order: {order.orderNumber}
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{errors.general}</p>
              </div>
            </div>
          )}

          {receivableItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">All items have been fully received</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  Enter the quantities you are receiving for each item. 
                  Leave blank or enter 0 for items not being received.
                </p>
              </div>

              {receivableItems.map((item) => {
                const maxReceivable = item.quantity - item.receivedQuantity
                const productId = item.productId._id

                return (
                  <Card key={productId} className="shadow-sm">
                    <CardBody>
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Product Info */}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.productId.name}</h4>
                          <p className="text-sm text-gray-600">SKU: {item.productId.sku}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              Ordered: <span className="font-medium">{item.quantity}</span>
                            </span>
                            <span className="text-gray-600">
                              Received: <span className="font-medium">{item.receivedQuantity}</span>
                            </span>
                            <span className="text-gray-600">
                              Remaining: <span className="font-medium text-orange-600">{maxReceivable}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Unit Price: {formatCurrency(item.unitPrice)}
                          </p>
                        </div>

                        {/* Receiving Input */}
                        <div className="w-full md:w-48">
                          <Input
                            type="number"
                            label="Receiving Quantity"
                            placeholder="0"
                            min="0"
                            max={maxReceivable}
                            value={receivingItems[productId] || ''}
                            onValueChange={(value) => handleQuantityChange(productId, value)}
                            isInvalid={!!errors[productId]}
                            errorMessage={errors[productId]}
                            description={`Max: ${maxReceivable}`}
                          />
                          {receivingItems[productId] && parseInt(receivingItems[productId]) > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Value: {formatCurrency(parseInt(receivingItems[productId]) * item.unitPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}

              {/* Summary */}
              {getTotalReceivingValue() > 0 && (
                <Card className="shadow-sm border-2 border-primary-200">
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Total Receiving Value</p>
                        <p className="text-sm text-gray-600">
                          {Object.values(receivingItems).filter(q => q && parseInt(q) > 0).length} items
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(getTotalReceivingValue())}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-2 w-full justify-between">
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            {receivableItems.length > 0 && (
              <Button 
                color="primary"
                onPress={handleReceiveItems}
                isLoading={receivePurchaseOrder.isPending}
                isDisabled={getTotalReceivingValue() === 0}
              >
                {receivePurchaseOrder.isPending ? 'Receiving...' : 'Receive Items'}
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ReceiveItemsModal