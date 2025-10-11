'use client'
import { useSupplierCustomers } from '@/libs/mutation/suppliser-customer/suppliser-customer-mutation-query'
import { Autocomplete, AutocompleteItem} from '@heroui/autocomplete'
import { Avatar } from '@heroui/avatar'
import React, { useEffect } from 'react'

const SupplierCustomerAutocomplete = ({ onSelectChange={},userData={}, type='supplier', ...props }) => {
   const [limit, setLimit] = React.useState(20)
   const [search, setSearch] = React.useState('')

   const { data: supplier, isLoading: fetching, isRefetching } = useSupplierCustomers({ search, limit, type: type })

   
   var debounderTimer;
   const handleSearch = (e) => {
      clearTimeout(debounderTimer);
      debounderTimer = setTimeout(() => {
         setSearch(e);
      }, 1000);
   }

   // return the selected data into userData function
   const handleSelect = (item) => {
      if(item){
         const selected = supplier?.data?.data?.find(s => s._id === item)
         userData(selected)
      }
   }
   
   
   return (
      <>
         <Autocomplete
            {...props}
            isLoading={fetching || isRefetching}
            aria-label="Select Supplier/Customer"
            defaultItems={supplier?.data?.data || []}
            popoverProps={{
               offset: 10,
            }}
            onInputChange={(e) => handleSearch(e)}
            onSelectionChange={(item) => {handleSelect(item), onSelectChange(item)}}
         >
            {(item) => (
               <AutocompleteItem key={item?._id} textValue={item?.name} >
                  <div className="flex justify-between items-center">
                     <div className="flex gap-2 items-center">
                        <Avatar alt={item?.name} className="flex-shrink-0" size="sm" color='primary' src={item?.avatar} />
                        <div className="flex flex-col">
                           <span className="text-small">{item?.name}</span>
                           <span className="text-tiny">{item?.phone}</span>
                        </div>
                     </div>
                  </div>
               </AutocompleteItem>
            )}
         </Autocomplete>
      </>  
   )
}

export default SupplierCustomerAutocomplete