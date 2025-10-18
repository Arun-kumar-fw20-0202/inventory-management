'use client'
import WarehouseAutocomplete from '@/components/dynamic/warehouse/warehouse-autocomplete-'
import SupplierCustomerAutocomplete from '@/components/dynamic/supplier-customer/supplier-customer-autocomplete'
import PageAccess from '@/components/role-page-access'
import { Button } from '@heroui/button'
import { Textarea, Input } from '@heroui/input'
import { Boxes, IndianRupee, Plus, Package, Calendar, FileText, Receipt, Trash2, ShoppingCart } from 'lucide-react'
import React from 'react'
import { formatCurrency } from '@/libs/utils'
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { useCreatePurchaseOrder } from '@/libs/mutation/purchase-order/purchase-order-mutation'
import SelectProductDrawr from './_components/select-product'
import { useDisclosure } from '@heroui/modal'
import { Card } from '@heroui/card'
import { Select, SelectItem } from '@heroui/select'
import { Divider } from '@heroui/divider'

const Index = () => {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    const createPurchaseOrder = useCreatePurchaseOrder()

    const { control, handleSubmit, setValue, getValues, formState: { errors }, reset } = useForm({
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
            unitPrice: product.purchasePrice || 0,
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
            reset({
                supplierId: '',
                warehouseId: '',
                expectedDeliveryDate: '',
                notes: '',
                items: [],
                discountType: 'fixed',
                discountValue: 0,
                extraCharge: 0
            })
            // window.location.reload()
        } catch (err) {
            // handled by hook
        }
    }
    return (
        <PageAccess allowedRoles={['superadmin', 'admin', 'manager', 'staff']}>
            <SelectProductDrawr 
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onOpen={onOpen}
                selectedProducts={fields || []}
                onProductSelect={onProductSelect}
                onProductRemove={onProductRemove}
            />
            <div className="min-h-screen bg-gradient-to-br from-default-50 to-default-100 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <ShoppingCart className="text-primary" size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    Create Purchase Order
                                </h1>
                                <p className="text-default-600 mt-1">Fill in the details below to create a new purchase order</p>
                            </div>
                        </div>
                    </div>

                    <div onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Main Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Supplier & Warehouse Info */}
                                <Card className="p-6 shadow-lg">
                                    <div className="flex items-center gap-2 mb-5">
                                        <Package className="text-primary" size={24} />
                                        <h2 className="text-xl font-semibold">Order Information</h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            control={control}
                                            name="supplierId"
                                            rules={{ required: 'Supplier is required' }}
                                            render={({ field }) => (
                                                <SupplierCustomerAutocomplete
                                                    label="Supplier"
                                                    type="supplier"
                                                    variant='bordered'
                                                    defaultSelectedKey={field.value}
                                                    key={field.value} 
                                                    placeholder="Select supplier"
                                                    userData={(data) => field.onChange(data._id)}
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
                                                    label="Delivery Warehouse"
                                                    variant='bordered'
                                                    defaultSelectedKey={field.value}
                                                    key={field.value} 
                                                    placeholder="Select warehouse"
                                                    onSelectChange={(warehouseId) => field.onChange(warehouseId ? warehouseId : '')}
                                                    isInvalid={!!errors.warehouseId}
                                                    errorMessage={errors.warehouseId && errors.warehouseId.message}
                                                />
                                            )}
                                        />

                                        <Controller 
                                            control={control} 
                                            name="expectedDeliveryDate" 
                                            render={({ field }) => (
                                                <Input 
                                                    type='date' 
                                                    label="Expected Delivery Date" 
                                                    variant='bordered'
                                                    startContent={<Calendar size={18} className="text-default-400" />}
                                                    value={field.value || ''} 
                                                    onChange={(e) => field.onChange(e.target.value)} 
                                                />
                                            )} 
                                        />
                                    </div>
                                </Card>

                                {/* Products Section */}
                                <Card className="p-6 shadow-lg">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="text-primary" size={24} />
                                            <h2 className="text-xl font-semibold">Products</h2>
                                            {fields.length > 0 && (
                                                <span className="ml-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                    {fields.length} item{fields.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <Button 
                                            color="primary" 
                                            endContent={<Plus size={18} />} 
                                            onPress={onOpen}
                                            className="font-medium"
                                        >
                                            Add Products
                                        </Button>
                                    </div>

                                    {fields.length === 0 ? (
                                        <div className="flex flex-col min-h-[320px] items-center justify-center border-2 border-dashed border-default-300 rounded-2xl bg-default-50/50">
                                            <div className="p-4 bg-default-100 rounded-full mb-4">
                                                <Boxes size={48} className="text-default-400"/>
                                            </div>
                                            <p className="text-default-600 font-medium mb-2">No products added yet</p>
                                            <p className="text-default-400 text-sm">Click "Add Products" to start building your order</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Table Header */}
                                            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-default-100 rounded-lg text-sm font-semibold text-default-600">
                                                <div className="col-span-5">Product</div>
                                                <div className="col-span-2 text-center">Quantity</div>
                                                <div className="col-span-3 text-center">Unit Price</div>
                                                <div className="col-span-2 text-right">Total</div>
                                            </div>

                                            {/* Product Rows */}
                                            {fields.map((p, index) => {
                                                const qty = Number(watchedItems[index]?.quantity) || 0;
                                                const price = Number(watchedItems[index]?.unitPrice) || 0;
                                                const lineTotal = qty * price;

                                                return (
                                                    <Card key={p.id} className="p-4 shadow-sm border border-default-200 hover:shadow-md transition-shadow">
                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                                            {/* Product Info */}
                                                            <div className="col-span-12 md:col-span-5">
                                                                <div className="font-semibold text-default-800">{p.productName}</div>
                                                                <div className="text-sm text-default-500">SKU: {p.sku}</div>
                                                            </div>

                                                            {/* Quantity */}
                                                            <div className="col-span-6 md:col-span-2">
                                                                <Controller
                                                                    control={control}
                                                                    name={`items.${index}.quantity`}
                                                                    render={({ field }) => (
                                                                        <Input 
                                                                            type="number" 
                                                                            variant='bordered' 
                                                                            size="sm"
                                                                            label="Qty"
                                                                            labelPlacement="outside"
                                                                            className="w-full" 
                                                                            value={field.value?.toString() || ''} 
                                                                            placeholder="0" 
                                                                            onChange={(e) => field.onChange(e.target.value)} 
                                                                        />
                                                                    )}
                                                                />
                                                            </div>

                                                            {/* Unit Price */}
                                                            <div className="col-span-6 md:col-span-3">
                                                                <Controller
                                                                    control={control}
                                                                    name={`items.${index}.unitPrice`}
                                                                    render={({ field }) => (
                                                                        <Input 
                                                                            startContent={<IndianRupee size={16} />} 
                                                                            isDisabled 
                                                                            type="number" 
                                                                            variant='bordered' 
                                                                            size="sm"
                                                                            label="Price"
                                                                            labelPlacement="outside"
                                                                            className="w-full" 
                                                                            value={field.value?.toString() || ''} 
                                                                            placeholder="0.00" 
                                                                            onChange={(e) => field.onChange(e.target.value)} 
                                                                        />
                                                                    )}
                                                                />
                                                            </div>

                                                            {/* Line Total & Remove */}
                                                            <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-end gap-3">
                                                                <div className="text-right">
                                                                    <div className="text-xs text-default-500 md:hidden">Total</div>
                                                                    <div className="font-semibold text-lg text-default-800">
                                                                        {formatCurrency(lineTotal)}
                                                                    </div>
                                                                </div>
                                                                <Button 
                                                                    isIconOnly
                                                                    color="danger" 
                                                                    variant="light" 
                                                                    size="sm"
                                                                    onPress={() => remove(index)}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card>

                                {/* Notes Section */}
                                <Card className="p-6 shadow-lg">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="text-primary" size={24} />
                                        <h2 className="text-xl font-semibold">Additional Notes</h2>
                                    </div>
                                    <Controller 
                                        control={control} 
                                        name="notes" 
                                        render={({ field }) => (
                                            <Textarea 
                                                label="Notes" 
                                                variant='bordered'
                                                placeholder="Add any special instructions, terms, or notes for this purchase order..." 
                                                value={field.value || ''} 
                                                onChange={(e) => field.onChange(e.target.value)}
                                                minRows={4}
                                            />
                                        )} 
                                    />
                                </Card>
                            </div>

                            {/* Right Column - Order Summary */}
                            <div className="lg:col-span-1">
                                <Card className="p-6 shadow-lg sticky top-6">
                                    <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                                        <IndianRupee className="text-primary" size={24} />
                                        Order Summary
                                    </h2>

                                    <div className="space-y-4">
                                        {/* Subtotal */}
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-default-600">Subtotal</span>
                                            <span className="font-semibold text-lg">{formatCurrency(calculateTotals()?.subTotal || 0)}</span>
                                        </div>

                                        <Divider />

                                        {/* Discount */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-default-600">Discount</label>
                                            <div className="flex gap-2">
                                                <Controller 
                                                    control={control} 
                                                    name="discountType" 
                                                    render={({ field }) => (
                                                        <Select 
                                                            {...field} 
                                                            variant='bordered' 
                                                            size="sm"
                                                            className="w-24"
                                                            aria-label="Discount Type"
                                                        >
                                                            <SelectItem key='percent' value='percent'>%</SelectItem>
                                                            <SelectItem key='fixed' value='fixed'>₹</SelectItem>
                                                        </Select>
                                                    )} 
                                                />

                                                <Controller 
                                                    control={control} 
                                                    name="discountValue" 
                                                    render={({ field }) => (
                                                        <Input 
                                                            variant='bordered' 
                                                            size="sm"
                                                            type='number' 
                                                            placeholder="0"
                                                            value={field.value?.toString() || '0'} 
                                                            onChange={(e) => field.onChange(e.target.value)} 
                                                        />
                                                    )} 
                                                />
                                            </div>
                                            {calculateTotals().discountAmount > 0 && (
                                                <div className="text-sm text-success">
                                                    Savings: {formatCurrency(calculateTotals().discountAmount)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Extra Charge */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-default-600">Extra Charges</label>
                                            <Controller 
                                                control={control} 
                                                name="extraCharge" 
                                                render={({ field }) => (
                                                    <Input 
                                                        variant='bordered'
                                                        size="sm"
                                                        type='number' 
                                                        placeholder="Shipping, taxes, etc."
                                                        startContent={<IndianRupee size={16} />}
                                                        value={field.value?.toString() || '0'} 
                                                        onChange={(e) => field.onChange(e.target.value)} 
                                                    />
                                                )} 
                                            />
                                        </div>

                                        <Divider />

                                        {/* Total */}
                                        <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-4">
                                            <span className="text-lg font-semibold">Total Amount</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {formatCurrency(calculateTotals()?.total || 0)}
                                            </span>
                                        </div>

                                        <Button 
                                            type="button"
                                            onClick={handleSubmit(onSubmit)}
                                            color="primary" 
                                            size="lg"
                                            className="w-full font-semibold text-base mt-6"
                                            isLoading={createPurchaseOrder.isPending}
                                        >
                                            Create Purchase Order
                                        </Button>

                                        {/* Quick Stats */}
                                        <div className="mt-6 pt-4 border-t border-default-200">
                                            <div className="text-sm text-default-600 space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Total Items:</span>
                                                    <span className="font-medium text-default-800">{fields.length}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Total Quantity:</span>
                                                    <span className="font-medium text-default-800">
                                                        {(watchedItems || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageAccess>
    )
}

export default Index