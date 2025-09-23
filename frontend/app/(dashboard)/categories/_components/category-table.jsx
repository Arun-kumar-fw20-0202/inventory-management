'use client'
import React from 'react'
import { Button, } from '@heroui/button';
import { Input } from '@heroui/input';

import CreateProductCategoryModel from './create-category-modal';
import DynamicDataTable from '@/components/dynamic-table';
import { useFetchProductCategory } from '@/libs/query/category/use-fetch-categories';
import { useDisclosure } from '@heroui/modal';
import { EyeIcon, Search } from 'lucide-react';

const CategoryTable = () => {
   const {isOpen, onOpen, onOpenChange} = useDisclosure();
   const [search, setSearch] = React.useState('');
   const [limit, setLimit] = React.useState(10);
   const [page, setPage] = React.useState(1);
   const { data: category, isLoading: fetching } = useFetchProductCategory({
      search,
      limit,
      page
   });

   const columns = [
      { name: 'Name', uid: 'name' },
      { name: 'Description', uid: 'description' },
      { name: 'Actions', uid: 'actions' },
   ]
   
   const renderCustomActions = (user) => {
      return (
      <div className="flex gap-2">
         <Button isIconOnly color="default" size="sm" onPress={() => alert(`Edit ${user.name}`)} startContent={<EyeIcon />} />
      </div>
   )};


   var debounderTimer;
   const handleSearch = (e) => {
      clearTimeout(debounderTimer);
      debounderTimer = setTimeout(() => {
         setSearch(e.target.value);
      }, 1000);
   }
   
   const topcontent = (
      <div className="flex justify-between items-center">
         <div className="flex gap-3">
            <Input placeholder="Search" size="sm" variant='bordered' onChange={handleSearch} endContent={<Search />}  />
         </div>
         <div>
            <Button onPress={onOpen} color="primary" size="sm">Create Category +</Button>
         </div>
      </div>
   )
   
   return (
      <>
         <CreateProductCategoryModel 
            isOpen={isOpen} 
            onOpen={onOpen} 
            onOpenChange={onOpenChange}
         />

         <DynamicDataTable 
            columns={columns}
            topContent={topcontent}
            bottomContent={null}
            data={category?.data || []}
            loading={fetching}
            onRowClick={() => {}}
            renderActions={renderCustomActions}
         />
      </>  
   )
}

export default CategoryTable