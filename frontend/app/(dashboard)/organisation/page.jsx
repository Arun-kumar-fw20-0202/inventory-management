import React from 'react'
import OrganisationPage from './_component/organisaiton'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const page = () => {
  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.ORGANIZATION, action: 'read' }} >
      <div className='p-4'>
        <OrganisationPage />
      </div>
    </CheckPagePermission>
  )
}

export default page