'use client'
import React, { useMemo } from 'react'
import { Button, } from '@heroui/button';
import { Input } from '@heroui/input';

import CreateProductCategoryModel from './create-category-modal';
import BulkUploadModal from '@/components/BulkUploadModal'
import BulkUploadResultsModal from './bulk-upload-results-modal'
import DynamicDataTable from '@/components/dynamic-table';
import { useFetchProductCategory } from '@/libs/query/category/use-fetch-categories';
import { useDisclosure } from '@heroui/modal';
import { Search, PencilIcon, Trash2Icon } from 'lucide-react';
import ConfirmActionModal from '@/app/(dashboard)/sales/all/_components/ConfirmActionModal'
import { useDeleteCategory } from '@/libs/mutation/category/use-create-category'
import { Pagination } from '@heroui/pagination';
import { Card } from '@heroui/card';

const CategoryTable = () => {
   const {isOpen, onOpen, onOpenChange} = useDisclosure();
   
   const {isOpen: isUploadOpen, onOpen: onUploadOpen, onOpenChange: onUploadOpenChange} = useDisclosure();
   const {isOpen: isResultsOpen, onOpen: onResultsOpen, onOpenChange: onResultsOpenChange} = useDisclosure();
   const [lastJobId, setLastJobId] = React.useState(null)
   const [editingItem, setEditingItem] = React.useState(null)
   const [deletingItem, setDeletingItem] = React.useState(null)
   const { mutate: deleteCategory } = useDeleteCategory()
   const [selectedKeys, setSelectedKeys] = React.useState(new Set())
   const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false)

   const [search, setSearch] = React.useState('');
   const [limit, setLimit] = React.useState(10);
   const [page, setPage] = React.useState(1);
   const { data: category, isLoading: fetching } = useFetchProductCategory({
      search,
      limit,
      page
   });

   const paginationData = useMemo(() => category?.pagination, [category])

   const columns = [
      { name: 'Name', uid: 'name' },
      { name: 'Creator', uid: 'createdBy' },
      { name: 'Actions', uid: 'actions' },
   ]
   
   const renderCustomActions = (row) => {
      return (
      <div className="flex gap-2">
         <Button isIconOnly color="default" size="sm" onPress={() => { setEditingItem(row); onOpen(true); }} startContent={<PencilIcon size={16} />} />
         <Button isIconOnly color="danger" size="sm" onPress={() => setDeletingItem(row)}>
            <Trash2Icon size={16} />
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
            <Input size="sm" variant='bordered' onChange={handleSearch} endContent={<Search />} label="Search" placeholder='Search Categories ' />
         </div>
         <div>
            {selectedKeys?.size > 0 && (
               <Button onPress={() => setIsBulkDeleteOpen(true)} color="danger" size="sm" className="mr-2">Delete Selected ({selectedKeys?.size})</Button>
            )}
            <Button onPress={onOpen} color="primary" size="sm">Create Category +</Button>
            <Button onPress={onUploadOpen} color="default" size="sm" className="ml-2">Bulk Upload</Button>
         </div>
      </div>
   )

      const bottomContent = (
         <Card className="flex shadow-none justify-between items-center overflow-hidden flex-row">
            <div className='overflow-hidden'>
               <Pagination color="primary" isCompact page={paginationData?.current_page} total={paginationData?.total_pages} onChange={setPage} showControls  />
            </div>
            <select onChange={(e) => setLimit(e.target.value)} value={limit} className='max-w-xs p-1 px-3 border border-default-100'>
               {[10, 20, 50, 100].map(l => (
                  <option className='dark:text-black' key={l} value={l}>{l}</option>
               ))}
            </select>
         </Card>
      )
   
   return (
      <>
         <CreateProductCategoryModel 
            isOpen={isOpen} 
            onOpen={onOpen} 
            onOpenChange={(v) => { onOpenChange(v); if (!v) setEditingItem(null) }}
            item={editingItem}
         />

         <BulkUploadModal type="category" isOpen={isUploadOpen} onOpenChange={onUploadOpenChange} onComplete={(jobId) => { setLastJobId(jobId); onResultsOpenChange(true); }} />
         <BulkUploadResultsModal jobId={lastJobId} isOpen={isResultsOpen} onOpenChange={onResultsOpenChange} />

         <ConfirmActionModal open={Boolean(deletingItem)} title="Delete category" message={`Are you sure you want to delete ${deletingItem?.name || ''}?`} onCancel={() => setDeletingItem(null)} onConfirm={(reason) => {
            if (!deletingItem) return;
            deleteCategory({ ids: [deletingItem._id || deletingItem.id] })
            setDeletingItem(null)
         }} />

         <ConfirmActionModal open={isBulkDeleteOpen} title="Delete selected categories" message={`This will delete ${selectedKeys?.size || 0} categories. This cannot be undone.`} onCancel={() => setIsBulkDeleteOpen(false)} onConfirm={(reason) => {
            const ids = Array.from(selectedKeys || []).map(i => i._id || i.id || i)
            if (ids.length > 0) deleteCategory({ ids })
            setSelectedKeys(new Set())
            setIsBulkDeleteOpen(false)
         }} />

         <DynamicDataTable 
            color="warning"
            aria-label="Category Table"
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            onSelectionChange={setSelectedKeys}
            columns={columns}
            // removeWrapper
            isCompact
            isStriped={false}
            topContent={topcontent}
            bottomContent={bottomContent}
            data={category?.data || []}
            loading={fetching}
            onRowClick={() => {}}
            renderActions={renderCustomActions}
         />
      </>  
   )
}

export default CategoryTable