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
import { Input, Textarea } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { Card, CardBody } from '@heroui/card'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { useCreatePurchaseOrder } from '@/libs/mutation/purchase-order/purchase-order-mutation'
import { formatCurrency } from '@/libs/utils'
import WarehouseAutocomplete from '@/components/dynamic/warehouse/warehouse-autocomplete-'
import SupplierCustomerAutocomplete from '@/components/dynamic/supplier-customer/supplier-customer-autocomplete'
import StockAutocomplete from '@/components/dynamic/stock/stock-autocomplete'

const CreatePurchaseOrderModal = ({ isOpen, onClose, suppliers = [], warehouses = [], products = [] }) => {
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }]
  })
  const [errors, setErrors] = useState({})

  const createPurchaseOrder = useCreatePurchaseOrder()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        supplierId: '',
        warehouseId: '',
        expectedDeliveryDate: '',
        notes: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }]
      })
      setErrors({})
    }
  }, [isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' ? parseInt(value) || 0 : 
               field === 'unitPrice' ? parseFloat(value) || 0 : 
               value
    }
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))

    // Clear item error
    if (errors[`items.${index}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`items.${index}.${field}`]: null
      }))
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0 }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData(prev => ({
        ...prev,
        items: newItems
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (!formData.warehouseId) newErrors.warehouseId = 'Warehouse is required'

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`items.${index}.productId`] = 'Product is required'
      }
      if (!item.quantity || item.quantity < 1) {
        newErrors[`items.${index}.quantity`] = 'Quantity must be at least 1'
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        newErrors[`items.${index}.unitPrice`] = 'Unit price must be greater than 0'
      }
    })

    // Check for duplicate products
    const productIds = formData.items.map(item => item.productId).filter(Boolean)
    const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      newErrors.general = 'Duplicate products are not allowed'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice)
    }, 0)
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const submitData = {
        ...formData,
        items: formData.items.filter(item => 
          item.productId && item.quantity > 0 && item.unitPrice > 0
        )
      }

      await createPurchaseOrder.mutateAsync(submitData)
      onClose()
    } catch (error) {
      console.error('Failed to create purchase order:', error)
      setErrors({ general: 'Failed to create purchase order. Please try again.' })
    }
  }

  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId)
    return product ? `${product.name} (${product.sku})` : ''
  }

  if (!isOpen) return null

  const totalAmount = calculateTotal()

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Create Purchase Order</h2>
          <p className="text-sm text-gray-600">Create a new purchase order for inventory procurement</p>
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

          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardBody>
                <h3 className="font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SupplierCustomerAutocomplete
                     onSelectChange={(supplier) => handleInputChange('supplierId', supplier ? supplier._id : '')}
                     variant='bordered'
                     label="Supplier"
                     placeholder="Select a supplier"
                     isInvalid={!!errors.supplierId}
                     errorMessage={errors.supplierId}
                     isRequired
                  />

                  <WarehouseAutocomplete 
                     onSelect={(warehouse) => handleInputChange('warehouseId', warehouse ? warehouse._id : '')}
                     variant='bordered'
                     label="Warehouse"
                     placeholder="Select a warehouse"
                     isInvalid={!!errors.warehouseId}
                     errorMessage={errors.warehouseId}
                     isRequired
                  />

                  <Input
                    variant='bordered'
                    type="date"
                    label="Expected Delivery Date"
                    value={formData.expectedDeliveryDate}
                    onValueChange={(value) => handleInputChange('expectedDeliveryDate', value)}
                    isInvalid={!!errors.expectedDeliveryDate}
                    errorMessage={errors.expectedDeliveryDate}
                  />
                </div>

                <div className="mt-4">
                  <Textarea
                    variant='bordered'
                    label="Notes"
                    placeholder="Add any additional notes or special instructions..."
                    value={formData.notes}
                    onValueChange={(value) => handleInputChange('notes', value)}
                    maxRows={3}
                  />
                </div>
                <div className="mt-4">
                  <StockAutocomplete
                     onSelectChange={(stock) => handleInputChange('stockId', stock ? stock._id : '')}
                     variant='bordered'
                     label="Stock"
                     placeholder="Select a stock"
                     isInvalid={!!errors.stockId}
                     errorMessage={errors.stockId}
                     isRequired
                  />
                </div>
              </CardBody>
            </Card>

            {/* Items */}
            <Card className="shadow-sm">
              <CardBody>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Order Items</h3>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={addItem}
                  >
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">Item #{index + 1}</h4>
                        {formData.items.length > 1 && (
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                           <Select
                              variant='bordered'
                              label="Product"
                              placeholder="Select a product"
                              selectedKeys={item.productId ? [item.productId] : []}
                              onSelectionChange={(keys) => handleItemChange(index, 'productId', Array.from(keys)[0] || '')}
                              isInvalid={!!errors[`items.${index}.productId`]}
                              errorMessage={errors[`items.${index}.productId`]}
                              isRequired
                           >
                              {products.map((product) => (
                                 <SelectItem key={product._id} value={product._id}>
                                 {product.name} ({product.sku})
                                 </SelectItem>
                              ))}
                           </Select>
                        </div>

                        <Input
                          variant='bordered'
                          type="number"
                          label="Quantity"
                          placeholder="0"
                          min="1"
                          value={item.quantity.toString()}
                          onValueChange={(value) => handleItemChange(index, 'quantity', value)}
                          isInvalid={!!errors[`items.${index}.quantity`]}
                          errorMessage={errors[`items.${index}.quantity`]}
                          isRequired
                        />

                        <Input
                          variant='bordered'
                          type="number"
                          label="Unit Price"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={item.unitPrice.toString()}
                          onValueChange={(value) => handleItemChange(index, 'unitPrice', value)}
                          isInvalid={!!errors[`items.${index}.unitPrice`]}
                          errorMessage={errors[`items.${index}.unitPrice`]}
                          startContent="₹"
                          isRequired
                        />
                      </div>

                      {item.productId && item.quantity > 0 && item.unitPrice > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Item Total:</span>
                            <span className="font-medium">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total */}
                {totalAmount > 0 && (
                  <div className="mt-6 pt-4 border-t-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-2 w-full justify-between">
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary"
              onPress={handleSubmit}
              isLoading={createPurchaseOrder.isPending}
              isDisabled={totalAmount === 0}
            >
              {createPurchaseOrder.isPending ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default CreatePurchaseOrderModal