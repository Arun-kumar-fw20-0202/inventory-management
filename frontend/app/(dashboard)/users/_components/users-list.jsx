import React, { useMemo, useState, useCallback } from 'react'
import { useFetchUsers, useDeleteUser, useUpdateUser } from '@/libs/mutation/user/user-mutations'
import CreateUserModal from './create-user-model'
import { Button } from '@heroui/button'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/table'
import { User } from '@heroui/user'
import { Chip } from '@heroui/chip'
import { Tooltip } from '@heroui/tooltip'
import { Input } from '@heroui/input'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { Switch } from '@heroui/switch'
import { DeleteIcon, EditIcon, EyeIcon, SearchIcon } from '@/components/icons'
import { Select, SelectItem } from '@heroui/select'
import { formatDateRelative } from '@/libs/utils'
import ConfirmActionModal from '@/app/(dashboard)/sales/all/_components/ConfirmActionModal'
import Link from 'next/link'
import { UserRoundCog } from 'lucide-react'

export const columns = [
  { name: 'NAME', uid: 'name' },
  { name: 'ROLE', uid: 'role' },
  { name: 'CREATED BY', uid: 'createdBy' },
  { name: 'LAST LOGIN', uid: 'last_login' },
  { name: 'STATUS', uid: 'status' },
  { name: 'ACTIONS', uid: 'actions' },
]

const statusColorMap = {
  active: 'success',
  blocked: 'danger',
}


