'use client'
import { TableStyleFormate } from '@/components/formate'
import { useFetchStock } from '@/libs/query/stock/stock-query'
import { Button } from '@heroui/button'
import { Card } from '@heroui/card'
import { Spinner } from '@heroui/spinner'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/table'
import { Chip } from '@heroui/chip'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { RefreshCcw, MoreVertical, Edit, Eye, Trash2, Plus } from 'lucide-react'
import React from 'react'

// Column definitions
const columns = [
   { name: "PRODUCT", uid: "productName", sortable: true },
   { name: "SKU", uid: "sku", sortable: true },
   { name: "CATEGORY", uid: "category", sortable: true },
   { name: "WAREHOUSE", uid: "warehouse", sortable: true },
   { name: "QUANTITY", uid: "quantity", sortable: true },
   { name: "UNIT", uid: "unit", sortable: false },
   { name: "PRICE", uid: "sellingPrice", sortable: true },
   { name: "TOTAL VALUE", uid: "totalValue", sortable: false },
   { name: "STATUS", uid: "stockStatus", sortable: false },
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
}) => {

   const renderCell = React.useCallback((item, columnKey) => {
      const cellValue = item[columnKey];

      switch (columnKey) {
         case "productName":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm capitalize">{item.productName}</p>
                  <p className="text-bold text-xs capitalize text-gray-600 dark:text-gray-400 ">{item.description.substring(0, 30) || "No description"} {item?.description.length > 30 ? "..." : ""}</p>
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
                  <p className="text-bold text-sm capitalize">{item?.category?.name}</p>
               </div>
            );
         case "warehouse":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm capitalize">{item?.warehouse?.name}</p>
                  {item?.warehouse?.location && <p className="text-xs text-gray-600 dark:text-gray-400">{item?.warehouse?.location}</p>}
               </div>
            );
         case "quantity":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className={`text-bold text-sm ${item.isLowStock ? 'text-danger' : 'text-success'}`}>
                     {item.quantity}
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
                  <p className="text-xs text-gray-600 dark:text-gray-400">Cost: ₹{item.purchasePrice}</p>
               </div>
            );
         case "totalValue":
            return (
               <div className="flex flex-col text-nowrap">
                  <p className="text-bold text-sm text-success">₹{item.totalValue}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                     Profit: ₹{((item.sellingPrice - item.purchasePrice) * item.quantity)}
                  </p>
               </div>
            );
         case "stockStatus":
            return (
               <Chip 
                  className="capitalize" 
                  color={
                     item.stockStatus === 'inactive' ? 'danger' :
                     item.stockStatus === 'lowstock' ? 'warning' : 'success'
                  } 
                  size="sm" 
                  variant="flat"
               >
                  {item.stockStatus}
               </Chip>
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

   
   return (
      <>
         <Table
            aria-label="Enhanced stock table"
            isHeaderSticky
            isStriped
            shadow='none'
            selectionMode="multiple"
            onSelectionChange={setBulkSelection}
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
                  <div className="flex gap-2">
                     <Button 
                        size='sm'
                        variant="flat" 
                        onPress={onRefresh}
                        isLoading={isLoading}
                        startContent={<RefreshCcw size={16} />}
                     >
                        Refresh
                     </Button>
                     <Button onPress={onAddNew} color='primary' variant='flat' size='sm' startContent={<Plus className="w-4 h-4" />}>
                        Add New Stock
                     </Button>
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
                  <TableRow key={item._id}>
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