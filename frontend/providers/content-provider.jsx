'use client'
import { Card } from '@heroui/card'
import React from 'react'

const ContentProvider = ({ children, title }) => {
   return (
      <>
         <Card className=" w-full p-3 mb-2 rounded-none">
            <h1 className='text-lg font-semibold'>{title}</h1>
         </Card>
         <Card className='p-1 mx-1 shadow-none bg-transparent'>
            {children}
         </Card>
      </>
   )
}

export default ContentProvider