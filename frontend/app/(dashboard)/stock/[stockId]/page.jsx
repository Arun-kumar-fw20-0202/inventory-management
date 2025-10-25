'use client'
import CheckPagePermission from '@/components/check-page-permissoin'
import React from 'react'
import SingleStockDetails from './_components/single-stock-details'
import { PERMISSION_MODULES } from '@/libs/utils'

const Index = (stockId) => {
    const id = stockId?.params?.stockId

    return (
        <>
            <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.STOCK, action: 'read' }}>
                <SingleStockDetails id={id} />
            </CheckPagePermission>
        </>
    )
}

export default Index