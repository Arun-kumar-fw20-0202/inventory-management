'use client'
import React from 'react'
import { Card } from '@heroui/card'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@heroui/table'
import { Button } from '@heroui/button'
import { formatCurrency } from '@/libs/utils'

export default function MembershipsTableView({ plans = [], isLoading = false, pagination = {}, onEdit, onDelete, onPageChange }) {
  if (isLoading) return <div className='py-8 text-center'>Loading...</div>
  if (!plans || plans.length === 0) return <div className='py-8 text-center'>No plans</div>

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Discount</TableCell>
            <TableCell>Managers</TableCell>
            <TableCell>Staff</TableCell>
            <TableCell>Features</TableCell>
            <TableCell>Validity (months)</TableCell>
            <TableCell>Trial</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map(p => (
            <TableRow key={p._id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{formatCurrency(p.price || 0, p.currency || 'INR')}</TableCell>
              <TableCell>{p.discountPrice ? formatCurrency(p.discountPrice, p.currency || 'INR') : '-'}</TableCell>
              <TableCell>{String(p.limits?.managers || '0')}</TableCell>
              <TableCell>{String(p.limits?.staff || '0')}</TableCell>
              <TableCell>{(p.features || []).slice(0,3).join(', ') || '-'}</TableCell>
              <TableCell>{p.validityMonths || 0}m</TableCell>
              <TableCell>{p.trialDays || 0}d</TableCell>
              <TableCell className='flex gap-2'>
                <Button size='sm' onPress={() => onEdit(p)}>Edit</Button>
                <Button size='sm' color='danger' onPress={() => onDelete(p)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className='mt-4 flex justify-between items-center'>
          <div>Showing {pagination.totalItems} plans</div>
          <div className='flex gap-2'>
            <Button size='sm' onPress={() => onPageChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage}>Prev</Button>
            <div className='px-3 py-1 bg-default-100 rounded'>Page {pagination.currentPage}</div>
            <Button size='sm' onPress={() => onPageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage}>Next</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
