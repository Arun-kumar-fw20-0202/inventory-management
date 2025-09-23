'use client'
import { Card } from '@heroui/react'
import React from 'react'

const ContentProvider = ({ children, title }) => {
  return (
   <>
      <Card className=" w-full p-3 mb-2 rounded-none">
         <h1 className='text-lg font-semibold'>{title}</h1>
      </Card>
      <Card className='md:p-4 p-1 md:mx-8 mx-1 shadow-none bg-transparent'>
         {children}
      </Card>
   </>
  )
}

export default ContentProvider