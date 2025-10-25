'use client'
import { TableStyleFormate } from '@/components/formate'
import { Button } from '@heroui/button'
import { Spinner } from '@heroui/spinner'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/table'
import { Chip } from '@heroui/chip'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { RefreshCcw, MoreVertical, Edit, Eye, Trash2, Plus, SheetIcon, Paperclip } from 'lucide-react'
import React from 'react'
import { formatDateRelative } from '@/libs/utils'
import BulkUploadModal from '@/components/BulkUploadModal'
import BulkUploadResultsModal from '../../categories/_components/bulk-upload-results-modal'
import { useDisclosure } from '@heroui/modal'
import { Avatar } from '@heroui/avatar'
import { useRouter } from 'next/navigation'

// Column definitions
const columns = [
   { name: "PRODUCT", uid: "productName", sortable: true },
   { name: "SKU", uid: "sku", sortable: true },
   { name: "CATEGORY", uid: "category", sortable: true },
   { name: "WAREHOUSE", uid: "warehouse", sortable: true },
   { name: "QUANTITY", uid: "quantity", sortable: true },
   // { name: "UNIT", uid: "unit", sortable: false },
   { name: "PRICE", uid: "sellingPrice", sortable: true },
   { name: 'ATTACHMENTS', uid: 'attachmentsCount', sortable: false },
   { name: "TOTAL VALUE", uid: "totalValue", sortable: false },
   { name: "STATUS", uid: "stockStatus", sortable: false },
   { name: "CREATEDAT", uid: "createdAt", sortable: false },
   { name: "ACTIONS", uid: "actions", sortable: false },
];

