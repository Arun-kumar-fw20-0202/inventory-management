'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Inbox } from 'lucide-react'
import SalesList from './_components/SalesList'

const AllSalesPage = () => {
  return (
    <PageAccess allowedRoles={['superadmin', 'admin', 'manager', 'staff']}>
      <div className="p-6">

        {/* <Card> */}
          {/* <CardHeader>
            <h2 className="text-xl font-semibold">Sales Transactions</h2>
          </CardHeader> */}
          {/* <CardBody> */}
            <SalesList />
          {/* </CardBody> */}
        {/* </Card> */}
      </div>
    </PageAccess>
  )
}

export default AllSalesPage