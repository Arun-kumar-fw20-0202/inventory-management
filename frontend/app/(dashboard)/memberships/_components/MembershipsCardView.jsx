'use client'
import React from 'react'
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card'
import { Button } from '@heroui/button'
import { formatCurrency } from '@/libs/utils'
import { Check, ShieldUser, User } from 'lucide-react'

export default function MembershipsCardView({ plans = [], isLoading = false, onEdit, onDelete }) {
if (isLoading) return (
    <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className='p-4 shadow-none border border-default'>
                <CardHeader>
                    <div className='w-full flex flex-col gap-2'>
                        <div className='h-6 bg-default-200 rounded animate-pulse'></div>
                        <div className='h-4 bg-default-200 rounded animate-pulse w-3/4'></div>
                        <div className='h-3 bg-default-200 rounded animate-pulse w-1/2'></div>
                    </div>
                    <div className='text-right'>
                        <div className='h-6 bg-default-200 rounded animate-pulse w-20'></div>
                    </div>
                </CardHeader>
                <CardBody>
                    <div className='grid grid-cols-2 gap-2'>
                        <div className='flex items-center gap-2'>
                            <div className='w-8 h-8 bg-default-200 rounded-2xl animate-pulse'></div>
                            <div>
                                <div className='h-3 bg-default-200 rounded animate-pulse w-16 mb-1'></div>
                                <div className='h-4 bg-default-200 rounded animate-pulse w-8'></div>
                            </div>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className='w-8 h-8 bg-default-200 rounded-2xl animate-pulse'></div>
                            <div>
                                <div className='h-3 bg-default-200 rounded animate-pulse w-16 mb-1'></div>
                                <div className='h-4 bg-default-200 rounded animate-pulse w-8'></div>
                            </div>
                        </div>
                    </div>
                    <div className='mt-3'>
                        <div className='h-4 bg-default-200 rounded animate-pulse w-20 mb-2'></div>
                        <div className='h-3 bg-default-200 rounded animate-pulse w-full mb-1'></div>
                        <div className='h-3 bg-default-200 rounded animate-pulse w-3/4'></div>
                    </div>
                    <div className='mt-2'>
                        <div className='h-3 bg-default-200 rounded animate-pulse w-1/2'></div>
                    </div>
                </CardBody>
                <CardFooter>
                    <div className='flex gap-2 justify-end'>
                        <div className='h-8 w-16 bg-default-200 rounded animate-pulse'></div>
                        <div className='h-8 w-16 bg-default-200 rounded animate-pulse'></div>
                    </div>
                </CardFooter>
            </Card>
        ))}
    </div>
)
  if (!plans || plans.length === 0) return <div className='py-8 text-center'>No plans</div>

  return (
    <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {plans.map(p => (
            <Card key={p?._id} className='p-4 border border-default-100'>
                <CardHeader>
                    <div className=' w-full flex flex-col gap-1'>
                        <h3 className='font-semibold'>{p?.name}</h3>
                        <p className='text-xs text-default-400 dark:text-default-600'>{p?.description}</p>
                        {/* <p className='text-xs text-danger font-bold'>{ p?.discountPrice ? `Discount: ${formatCurrency(p?.discountPrice, p?.currency || 'INR')}` : ''}</p> */}
                    </div>
                    <div className='text-right'>
                        {p?.discountPrice ? (
                            <div className="flex flex-col items-baseline justify-end">
                                <span className='text-sm text-gray-500 line-through'>{formatCurrency(p?.price || 0, p?.currency || 'INR')}</span>
                                <span className='text-2xl font-bold text-primary text-end'>{formatCurrency(p?.discountPrice || 0, p?.currency || 'INR')}</span>
                            </div>
                        ) : (
                            <p className='font-bold text-success'>{formatCurrency(p?.price || 0, p?.currency || 'INR')}</p>
                        )}
                    {/* <p className='font-bold text-success'>{formatCurrency(p?.price || 0, p?.currency || 'INR')}</p> */}
                    {/* customizable removed */}
                    </div>
                </CardHeader>
                <CardBody>
                    <div className='grid grid-cols-2 gap-2 border-b border-default-200 pb-2'>
                        <div className='flex items-center gap-2'>
                            {/* Manager icon */}
                            <div className="p-1 5 bg-warning/10 rounded-2xl">
                                <ShieldUser className='text-warning'/>
                            </div>
                            <div>
                                <p className='text-xs text-default-400 dark:text-default-600'>Managers</p>
                                <p className='font-medium'>{String(p?.limits?.managers || '0')}</p>
                            </div>
                        </div>
                        
                        <div className='flex items-center gap-2'>
                            {/* Staff icon */}
                            <div className="p-1 5 bg-secondary/10 rounded-2xl">
                                <User className='text-secondary'/>
                            </div>
                            <div>
                                <p className='text-xs text-default-400 dark:text-default-600'>Staff</p>
                                <p className='font-medium'>{String(p?.limits?.staff || '0')}</p>
                            </div>
                        </div>
                    </div>
                    {/* billing_cycle */}
                    <div className='mt-2 text-sm'>
                        <span className='mr-3 capitalize'>Billing Cycle: <strong>{p?.billing_cycle ? p?.billing_cycle.join(', ') : 'monthly, yearly'}</strong></span>
                    </div>
                    <div className='mt-2 text-sm border-b border-default-200 pb-2'>
                        <span className='mr-3'>Validity: <strong>{p?.validityMonths || 0} month</strong></span>
                        <span className='mr-3'>Trial: <strong>{p?.trialDays || 0} d</strong></span>
                    </div>
                    <div className='mt-3 text-xs'>
                        <strong>Features:</strong>
                        <div className="mt-4 grid grid-cols-2 gap-3 ml-4">
                            {p?.features?.map((f, i) => (
                                <div key={i} className='text-xs flex items-start gap-2'>
                                    <div className=" bg-success text-white mt-0.5 rounded-full">
                                        <Check size={15} /> 
                                    </div>
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    
                </CardBody>
                <CardFooter>
                    <div className='flex gap-2 justify-end'>
                    <Button size='sm' onPress={() => onEdit(p)}>Edit</Button>
                    <Button size='sm' color='danger' onPress={() => onDelete(p)}>Delete</Button>
                    </div>
                </CardFooter>
            </Card>
        ))}
    </div>
  )
}
