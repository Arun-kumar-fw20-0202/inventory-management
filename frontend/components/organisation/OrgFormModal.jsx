 'use client'
import React, { useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@heroui/drawer'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useUpdateOrganisation } from '@/libs/mutation/organisation/organisation-mutation'

export default function OrgFormModal({ isOpen, onOpenChange, org = {} }) {
  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      // details object from OrganisationSchema
      details: {
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        taxId: '',
        currency: 'INR',
        logoUrl: '',
        businessType: '',
        industry: '',
        additionalInfo: '',
      }
    }
  })

  const updateOrg = useUpdateOrganisation()

  useEffect(() => {
    if (isOpen) {
      setValue('name', org.name || '')

      // details
      const d = org.details || {}
      setValue('details.address', d.address || '')
      setValue('details.city', d.city || '')
      setValue('details.state', d.state || '')
      setValue('details.zip', d.zip || '')
      setValue('details.country', d.country || '')
      setValue('details.phone', d.phone || '')
      setValue('details.email', d.email || '')
      setValue('details.website', d.website || '')
      setValue('details.taxId', d.taxId || '')
      setValue('details.currency', d.currency || 'INR')
      setValue('details.logoUrl', d.logoUrl || '')
      setValue('details.businessType', d.businessType || '')
      setValue('details.industry', d.industry || '')
      setValue('details.additionalInfo', d.additionalInfo || '')
    } else {
      reset()
    }
  }, [isOpen, org])

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      settings: { },
      details: values.details
    }

    try {
      if (org) {
        updateOrg.mutate({ data: payload }, {
          onSuccess: () => {
            toast.success('Organisation updated')
            onOpenChange(false)
          },
          onError: (err) => {
            console.error(err)
            toast.error(err?.response?.data?.message || 'Could not update organisation')
          }
        })
      }
    } catch (err) {
      console.error('onSubmit error', err)
      toast.error('Unexpected error')
    }
  }

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
            <DrawerHeader>Edit Organisation</DrawerHeader>
            <DrawerBody>
              <div className="space-y-3">
                <Controller name="name" control={control} render={({ field }) => (
                  <Input {...field} label="Organisation name" size="sm" variant="bordered" />
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Controller name="details.address" control={control} render={({ field }) => (
                    <Input {...field} label="Address" size="sm" variant="bordered" />
                  )} />

                  <Controller name="details.city" control={control} render={({ field }) => (
                    <Input {...field} label="City" size="sm" variant="bordered" />
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Controller name="details.state" control={control} render={({ field }) => (
                    <Input {...field} label="State" size="sm" variant="bordered" />
                  )} />
                  <Controller name="details.zip" control={control} render={({ field }) => (
                    <Input {...field} label="ZIP / Postal" size="sm" variant="bordered" />
                  )} />
                  <Controller name="details.country" control={control} render={({ field }) => (
                    <Input {...field} label="Country" size="sm" variant="bordered" />
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Controller name="details.phone" control={control} render={({ field }) => (
                    <Input {...field} label="Phone" size="sm" variant="bordered" />
                  )} />
                  <Controller name="details.email" control={control} render={({ field }) => (
                    <Input {...field} label="Contact Email" size="sm" variant="bordered" />
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Controller name="details.website" control={control} render={({ field }) => (
                    <Input {...field} label="Website" size="sm" variant="bordered" />
                  )} />
                  <Controller name="details.taxId" control={control} render={({ field }) => (
                    <Input {...field} label="Tax ID" size="sm" variant="bordered" />
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Controller name="details.currency" control={control} render={({ field }) => (
                    <Input {...field} label="Currency" size="sm" variant="bordered" />
                  )} />
                  <Controller name="details.logoUrl" control={control} render={({ field }) => (
                    <Input {...field} label="Logo URL" size="sm" variant="bordered" />
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Controller name="details.businessType" control={control} render={({ field }) => (
                    <Input {...field} label="Business type" size="sm" variant="bordered" />
                  )} />
                  <Controller name="details.industry" control={control} render={({ field }) => (
                    <Input {...field} label="Industry" size="sm" variant="bordered" />
                  )} />
                </div>

                <Controller name="details.additionalInfo" control={control} render={({ field }) => (
                  <Input {...field} label="Additional info" size="sm" variant="bordered" />
                )} />
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button size="sm" variant="light" onPress={() => onOpenChange(false)}>Cancel</Button>
              <Button size="sm" type="submit">Save</Button>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  )
}
