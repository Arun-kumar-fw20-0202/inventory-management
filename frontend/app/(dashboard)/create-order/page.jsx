'use client'
import SupplierCustomerAutocomplete from '@/components/dynamic/supplier-customer/supplier-customer-autocomplete'
import WarehouseAutocomplete from '@/components/dynamic/warehouse/warehouse-autocomplete-'
import PageAccess from '@/components/role-page-access'
import { Button } from '@heroui/button'
import { Textarea, Input } from '@heroui/input'
import { PlusIcon } from 'lucide-react'
import React from 'react'
import { formatCurrency } from '@/libs/utils'
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { useCreatePurchaseOrder } from '@/libs/mutation/purchase-order/purchase-order-mutation'
import SelectProductDrawr from './_components/select-product'
import { useDisclosure } from '@heroui/modal'
import { Card } from '@heroui/card'
import { Select, SelectItem } from '@heroui/select'

const Index = () => {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    const createPurchaseOrder = useCreatePurchaseOrder()

    const { control, handleSubmit, setValue, getValues, formState: { errors } } = useForm({
        defaultValues: {
            supplierId: '',
            warehouseId: '',
            expectedDeliveryDate: '',
            notes: '',
            items: [],
            discountType: 'fixed',
            discountValue: 0,
            extraCharge: 0
        }
    })

    const { fields, append, remove, update } = useFieldArray({ control, name: 'items' })

    // watch items for live totals
    const watchedItems = useWatch({ control, name: 'items' }) || []

    const onProductSelect = (product) => {
        // append product into items field array; user must enter qty/unitPrice
        const existing = fields.find(f => f._id === product._id)
        if (existing) return
        append({
            _id: product._id,
            productId: product.productId || product._id,
            productName: product.productName || product.name,
            sku: product.sku,
            quantity: '',
            unitPrice: ''
        })
    }

    const onProductRemove = (product) => {
        const idx = fields.findIndex(f => f._id === product._id)
        if (idx !== -1) remove(idx)
    }

    const onProductUpdate = (product, { quantity, unitPrice }) => {
        const idx = fields.findIndex(f => f._id === product._id)
        if (idx === -1) return
        update(idx, { ...fields[idx], quantity, unitPrice })
    }

    const calculateTotals = () => {
        const subTotal = (watchedItems || []).reduce((sum, it) => {
            const q = Number(it.quantity) || 0
            const p = Number(it.unitPrice) || 0
            return sum + q * p
        }, 0)
        const discountValue = Number(getValues('discountValue')) || 0
        const discountType = getValues('discountType') || 'fixed'
        const extraCharge = Number(getValues('extraCharge')) || 0
        let discountAmount = 0
        if (discountValue > 0) {
            discountAmount = discountType === 'percent' ? (subTotal * (discountValue / 100)) : discountValue
        }
        const total = Math.max(0, subTotal - discountAmount + extraCharge)
        return { subTotal, discountAmount, total }
    }

    const onSubmit = async (data) => {
        // basic validation
        if (!data.supplierId) return alert('Supplier is required')
        if (!data.warehouseId) return alert('Warehouse is required')
        if (!data.items || data.items.length === 0) return alert('At least one product is required')

        // validate each item
        for (const it of data.items) {
            if (!it.quantity || Number(it.quantity) < 1) return alert('Quantity must be at least 1 for all items')
            if (!it.unitPrice || Number(it.unitPrice) <= 0) return alert('Unit price must be > 0 for all items')
        }

        const totals = calculateTotals()

        const payload = {
            supplierId: data.supplierId,
            warehouseId: data.warehouseId,
            expectedDeliveryDate: data.expectedDeliveryDate || undefined,
            notes: data.notes,
            items: data.items.map(it => ({ productId: it.productId, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
            pricing: {
                subTotal: totals.subTotal,
                discountType: data.discountType,
                discountValue: Number(data.discountValue) || 0,
                discountAmount: totals.discountAmount,
                extraCharge: Number(data.extraCharge) || 0,
                total: totals.total
            }
        }

        try {
            await createPurchaseOrder.mutateAsync(payload)
            // reset form
            window.location.reload()
        } catch (err) {
            // handled by hook
        }
    }
    return (
        <PageAccess allowedRoles={['superadmin', 'admin', 'manager']}>
            <div className="p-6">
                <h1 className="text-3xl font-bold">New Purchase Order</h1>
                <p className="text-gray-600">This is the create order page.</p>
            </div>
            <SelectProductDrawr 
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onOpen={onOpen}
                selectedProducts={fields || []}
                onProductSelect={onProductSelect}
                onProductRemove={onProductRemove}
                onProductUpdate={onProductUpdate}
            />
            
            <div className='p-6 grid grid-cols-2 gap-4'>
                {/* Autocomplete Components */}
                <Controller
                    control={control}
                    name="supplierId"
                    rules={{ required: 'Supplier is required' }}
                    render={({ field }) => (
                        <SupplierCustomerAutocomplete
                            label="Select Supplier"
                            type="supplier"
                            variant='bordered'
                            placeholder="Search and select a supplier"
                            onSelectChange={(supplierId) => field.onChange(supplierId ? supplierId : '')}
                            isInvalid={!!errors.supplierId}
                            errorMessage={errors.supplierId && errors.supplierId.message}
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="warehouseId"
                    rules={{ required: 'Warehouse is required' }}
                    render={({ field }) => (
                        <WarehouseAutocomplete
                            label="Select Warehouse"
                            variant='bordered'
                            placeholder="Search and select a warehouse"
                            onSelectChange={(warehouseId) => field.onChange(warehouseId ? warehouseId : '')}
                            isInvalid={!!errors.warehouseId}
                            errorMessage={errors.warehouseId && errors.warehouseId.message}
                        />
                    )}
                />
                {/* expectedDeliveryDate */}
                <Controller control={control} name="expectedDeliveryDate" render={({ field }) => (
                    <Input type='date' label="Expected Delivery Date" value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} />
                )} />

                <Button color="primary" size='lg' endContent={<PlusIcon />} onPress={onOpen}>
                    Select Products 
                </Button>

                {/* Selected products preview */}
                <div className="col-span-2">
                    <h3 className="font-semibold mb-2">Selected Products</h3>
                    {fields.length === 0 ? (
                        <p className="text-sm text-gray-500">No products selected</p>
                    ) : (
                        <div className="space-y-2">
                            {fields.map((p, index) => (
                                <Card key={p.id} className="p-3 rounded flex-row flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-medium">{p.productName}</div>
                                        <div className="text-sm text-gray-500">SKU: {p.sku}</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Controller
                                            control={control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <Input type="number" variant='bordered' className="w-28" value={field.value?.toString() || ''} placeholder="Qty" onChange={(e) => field.onChange(e.target.value)} />
                                            )}
                                        />

                                        <Controller
                                            control={control}
                                            name={`items.${index}.unitPrice`}
                                            render={({ field }) => (
                                                <Input type="number" variant='bordered' className="w-36" value={field.value?.toString() || ''} placeholder="Unit Price" onChange={(e) => field.onChange(e.target.value)} />
                                            )}
                                        />

                                        <Button color="danger" variant="light" onPress={() => remove(index)}>Remove</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                

                {/* notes */}
                <Controller control={control} name="notes" render={({ field }) => (
                    <Textarea label="Notes" placeholder="Enter any additional notes for the purchase order" value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} />
                )} />
                {/* subtotal discount etc box */}
                <Card className="p-2 gap-4">
                    <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex justify-between">
                        <p className="font-medium">Sub-total</p>
                        <p className="font-semibold">{formatCurrency(calculateTotals()?.subTotal || 0)}</p>
                    </div>
                    <div className="flex gap-4 mt-2">
                        <Controller control={control} name="discountType" render={({ field }) => (
                            <Select {...field} variant='bordered' label='Discount Type'>
                                <SelectItem key='percent' value='percent'>%</SelectItem>
                                <SelectItem key='fixed' value='fixed'>Fixed</SelectItem>
                            </Select>
                        )} />

                        <Controller control={control} name="discountValue" render={({ field }) => (
                            <Input label='Discount' variant='bordered' type='number' value={field.value?.toString() || '0'} onChange={(e) => field.onChange(e.target.value)} />
                        )} />
                    </div>
                    <div className="mt-2">
                        <Controller control={control} name="extraCharge" render={({ field }) => (
                            <Input label='Extra Charge' variant='bordered' type='number' value={field.value?.toString() || '0'} onChange={(e) => field.onChange(e.target.value)} />
                        )} />
                    </div>

                    <div className="flex justify-between mt-4">
                        <p className="font-medium">Total</p>
                        <p className="font-semibold">{formatCurrency(calculateTotals()?.total || 0)}</p>
                    </div>

                    <div className="mt-4">
                        <Button type="submit" color="primary">Create Purchase Order</Button>
                    </div>
                    </form>
                </Card>
            </div>

        </PageAccess>
    )
}

export default Index