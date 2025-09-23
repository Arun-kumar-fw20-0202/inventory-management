'use client'
import { useFetchProductCategory } from '@/libs/query/category/use-fetch-categories'
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete'
import { Avatar } from '@heroui/avatar'
import React from 'react'

const CategoryAutocomplete = ({ onSelectChange={}, ...props }) => {
   const [limit, setLimit] = React.useState(20)
   const [search, setSearch] = React.useState('')

   const { data: category, isLoading: fetching, isRefetching } = useFetchProductCategory({ search, limit })

   
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
            aria-label="Select category"
            defaultItems={category?.data || []}
            popoverProps={{
               offset: 10,
            }}
            onInputChange={(e) => handleSearch(e)}
            onSelectionChange={(item) => onSelectChange(item)}
         >
            {(item) => (
               <AutocompleteItem key={item?._id} textValue={item?.name}>
                  <div className="flex justify-between items-center">
                     <div className="flex gap-2 items-center">
                        <Avatar alt={item?.name} className="flex-shrink-0" size="sm" />
                        <div className="flex flex-col">
                           <span className="text-small">{item?.name}</span>
                           <span className="text-tiny text-default-400">{item?.description}</span>
                        </div>
                     </div>
                  </div>
               </AutocompleteItem>
            )}
         </Autocomplete>
      </>  
   )
}

export default CategoryAutocomplete