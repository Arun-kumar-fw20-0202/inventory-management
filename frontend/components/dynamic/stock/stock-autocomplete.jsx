'use client'
import { useSupplierCustomers } from '@/libs/mutation/suppliser-customer/suppliser-customer-mutation-query'
import { useFetchStock } from '@/libs/query/stock/stock-query'
import { Autocomplete, AutocompleteItem} from '@heroui/autocomplete'
import { Avatar } from '@heroui/avatar'
import React from 'react'

const StockAutocomplete = ({ onSelectChange={}, ...props }) => {
   const [limit, setLimit] = React.useState(20)
   const [search, setSearch] = React.useState('')

   const { data: stock, isLoading: fetching, isRefetching } = useFetchStock({ search, limit })

   
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
            defaultItems={stock?.data || []}
            popoverProps={{
               offset: 10,
            }}
            onInputChange={(e) => handleSearch(e)}
            onSelectionChange={(item) => onSelectChange(item)}
         >
            {(item) => (
               <AutocompleteItem key={item?._id} textValue={item?.productName}>
                  <div className="flex justify-between items-center">
                     <div className="flex gap-2 items-center">
                        <Avatar alt={item?.name} className="flex-shrink-0" size="sm" color='primary' src={item?.avatar} />
                        <div className="flex flex-col">
                           <span className="text-small">{item?.productName}</span>
                           <span className="text-tiny">{item?.description}</span>
                        </div>
                     </div>
                  </div>
               </AutocompleteItem>
            )}
         </Autocomplete>
      </>  
   )
}

export default StockAutocomplete