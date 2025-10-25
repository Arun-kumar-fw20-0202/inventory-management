'use client';
import { Card } from '@heroui/card';
import { ArrowLeftIcon, HomeIcon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';



export default function PaymentFailedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Card className=" py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
                    <div className="text-center">
                        {/* Error Icon */}
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                            <XCircleIcon className="h-10 w-10 text-red-600" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold mb-2">
                            Payment Failed
                        </h1>

                        {/* Description */}
                        <p className="text-gray-600 mb-8 dark:text-gray-300">
                            We couldn't process your payment. Please check your payment details and try again.
                        </p>

                        {/* Error Details */}
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                            <p className="text-sm text-red-800">
                                Your payment could not be completed. No charges have been made to your account.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/pricing')}
                                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                                Try Again
                            </button>

                            <button
                                onClick={() => router.push('/')}
                                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                <HomeIcon className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </button>
                        </div>

                        {/* Support Link */}
                        {/* <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                Need help?{' '}
                                <a href="/support" className="text-indigo-600 hover:text-indigo-500">
                                    Contact Support
                                </a>
                            </p>
                        </div> */}
                    </div>
                </Card>
            </div>
        </div>
    );
}