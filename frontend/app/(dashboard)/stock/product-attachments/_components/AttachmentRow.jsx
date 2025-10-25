"use client"
import React from 'react'
import { useUpdateAttachment, useDeleteAttachment } from '@/libs/mutation/stock/stock-attachments-mutation'

export default function AttachmentRow({ item, canUpdate = false, canDelete = false, onUpdated = () => {} }){
  const upd = useUpdateAttachment()
  const del = useDeleteAttachment()

  const onToggleStatus = async () => {
    try {
      await upd.mutateAsync({ id: item._id, payload: { status: item.status === 'active' ? 'inactive' : 'active' } })
      onUpdated()
    } catch (err) { console.error(err) }
  }

  const onDelete = async () => {
    if (!confirm('Delete attachment?')) return
    try {
      await del.mutateAsync(item._id)
      onUpdated()
    } catch (err) { console.error(err) }
  }

  return (
    <tr>
      <td className="px-4 py-2">{item.name}</td>
      <td className="px-4 py-2">{item.qty}</td>
      <td className="px-4 py-2">{item.status}</td>
      <td className="px-4 py-2">{new Date(item.createdAt).toLocaleString()}</td>
      <td className="px-4 py-2">
        {canUpdate && <button className="btn btn-sm mr-2" onClick={onToggleStatus}>{item.status === 'active' ? 'Disable' : 'Enable'}</button>}
        {canDelete && <button className="btn btn-sm btn-danger" onClick={onDelete}>Delete</button>}
      </td>
    </tr>
  )
}
