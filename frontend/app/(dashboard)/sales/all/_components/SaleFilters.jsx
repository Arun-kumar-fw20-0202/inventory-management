'use client'
import React from 'react'
// import SupplierCustomerAutocomplete from '@/components/dynamic/supplier-customer/supplier-customer-autocomplete'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { SearchIcon } from '@/components/icons'
import { Card } from '@heroui/card'
import { Inbox } from 'lucide-react'

const statuses = ['all','draft','submitted','approved','rejected','completed']

const SaleFilters = ({ onChange, onChangeMode, mode }) => {
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('all')
  const [fromDate, setFromDate] = React.useState('')
  const [toDate, setToDate] = React.useState('')
  const [customer, setCustomer] = React.useState(null)
  const [minTotal, setMinTotal] = React.useState('')
  const [maxTotal, setMaxTotal] = React.useState('')
  const [sortBy, setSortBy] = React.useState('updatedAt')
  const [sortDir, setSortDir] = React.useState('desc')

  React.useEffect(() => {
    const payload = {
      search,
      status: status === 'all' ? undefined : status,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      customerId: customer,
      minTotal: minTotal || undefined,
      maxTotal: maxTotal || undefined,
      sortBy,
      sortDir,
    }
    const t = setTimeout(() => onChange && onChange(payload), 400)
    return () => clearTimeout(t)
  }, [search, status, fromDate, toDate, customer, minTotal, maxTotal, sortBy, sortDir, ])

  return (
    <Card className="flex gap-3 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3 items-center">
          <Inbox className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">All Transactions</h1>
            <p className="text-gray-600 dark:text-gray-400">View all sales transactions</p>
          </div>
        </div>

        {/* <div className="flex gap-2">
          <Tooltip content="Card View">
            <Button color='primary' variant={mode == 'card' ? 'solid' : 'flat'} isIconOnly size='sm' startContent={<Grid3x3 />} onPress={() => onChangeMode('card')} />
          </Tooltip>
          <Tooltip content="Table View">
            <Button color='primary' variant={mode == 'table' ? 'solid' : 'flat'} isIconOnly size='sm' startContent={<Table2 />} onPress={() => onChangeMode('table')} />
          </Tooltip>
        </div> */}
      </div>
      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 ">
        <Input variant='bordered' value={search} onChange={e => setSearch(e.target.value)} label='search' placeholder="Search by order/customer" startContent={<SearchIcon />} />
        
        <Select variant='bordered' value={status} onChange={e => setStatus(e.target.value)} label="Status" placeholder="Select Status" disabledKeys={new Set([status])}>
          {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </Select>


        <Select variant='bordered' value={sortBy} onChange={e => setSortBy(e.target.value)} label="Sort" placeholder="Sort By" disabledKeys={new Set([sortBy])}>
          <SelectItem key='createdAt' value="createdAt">CreatedAt</SelectItem>
          <SelectItem key='updatedAt' value="updatedAt">UpdatedAt</SelectItem>
          <SelectItem key='grandTotal' value="grandTotal">Total</SelectItem>
        </Select>
        <Select variant='bordered' value={sortDir} onChange={e => setSortDir(e.target.value)} label="Direction" placeholder="Sort Direction" disabledKeys={new Set([sortDir])}>
          <SelectItem key='desc' value="desc">Desc</SelectItem>
          <SelectItem key='asc' value="asc">Asc</SelectItem>
        </Select>

      <div className="flex gap-2">
        <Input variant='bordered' type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}  />
        <Input variant='bordered' type="date" value={toDate} onChange={e => setToDate(e.target.value)}  />
      </div>

        {/* <Input variant='bordered' value={minTotal} onChange={e => setMinTotal(e.target.value)} placeholder="Min total" />
        <Input variant='bordered' value={maxTotal} onChange={e => setMaxTotal(e.target.value)} placeholder="Max total" /> */}
          
      </div>
    </Card>
  )
}

export default SaleFilters
