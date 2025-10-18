'use client'
import React, { useState } from 'react'
import { Button } from '@heroui/button'
import MembershipsTableView from './MembershipsTableView'
import MembershipsCardView from './MembershipsCardView'
import MembershipModal from './MembershipModal'
import { useFetchPlans, useDeletePlan } from '@/libs/mutation/pricing/pricing-mutation'
import { Card } from '@heroui/card'
import { Plus } from 'lucide-react'

export default function MembershipsList() {
  const [viewMode, setViewMode] = useState('card')
  const [filters, setFilters] = useState({ page: 1, limit: 10 })
  const [selected, setSelected] = useState(null)
  const [isModalOpen, setModalOpen] = useState(false)

  const { data, isLoading, refetch } = useFetchPlans(filters)
  const deletePlan = useDeletePlan()

  const plans = data?.data?.plans || []
  const pagination = data?.data?.pagination || {}

  const openCreate = () => { setSelected(null); setModalOpen(true) }
  const openEdit = (p) => { setSelected(p); setModalOpen(true) }

  const handleDelete = (p) => {
    if (!confirm(`Delete plan ${p.name}?`)) return
    deletePlan.mutate({ id: p._id, hard: true })
  }

  return (
    <div className=''>
        <Card className='flex rounded-none flex-row p-4 shadow-sm justify-between items-end mb-4'>
            <div>
                <h2 className='text-lg font-semibold'>Membership Plans</h2>
                <div className='text-sm text-default-500'>Manage your membership and pricing plans</div>
            </div>
            <div className='flex gap-2'>
                {/* <Button variant={viewMode === 'table' ? 'solid' : 'flat'} onPress={() => setViewMode('table')}>Table</Button>
                <Button variant={viewMode === 'card' ? 'solid' : 'flat'} onPress={() => setViewMode('card')}>Card</Button> */}
                <Button size='sm' color='primary' onPress={openCreate}>Create Plan <Plus size={17} /></Button>
            </div>
        </Card>

        <div className='p-4'>
            {viewMode === 'table' ? (
                <MembershipsTableView plans={plans} isLoading={isLoading} pagination={pagination} onEdit={openEdit} onDelete={handleDelete} onPageChange={(p) => setFilters(f => ({ ...f, page: p }))} />
            ) : (
                <MembershipsCardView plans={plans} isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} />
            )}
        </div>
        <MembershipModal isOpen={isModalOpen} onOpenChange={setModalOpen} mode={selected ? 'edit' : 'create'} initialData={selected} onSaved={() => { setModalOpen(false); refetch() }} />
    </div>
  )
}
