'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import { hasPermission as checkPerm } from '../libs/utils/check-permission'

const CheckPagePermission = ({ allowPermission, children }) => { // allowPermission example: { module: 'products', action: 'read' }
    const activerole = useSelector((state) => state.auth.user?.data?.activerole);
    const isSuper = activerole === 'superadmin';
    const perms = useSelector((state) => state.permissions.permissions)    
    const isAllowed = isSuper || checkPerm(perms, allowPermission.module, allowPermission.action)

    if (isAllowed) {
        return <>{children}</>
    } else {
        return (
            <div className='flex justify-center items-center h-screen'>
                <div className='max-w-md mx-auto text-center p-8 rounded-2xl shadow-lg'>
                    <div className='w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center'>
                        <svg className='w-8 h-8 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10' />
                        </svg>
                    </div>
                    <h1 className='text-2xl font-bold mb-3'>Access Denied</h1>
                    <p className='text-gray-600 dark:text-gray-300 mb-6'>You don't have permission to view this page. Please contact your administrator if you believe this is an error.</p>
                    <button
                        onClick={() => window.history.back()}
                        className='px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200'
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }
}

export default CheckPagePermission