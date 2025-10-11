
'use client'
import React, { useState } from 'react'
import OrgCard from '@/components/organisation/OrgCard'
import OrgFormModal from '@/components/organisation/OrgFormModal'
import { Card } from '@heroui/card'
import { useFetchMyOrganisation } from '@/libs/mutation/organisation/organisation-mutation'
import dayjs from 'dayjs'
import { Button } from '@heroui/button'
import UsersList from '../../users/_components/users-list'
import { PlusIcon } from 'lucide-react'
import { useSelector } from 'react-redux'

const OrganisationPage = () => {
  const [isOpen, setIsOpen] = useState(false)
  // const { data: organisation, isLoading } = useFetchMyOrganisation()
  const organisation = useSelector((state) => state?.organisation?.organisation?.organisation);
  const organi = organisation
  // console.log('Organisation data:', organi);

  // Mocked data for now — swap with API hooks later
  const org = {
    name: organi?.name || '',
    // orgNo: 'ACME-001',
    plan: 'Pro',
    users: organi?.counts?.users || 0,
    managers: organi?.counts?.managers || 0,
    stafs: organi?.counts?.staff || 0,
    createdAt: dayjs(organi?.createdAt).format('DD MMM, YYYY') || '',
    details : organi?.details || {},
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex-1">Organisation Details</h1>
        <Button endContent={<PlusIcon size={18} />} color='primary' onPress={() => setIsOpen(true)}>Edit Organisation</Button>
      </div>

      <OrgCard org={org} />
      <h2 className="text-xl font-bold">Organisation Members</h2>
      <UsersList />

      <OrgFormModal isOpen={isOpen} onOpenChange={setIsOpen} org={org} />
    </div>
  )
}

export default OrganisationPage