"use client"
import React, { useState, useCallback } from 'react'
import { useAttachments, useUpdateAttachment, useDeleteAttachment } from '@/libs/mutation/stock/stock-attachments-mutation'
import { formatDateRelative, PERMISSION_MODULES } from '@/libs/utils'
import { useHasPermission } from '@/libs/utils/check-permission'
import AttachmentCreateModal from './AttachmentCreateModal'
import { useDisclosure } from '@heroui/modal'
import { Table, TableHeader, TableBody, TableRow, TableCell, TableColumn } from '@heroui/table'
import { Chip } from '@heroui/chip'
import { Tooltip } from '@heroui/tooltip'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { PlusIcon } from 'lucide-react'
import { Pagination } from '@heroui/pagination'
import { TableStyleFormate } from '@/components/formate'

const columns = [
  { name: 'NAME', uid: 'name' },
  { name: 'QTY', uid: 'qty' },
  { name: 'STATUS', uid: 'status' },
  { name: 'CREATED', uid: 'createdAt' },
  { name: 'ACTIONS', uid: 'actions' }
]

export default function AttachmentManager() {
  const [query, setQuery] = useState({ page: 1, limit: 25 })
  const [search, setSearch] = useState('')
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [editing, setEditing] = useState(null)

  const canCreate = useHasPermission(PERMISSION_MODULES.STOCK, 'create')
  const canUpdate = useHasPermission(PERMISSION_MODULES.STOCK, 'update')
  const canDelete = useHasPermission(PERMISSION_MODULES.STOCK, 'delete')

  const { data, isLoading, isError } = useAttachments(query)
  const updateMutation = useUpdateAttachment()
  const deleteMutation = useDeleteAttachment()

  const items = data?.data?.items || []
  const total = data?.data?.total || 0
  const totalPages = data?.data?.totalPages
//   console.log({page: data?.data?.page})

  const onSearch = (e) => {
    e.preventDefault()
    setQuery(q => ({ ...q, page: 1, search: search.trim() }))
  }

  const gotoPage = (p) => setQuery(q => ({ ...q, page: Math.max(1, Math.min(totalPages, p)) }))

  const onToggleStatus = useCallback(async (item) => {
    try {
      await updateMutation.mutateAsync({ id: item._id, payload: { status: item.status === 'active' ? 'inactive' : 'active' } })
      // refresh handled by mutation onSuccess
    } catch (err) { console.error(err) }
  }, [updateMutation])

  const onDelete = useCallback(async (item) => {
    if (!confirm('Delete attachment?')) return
    try {
      await deleteMutation.mutateAsync(item._id)
    } catch (err) { console.error(err) }
  }, [deleteMutation])

  const onEdit = useCallback((item) => {
    setEditing(item)
    onOpen()
  }, [onOpen])

      const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case 'name': return (
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          {item.description && <span className="text-sm text-gray-600 dark:text-gray-300">{item.description}</span>}
        </div>
      )
      case 'qty': return item.qty
      case 'status': return <Chip className="capitalize" color={item.status === 'active' ? 'success' : 'danger'} size="sm" variant="flat">{item.status}</Chip>
      case 'createdAt': return formatDateRelative(item.createdAt)
      case 'actions':
        return (
          <div className="flex justify-end gap-2">
            <Tooltip content="Edit"><Button onPress={() => onEdit(item)} isDisabled={!canUpdate}>Edit</Button></Tooltip>
            <Tooltip content="Toggle status"><Button onPress={() => onToggleStatus(item)} isDisabled={!canUpdate}>{item.status === 'active' ? 'Disable' : 'Enable'}</Button></Tooltip>
            <Tooltip content="Delete"><Button color='danger' onPress={() => onDelete(item)} isDisabled={!canDelete}>Delete</Button></Tooltip>
          </div>
        )
      default: return item[columnKey]
    }
  }, [canUpdate, canDelete, onDelete, onToggleStatus])

    const TopContent = () => {
        return (
            <div className="flex items-center justify-between">
                <form onSubmit={onSearch} className="flex items-center gap-2">
                    <Input onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" className="input input-sm" />
                    <Button type="submit">Search</Button>
                </form>

                <div>
                    {canCreate && (
                        <Button startContent={<PlusIcon />} onPress={() => onOpen()} >Create attachment</Button>
                    )}
                </div>
            </div>
        )
    }

    const BottomContent = () => {
        return (
            <div className="flex justify-between items-center mt-2 overflow-hidden">
                <Pagination color="primary" isCompact page={query?.page} total={totalPages} onChange={gotoPage} showControls/>
                <select onChange={(e) => setQuery({...query, limit: e.target.value})} value={query?.limit} className='max-w-xs p-1 px-3 border border-default-100'>
                    {[10, 25, 50, 100].map(l => (
                    <option className='dark:text-black' key={l} value={l}>{l}</option>
                    ))}
                </select>
            </div>
        )
    }

  return (
    <div className="space-y-4">

        <Table aria-label="Attachments table" topContent={<TopContent />} bottomContent={<BottomContent />} isStriped classNames={TableStyleFormate()} isLoading={isLoading || isError}>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === 'actions' ? 'end' : 'start'}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={items} loadingContent={<LoadingState />} emptyContent={<EmptyState />} >
            {(item) => (
              <TableRow key={item._id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>

        <AttachmentCreateModal 
          isOpen={isOpen}
          onOpenChange={(v)=>{ onOpenChange(v); if(!v) setEditing(null)}}
          initialData={editing}
        />
    </div>
  )
}

const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No attachments found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                Get started by creating your first product attachment to organize your inventory.
            </p>
        </div>
    )
}

const LoadingState = () => {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading attachments...</p>
            </div>
        </div>
    )
}