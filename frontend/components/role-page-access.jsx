'use client'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Spinner } from '@heroui/spinner';

const PageAccess = ( {children , allowedRoles }) => {
   const [loading, setLoading] = React.useState(true)
   const user = useSelector((state) => state.auth.user);

   useEffect(() => {     
      setTimeout(() => {
         setLoading(false)
      }, 600)
      
   }, [])

   if (loading) return <div className='flex justify-center items-center h-screen flex-col gap-2'>
      <Spinner size='lg' />
      <span className='text-sm text-gray-500'>Loading...</span>
   </div>
   // if (user?.data?.activerole === "admin") return (children)

   if (allowedRoles.includes("all") || allowedRoles.includes(user?.data?.activerole)) return (children)
   else return (
      <div className='flex justify-center items-center h-screen flex-col gap-2'>
         <h1 className='text-2xl font-bold'>Access Denied</h1>
         <p className='text-gray-500'>You do not have permission to view this page.</p>
      </div>
   )
}

export default PageAccess