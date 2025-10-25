'use client'
import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { Textarea } from '@heroui/input'
import { Chip } from '@heroui/chip'
import { IndianRupee, X } from 'lucide-react'
import toast from 'react-hot-toast'
import CategoryAutocomplete from '@/components/dynamic/category/category-autocomplete'
import WarehouseAutocomplete from '@/components/dynamic/warehouse/warehouse-autocomplete-'
import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from '@heroui/drawer'

const StockModal = ({ isOpen, onClose, mode = 'create', stockData = null, onSubmit }) => { // mode --> 'create' | 'edit'
   const {
      control,
      handleSubmit,
      reset,
      setValue,
      watch,
      formState: { errors, isSubmitting }
   } = useForm({
      defaultValues: {
         productName: '',
         sku: '',
         category: '',
         description: '',
         quantity: 0,
         unit: 'pcs',
         purchasePrice: 0,
         sellingPrice: 0,
         lowStockThreshold: 5,
         status: 'active',
         tags: []
      }
   })

   // console.log(stockData)

   const watchedTags = watch('tags')

  // Unit options based on schema enum
   const unitOptions = [
      { value: 'pcs', label: 'Pieces' },
      { value: 'kg', label: 'Kilograms' },
      { value: 'ltr', label: 'Liters' },
      { value: 'box', label: 'Box' },
      { value: 'packet', label: 'Packet' }
   ]

  // Status options based on schema enum
   const statusOptions = [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'archived', label: 'Archived' }
   ]

  // Populate form when editing
   useEffect(() => {
      if (mode === 'edit' && stockData) {
         // console.log(stockData)
         reset({
            productName: stockData.productName || '',
            sku: stockData.sku || '',
            category: stockData.category?._id || '',
            warehouse: stockData.warehouse?._id || '',
            description: stockData.description || '',
            quantity: stockData.quantity || 0,
            unit: stockData.unit || 'pcs',
            purchasePrice: stockData.purchasePrice || 0,
            sellingPrice: stockData.sellingPrice || 0,
            lowStockThreshold: stockData.lowStockThreshold || 5,
            status: stockData.status || 'active',
            tags: stockData.tags || []
         })
      } else if (mode === 'create') {
         reset({
            productName: '',
            sku: '',
            category: '',
            description: '',
            quantity: 0,
            unit: 'pcs',
            purchasePrice: 0,
            sellingPrice: 0,
            lowStockThreshold: 5,
            status: 'active',
            tags: []
         })
      }
   }, [mode, stockData, reset])

  // Handle form submission
   const onFormSubmit = async (data) => {
      try {
         // Transform SKU to uppercase as per schema requirement
         const formattedData = {
            ...data,
            sku: data.sku.toUpperCase(),
            quantity: Number(data.quantity),
            purchasePrice: Number(data.purchasePrice),
            sellingPrice: Number(data.sellingPrice),
            lowStockThreshold: Number(data.lowStockThreshold)
         }

         await onSubmit(formattedData)
         
         // Success message and modal closing is handled by the parent component
         
      } catch (error) {
         // Error message is handled by the mutation hook
         // Don't close modal on error so user can retry
         console.error('Form submission error:', error)
      }
   }

  // Handle tag addition
   const handleAddTag = (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
         e.preventDefault()
         const newTag = e.target.value.trim()
         const currentTags = watchedTags || []
         
         if (!currentTags.includes(newTag)) {
         setValue('tags', [...currentTags, newTag])
         e.target.value = ''
         }
      }
   }

  // Handle tag removal
   const handleRemoveTag = (tagToRemove) => {
      const currentTags = watchedTags || []
      setValue('tags', currentTags.filter(tag => tag !== tagToRemove))
   }

   return (
      <Drawer 
         isOpen={isOpen} 
         onClose={onClose}
         size="2xl"
         scrollBehavior="inside"
      >
         <DrawerContent>
               <DrawerHeader>
                  <h3 className="text-xl font-semibold">{mode === 'create' ? 'Add New Stock Item' : 'Edit Stock Item'}</h3>
               </DrawerHeader>

               <DrawerBody className="space-y-4">
                  <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                     {/* Product Name */}
                     <Controller
                        name="productName"
                        control={control}
                        rules={{ 
                           required: 'Product name is required',
                           minLength: { value: 2, message: 'Product name must be at least 2 characters' }
                        }}
                        render={({ field }) => (
                           <Input variant='bordered' {...field} label="Product Name" isRequired placeholder="Enter product name" isInvalid={!!errors.productName} errorMessage={errors.productName?.message} />
                        )}
                     />

                     {/* SKU */}
                     <Controller
                        name="sku"
                        control={control}
                        rules={{ 
                           required: 'SKU is required',
                           pattern: {
                              value: /^[A-Z0-9-_]+$/i,
                              message: 'SKU can only contain letters, numbers, hyphens, and underscores'
                           }
                        }}
                        render={({ field }) => (
                           <Input
                                 variant='bordered'
                                 {...field}
                                 label="SKU (Stock Keeping Unit)"
                                 isRequired
                                 placeholder="Enter SKU (will be converted to uppercase)"
                                 isInvalid={!!errors.sku}
                                 errorMessage={errors.sku?.message}
                                 onBlur={(e) => {
                                 field.onBlur(e)
                                 setValue('sku', e.target.value.toUpperCase())
                              }}
                           />
                        )}
                     />

                     {/* Category */}
                     <Controller
                        name="category"
                        control={control}
                        rules={{ required: 'Category is required' }}
                        render={({ field }) => (
                           <>
                              {/* {console.log(field.value)} */}
                              <CategoryAutocomplete 
                                 onSelectChange={(value) => setValue('category', value)}
                                 variant='bordered'
                                 label="Category"
                                 isRequired
                                 // defaultSelectedKey={field.value}
                                 // key={field.value} 
                                 
                                 defaultSelectedKey={field.value}
                                 key={field.value} 
                                 placeholder="Select or type to search category"
                              />
                           </>
                        )}
                     />

                     {/* Category */}
                     <Controller
                        name="warehouse"
                        control={control}
                        rules={{ required: 'Warehouse is required' }}
                        render={({ field }) => (
                           <>
                              {/* {field.value} */}
                              <WarehouseAutocomplete 
                                 onSelectChange={(value) => setValue('warehouse', value)}
                                 variant='bordered'
                                 defaultSelectedKey={field.value}
                                 key={field.value} 
                                 label="Warehouse"
                                 isRequired
                                 placeholder="Select or type to search warehouse"
                              />
                           </>
                        )}
                     />

                     {/* Description */}
                     <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                           <Textarea
                              variant='bordered'
                              {...field}
                              label="Description"
                              placeholder="Enter product description (optional)"
                              minRows={2}
                              maxRows={4}
                           />
                        )}
                     />

                     {/* Quantity and Unit */}
                     <div className="grid grid-cols-2 gap-4">
                        <Controller
                           name="quantity"
                           control={control}
                           rules={{ 
                              required: 'Quantity is required',
                              min: { value: 0, message: 'Quantity cannot be negative' }
                           }}
                           render={({ field }) => (
                              <Input
                                 variant='bordered'
                              {...field}
                              type="number"
                              label="Quantity"
                              isRequired
                              placeholder="Enter quantity"
                              isInvalid={!!errors.quantity}
                              errorMessage={errors.quantity?.message}
                              />
                           )}
                        />

                        <Controller
                           name="unit"
                           control={control}
                           rules={{ required: 'Unit is required' }}
                           render={({ field }) => (
                              <Select
                                 variant='bordered'
                                 {...field}
                                 label="Unit"
                                 isRequired
                                 placeholder="Select unit"
                                 selectedKeys={field.value ? [field.value] : []}
                                 onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0]
                                    field.onChange(selectedKey)
                                 }}
                              >
                              {unitOptions.map((unit) => (
                                 <SelectItem key={unit.value} value={unit.value}>
                                    {unit.label}
                                 </SelectItem>
                              ))}
                              </Select>
                           )}
                        />
                     </div>

                     {/* Purchase Price and Selling Price */}
                     <div className="grid grid-cols-2 gap-4">
                        <Controller
                           name="purchasePrice"
                           control={control}
                           rules={{ 
                              required: 'Purchase price is required',
                              min: { value: 0, message: 'Purchase price cannot be negative' }
                           }}
                           render={({ field }) => (
                              <Input
                                 variant='bordered'
                                 {...field}
                                 type="number"
                                 step="0.01"
                                 label="Purchase Price"
                                 isRequired
                                 placeholder="0.00"
                                 startContent={<span className="text-default-400"><IndianRupee size={16} /></span>}
                                 isInvalid={!!errors.purchasePrice}
                                 errorMessage={errors.purchasePrice?.message}
                              />
                           )}
                        />

                        <Controller
                           name="sellingPrice"
                           control={control}
                           rules={{ 
                              required: 'Selling price is required',
                              min: { value: 0, message: 'Selling price cannot be negative' }
                           }}
                           render={({ field }) => (
                              <Input
                                 variant='bordered'
                                 {...field}
                                 type="number"
                                 step="0.01"
                                 label="Selling Price"
                                 isRequired
                                 placeholder="0.00"
                                 startContent={<span className="text-default-400"><IndianRupee size={16} /></span>}
                                 isInvalid={!!errors.sellingPrice}
                                 errorMessage={errors.sellingPrice?.message}
                              />
                           )}
                        />
                     </div>

                     {/* Low Stock Threshold and Status */}
                     <div className="grid grid-cols-2 gap-4">
                        <Controller
                           name="lowStockThreshold"
                           control={control}
                           rules={{ 
                              min: { value: 0, message: 'Threshold cannot be negative' }
                           }}
                           render={({ field }) => (
                              <Input
                                 variant='bordered'
                                 {...field}
                                 type="number"
                                 label="Low Stock Threshold"
                                 placeholder="5"
                                 isInvalid={!!errors.lowStockThreshold}
                                 errorMessage={errors.lowStockThreshold?.message}
                              />
                           )}
                        />

                        <Controller
                           name="status"
                           control={control}
                           rules={{ required: 'Status is required' }}
                           render={({ field }) => (
                              <Select
                                 {...field}
                                 variant='bordered'
                                 label="Status"
                                 isRequired
                                 placeholder="Select status"
                                 selectedKeys={field.value ? [field.value] : []}
                                 onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0]
                                    field.onChange(selectedKey)
                                 }}
                              >
                                 {statusOptions.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                       {status.label}
                                    </SelectItem>
                                 ))}
                              </Select>
                           )}
                        />
                     </div>

                     {/* Tags */}
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Tags</label>
                        <Input variant='bordered' placeholder="Type a tag and press Enter" onKeyDown={handleAddTag} />
                        {watchedTags && watchedTags.length > 0 && (
                           <div className="flex flex-wrap gap-2 mt-2">
                              {watchedTags.map((tag, index) => (
                              <Chip
                                 key={index}
                                 variant="flat"
                                 color="primary"
                                 endContent={
                                    <X 
                                    className="w-3 h-3 cursor-pointer" 
                                    onClick={() => handleRemoveTag(tag)}
                                    />
                                 }
                              >
                                 {tag}
                              </Chip>
                              ))}
                           </div>
                        )}
                     </div>

                     <div className="flex">
                        <Button variant="light" onPress={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button color="primary" type="submit" isLoading={isSubmitting}>{mode === 'create' ? 'Create Stock Item' : 'Update Stock Item'}</Button>
                     </div>
                  </form>
               </DrawerBody>

               <ModalFooter></ModalFooter>
         </DrawerContent>
      </Drawer>
   )
}

export default StockModal
