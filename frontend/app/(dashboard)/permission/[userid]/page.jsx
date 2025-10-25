"use client"

import PageAccess from "@/components/role-page-access"
import { PermissionsComp } from "./_components/permissions-comp"

const Page = ({ params }) => {
  const userId = params.userid
  
  return (
    <PageAccess allowedRoles={['admin','superadmin']}>
        <PermissionsComp userId={userId} />
    </PageAccess>
  )
}

export default Page