const StockTable = ({
   tableData,
   isLoading,
   paginationData,
   bulkSelection,
   setBulkSelection,
   onRefresh,
   onAddNew,
   onViewDetails,
   onEdit,
   onDelete,
   bottomContent,
}) => {

   const router = useRouter();
   const renderCell = React.useCallback((item, columnKey) => {
      const cellValue = item[columnKey];

      switch (columnKey) {
         case "productName":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm capitalize">{item.productName}</p>
                  <p className="text-bold text-xs capitalize text-gray-600 dark:text-gray-300 ">{item.description.substring(0, 30) || "No description"} {item?.description.length > 30 ? "..." : ""}</p>
               </div>
            );
         case "attachmentsCount":
            return (
               item.attachmentsCount || item.attachmentsCount ? (
                  <div className="flex flex-col text-nowrap">
                     <p className="text-bold text-sm">{item.attachmentsCount || "--"} Attachments</p>
                     <p className="text-bold text-xs text-gray-600 dark:text-gray-300 ">Total quantity: {item.totalAttachmentCount || 0}</p>
                  </div>
               )
            :
               <div className="flex flex-col text-nowrap text-center">
                  <p className="text-bold text-sm">----</p>
               </div>
            );
         case "sku":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm">{item.sku}</p>
               </div>
            );
         case "category":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm capitalize">{item?.category?.name || <i className='text-danger text-xs font-semibold'>Category not found</i>}</p>
               </div>
            );
         case "warehouse":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm capitalize">{item?.warehouse?.name || <i className='text-danger text-xs font-semibold'>Warehouse not found</i>}</p>
                  {item?.warehouse?.location && <p className="text-xs text-gray-600 dark:text-gray-300">{item?.warehouse?.location}</p>}
               </div>
            );
         case "quantity":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className={`text-bold text-sm ${item.isLowStock ? 'text-danger' : 'text-success'}`}>
                     {item.quantity} {item.unit}
                  </p>
                  {item.isLowStock && <p className="text-xs text-danger">Low Stock</p>}
               </div>
            );
         case "unit":
            return (
               <Chip className="capitalize" color="default" size="sm" variant="flat">
                  {item.unit}
               </Chip>
            );
         case "sellingPrice":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm">₹{item.sellingPrice}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Cost: ₹{item.purchasePrice}</p>
               </div>
            );
         case "totalValue":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm text-success">₹{item.totalValue}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                     Profit: ₹{((item.sellingPrice - item.purchasePrice) * item.quantity)}
                  </p>
               </div>
            );
         case "stockStatus":
            return (
               <Chip 
                  className="capitalize" 
                  color={
                     item.status === 'inactive' ? 'danger' :
                     item.status === 'archived' ? 'warning' : 'success'
                  } 
                  size="sm" 
                  variant="flat"
               >
                  {item.status}
               </Chip>
            );

         case "createdAt":
            return (
               <div className="flex flex-col text-nowrap">
                  <div className="flex gap-2">
                     <Avatar name={item?.createdBy?.name} className='h-6 w-6' />
                     <div className="flex flex-col">
                        <p className="text-bold text-sm">
                           {item[columnKey] ? formatDateRelative(item[columnKey]) : 'N/A'}
                        </p>
                        <p className='text-xs'> By : {item?.createdBy?.name}</p>
                     </div>
                  </div>
               </div>
            );
            
         case "actions":
            return (
               <div className="relative flex justify-end items-center gap-2">
                  <Dropdown>
                     <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                           <MoreVertical className="text-default-300" />
                        </Button>
                     </DropdownTrigger>
                     <DropdownMenu>
                        <DropdownItem key="add-attachments" startContent={<Paperclip size={16} />} onPress={() => router.push(`/stock/product-attachments/${item._id}`) }>
                           Add Attachments
                        </DropdownItem>
                        <DropdownItem key="view" startContent={<Eye size={16} />} onPress={() => onViewDetails?.(item)}>
                           View Details
                        </DropdownItem>
                        <DropdownItem key="edit" startContent={<Edit size={16} />} onPress={() => onEdit?.(item)}>
                           Edit
                        </DropdownItem>
                        <DropdownItem 
                           key="delete" 
                           className="text-danger" 
                           color="danger" 
                           startContent={<Trash2 size={16} />}
                           onPress={() => onDelete?.(item)}
                        >
                           Delete
                        </DropdownItem>
                     </DropdownMenu>
                  </Dropdown>
               </div>
            );
         default:
            return cellValue;
      }
   }, [onViewDetails, onEdit, onDelete]);


   const {isOpen: isUploadOpen, onOpen: onUploadOpen, onOpenChange: onUploadOpenChange} = useDisclosure();
   const {isOpen: isResultsOpen, onOpen: onResultsOpen, onOpenChange: onResultsOpenChange} = useDisclosure();
   const [lastJobId, setLastJobId] = React.useState(null)


   
   return (
      <>
         <BulkUploadModal type="stock" isOpen={isUploadOpen} onOpenChange={onUploadOpenChange} onComplete={(jobId) => { setLastJobId(jobId); onResultsOpenChange(false); }} />
         <BulkUploadResultsModal jobId={lastJobId} isOpen={isResultsOpen} onOpenChange={onResultsOpenChange} />

         <Table
            aria-label="Enhanced stock table"
            isHeaderSticky
            isStriped={true}
            bottomContent={bottomContent && bottomContent()}
            shadow='none'
            selectionMode="multiple"
            // onSelectionChange={setBulkSelection}
            topContent={
               <div className="flex flex-wrap gap-3 sticky left-0 justify-between items-center">
                  <div>
                     <h2 className="text-lg font-semibold">Stock Inventory</h2>
                     {paginationData && (
                        <p className="text-sm text-gray-500">
                           {paginationData.totalItems} total items
                        </p>
                     )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <Button size='sm' variant="flat"  onPress={onRefresh} isLoading={isLoading} startContent={<RefreshCcw size={16} />}>Refresh</Button>
                     <Button onPress={onAddNew} color='primary' variant='flat' size='sm' startContent={<Plus className="w-4 h-4" />}>Add New Stock</Button>
                     <Button onPress={onUploadOpen} color='success' variant='flat' size='sm' startContent={<SheetIcon className="w-4 h-4" />}>Bulk Upload</Button>
                  </div>
               </div>
            }
            classNames={TableStyleFormate()}
         >
            <TableHeader columns={columns}>
               {(column) => (
                  <TableColumn
                     key={column.uid}
                     align={column.uid === "actions" ? "center" : "start"}
                     allowsSorting={column.sortable}
                  >
                     {column.name}
                  </TableColumn>
               )}
            </TableHeader>
            <TableBody
               emptyContent={
                  <div className="text-center py-8">
                     <p className="text-gray-500 text-lg mb-2">No stock items found</p>
                     <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </div>
               }
               items={tableData || []}
               isLoading={isLoading}
               loadingContent={<Spinner size="lg" />}
            >
               {(item) => (
                  <TableRow key={item._id} className={
                     item?.lowStockThreshold >= item?.quantity && 'bg-danger/5 text-danger'
                  }>
                     {(columnKey) => (
                        <TableCell>{renderCell(item, columnKey)}</TableCell>
                     )}
                  </TableRow>
               )}
            </TableBody>
         </Table>
      </>
   )
}

export default StockTable