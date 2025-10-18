'use client'
import React from 'react'
import { Button } from '@heroui/button'
import { Select, SelectItem } from '@heroui/select'
import { Card } from '@heroui/card'
import { ArrowLeftRight, UserCircle2 } from 'lucide-react'
import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";
import { Input } from '@heroui/input'
import RowSteps from '@/components/stepper'
import UsersAutocomplete from '@/components/dynamic/user-autocomplete'

const todayISO = () => new Date().toISOString().split('T')[0]
const startOfWeekISO = () => {
  const d = new Date()
  const diff = d.getDate() - d.getDay() + 1 // Monday as start
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
const startOfMonthISO = () => {
  const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
}
const daysAgoISO = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}

const FiltersBar = ({ filters, onChange }) => {
  const [local, setLocal] = React.useState({ ...(filters || {}) })
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => setLocal(filters || {}), [filters])

  React.useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const apply = () => { onChange && onChange(local); setOpen(false) }
  const reset = () => { setLocal({}); onChange && onChange({}); setOpen(false) }

  const setPreset = (preset) => {
    if (preset === 'today') setLocal(prev => ({ ...prev, startDate: todayISO(), endDate: todayISO() }))
    if (preset === 'this_week') setLocal(prev => ({ ...prev, startDate: startOfWeekISO(), endDate: todayISO() }))
    if (preset === 'this_month') setLocal(prev => ({ ...prev, startDate: startOfMonthISO(), endDate: todayISO() }))
    if (preset === 'last_30') setLocal(prev => ({ ...prev, startDate: daysAgoISO(30), endDate: todayISO() }))
  }

  return (
    <Card className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4 p-4">
      <div className="flex items-center gap-3">
        <Popover color='foreground'>
          <PopoverTrigger>
              <Button variant="ghost">
                  <span className="mr-2">Select Date Range</span>
                  <ArrowLeftRight className="inline-block" />
              </Button>
          </PopoverTrigger>
          <PopoverContent className='p-4'>
              <div className="grid grid-cols-2 gap-2 mb-3 w-full">
                  <Button variant='solid' size='sm' onPress={() => setPreset('today')}>Today</Button>
                  <Button variant='solid' size='sm' onPress={() => setPreset('this_week')}>This Week</Button>
                  <Button variant='solid' size='sm' onPress={() => setPreset('this_month')}>This Month</Button>
                  <Button variant='solid' size='sm' onPress={() => setPreset('last_30')}>Last 30 Days</Button>
              </div>
              <div className="mb-3 space-y-1 w-full">
                  <Input label='Start Date' type="date" value={local.startDate || ''} onChange={(e) => setLocal(prev => ({ ...prev, startDate: e.target.value }))} variant='flat' />
                  <Input label='End Date' type="date" value={local.endDate || ''} onChange={(e) => setLocal(prev => ({ ...prev, endDate: e.target.value }))} variant='flat' />
              </div>

              <div className="flex gap-2 items-center w-full">
                  {/* <Button className="text-sm text-gray-500" onPress={() => { setLocal({}); }}>Clear</Button> */}
                  <Button size='sm' variant="bordered" color='danger' onPress={reset}>Clear</Button>
                  <Button size='sm' onPress={apply}>Apply</Button>
              </div>
          </PopoverContent>
        </Popover>
        <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300">{local.startDate ? `${local.startDate} → ${local.endDate || '...'}` : 'No range selected'}</div>
      </div>
      <UsersAutocomplete 
        startContent={<UserCircle2 className="w-5 h-5 text-gray-400" />}
        onSelectChange={(user) => onChange && onChange({ ...filters, userId: user }) }
        placeholder="Filter by Staff or Manager"
        clearable
        className="max-w-xs"
        label="Filter by Staff or Manager"
      />
      {/* <RowSteps 
        currentStep={3}
        size="sm"
        color='secondary'
        // defaultStep={2}
        steps={[
            {
            title: "Create",
            },
            {
            title: "Review",
            },
            {
            title: "Publish",
            },
        ]}
      /> */}

      {/* <div className="flex items-center gap-3">
        <div>
          <Select variant='bordered' className='w-full max-w-xs' defaultValue={local.granularity || 'day'} value={local.granularity || 'day'} onChange={(e) => setLocal(prev => ({ ...prev, granularity: e.target.value }))}>
            <SelectItem key='hour' value="hour">Hour</SelectItem>
            <SelectItem key='day' value="day">Day</SelectItem>
            <SelectItem key='week' value="week">Week</SelectItem>
            <SelectItem key='month' value="month">Month</SelectItem>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onPress={() => onChange && onChange(local)}>Apply</Button>
          <Button variant="ghost" onPress={() => { setLocal({}); onChange && onChange({}) }}>Reset</Button>
        </div>
      </div> */}
    </Card>
  )
}

export default FiltersBar
