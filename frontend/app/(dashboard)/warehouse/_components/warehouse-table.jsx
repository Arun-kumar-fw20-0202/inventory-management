'use client'
import React from 'react'
import CreateWherehouseModel from './create-warehouse-model';
import { Button } from '@heroui/button';
import {  EyeIcon, Search } from 'lucide-react';
import DynamicDataTable from '@/components/dynamic-table';
import { useFetchWarehouses } from '@/libs/query/warehouse/use-fetch-warehouses';
import { Input } from '@heroui/input';
import { useDisclosure } from '@heroui/modal';

const WarehouseTable = () => {
   const [search, setSearch] = React.useState('');
   
   const  { data: warehouses, isLoading: fetching } = useFetchWarehouses({
      search
   });
   const {isOpen, onOpen, onOpenChange} = useDisclosure();

   const columns = [
      { name: 'Warehouse Name', uid: 'name' },
      { name: 'Location', uid: 'location' },
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
            <Input placeholder="Search" variant='bordered' size="sm" onChange={handleSearch} endContent={<Search />}  />
         </div>
         <div>
            <Button onPress={onOpen} color="primary" size="sm">Create Warehouse +</Button>
         </div>
      </div>
   )
   
   return (
      <>
         <CreateWherehouseModel 
            isOpen={isOpen} 
            onOpen={onOpen} 
            onOpenChange={onOpenChange}
         />

         <DynamicDataTable 
            columns={columns}
            topContent={topcontent}
            bottomContent={null}
            data={warehouses?.data || []}
            loading={fetching}
            onRowClick={() => {}}
            renderActions={renderCustomActions}
         />
         
      </>
   )
}

export default WarehouseTable