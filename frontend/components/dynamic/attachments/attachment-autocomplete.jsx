'use client'
import { useAttachments } from '@/libs/mutation/stock/stock-attachments-mutation'
import { useattachmentDataCustomers } from '@/libs/mutation/suppliser-customer/suppliser-customer-mutation-query'
import { Autocomplete, AutocompleteItem} from '@heroui/autocomplete'
import { Avatar } from '@heroui/avatar'
import { Chip } from '@heroui/chip'
import React from 'react'

const AttachmentsAutocomplete = ({ onSelectChange={},selectedAttachment={}, ...props }) => {
   const [limit, setLimit] = React.useState(20)
   const [search, setSearch] = React.useState('')

   const { data: attachmentData, isLoading: fetching, isRefetching } = useAttachments({ search, limit })

   
   var debounderTimer;
   const handleSearch = (e) => {
      clearTimeout(debounderTimer);
      debounderTimer = setTimeout(() => {
         setSearch(e);
      }, 1000);
   }

   // return the selected data into selectedAttachment function
   const handleSelect = (item) => {
      if(item){
        const selected = attachmentData?.data?.items?.find(s => s._id === item)
        selectedAttachment(selected)
      }
   }
   
   
   return (
      <>
         <Autocomplete
            {...props}
            isLoading={fetching || isRefetching}
            aria-label="Select attachmentData"
            defaultItems={attachmentData?.data?.items || []}
            onInputChange={(e) => handleSearch(e)}
            onSelectionChange={(item) => {handleSelect(item), onSelectChange(item)}}
         >
            {(item) => (
               <AutocompleteItem key={item?._id} textValue={item?.name} >
                  <div className="flex justify-between items-center">
                     <div className="flex gap-2 items-center w-full">
                        <Avatar alt={item?.name} className="flex-shrink-0" size="sm" color='primary' src={item?.avatar} />
                        <div className="flex flex-col w-full">
                           <div className="flex justify-between w-full">
                              <span className="text-small">{item?.name}</span>
                           </div>
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

export default AttachmentsAutocomplete