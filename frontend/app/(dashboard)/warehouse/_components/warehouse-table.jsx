'use client'
import React, { useMemo } from 'react'
import CreateWherehouseModel from './create-warehouse-model';
import BulkUploadModal from './bulk-upload-modal'
import BulkUploadResultsModal from './bulk-upload-results-modal'
import { Button } from '@heroui/button';
import {  EyeIcon, PencilIcon, Search, Trash2Icon, Warehouse } from 'lucide-react';
import DynamicDataTable from '@/components/dynamic-table';
import { useFetchWarehouses } from '@/libs/query/warehouse/use-fetch-warehouses';
import { Input } from '@heroui/input';
import { useDisclosure } from '@heroui/modal';
import ConfirmActionModal from '@/app/(dashboard)/sales/all/_components/ConfirmActionModal'
import { useDeleteWarehouse } from '@/libs/mutation/warehouse/use-create-warehouse'
import { Pagination } from '@heroui/pagination';
import { Select, SelectItem } from '@heroui/select';

const WarehouseTable = () => {
   const [search, setSearch] = React.useState('');
   const [page, setPage] = React.useState(1);
   const [limit, setLimit] = React.useState(10);
   const  { data: warehouses, isLoading: fetching } = useFetchWarehouses({
      search,
      page,
      limit,
   });

   const paginationData = useMemo(() => warehouses?.pagination, [warehouses])
   
   const {isOpen, onOpen, onOpenChange} = useDisclosure();
   const {isOpen: isUploadOpen, onOpen: onUploadOpen, onOpenChange: onUploadOpenChange} = useDisclosure();
   const {isOpen: isResultsOpen, onOpen: onResultsOpen, onOpenChange: onResultsOpenChange} = useDisclosure();
   const [lastJobId, setLastJobId] = React.useState(null)
   const [editingItem, setEditingItem] = React.useState(null)
   const [deletingItem, setDeletingItem] = React.useState(null)
   const { mutate: deleteWarehouse } = useDeleteWarehouse()
   const [selectedKeys, setSelectedKeys] = React.useState(new Set());
   const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);

   const columns = [
      { name: 'Warehouse Name', uid: 'name' },
      { name: 'Location', uid: 'location' },
      { name: 'Creator', uid: 'createdBy' },
      { name: 'Actions', uid: 'actions' },
   ]

   const renderCustomActions = (row) => {
      return (
      <div className="flex gap-2">
         <Button isIconOnly color="default" size="sm" onPress={() => { setEditingItem(row); onOpen(true); }} startContent={<PencilIcon size={17} />} />
         <Button isIconOnly color="danger" size="sm" onPress={() => setDeletingItem(row)}>
            <Trash2Icon size={17} />
         </Button>
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
            <Input 
               // startContent={<Warehouse />}
               variant='bordered' size="sm" onChange={handleSearch} endContent={<Search />}  
               label="Search Warehouse"
               placeholder="Search warehouse by name or location"
            />
         </div>
         <div>
            {selectedKeys?.size > 0 && (
               <Button onPress={() => setIsBulkDeleteOpen(true)} color="danger" size="sm" className="mr-2">Delete Selected ({selectedKeys?.size})</Button>
            )}
            <Button onPress={onOpen} color="primary" size="sm">Create Warehouse +</Button>
            <Button onPress={onUploadOpen} color="default" size="sm" className="ml-2">Bulk Upload</Button>
            
         </div>
      </div>
   )
   
   const bottomContent = (
      <div className="flex justify-between items-center mt-2 overflow-hidden">
         <Pagination color="primary" isCompact page={paginationData?.currentPage} total={paginationData?.totalPages} onChange={setPage} showControls/>
         <select onChange={(e) => setLimit(e.target.value)} value={limit} className='max-w-xs p-1 px-3 border border-default-100'>
            {[10, 20, 50, 100].map(l => (
               <option className='dark:text-black' key={l} value={l}>{l}</option>
            ))}
         </select>
      </div>
   )

   
   return (
      <>
         <CreateWherehouseModel 
            isOpen={isOpen} 
            onOpen={onOpen} 
            onOpenChange={(v) => { onOpenChange(v); if(!v) setEditingItem(null) }}
            item={editingItem}
         />

         <BulkUploadModal isOpen={isUploadOpen} onOpenChange={onUploadOpenChange} onComplete={(jobId) => { setLastJobId(jobId); onResultsOpenChange(true); }} />
         <BulkUploadResultsModal jobId={lastJobId} isOpen={isResultsOpen} onOpenChange={onResultsOpenChange} />

         <ConfirmActionModal open={Boolean(deletingItem)} title="Delete warehouse" message={`Are you sure you want to delete ${deletingItem?.name || ''}?`} onCancel={() => setDeletingItem(null)} onConfirm={(reason) => {
            if (!deletingItem) return;
            deleteWarehouse({ ids: [deletingItem._id || deletingItem.id] })
            setDeletingItem(null)
         }} />

         <ConfirmActionModal open={isBulkDeleteOpen} title="Delete selected warehouses" message={`This will delete ${selectedKeys?.size || 0} warehouses. This action cannot be undone. Are you sure?`} onCancel={() => setIsBulkDeleteOpen(false)} onConfirm={(reason) => {
            const ids = Array.from(selectedKeys || []).map(i => i._id || i.id || i)
            if (ids.length > 0) {
               deleteWarehouse({ ids })
            }
            setSelectedKeys(new Set())
            setIsBulkDeleteOpen(false)
         }} />

         <DynamicDataTable 
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            onSelectionChange={setSelectedKeys}
            isCompact
            isStriped={false}
            color="warning"
            aria-label="Warehouse Table"
            columns={columns}
            topContent={topcontent}
            bottomContent={bottomContent}
            data={warehouses?.data || []}
            loading={fetching}
            onRowClick={() => {}}
            renderActions={renderCustomActions}
         />
         
      </>
   )
}

export default WarehouseTable