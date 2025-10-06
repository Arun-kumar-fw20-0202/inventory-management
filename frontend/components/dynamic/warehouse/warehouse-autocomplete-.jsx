'use client'
import { useFetchWarehouses } from '@/libs/query/warehouse/use-fetch-warehouses'
import { Autocomplete, AutocompleteItem} from '@heroui/autocomplete'
import { Avatar } from '@heroui/avatar'
import React from 'react'

const WarehouseAutocomplete = ({ onSelectChange={} , ...props }) => {
   const [limit, setLimit] = React.useState(20)
   const [search, setSearch] = React.useState('')

   const { data: warehouses, isLoading: fetching, isRefetching } = useFetchWarehouses({ search, limit })

   
   var debounderTimer;
   const handleSearch = (e) => {
      clearTimeout(debounderTimer);
      debounderTimer = setTimeout(() => {
         setSearch(e);
      }, 1000);
   }
   
   
   return (
      <>
         <Autocomplete
            {...props}
            isLoading={fetching || isRefetching}
            aria-label="Select Warehouse"
            defaultItems={warehouses?.data || []}
            popoverProps={{
               offset: 10,
            }}
            emptyState="No warehouses"
            loadingState="Loading warehouses..."
            onInputChange={(e) => handleSearch(e)}
            onSelectionChange={(item) => onSelectChange(item)}
         >
            {(item) => (
               <AutocompleteItem key={item?._id} textValue={item?.name}>
                  <div className="flex justify-between items-center">
                     <div className="flex gap-2 items-center">
                        <Avatar alt={item?.name} className="flex-shrink-0" size="sm" color='primary' src={item?.avatar} />
                        <div className="flex flex-col">
                           <span className="text-small">{item?.name}</span>
                           <span className="text-tiny">{item?.location}</span>
                        </div>
                     </div>
                  </div>
               </AutocompleteItem>
            )}
         </Autocomplete>
      </>  
   )
}

export default WarehouseAutocomplete