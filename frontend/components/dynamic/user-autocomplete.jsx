'use client'
import { useFetchUsers } from '@/libs/mutation/user/user-mutations'
import { Autocomplete, AutocompleteItem} from '@heroui/autocomplete'
import { Avatar } from '@heroui/avatar'
import React from 'react'

const UsersAutocomplete = ({ onSelectChange={} , ...props }) => {
   const [limit, setLimit] = React.useState(20)
   const [search, setSearch] = React.useState('')

   const { data: users, isLoading: fetching, isRefetching } = useFetchUsers({ search, limit, fields: 'name email phone activerole' })

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
                defaultItems={users?.data?.users || []}
                popoverProps={{
                offset: 10,
                }}
                emptyState="No Users"
                loadingState="Loading Users..."
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
                                <span className="text-tiny">{item?.email}</span>
                            </div>
                        </div>
                    </div>
                </AutocompleteItem>
                )}
            </Autocomplete>
        </>  
    )
}

export default UsersAutocomplete