export default function UsersList({ activerole, topContent = null }) {
  const [params, setParams] = useState({ page: 1, limit: 10, block_status: undefined })
  const [query, setQuery] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmShowReason, setConfirmShowReason] = useState(false)
  const [confirmPayload, setConfirmPayload] = useState(null)

  const { data, isLoading, isFetching } = useFetchUsers({ ...params, q: query })
  const deleteUser = useDeleteUser()
  const updateUser = useUpdateUser()

  // backend response shape is { data: { users: [...] , total, page, limit } }
  const items = useMemo(() => data?.data?.users || [], [data])

  const openEdit = useCallback((user) => {
    setEditingUser(user)
    setModalOpen(true)
  }, [])

  // Toggle block/unblock user
  const toggleBlock = useCallback((user) => {
    const action = user?.block_status ? 'Unblock' : 'Block'
    setConfirmTitle(`${action} user`)
    setConfirmMessage(`Are you sure you want to ${action.toLowerCase()} ${user?.name}?`)
    setConfirmShowReason(false)
    setConfirmPayload({ type: 'toggleBlock', user })
    setConfirmOpen(true)
  }, [updateUser])

  // Delete permanently if superadmin, else soft delete (block)
  const doDelete = useCallback((user) => {
    setConfirmTitle('Delete user')
    setConfirmMessage(`Permanently delete ${user?.name}? This cannot be undone.`)
    // setConfirmShowReason(true)
    setConfirmPayload({ type: 'deleteUser', user })
    setConfirmOpen(true)
  }, [activerole, deleteUser, updateUser])

  // Render cell based on column key
  const renderCell = useCallback((user, columnKey) => {
    switch (columnKey) {
      case 'name':
        return (
        <User avatarProps={{ radius: 'lg', src: `https://i.pravatar.cc/150?u=${user?._id}` }} description={user?.email} name={user?.name}>
            {user?.email}
        </User>
        )
      case 'role':
        return (
          <div className='flex flex-col'>
              <p className='text-sm font-semibold capitalize'>{user?.activerole}</p>
          </div>
        )
      
      case 'createdBy' : {
        return (
          <div className='flex flex-col'>
            <p className='text-sm font-semibold capitalize'>{user?.createdBy?.name || 'N/A'}</p>
            <p className='text-xs text-default-400 dark:text-gray-300'>{user?.createdBy?.email || ''}</p>
          </div>
        )
      }
      
      case 'last_login' : {
        return (
          <div className='flex flex-col text-nowrap'>
            <p className='text-sm font-semibold capitalize'>{user?.last_login ? `${formatDateRelative(user?.last_login) + " " + dayjs(user?.last_login).format("h:m A")}` : 'Never'}</p>
          </div>
        )
      }
      
      case 'status': {
        const status = user?.block_status ? 'blocked' : 'active'
        return (
          <Chip className='capitalize border-none' color={statusColorMap[status] || 'default'} size='sm' variant='dot'>
            {status}
          </Chip>
        )
      }
      case 'actions':
        return (
          <div className='flex items-center justify-end gap-3'>
            <Tooltip content='View'>
              <span onClick={() => openEdit(user)} className='text-lg text-default-400 cursor-pointer active:opacity-60'><EyeIcon /></span>
            </Tooltip>
            <Tooltip content='Edit'>
              <span onClick={() => openEdit(user)} className='text-lg text-default-400 cursor-pointer active:opacity-60'><EditIcon /></span>
            </Tooltip>
            <Tooltip color='danger' content={'Delete permanently'}>
              <span onClick={() => doDelete(user)} className='text-lg text-danger cursor-pointer active:opacity-60'><DeleteIcon /></span>
            </Tooltip>
            <Tooltip content={user?.block_status ? 'Unblock' : 'Block'}>
              <Switch isSelected={!user?.block_status} onValueChange={() => toggleBlock(user)} size='sm' />
            </Tooltip>
            {/* permisison */}
            <Tooltip content='Manage Permissions'>
              <Button isIconOnly size='sm' as={Link} startContent={<UserRoundCog size={18} />} href={`/permission/${user?._id}`} />
            </Tooltip>
          </div>
        )
      default:
      return null
    }
  }, [openEdit, toggleBlock, doDelete])


  var debounderTimer;
  const HandleSearch = (e) => {
    const value = e.target.value;
    clearTimeout(debounderTimer);
    debounderTimer = setTimeout(() => {
      setQuery(value);
      setParams(p => ({ ...p, page: 1 }))
    }, 700);
  }

  const HandleSelectBlockUnblockStatus = (value) => {
    if(value === 'active') {
      setParams(p => ({ ...p, block_status: false, page: 1 }))
      setQuery('');
    } else if(value === 'blocked') {
      setParams(p => ({ ...p, block_status: true, page: 1 }))
      setQuery('');
    } else {
      setParams(p => ({ ...p, block_status: undefined, page: 1 }))
    }
  }

  const TableTopContent = useMemo(() => {
    return (
        <div className='flex items-center justify-between mb-4 sticky left-0'>
          <div className='flex w-full gap-3 items-center'>
            <Input placeholder='Search users by name, email or phone' size='sm' onChange={HandleSearch} startContent={<SearchIcon />} label='Search users' className='max-w-xs' />
            <Select size='sm' className="max-w-xs" label='Select Status' placeholder='Status' selectedKeys={params.block_status === undefined ? '' : params.block_status ? 'blocked' : 'active'} onChange={(e) => HandleSelectBlockUnblockStatus(e.target.value)} >
              <SelectItem value='' key=''>All</SelectItem>
              <SelectItem value='active' key={'active'}>Active</SelectItem>
              <SelectItem value='blocked' key={'blocked'}>Blocked</SelectItem>
            </Select>
          </div>
          <div>
            {topContent}
          </div>
        </div>
    )
  }, [topContent])

  return (
    <div className=''>
      <div className=''>
        <Table aria-label='Users table' shadow='none' topContent={TableTopContent} isLoading={isLoading}
          isCompact
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>

          <TableBody items={items}>
            {(item) => (
              <TableRow key={item._id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className='mt-4 flex justify-between items-center'>
          <div className='text-sm text-default-400'>Showing {items.length} of {data?.data?.total || 0}</div>
          <div className='flex gap-2'>
            <Button size='sm' onPress={() => setParams(p => ({ ...p, page: Math.max(1, p.page - 1) }))} isDisabled={data?.data?.isPrevPage === false}>Prev</Button>
            <div className='px-3 py-1 rounded bg-default-100'>Page {params.page}</div>
            <Button size='sm' onPress={() => setParams(p => ({ ...p, page: p.page + 1 }))} isDisabled={data?.data?.isNextPage === false}>Next</Button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CreateUserModal
          activerole={activerole}
          isOpen={isModalOpen}
          onOpen={() => setModalOpen(true)}
          onOpenChange={(v) => { setModalOpen(!!v); if (!v) setEditingUser(null) }}
          mode='edit'
          initialData={editingUser}
          onSuccess={() => setEditingUser(null) }
        />
      )}
      <ConfirmActionModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        showReason={confirmShowReason}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={(reason) => {
          if (!confirmPayload) {
            setConfirmOpen(false)
            return
          }
          const { type, user } = confirmPayload
          if (type === 'toggleBlock') {
            updateUser?.mutate({ id: user?._id, data: { block_status: !user?.block_status } })
          } else if (type === 'deleteUser') {
            // pass reason if the mutation/back-end accepts it
            deleteUser?.mutate({ id: user?._id, hard: true, reason })
          }
          setConfirmOpen(false)
          setConfirmPayload(null)
        }}
      />
    </div>
  )
}
