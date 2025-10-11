'use client'
import { useFetchPlans } from '@/libs/mutation/pricing/pricing-mutation'
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card'
import { Button } from '@heroui/button'
import React from 'react'
import { Chip } from '@heroui/chip'
import { ShieldUser, User, } from 'lucide-react'
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
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const { data: pricings, isLoading, error } = useFetchPlans({
        isActive: true,
    })

    if (isLoading) {
        return <PricingLoadingState />
    }
    
    if (error) return <div>Error loading pricings</div>

    const plans = pricings?.data?.plans || pricings || []


    return (
        <>
            <SelectedDrawer 
                plan={selectedPanel} 
                isOpen={isOpen} 
                onOpenChange={onOpenChange}
            />
            <div className="flex items-center  w-full">
                <div className='w-full p-4 space-y-4'>
                    <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {plans?.map((plan) => (
                            <Card key={plan?._id} className={`shadow-lg border ${plan?.isPopular ? 'border-2 border-primary-500 relative' : 'border-default'}`}>
                                {plan?.isPopular && (
                                    <div className="flex justify-center">
                                        <div className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-bl  rounded-br">
                                            <p>Most Popular</p>
                                        </div>
                                    </div>
                                )}
                                
                                <CardHeader className="pb-4">
                                    <div className='w-full'>
                                        <div className='text-center'>
                                            <div className="bg-default-100 rounded-lg p-2 flex items-center justify-center gap-2">
                                                
                                                {plan?.discountPrice ? (
                                                    <div className='flex flex-col gap-2'>
                                                        <Chip color='success' variant='flat' >{`SAVE ${PricingHeader({ plan })}%`}</Chip>
                                                        <div className="flex items-baseline gap-2 justify-center">
                                                            <span className='text-3xl font-bold text-primary'>₹{plan?.discountPrice}</span>
                                                            <span className='text-lg text-gray-500 line-through'>₹{plan?.price}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className='text-3xl font-bold text-primary'>₹{plan?.price}</span>
                                                )}
                                            </div>
                                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                                / {plan?.validityMonths} month{plan?.validityMonths > 1 ? 's' : ''}
                                            </span>
                                            {plan?.trialDays > 0 && (
                                                <p className='text-xs text-green-600 mt-1'>{plan?.trialDays} Days Extra</p>
                                            )}
                                        </div>
                                        <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200 mb-2'>{plan?.name}</h3>
                                        <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>{plan?.description}</p>
                                        
                                    </div>
                                </CardHeader>
                                
                                <CardBody className="py-4">
                                    <div className='grid grid-cols-2 gap-4 mb-4'>
                                        <div className='flex items-center gap-2'>
                                            <div className="p-1 5 bg-warning/10 rounded-2xl">
                                                <ShieldUser className='text-warning'/>
                                            </div>
                                            <div>
                                                <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>Managers</p>
                                                <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>
                                                    {plan?.limits.managers === 'unlimited' ? 'Unlimited' : plan?.limits.managers}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className='flex items-center gap-2'>
                                            <div className="p-1 5 bg-secondary/10 rounded-2xl">
                                                <User className='text-secondary'/>
                                            </div>
                                            <div>
                                                <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>Staff</p>
                                                <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>
                                                    {plan?.limits.staff === 'unlimited' ? 'Unlimited' : plan?.limits.staff}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className='text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2'>Features:</h4>
                                        <ul className='space-y-1 ml-5'>
                                            {plan?.features?.slice(0, 4).map((feature, index) => (
                                                <li key={index} className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    {feature}
                                                </li>
                                            ))}
                                            {plan?.features?.length > 4 && (
                                                <li className='text-xs text-gray-500'>
                                                    +{plan?.features?.length - 4} more features
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </CardBody>
                                
                                <CardFooter className="pt-4">
                                    <div className='flex gap-2 w-full'>
                                        <Button 
                                            color="primary" 
                                            variant="solid" 
                                            className="flex-1"
                                            size="sm"
                                            onPress={() => { setSelectedPanel(plan); onOpen(); }}
                                        >
                                            Upgrade Plan
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default PricingList



export const PricingLoadingState = () => {
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