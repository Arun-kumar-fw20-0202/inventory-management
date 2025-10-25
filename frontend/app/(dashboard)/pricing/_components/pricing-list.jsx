 'use client'
import { useFetchPlans } from '@/libs/mutation/pricing/pricing-mutation'
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card'
import { Button } from '@heroui/button'
import React from 'react'
import { Chip } from '@heroui/chip'
import { ShieldUser, User, Check } from 'lucide-react'
import { useDisclosure } from '@heroui/modal'
import { SelectedDrawer } from './make-payment-drawer'

export const PricingHeader = ({ plan }) => {
    const hasDiscount = plan?.discountPrice && plan?.discountPrice < plan?.price
    const displayPrice = hasDiscount ? plan?.discountPrice : plan?.price
    const savingsPercent = hasDiscount 
        ? Math.round(((plan?.price - plan?.discountPrice) / plan?.price) * 100)
        : 0
    return savingsPercent   
}

const PricingList = () => {
    const [selectedPanel, setSelectedPanel] = React.useState(null)
    const [billingCycle, setBillingCycle] = React.useState('monthly') // monthly | yearly
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const { data: pricings, isLoading, error } = useFetchPlans({
        isActive: true,
    })

    if (isLoading) {
        return <LoadingState />
    }
    
    if (error) return <div className="text-center text-red-500">Error loading pricings</div>

    const plans = pricings?.data?.plans || pricings || []

    const toggleBilling = (cycle) => setBillingCycle(cycle)

    const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

    return (
        <>
            <SelectedDrawer 
                plan={selectedPanel} 
                billingCycle={billingCycle}
                isOpen={isOpen} 
                onOpenChange={onOpenChange}
            />

            <div className="w-full p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">Choose a plan</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Simple pricing for teams of all sizes. Upgrade or switch anytime.</p>
                    </div>

                    {/* Billing toggle */}
                    <div className="bg-default-100 rounded-full p-1 flex items-center gap-1">
                        <button
                            onClick={() => toggleBilling('monthly')}
                            className={`px-4 py-1 rounded-full text-sm ${billingCycle === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-600 dark:text-gray-300'}`}>
                            Monthly
                        </button>
                        <button
                            onClick={() => toggleBilling('yearly')}
                            className={`px-4 py-1 rounded-full text-sm ${billingCycle === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-600 dark:text-gray-300'}`}>
                            Yearly
                        </button>
                    </div>
                </div>

                <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 justify-between'>
                    {plans?.map((plan) => {
                        const hasDiscount = plan?.discountPrice && plan?.discountPrice < plan?.price
                        const displayPrice = hasDiscount ? plan?.discountPrice : plan?.price
                        const savedPercent = hasDiscount ? Math.round(((plan?.price - plan?.discountPrice) / plan?.price) * 100) : 0

                        const pricePerUnit = (billingCycle === 'yearly') ? displayPrice * 12 : displayPrice
                        const billingLabel = billingCycle === 'yearly' ? ' / year' : ' / month'

                        return (
                            <Card key={plan?._id} className={`relative overflow-hidden rounded-xl transform transition hover:scale-[1.02] shadow-lg` }>
                                {/* Accent stripe */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${plan?.isPopular ? 'bg-gradient-to-b from-primary-500 to-primary-700' : 'bg-gray-200'} `}></div>

                                {/* Popular ribbon */}
                                {plan?.isPopular && (
                                    <div className="absolute left-0 top-0 -mr-6 -rotate-12">
                                        <div className="bg-primary-500 text-white text-xs font-semibold px-4 py-1 rounded shadow-lg">Most Popular</div>
                                    </div>
                                )}

                                <div className="p-6 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className='text-lg font-semibold'>{plan?.name}</h3>
                                                <p className='text-sm text-gray-500 dark:text-gray-300 mt-1'>{plan?.description}</p>
                                            </div>
                                            <div className='text-right'>
                                                <div className='inline-flex items-end gap-3'>
                                                    <span className='text-4xl font-extrabold text-primary'>{formatCurrency(pricePerUnit)}</span>
                                                </div>
                                                <div className='text-sm text-gray-500 dark:text-gray-300 mt-1'>{billingLabel}</div>
                                                {hasDiscount && <div className='mt-2'><Chip color='success' variant='flat'>{`Save ${savedPercent}%`}</Chip></div>}
                                                {billingCycle === 'yearly' && hasDiscount && (
                                                    <div className='text-xs text-gray-400 mt-1'>Billed yearly. Savings shown above.</div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className='mt-4 grid grid-cols-2 gap-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className="bg-secondary/10 p-2 rounded-lg">
                                                    <ShieldUser className='text-secondary' />
                                                </div>
                                                <div>
                                                    <p className='text-xs text-gray-500 dark:text-gray-300'>Managers</p>
                                                    <p className='text-sm font-semibold '>{plan?.limits.managers === 'unlimited' ? 'Unlimited' : plan?.limits.managers}</p>
                                                </div>
                                            </div>
                                            
                                            <div className='flex items-center gap-3'>
                                                <div className="bg-success/10 p-2 rounded-lg">
                                                    <User className='text-success' />
                                                </div>
                                                <div>
                                                    <p className='text-xs text-gray-500 dark:text-gray-300'>Staff</p>
                                                    <p className='text-sm font-semibold'>{plan?.limits.staff === 'unlimited' ? 'Unlimited' : plan?.limits.staff}</p>
                                                </div>
                                            </div>

                                            <div className='flex items-center gap-3'>
                                                <div className="bg-warning/10 p-2 rounded-lg">
                                                    <User className='text-warning' />
                                                </div>
                                                <div>
                                                    <p className='text-xs text-gray-500 dark:text-gray-300'>Production Head</p>
                                                    <p className='text-sm font-semibold '>{plan?.limits.production_head === 'unlimited' ? 'Unlimited' : plan?.limits.production_head}</p>
                                                </div>
                                            </div>

                                            {/* <div className='flex items-center gap-3'>
                                                <div className="bg-danger/10 p-2 rounded-lg">
                                                    <User className='text-danger' />
                                                </div>
                                                <div>
                                                    <p className='text-xs text-gray-500 dark:text-gray-300'>Accountant</p>
                                                    <p className='text-sm font-semibold '>{plan?.limits.accountant === 'unlimited' ? 'Unlimited' : plan?.limits.accountant}</p>
                                                </div>
                                            </div> */}
                                        </div>
                                        
                                        <div className='mt-4'>
                                            <ul className='space-y-2'>
                                                {plan?.features?.slice(0, 6).map((feature, index) => (
                                                    <li key={index} className='flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300'>
                                                        <span className='p-1 bg-green-100 text-green-600 rounded-full'><Check className='w-3 h-3' /></span>
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                                {plan?.features?.length > 6 && (
                                                    <li className='text-xs text-gray-400'>+{plan?.features?.length - 6} more features</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>



                                    <div className='mt-6 flex gap-3'>
                                        <Button 
                                            color={plan?.isPopular ? 'primary' : 'secondary'} 
                                            variant='solid' 
                                            className='flex-1'
                                            onPress={() => { setSelectedPanel(plan); onOpen(); }}
                                        >
                                            {plan?.isPopular ? 'Get Started' : 'Upgrade Plan'}
                                        </Button>
                                        {/* <Button color='flat' variant='flat' onPress={() => alert('Contact sales')}>
                                            Contact
                                        </Button> */}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

export default PricingList



const LoadingState = () => {
    return (
        <div className="flex items-center w-full">
            <div className='w-full p-4 space-y-4'>
                <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4 '>
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
            </div>
        </div>
    )
}