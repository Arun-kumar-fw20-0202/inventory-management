// @ts-nocheck
'use client'
import { Sidebar } from '@/components/sidebr/side-bar'
import AuthProvider from '@/providers/auth-providers'
import React from 'react'

const layout = ({ children }) => {
   return (
      <AuthProvider>
         <Sidebar>
            <div>{children}</div>
         </Sidebar>
      </AuthProvider>
   )
}

export default layout