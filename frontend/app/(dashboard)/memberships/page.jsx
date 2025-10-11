import PageAccess from '@/components/role-page-access'
import React from 'react'
import MembershipsList from './_components/MembershipsList'

const Index = () => {
  return (
    <PageAccess allowedRoles={['superadmin']}>
        <MembershipsList />
    </PageAccess>
  )
}

export default Index