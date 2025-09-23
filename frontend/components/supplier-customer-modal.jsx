'use client'
import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Button } from '@heroui/button'
import { Input, Textarea } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { Chip } from '@heroui/chip'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Switch } from '@heroui/switch'
import { Divider } from '@heroui/divider'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useCreateSupplierCustomer, useUpdateSupplierCustomer } from '@/libs/mutation/suppliser-customer/suppliser-customer-mutation-query'

const SupplierCustomerModal = ({ 
   isOpen, 
   onClose, 
   editData = null, 
   defaultType = 'supplier' 
}) => {
   const [formData, setFormData] = useState({
      // Basic Information
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      companyName: '',
      type: defaultType,
      
      // Address
      address: {
         street: '',
         city: '',
         state: '',
         zipCode: '',
         country: 'USA'
      },
      
      // Contact Person
      contactPerson: {
         name: '',
         designation: '',
         email: '',
         phone: ''
      },
      
      // Business Details
      taxId: '',
      gstNumber: '',
      website: '',
      status: 'active',
      category: 'standard',
      
      // Financial Information
      creditLimit: 0,
      currentBalance: 0,
      paymentTerms: 'net30',
      paymentMethod: 'bank_transfer',
      
      // Bank Details
      bankDetails: {
         accountNumber: '',
         routingNumber: '',
         bankName: '',
         accountHolderName: ''
      },
      
      // Additional Info
      rating: 3,
      tags: [],
      notes: '',
      internalNotes: ''
   })

   const [newTag, setNewTag] = useState('')
   const [showAdvanced, setShowAdvanced] = useState(false)
   const [loading, setLoading] = useState(false)

   const createMutation = useCreateSupplierCustomer()
   const updateMutation = useUpdateSupplierCustomer()

   // Initialize form data
   useEffect(() => {
      if (editData) {
         setFormData({
            ...editData,
            address: editData.address || {
               street: '',
               city: '',
               state: '',
               zipCode: '',
               country: 'USA'
            },
            contactPerson: editData.contactPerson || {
               name: '',
               designation: '',
               email: '',
               phone: ''
            },
            bankDetails: editData.bankDetails || {
               accountNumber: '',
               routingNumber: '',
               bankName: '',
               accountHolderName: ''
            },
            tags: editData.tags || []
         })
      } else {
         // Reset form for new entry
         setFormData({
            name: '',
            email: '',
            phone: '',
            alternatePhone: '',
            companyName: '',
            type: defaultType,
            address: {
               street: '',
               city: '',
               state: '',
               zipCode: '',
               country: 'USA'
            },
            contactPerson: {
               name: '',
               designation: '',
               email: '',
               phone: ''
            },
            taxId: '',
            gstNumber: '',
            website: '',
            status: 'active',
            category: 'standard',
            creditLimit: 0,
            currentBalance: 0,
            paymentTerms: 'net30',
            paymentMethod: 'bank_transfer',
            bankDetails: {
               accountNumber: '',
               routingNumber: '',
               bankName: '',
               accountHolderName: ''
            },
            rating: 3,
            tags: [],
            notes: '',
            internalNotes: ''
         })
      }
   }, [editData, defaultType])

   const handleInputChange = (field, value, nested = null) => {
      if (nested) {
         setFormData(prev => ({
            ...prev,
            [nested]: {
               ...prev[nested],
               [field]: value
            }
         }))
      } else {
         setFormData(prev => ({
            ...prev,
            [field]: value
         }))
      }
   }

   const handleAddTag = () => {
      if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
         setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, newTag.trim().toLowerCase()]
         }))
         setNewTag('')
      }
   }

   const handleRemoveTag = (tagToRemove) => {
      setFormData(prev => ({
         ...prev,
         tags: prev.tags.filter(tag => tag !== tagToRemove)
      }))
   }

   const handleSubmit = async () => {
      try {
         setLoading(true)
         
         if (editData) {
            await updateMutation.mutateAsync({
               id: editData._id,
               data: formData
            })
         } else {
            await createMutation.mutateAsync(formData)
         }
         
         onClose()
      } catch (error) {
         console.error('Submit error:', error)
      } finally {
         setLoading(false)
      }
   }

   const typeOptions = [
      { key: 'supplier', label: 'Supplier' },
      { key: 'customer', label: 'Customer' },
      { key: 'both', label: 'Both' }
   ]

   const statusOptions = [
      { key: 'active', label: 'Active' },
      { key: 'inactive', label: 'Inactive' },
      { key: 'suspended', label: 'Suspended' },
      { key: 'blacklisted', label: 'Blacklisted' }
   ]

   const categoryOptions = [
      { key: 'premium', label: 'Premium' },
      { key: 'standard', label: 'Standard' },
      { key: 'basic', label: 'Basic' },
      { key: 'vip', label: 'VIP' }
   ]

   const paymentTermsOptions = [
      { key: 'net15', label: 'Net 15' },
      { key: 'net30', label: 'Net 30' },
      { key: 'net45', label: 'Net 45' },
      { key: 'net60', label: 'Net 60' },
      { key: 'immediate', label: 'Immediate' },
      { key: 'custom', label: 'Custom' }
   ]

   const paymentMethodOptions = [
      { key: 'cash', label: 'Cash' },
      { key: 'credit', label: 'Credit' },
      { key: 'bank_transfer', label: 'Bank Transfer' },
      { key: 'check', label: 'Check' },
      { key: 'online', label: 'Online' }
   ]

   return (
      <Modal 
         isOpen={isOpen} 
         onClose={onClose}
         size="4xl"
         scrollBehavior="inside"
         placement="center"
      >
         <ModalContent>
            <ModalHeader>
               <h2 className="text-xl font-semibold">
                  {editData ? 'Edit' : 'Add'} {defaultType === 'supplier' ? 'Supplier' : 'Customer'}
               </h2>
            </ModalHeader>
            
            <ModalBody className="space-y-6">
               {/* Basic Information */}
               <h3 className="text-lg font-medium">Basic Information</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                     label="Name *"
                     placeholder="Enter full name"
                     value={formData.name}
                     onChange={(e) => handleInputChange('name', e.target.value)}
                     variant="bordered"
                     isRequired
                  />
                  <Input
                     label="Email *"
                     placeholder="Enter email address"
                     type="email"
                     value={formData.email}
                     onChange={(e) => handleInputChange('email', e.target.value)}
                     variant="bordered"
                     isRequired
                  />
                  <Input
                     label="Phone *"
                     placeholder="Enter phone number"
                     value={formData.phone}
                     onChange={(e) => handleInputChange('phone', e.target.value)}
                     variant="bordered"
                     isRequired
                  />
                  <Input
                     label="Alternate Phone"
                     placeholder="Enter alternate phone"
                     value={formData.alternatePhone}
                     onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                     variant="bordered"
                  />
                  <Input
                     label="Company Name"
                     placeholder="Enter company name"
                     value={formData.companyName}
                     onChange={(e) => handleInputChange('companyName', e.target.value)}
                     variant="bordered"
                  />
                  <Select
                     label="Type *"
                     placeholder="Select type"
                     selectedKeys={[formData.type]}
                     onSelectionChange={(keys) => handleInputChange('type', Array.from(keys)[0])}
                     variant="bordered"
                     isRequired
                  >
                     {typeOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                           {option.label}
                        </SelectItem>
                     ))}
                  </Select>
               </div>

               {/* Address Information */}
               <h3 className="text-lg font-medium">Address Information</h3>
               <div className="grid grid-cols-1 gap-4">
                  <Input
                     label="Street Address *"
                     placeholder="Enter street address"
                     value={formData.address.street}
                     onChange={(e) => handleInputChange('street', e.target.value, 'address')}
                     variant="bordered"
                     isRequired
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Input
                        label="City *"
                        placeholder="Enter city"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('city', e.target.value, 'address')}
                        variant="bordered"
                        isRequired
                     />
                     <Input
                        label="State *"
                        placeholder="Enter state"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('state', e.target.value, 'address')}
                        variant="bordered"
                        isRequired
                     />
                     <Input
                        label="Zip Code *"
                        placeholder="Enter zip code"
                        value={formData.address.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value, 'address')}
                        variant="bordered"
                        isRequired
                     />
                  </div>
                  <Input
                     label="Country *"
                     placeholder="Enter country"
                     value={formData.address.country}
                     onChange={(e) => handleInputChange('country', e.target.value, 'address')}
                     variant="bordered"
                     isRequired
                  />
               </div>

               {/* Business Details */}
               <h3 className="text-lg font-medium">Business Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                     label="Status"
                     placeholder="Select status"
                     selectedKeys={[formData.status]}
                     onSelectionChange={(keys) => handleInputChange('status', Array.from(keys)[0])}
                     variant="bordered"
                  >
                     {statusOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                           {option.label}
                        </SelectItem>
                     ))}
                  </Select>
                  <Select
                     label="Category"
                     placeholder="Select category"
                     selectedKeys={[formData.category]}
                     onSelectionChange={(keys) => handleInputChange('category', Array.from(keys)[0])}
                     variant="bordered"
                  >
                     {categoryOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                           {option.label}
                        </SelectItem>
                     ))}
                  </Select>
                  <Input
                     label="Credit Limit"
                     placeholder="Enter credit limit"
                     type="number"
                     value={formData.creditLimit.toString()}
                     onChange={(e) => handleInputChange('creditLimit', Number(e.target.value))}
                     variant="bordered"
                  />
                  <Input
                     label="Rating (1-5)"
                     placeholder="Enter rating"
                     type="number"
                     min="1"
                     max="5"
                     value={formData.rating.toString()}
                     onChange={(e) => handleInputChange('rating', Number(e.target.value))}
                     variant="bordered"
                  />
               </div>

               {/* Payment Terms */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                     label="Payment Terms"
                     placeholder="Select payment terms"
                     selectedKeys={[formData.paymentTerms]}
                     onSelectionChange={(keys) => handleInputChange('paymentTerms', Array.from(keys)[0])}
                     variant="bordered"
                  >
                     {paymentTermsOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                           {option.label}
                        </SelectItem>
                     ))}
                  </Select>
                  <Select
                     label="Payment Method"
                     placeholder="Select payment method"
                     selectedKeys={[formData.paymentMethod]}
                     onSelectionChange={(keys) => handleInputChange('paymentMethod', Array.from(keys)[0])}
                     variant="bordered"
                  >
                     {paymentMethodOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                           {option.label}
                        </SelectItem>
                     ))}
                  </Select>
               </div>

               {/* Tags */}
               <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2">
                     <Input
                        placeholder="Add tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        variant="bordered"
                     />
                     <Button
                        color="primary"
                        variant="flat"
                        size="sm"
                        startContent={<Plus className="w-4 h-4" />}
                        onClick={handleAddTag}
                     >
                        Add
                     </Button>
                  </div>
                  {formData.tags.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, index) => (
                           <Chip
                              key={index}
                              color="primary"
                              variant="flat"
                              onClose={() => handleRemoveTag(tag)}
                           >
                              {tag}
                           </Chip>
                        ))}
                     </div>
                  )}
               </div>

               {/* Additional Fields Toggle */}
               <div className="flex items-center justify-between">
                  <Button
                     variant="light"
                     onClick={() => setShowAdvanced(!showAdvanced)}
                     endContent={showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  >
                     {showAdvanced ? 'Hide' : 'Show'} Additional Fields
                  </Button>
               </div>

               {/* Advanced Fields */}
               {showAdvanced && (
                  <>
                     {/* Contact Person */}
                     <h3 className="text-lg font-medium">Contact Person</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                           label="Contact Name"
                           placeholder="Enter contact person name"
                           value={formData.contactPerson.name}
                           onChange={(e) => handleInputChange('name', e.target.value, 'contactPerson')}
                           variant="bordered"
                        />
                        <Input
                           label="Designation"
                           placeholder="Enter designation"
                           value={formData.contactPerson.designation}
                           onChange={(e) => handleInputChange('designation', e.target.value, 'contactPerson')}
                           variant="bordered"
                        />
                        <Input
                           label="Contact Email"
                           placeholder="Enter contact email"
                           type="email"
                           value={formData.contactPerson.email}
                           onChange={(e) => handleInputChange('email', e.target.value, 'contactPerson')}
                           variant="bordered"
                        />
                        <Input
                           label="Contact Phone"
                           placeholder="Enter contact phone"
                           value={formData.contactPerson.phone}
                           onChange={(e) => handleInputChange('phone', e.target.value, 'contactPerson')}
                           variant="bordered"
                        />
                     </div>

                     {/* Tax & Legal */}
                     <h3 className="text-lg font-medium">Tax & Legal Information</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                           label="Tax ID"
                           placeholder="Enter tax ID"
                           value={formData.taxId}
                           onChange={(e) => handleInputChange('taxId', e.target.value)}
                           variant="bordered"
                        />
                        <Input
                           label="GST Number"
                           placeholder="Enter GST number"
                           value={formData.gstNumber}
                           onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                           variant="bordered"
                        />
                        <Input
                           label="Website"
                           placeholder="Enter website URL"
                           value={formData.website}
                           onChange={(e) => handleInputChange('website', e.target.value)}
                           variant="bordered"
                        />
                     </div>

                     {/* Bank Details */}
                     <h3 className="text-lg font-medium">Bank Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                           label="Bank Name"
                           placeholder="Enter bank name"
                           value={formData.bankDetails.bankName}
                           onChange={(e) => handleInputChange('bankName', e.target.value, 'bankDetails')}
                           variant="bordered"
                        />
                        <Input
                           label="Account Holder Name"
                           placeholder="Enter account holder name"
                           value={formData.bankDetails.accountHolderName}
                           onChange={(e) => handleInputChange('accountHolderName', e.target.value, 'bankDetails')}
                           variant="bordered"
                        />
                        <Input
                           label="Account Number"
                           placeholder="Enter account number"
                           value={formData.bankDetails.accountNumber}
                           onChange={(e) => handleInputChange('accountNumber', e.target.value, 'bankDetails')}
                           variant="bordered"
                        />
                        <Input
                           label="Routing Number"
                           placeholder="Enter routing number"
                           value={formData.bankDetails.routingNumber}
                           onChange={(e) => handleInputChange('routingNumber', e.target.value, 'bankDetails')}
                           variant="bordered"
                        />
                     </div>

                     {/* Notes */}
                     <h3 className="text-lg font-medium">Notes</h3>
                     <Textarea
                        label="Public Notes"
                        placeholder="Enter notes visible to all users"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        variant="bordered"
                        rows={3}
                     />
                     <Textarea
                        label="Internal Notes"
                        placeholder="Enter internal notes (visible to managers only)"
                        value={formData.internalNotes}
                        onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                        variant="bordered"
                        rows={3}
                     />
                  </>
               )}
            </ModalBody>

            <ModalFooter>
               <Button
                  color="danger"
                  variant="light"
                  onClick={onClose}
               >
                  Cancel
               </Button>
               <Button
                  color="primary"
                  onClick={handleSubmit}
                  isLoading={loading}
                  isDisabled={!formData.name || !formData.email || !formData.phone}
               >
                  {editData ? 'Update' : 'Create'}
               </Button>
            </ModalFooter>
         </ModalContent>
      </Modal>
   )
}

export default SupplierCustomerModal
