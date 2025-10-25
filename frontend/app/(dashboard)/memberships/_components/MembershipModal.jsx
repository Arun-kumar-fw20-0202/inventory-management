'use client'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { Checkbox, CheckboxGroup } from '@heroui/checkbox'
import { useCreatePlan, useUpdatePlan } from '@/libs/mutation/pricing/pricing-mutation'
import toast from 'react-hot-toast'
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader } from '@heroui/drawer'

export default function MembershipModal({ isOpen, onOpenChange, mode = 'create', initialData = null, onSaved = null }) {
  const { control, handleSubmit, reset, setValue, setError, getValues, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      limits: { managers: 0, staff: 0, production_head: 0, accountant: 0 },
      price: 0,
      discountPrice: 0,
      currency: 'INR',
      // removed customizable & popularity flags
      features: [], // will be handled as array of tags
      validityMonths: 1,
      trialDays: 0,
      billing_cycle: ['monthly', 'yearly'],
      isActive: true,
    }
  })

  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()

  const [featureInput, setFeatureInput] = useState('')
  const [tags, setTags] = useState([])

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setValue('name', initialData.name || '')
      setValue('description', initialData.description || '')
      setValue('limits', initialData.limits || { managers: 0, staff: 0 })
      setValue('price', initialData.price || 0)
      setValue('discountPrice', initialData.discountPrice || 0)
      setTags(initialData.features || [])
      setValue('features', initialData.features || [])
      setValue('validityMonths', initialData.validityMonths || 1)
      setValue('trialDays', initialData.trialDays || 0)
      setValue('currency', initialData.currency || 'INR')
      // customizable removed
      setValue('isPopular', initialData.isPopular === true)
      setValue('isActive', initialData.isActive !== false)
      setValue('billing_cycle', initialData.billing_cycle || ['', ''])
    }
    if (!isOpen) {
      reset()
      setTags([])
      setFeatureInput('')
    }
  }, [isOpen, mode, initialData])

  useEffect(() => {
    if (createPlan.isSuccess || updatePlan.isSuccess) {
      onOpenChange && onOpenChange(false)
      onSaved && onSaved()
      reset()
    }
  }, [createPlan.isSuccess, updatePlan.isSuccess])

  const onSubmit = (values) => {
    // normalize limits: allow 'unlimited' or number
    const normalizeLimit = (v) => {
      if (v === undefined || v === null) return null
      if (String(v).toLowerCase() === 'unlimited') return 'unlimited'
      // allow empty string -> treat as 0
      if (String(v).trim() === '') return 0
      const n = Number(v)
      if (!Number.isNaN(n) && n >= 0) return n
      return null
    }

    const m = normalizeLimit(values.limits?.managers)
    const s = normalizeLimit(values.limits?.staff)
    if (m === null || s === null) {
      toast.error('Limits must be a non-negative number or the string "unlimited"')
      return
    }

    const priceNum = Number(values.price) || 0
    const discountNum = Number(values.discountPrice) || 0
    const validityNum = Number(values.validityMonths) || 0

    // inline validation: validityMonths must be integer >= 0
    if (!Number.isInteger(validityNum) || validityNum < 0) {
      setError('validityMonths', { type: 'validate', message: 'Validity must be a non-negative integer' })
      toast.error('Validity must be a non-negative integer')
      return
    }

    // discount must not exceed price
    if (discountNum > priceNum) {
      setError('discountPrice', { type: 'validate', message: 'Discount cannot be greater than price' })
      toast.error('Discount cannot be greater than price')
      return
    }

    const payload = {
      name: String(values.name).trim(),
      description: values.description,
      limits: { managers: m, staff: s, production_head: normalizeLimit(values.limits?.production_head),
        accountant: normalizeLimit(values.limits?.accountant)},
      price: priceNum,
      currency: values.currency || 'INR',
      discountPrice: discountNum,
      features: tags || [],
      isPopular: !!values.isPopular,
      validityMonths: validityNum,
      trialDays: Number(values.trialDays) || 0,
      isActive: !!values.isActive,
      billing_cycle: Array.isArray(values.billing_cycle) && values.billing_cycle.length > 0 ? values.billing_cycle : ['monthly'],
    }

    if (mode === 'create') {
      createPlan.mutate(payload)
      return
    }

    // edit
    if (mode === 'edit' && initialData && initialData._id) {
      updatePlan.mutate({ id: initialData._id, data: payload })
    }
  }

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange} >
      <DrawerContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <DrawerHeader>{mode === 'create' ? 'Create Plan' : 'Edit Plan'}</DrawerHeader>
            <DrawerBody>
              <div className="flex flex-col gap-3">
                <Controller name="name" control={control} rules={{ required: 'Name required' }} render={({ field }) => (
                  <Input variant='bordered' {...field} placeholder='Plan name' label='Name' size='sm' />
                )} />
                {errors.name && <p className='text-xs text-danger'>{errors.name.message}</p>}

                <Controller name="description" control={control} render={({ field }) => (
                  <Input variant='bordered' {...field} placeholder='Short description' label='Description' size='sm' />
                )} />

                <div className='grid grid-cols-2 gap-2'>
                  <Controller name='limits.managers' control={control} rules={{ required: true }} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='Managers limit (number or "unlimited")' label='Managers' size='sm' />
                  )} />
                  <Controller name='limits.staff' control={control} rules={{ required: true }} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='Staff limit (number or "unlimited")' label='Staff' size='sm' />
                  )} />

                  <Controller name='limits.production_head' control={control} rules={{ required: true }} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='Production Head limit (number or "unlimited")' label='Production Heads' size='sm' />
                  )} />

                  <Controller name='limits.accountant' control={control} rules={{ required: true }} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='Accountant limit (number or "unlimited")' label='Accountants' size='sm' />
                  )} />
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <Controller name='price' control={control} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='0' label='Price' size='sm' type='number' />
                  )} />
                {errors.price && <p className='text-xs text-danger'>{errors.price.message}</p>}

                  <Controller name='discountPrice' control={control} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='0' label='Discount Price' size='sm' type='number' />
                  )} />
                  {errors.discountPrice && <p className='text-xs text-danger'>{errors.discountPrice.message}</p>}
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <Controller name='currency' control={control} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='INR' label='Currency' size='sm' />
                  )} />

                  <Controller name='validityMonths' control={control} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='12' label='Validity (months)' size='sm' type='number' />
                  )} />
                  {errors.validityMonths && <p className='text-xs text-danger'>{errors.validityMonths.message}</p>}
                </div>
              
                <div className='grid grid-cols-1 gap-2'>
                  <Controller name='billing_cycle' control={control} render={({ field }) => (
                    <CheckboxGroup orientation='vertical' value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <Checkbox value='monthly'>Monthly Billing</Checkbox>
                      <Checkbox value='yearly'>Yearly Billing</Checkbox>
                    </CheckboxGroup>
                  )} />
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <Controller name='trialDays' control={control} render={({ field }) => (
                    <Input variant='bordered' {...field} placeholder='0' label='Trial days' size='sm' type='number' />
                  )} />

                </div>
                <div>
                <label className='block text-xs mb-1'>Features</label>
                <div className='flex gap-2'>
                    <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder='feature name' size='sm'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const v = String(featureInput || '').trim()
                          if (!v) return
                          if (tags.includes(v)) { toast.error('Feature already added'); return }
                          const next = [...tags, v]
                          setTags(next)
                          setValue('features', next)
                          setFeatureInput('')
                        }

                        // Backspace to remove last tag when input is empty
                        if (e.key === 'Backspace' && String(featureInput || '') === '') {
                          if (tags.length === 0) return
                          const next = tags.slice(0, -1)
                          setTags(next)
                          setValue('features', next)
                        }
                      }}
                    />
                    <Button size='sm' type='button' onPress={() => {
                      const v = String(featureInput || '').trim()
                      if (!v) return
                      if (tags.includes(v)) { toast.error('Feature already added'); return }
                      const next = [...tags, v]
                      setTags(next)
                      setValue('features', next)
                      setFeatureInput('')
                    }}>Add</Button>
                </div>
                <div className='mt-2 flex flex-wrap gap-2'>
                    {tags.map((t, i) => (
                    <div key={i} className='px-2 py-1 bg-default-100 rounded flex items-center gap-2'>
                        <span className='text-xs'>{t}</span>
                        <button type='button' className='text-xs text-danger' onClick={() => {
                        const next = tags.filter(x => x !== t)
                        setTags(next)
                        setValue('features', next)
                        }}>x</button>
                    </div>
                    ))}
                </div>
                </div>

                <div className='flex flex-col gap-4'>
                  <Controller name='isActive' control={control} render={({ field }) => (
                    <Checkbox isSelected={field.value} onValueChange={(v) => field.onChange(!!v)}>Active</Checkbox>
                  )} />
                  <Controller name='isPopular' control={control} render={({ field }) => (
                    <Checkbox isSelected={field.value} onValueChange={(v) => field.onChange(!!v)}>Popular ?</Checkbox>
                  )} />
                </div>
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button size='sm' variant='light' onPress={onClose}>Close</Button>
              <Button size='sm' type='submit' isLoading={createPlan.isLoading || updatePlan.isLoading}>{mode === 'create' ? 'Create' : 'Save'}</Button>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  )
}
