'use client'
import {  usePlan } from '@/libs/mutation/pricing/pricing-mutation'
import { Button } from '@heroui/button'
import React, { useState } from 'react'
import { Chip } from '@heroui/chip'
import { ShieldUser, User } from 'lucide-react'
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader } from '@heroui/drawer'
import { PricingHeader } from './pricing-list'
import api from '@/components/base-url'
import { Spinner } from '@heroui/spinner'

export const SelectedDrawer = ({ plan, isOpen, onOpenChange, billingCycle = 'monthly' }) => {
    
   const [paymentType, setPaymentType] = useState('one-time'); // 'one-time' or 'subscription'
   const [paymentGateway, setPaymentGateway] = useState('phonepe'); // 'razorpay' or 'phonepe'
    const { data: singleData, isLoading: fetchsingleplan } = usePlan(plan?._id, { enabled: Boolean(plan?._id) })
    const plandata = singleData?.data?.plan
    const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

    // compute final price depending on billingCycle
    const finalPrice = plandata ? (billingCycle === 'yearly' ? (plandata.discountPrice || plandata.price) * 12 : (plandata.discountPrice || plandata.price)) : 0


    const handlePhonePePayment = async () => {
        try {
            
            const { data } = await api.post("/payment/phone-pe/create-order", {
                amount: finalPrice,
                pricing_id: plandata?._id,
                billing_cycle: billingCycle
            });

            console.log('✅ PhonePe order created:', data);

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("❌ Failed to create PhonePe payment");
            }
        } catch (err) {
            console.error("PhonePe payment error:", err.response || err);
            alert("Failed to initiate PhonePe payment. Please try again.");
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        try {
            if (paymentGateway === 'phonepe') {
                return await handlePhonePePayment();
            }


            // One-time payment logic (existing)
            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) {
                alert('Failed to load payment gateway');
                return;
                }
            }

            // 1️⃣ Create order from backend
            const { data } = await api.post("/payment/razorpay/create-order", {
                pricing_id: plandata?._id,
                payment_type: 'one-time'
            });

            // 2️⃣ Razorpay options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                name: "AppSevaa",
                description: "DVC Payment - One Time",
                order_id: data.id,
                handler: async function (response) {
                // 3️⃣ Verify payment on backend
                const verifyRes = await api.post("/payment/razorpay/verify", {
                    ...response,
                    pricing_id: plandata?._id,
                    payment_type: 'one-time'
                });
                if (verifyRes.data.success) {
                    // router.push(`/`)
                    window.location.href = '/'
                } else {
                    alert("❌ Payment Failed");
                }
                },
                prefill: {name: "Inventory Management",},
                theme: {
                color: "#c31d7b",
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error(err);
        }
    }
    
    return (
        <>
            <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="right" size="sm">
                <DrawerContent>
                    {fetchsingleplan ? (
                        <div className="p-5 flex justify-center items-center flex-col min-h-screen">
                            <Spinner size='lg' />
                            <p className='text-sm text-gray-600 mt-2'>Loading plan details...</p>
                        </div>
                    )
                    :
                    <>
                        <DrawerHeader>
                            <div className='w-full'>
                                <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200 '>{plandata?.name}</h3>
                                <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>{plandata?.description}</p>
                                
                                <div className='text-center'>
                                    <div className="bg-default-100 rounded-lg p-2 flex items-center justify-center gap-2">
                                        {plandata?.discountPrice ? (
                                            <div className='flex flex-col gap-2'>
                                                <Chip color='success' variant='flat' >{`SAVE ${PricingHeader({ plan })}%`}</Chip>
                                                <div className="flex items-baseline gap-2 justify-center">
                                                    <span className='text-3xl font-bold text-primary'>₹{finalPrice}</span>
                                                    <span className='text-lg text-gray-500 line-through'>₹{plandata?.price * 12}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className='text-3xl font-bold text-primary'>₹{plandata?.price}</span>
                                        )}
                                    </div>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        / {plandata?.validityMonths} month{plandata?.validityMonths > 1 ? 's' : ''}
                                    </span>
                                    {plandata?.trialDays > 0 && (
                                        <p className='text-xs text-green-600 mt-1'>{plandata?.trialDays} Days Extra</p>
                                    )}
                                </div>
                            </div>
                        </DrawerHeader>
                        <DrawerBody>
                            <div className='grid grid-cols-2 gap-4 mb-4'>
                                <div className='flex items-center gap-2'>
                                    <div className="p-1 5 bg-warning/10 rounded-2xl">
                                        <ShieldUser className='text-warning'/>
                                    </div>
                                    <div>
                                        <p className='text-xs font-medium text-gray-600 dark:text-gray-400'>Managers</p>
                                        <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>
                                            {plandata?.limits.managers === 'unlimited' ? 'Unlimited' : plandata?.limits.managers}
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
                                            {plandata?.limits.staff === 'unlimited' ? 'Unlimited' : plandata?.limits.staff}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className='text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2'>Features:</h4>
                                <ul className='space-y-1 ml-5'>
                                    {plandata?.features?.map((feature, index) => (
                                        <li key={index} className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </DrawerBody>
                        <DrawerFooter>
                            <Button onPress={onOpenChange} color='danger' size='sm' variant='flat'>Close</Button>
                            <Button color='primary' size='sm' onPress={handlePayment}>Upgrade Now</Button>
                        </DrawerFooter>
                    </>
                    }
                </DrawerContent>
            </Drawer>
        </>
    )
}
