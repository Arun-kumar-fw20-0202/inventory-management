'use client'
import React, { useState, useEffect } from 'react'
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
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader } from '@heroui/drawer'

const CreatePurchaseOrderModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }]
  })
  // selectedStocks holds items user chose from StockAutocomplete
  // each entry: { _id, name, quantity, unitPrice, ...rest }
  const [selectedStocks, setSelectedStocks] = useState([])

  // discount: support fixed or percent
  const [discountType, setDiscountType] = useState('fixed') // 'fixed' | 'percent'
  const [discountValue, setDiscountValue] = useState(0)
  const [extraCharge, setExtraCharge] = useState(0)
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
      setSelectedStocks([])
      setDiscountType('fixed')
      setDiscountValue(0)
      setExtraCharge(0)
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

  // Add selected stock to list (if not already present)
  const handleStockSelect = (stock) => {
    if (!stock || !stock._id) return
    setSelectedStocks(prev => {
      const exists = prev.find(s => s._id === stock._id)
      if (exists) return prev
      return [...prev, { ...stock, quantity: 1, unitPrice: 0 }]
    })
    // clear error
    if (errors.stockId) {
      setErrors(prev => ({ ...prev, stockId: null }))
    }
  }

  const handleSelectedStockChange = (stockId, field, value) => {
    setSelectedStocks(prev => prev.map(s => {
      if (s._id !== stockId) return s
      return {
        ...s,
        [field]: field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0
      }
    }))

    if (errors[`stock.${stockId}.${field}`]) {
      setErrors(prev => ({ ...prev, [`stock.${stockId}.${field}`]: null }))
    }
  }

  const removeSelectedStock = (stockId) => {
    setSelectedStocks(prev => prev.filter(s => s._id !== stockId))
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (!formData.warehouseId) newErrors.warehouseId = 'Warehouse is required'

    // Validate selected stocks
    if (!selectedStocks || selectedStocks.length === 0) {
      newErrors.stockId = 'At least one stock must be selected'
    } else {
      selectedStocks.forEach(s => {
        if (!s.quantity || s.quantity < 1) {
          newErrors[`stock.${s._id}.quantity`] = 'Quantity must be at least 1'
        }
        if (!s.unitPrice || s.unitPrice <= 0) {
          newErrors[`stock.${s._id}.unitPrice`] = 'Unit price must be greater than 0'
        }
      })
    }

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
    const itemsTotal = formData.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice)
    }, 0)
    
    const stockTotal = selectedStocks.reduce((total, s) => {
      const q = s.quantity || 0
      const p = s.unitPrice || 0
      return total + (q * p)
    }, 0)

    const subTotal = itemsTotal + stockTotal

    // discount
    let discountAmount = 0
    if (discountValue && discountValue > 0) {
      if (discountType === 'percent') {
        discountAmount = (subTotal * (discountValue / 100))
      } else {
        discountAmount = discountValue
      }
    }

    const total = Math.max(0, subTotal - discountAmount + (extraCharge || 0))
    return { total, subTotal, discountAmount }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      const totals = calculateTotal()
      const submitData = {
        ...formData,
        items: formData.items.filter(item => 
          item.productId && item.quantity > 0 && item.unitPrice > 0
        ),
        stocks: selectedStocks.map(s => ({ stockId: s._id, stockName: s.name, quantity: s.quantity, unitPrice: s.unitPrice })),
        pricing: {
          subTotal: totals.subTotal,
          discountType,
          discountValue,
          discountAmount: totals.discountAmount,
          extraCharge,
          total: totals.total
        }
      }

      await createPurchaseOrder.mutateAsync(submitData)
      onClose()
    } catch (error) {
      console.error('Failed to create purchase order:', error)
      setErrors({ general: 'Failed to create purchase order. Please try again.' })
    }
  }

  if (!isOpen) return null

  const totals = calculateTotal()

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
    >
      <DrawerContent>
        <DrawerHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Create Purchase Order</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create a new purchase order for inventory procurement</p>
        </DrawerHeader>

        <DrawerBody>
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
                     onSelectChange={handleStockSelect}
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

            {/* Selected Stocks List */}
            {selectedStocks.length > 0 && (
              <Card className="shadow-sm">
                <CardBody>
                  <h3 className="font-semibold mb-4">Selected Stocks</h3>

                  <div className="space-y-3">
                    {selectedStocks.map(s => (
                      <div key={s._id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">{s.name}</h4>
                            <p className="text-tiny text-gray-500">ID: {s._id}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center w-full md:w-1/2">
                          <Input
                            variant='bordered'
                            type="number"
                            label="Quantity"
                            min="1"
                            value={(s.quantity || 0).toString()}
                            onValueChange={(value) => handleSelectedStockChange(s._id, 'quantity', value)}
                            isInvalid={!!errors[`stock.${s._id}.quantity`]}
                            errorMessage={errors[`stock.${s._id}.quantity`]}
                          />

                          <Input
                            variant='bordered'
                            type="number"
                            label="Unit Price"
                            min="0"
                            step="0.01"
                            value={(s.unitPrice || 0).toString()}
                            onValueChange={(value) => handleSelectedStockChange(s._id, 'unitPrice', value)}
                            isInvalid={!!errors[`stock.${s._id}.unitPrice`]}
                            errorMessage={errors[`stock.${s._id}.unitPrice`]}
                            startContent="₹"
                          />

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm">Total: <span className="font-medium">{formatCurrency((s.quantity||0) * (s.unitPrice||0))}</span></div>
                            </div>
                            <Button size="sm" color="danger" variant="light" onPress={() => removeSelectedStock(s._id)}>Remove</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Pricing: Subtotal, Discount, Charges, Grand Total */}
            <Card className="shadow-sm">
              <CardBody>
                <h3 className="font-semibold mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-1">
                    <div className="mb-2 text-sm text-gray-600">Sub Total</div>
                    <div className="text-lg font-medium">{formatCurrency(calculateTotal().subTotal || 0)}</div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-gray-600">Discount</div>
                    <div className="flex gap-2 items-center">
                      <Select value={discountType} onValueChange={(v) => setDiscountType(v)}>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="percent">Percent</SelectItem>
                      </Select>
                      <Input variant='bordered' type="number" value={discountValue.toString()} onValueChange={(v) => setDiscountValue(parseFloat(v)||0)} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Discount amount: {formatCurrency(calculateTotal().discountAmount || 0)}</div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-gray-600">Extra Charge</div>
                    <Input variant='bordered' type="number" value={extraCharge.toString()} onValueChange={(v) => setExtraCharge(parseFloat(v)||0)} startContent="₹" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold">Grand Total</div>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal().total || 0)}</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Items */}
            <Card className="shadow-sm">
              <CardBody>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Additional Order Items</h3>
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {totals.total > 0 && (
                  <div className="mt-6 pt-4 border-t-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <div className="flex gap-2 w-full justify-between">
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary"
              onPress={handleSubmit}
              isLoading={createPurchaseOrder.isPending}
              isDisabled={(calculateTotal().total || 0) === 0 || (selectedStocks.length === 0 && formData.items.every(item => !item.productId))}
            >
              {createPurchaseOrder.isPending ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default CreatePurchaseOrderModal