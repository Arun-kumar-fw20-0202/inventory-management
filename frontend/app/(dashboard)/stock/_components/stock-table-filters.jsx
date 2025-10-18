import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { SearchIcon } from '@/components/icons'
import { Input } from '@heroui/input'
import { BookOpen, EllipsisVertical, Filter } from 'lucide-react'
import { Button } from '@heroui/button'
import CategoryAutocomplete from '@/components/dynamic/category/category-autocomplete'
import { Popover, PopoverContent, PopoverTrigger } from '@heroui/popover'
import WarehouseAutocomplete from '@/components/dynamic/warehouse/warehouse-autocomplete-'
import { Checkbox } from "@heroui/checkbox"
import { Select, SelectItem } from '@heroui/select'

/**
 * StockTableFilters
 * Props:
 * - filter: current filter object
 * - setFilter: setter to update parent filter state
 * - categories: optional array of category objects { _id, name }
 * - units: optional array of unit strings
 * - className: optional wrapper class
 *
 * Notes:
 * - Search input is debounced for 600ms
 * - Other controls update filter immediately
 */
const StockTableFilters = ({ filter = {}, setFilter, categories = [], units = [], className = '' }) => {
    const defaultState = useMemo(() => ({
        search: '',
        category: '',
        warehouse: '',
        status: '',
        unit: '',
        minPrice: '',
        maxPrice: '',
        lowStock: false,
        includeAnalytics: true,
        limit: 10,
    }), [])

    const [local, setLocal] = useState(() => ({
        search: filter.search || defaultState.search,
        category: filter.category || defaultState.category,
        warehouse: filter.warehouse || defaultState.warehouse,
        status: filter.status || defaultState.status,
        unit: filter.unit || defaultState.unit,
        minPrice: filter.minPrice || defaultState.minPrice,
        maxPrice: filter.maxPrice || defaultState.maxPrice,
        lowStock: !!filter.lowStock,
        includeAnalytics: filter.includeAnalytics === undefined ? defaultState.includeAnalytics : !!filter.includeAnalytics,
        limit: filter.limit || defaultState.limit,
    }))

    const debounceTimer = useRef(null)

    useEffect(() => {
        setLocal(prev => ({
            ...prev,
            search: filter.search || defaultState.search,
            category: filter.category || defaultState.category,
            warehouse: filter.warehouse || defaultState.warehouse,
            status: filter.status || defaultState.status,
            unit: filter.unit || defaultState.unit,
            minPrice: filter.minPrice || defaultState.minPrice,
            maxPrice: filter.maxPrice || defaultState.maxPrice,
            lowStock: !!filter.lowStock,
            includeAnalytics: filter.includeAnalytics === undefined ? defaultState.includeAnalytics : !!filter.includeAnalytics,
            limit: filter.limit || defaultState.limit,
        }))
    }, [filter, defaultState])

    const updateParent = useCallback((patch, immediate = true) => {
        if (!setFilter) return
        
        if (immediate) {
            setFilter(prev => ({ ...prev, ...patch, page: 1 }))
            return
        }

        // debounced update (used for search)
        clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(() => {
            setFilter(prev => ({ ...prev, ...patch, page: 1 }))
        }, 600)
    }, [setFilter])

    const onSearchChange = useCallback((e) => {
        const v = e.target.value
        setLocal(l => ({ ...l, search: v }))
        updateParent({ search: v }, false)
    }, [updateParent])

    const onChange = useCallback((key) => (e) => {
        const value = e.target?.type === 'checkbox' ? e.target.checked : e.target?.value || e
        setLocal(l => ({ ...l, [key]: value }))
        
        // numeric fields should convert to numbers when present
        if (key === 'minPrice' || key === 'maxPrice') {
            const num = value === '' || value === null ? null : Number(value)
            updateParent({ [key]: num })
        } else if (key === 'limit') {
            updateParent({ [key]: Number(value) })
        } else {
            updateParent({ [key]: value })
        }
    }, [updateParent])

    const handleCategoryChange = useCallback((item) => {
        const catId = item || ''
        setLocal(l => ({ ...l, category: catId }))
        updateParent({ category: catId })
    }, [updateParent])

    const handleWarehouseChange = useCallback((item) => {
        const whId = item || ''
        setLocal(l => ({ ...l, warehouse: whId }))
        updateParent({ warehouse: whId })
    }, [updateParent])

    const handleReset = useCallback(() => {
        const resetState = {
            ...defaultState,
            category: null,
            warehouse: null,
            minPrice: null,
            maxPrice: null
        }
        setLocal(resetState)
        if (setFilter) {
            setFilter(prev => ({ ...prev, ...resetState, page: 1 }))
        }
    }, [defaultState, setFilter])

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
            }
        }
    }, [])

    return (
        <div className={`w-full ${className} flex justify-between items-center flex-wrap gap-2`}>
            <Input placeholder="Search stock items..." label="Search" value={local.search} onChange={onSearchChange} className="rounded-sm max-w-xs w-full" endContent={<SearchIcon />} startContent={<BookOpen />} variant='bordered' />

            <Popover>
                <PopoverTrigger>
                    <Button size='lg' color='primary' isIconOnly className='rounded-sm'>
                        <Filter size={18} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='gap-2'>
                    <div className="flex flex-col items-center gap-2">
                        <CategoryAutocomplete 
                            label="Category"
                            size='sm'
                            clearable
                            selectedKey={local.category}
                            placeholder='Search For Category'
                            onSelectChange={handleCategoryChange}
                        />

                        <WarehouseAutocomplete 
                            label="Warehouse"
                            size='sm'
                            clearable
                            selectedKey={local.warehouse}
                            placeholder='Search For Warehouse'
                            onSelectChange={handleWarehouseChange}
                        />
                        <Select
                            label="Status"
                            size='sm'
                            value={local.status}
                            onChange={onChange('status')}
                            placeholder="Select Status"
                            disabledKeys={new Set([local.status])}
                        >
                            <SelectItem key='all' value="all">All</SelectItem>
                            <SelectItem key='active' value="active">Active</SelectItem>
                            <SelectItem key='inactive' value="inactive">Inactive</SelectItem>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <div className="w-full gap-2">
                            <label className="text-xs text-gray-600 dark:text-gray-400">Price Range</label>
                            <div className="flex flex-col gap-2">
                                <Input 
                                    type="number" 
                                    placeholder="Min Price" 
                                    value={local.minPrice ?? ''} 
                                    onChange={onChange('minPrice')}
                                    min="0"
                                    step="0.01"
                                />
                                <Input 
                                    type="number" 
                                    placeholder="Max Price" 
                                    value={local.maxPrice ?? ''} 
                                    onChange={onChange('maxPrice')}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Checkbox 
                                size='sm'
                                isSelected={local.lowStock} 
                                onValueChange={onChange('lowStock')}
                            >
                                Low Stock Alert
                            </Checkbox>
                            <Checkbox 
                                size='sm'
                                isSelected={local.includeAnalytics} 
                                onValueChange={onChange('includeAnalytics')}
                            >
                                Include Analytics
                            </Checkbox>
                        </div>
                        
                        <Button variant="flat" color='danger' onPress={handleReset} className="mt-2">
                            Reset Filters
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default StockTableFilters