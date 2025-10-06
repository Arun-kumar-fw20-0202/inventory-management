'use client'
import React from 'react'
import SupplierCustomerAutocomplete from '@/components/dynamic/supplier-customer/supplier-customer-autocomplete'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { SearchIcon } from '@/components/icons'
import { Card } from '@heroui/card'
import { Inbox } from 'lucide-react'

const statuses = ['all','draft','submitted','approved','rejected','completed']

const SaleFilters = ({ onChange }) => {
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('all')
  const [fromDate, setFromDate] = React.useState('')
  const [toDate, setToDate] = React.useState('')
  const [customer, setCustomer] = React.useState(null)
  const [minTotal, setMinTotal] = React.useState('')
  const [maxTotal, setMaxTotal] = React.useState('')
  const [sortBy, setSortBy] = React.useState('createdAt')
  const [sortDir, setSortDir] = React.useState('desc')
  const [limit, setLimit] = React.useState(20)

  React.useEffect(() => {
    const payload = {
      search,
      status: status === 'all' ? undefined : status,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      customerId: customer?._id,
      minTotal: minTotal || undefined,
      maxTotal: maxTotal || undefined,
      sortBy,
      sortDir,
      limit
    }
    const t = setTimeout(() => onChange && onChange(payload), 400)
    return () => clearTimeout(t)
  }, [search, status, fromDate, toDate, customer, minTotal, maxTotal, sortBy, sortDir, limit])

  return (
    <Card className="flex gap-3 p-6">
      <div className="flex items-center gap-3">
        <Inbox className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">All Transactions</h1>
          <p className="text-gray-600">View all sales transactions</p>
        </div>
      </div>
      <div className="flex gap-4">
        <Input variant='bordered' value={search} onChange={e => setSearch(e.target.value)} label='search' placeholder="Search by order/customer" startContent={<SearchIcon />} />
        
        <Select variant='bordered' value={status} onChange={e => setStatus(e.target.value)} label="Status" placeholder="Select Status">
          {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </Select>

        <Select variant='bordered' value={limit} defaultSelectedKeys={new Set([limit])} onChange={e => setLimit(Number(e.target.value))} label="Limit" placeholder="Select Limit">
          <SelectItem value={10}>10</SelectItem>
          <SelectItem value={20}>20</SelectItem>
          <SelectItem value={50}>50</SelectItem>
        </Select>

        {/* <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border px-3 py-2 rounded">
          <option value="createdAt">Date</option>
          <option value="grandTotal">Total</option>
        </select>
        <select value={sortDir} onChange={e => setSortDir(e.target.value)} className="border px-3 py-2 rounded">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select> */}

      {/* <div className="flex gap-2">
        <Input variant='bordered' type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border px-3 py-2 rounded" />
        <Input variant='bordered' type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border px-3 py-2 rounded" />
      </div> */}

        {/* <div className="w-48"><SupplierCustomerAutocomplete onSelectChange={(c) => setCustomer(c)} /></div> */}
        {/* <Input variant='bordered' value={minTotal} onChange={e => setMinTotal(e.target.value)} placeholder="Min total" />
        <Input variant='bordered' value={maxTotal} onChange={e => setMaxTotal(e.target.value)} placeholder="Max total" /> */}
          
      </div>
    </Card>
  )
}

export default SaleFilters
