'use client'
import React, { useState, useMemo } from 'react'
import { Avatar } from '@heroui/avatar'
import { Select, SelectItem } from '@heroui/select'
import { Input } from '@heroui/input'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Spinner } from '@heroui/spinner'
import { Pagination } from '@heroui/pagination'
import { Card, CardBody, CardHeader } from '@heroui/card'

import { 
   Search, 
   MoreVertical, 
   Edit, 
   Trash2, 
   Eye, 
   Mail, 
   Phone, 
   Star,
   MapPin,
   CreditCard,
   TrendingUp,
   Calendar
} from 'lucide-react'
import { useSupplierCustomers, useDeleteSupplierCustomer } from '@/libs/mutation/suppliser-customer/suppliser-customer-mutation-query'
import { formatDateRelative, formatNumberShort } from '@/libs/utils'
import { useSelector } from 'react-redux'

const SupplierCustomerCards = ({ 
   type = '', 
   onEdit, 
   onView,
   refreshTrigger = 0 
}) => {
   const [page, setPage] = useState(1)
   const [limit] = useState(12) // Reduced for card layout
   const [search, setSearch] = useState('')
   const [statusFilter, setStatusFilter] = useState('')
   const [categoryFilter, setCategoryFilter] = useState('')
   const [sortBy, setSortBy] = useState('createdAt')
   const [sortOrder, setSortOrder] = useState('desc')
   const [fields, setFields] = useState('metrics,name,email,phone,type,companyName,category,status,totalSales,totalPurchases,lastSaleAmount,lastPurchaseAmount,totalTransactions,displayName,lastTransactionDate,createdAt,rating') // 'basic' | 'detailed'

   const user = useSelector((state) => state.auth.user);

   // Query filters
   const filters = useMemo(() => {
      const baseFilters = {
         page,
         limit,
         ...(search && { search }),
         ...(statusFilter && { status: statusFilter }),
         ...(categoryFilter && { category: categoryFilter }),
         sortBy,
         sortOrder,
         fields,
      };
      
      if (type === 'supplier') {
         baseFilters.type = 'supplier';
      } else if (type === 'customer') {
         baseFilters.type = 'customer';
      }
      
      return baseFilters;
   }, [page, limit, type, search, statusFilter, categoryFilter, sortBy, sortOrder])

   const { data, isLoading, error, refetch } = useSupplierCustomers(filters)
   const deleteMutation = useDeleteSupplierCustomer()

   React.useEffect(() => {
      if (refreshTrigger > 0) {
         refetch()
      }
   }, [refreshTrigger, refetch])

   const handleDelete = async (id, name) => {
      if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
         try {
            await deleteMutation.mutateAsync(id)
         } catch (error) {
            console.error('Delete failed:', error)
         }
      }
   }

   const getStatusColor = (status) => {
      switch (status) {
         case 'active': return 'success'
         case 'inactive': return 'default'
         case 'suspended': return 'warning'
         case 'blacklisted': return 'danger'
         default: return 'default'
      }
   }

   const getCategoryColor = (category) => {
      switch (category) {
         case 'premium': return 'secondary'
         case 'vip': return 'primary'
         case 'standard': return 'default'
         case 'basic': return 'warning'
         default: return 'default'
      }
   }

   const getTypeColor = (type) => {
      switch (type) {
         case 'supplier': return 'primary'
         case 'customer': return 'success'
         case 'both': return 'secondary'
         default: return 'default'
      }
   }

   const formatCurrency = (amount) => {
      return `₹${amount?.toFixed(2)}`
   }

   const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString()
   }

   const ContactCard = ({ item }) => (
      <Card className="w-full h-full  border shadow-sm border-default-100">
         <CardHeader className="pb-2">
            <div className="flex items-start justify-between w-full">
               <div className="flex items-center gap-3">
                  <Avatar
                     name={item?.displayName || item?.name}
                     size="md"
                     color="primary"
                     variant="flat"
                  />
                  <div className="flex flex-col">
                     <h4 className="font-semibold text-base line-clamp-1">
                        {item?.displayName || item?.name}
                     </h4>
                     <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-1">{item?.email}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <Chip
                     color={getTypeColor(item?.type)}
                     variant="flat"
                     size="sm"
                  >
                     {item?.type?.toUpperCase()}
                  </Chip>
                  <Dropdown>
                     <DropdownTrigger>
                        <Button
                           variant="light"
                           size="sm"
                           isIconOnly
                        >
                           <MoreVertical className="w-4 h-4" />
                        </Button>
                     </DropdownTrigger>
                     <DropdownMenu aria-label="Actions">
                        <DropdownItem
                           key="view"
                           startContent={<Eye className="w-4 h-4" />}
                           onClick={() => onView?.(item)}
                        >
                           View Details
                        </DropdownItem>
                        <DropdownItem
                           key="edit"
                           startContent={<Edit className="w-4 h-4" />}
                           onClick={() => onEdit?.(item)}
                        >
                           Edit
                        </DropdownItem>
                        <DropdownItem
                           key="email"
                           startContent={<Mail className="w-4 h-4" />}
                           onClick={() => window.open(`mailto:${item?.email}`)}
                        >
                           Send Email
                        </DropdownItem>
                        <DropdownItem
                           key="call"
                           startContent={<Phone className="w-4 h-4" />}
                           onClick={() => window.open(`tel:${item?.phone}`)}
                        >
                           Call
                        </DropdownItem>
                        <DropdownItem
                           key="delete"
                           color="danger"
                           startContent={<Trash2 className="w-4 h-4" />}
                           onClick={() => handleDelete(item?._id, item?.displayName || item?.name)}
                        >
                           Delete
                        </DropdownItem>
                     </DropdownMenu>
                  </Dropdown>
               </div>
            </div>
         </CardHeader>
         <CardBody className="pt-0 space-y-4">
            {/* Contact Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
               <Phone className="w-4 h-4" />
               <span className="line-clamp-1">{item?.phone}</span>
            </div>

            {/* Location */}
            {item?.address && (
               <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                     <span className="font-medium line-clamp-1">{item?.address?.city}</span>
                     <span className="text-gray-500 dark:text-gray-300 text-xs line-clamp-1">
                        {item?.address?.state}, {item?.address?.country}
                     </span>
                  </div>
               </div>
            )}

            {/* Financial Info */}
            {user?.data?.activerole != 'staff' && (
               <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                     <CreditCard className="w-4 h-4 text-gray-400" />
                     <span className="font-medium">Financial Overview</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                     <div className="text-center">
                        <div className="text-gray-500 dark:text-gray-300">Total Purchase</div>
                        <div className="font-semibold">{formatNumberShort(item?.totalPurchases)}</div>
                     </div>
                     <div className="text-center">
                        <div className="text-gray-500 dark:text-gray-300">Total Transaction</div>
                        <div className={`font-semibold`}>
                           {formatNumberShort(item?.totalTransactions)}
                        </div>
                     </div>
                     <div className="text-center">
                        <div className="text-gray-500 dark:text-gray-300">Total Sale.</div>
                        <div className="font-semibold">₹ {formatNumberShort(item?.totalSales)}</div>
                     </div>
                  </div>
               </div>
            )}

            {/* Status and Category */}
            <div className="flex items-center justify-between">
               <div className="flex gap-2">
                  <Chip
                     color={getStatusColor(item?.status)}
                     variant="flat"
                     size="sm"
                  >
                     {item?.status?.toUpperCase()}
                  </Chip>
                  <Chip
                     color={getCategoryColor(item?.category)}
                     variant="dot"
                     size="sm"
                  >
                     {item?.category?.toUpperCase()}
                  </Chip>
               </div>
            </div>

            {/* Performance */}
            <div className="flex items-center justify-between text-sm">
               <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Performance</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                     <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                     <span className="text-xs">{item?.rating || 0}/5</span>
                  </div>
                  {user?.data?.activerole != 'staff' && (
                     <div className="text-xs text-gray-500 dark:text-gray-300">
                        {item?.metrics?.totalOrders || 0} orders
                     </div>
                  )}
               </div>
            </div>

            {/* Last Activity */}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
               <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Last Activity</span>
               </div>
               <div className="text-right">
                  <div className="font-medium text-xs">
                     {formatDateRelative(item?.lastTransactionDate)}
                  </div>
                  {/* <div className="text-xs text-gray-500 dark:text-gray-300">
                     {formatDate(item?.updatedAt)}
                  </div> */}
               </div>
            </div>
         </CardBody>
      </Card>
   )

   const topContent = (
      <div className="space-y-4">
         {/* Search and Filters */}
         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Input
               placeholder="Search contacts..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               startContent={<Search className="w-4 h-4 text-gray-400" />}
               variant="bordered"
               className="flex-1"
            />
            <div className="flex gap-3">
               <Select
                  placeholder="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  variant="bordered"
                  className="w-full sm:w-32"
               >
                  <SelectItem key="">All Status</SelectItem>
                  <SelectItem key="active">Active</SelectItem>
                  <SelectItem key="inactive">Inactive</SelectItem>
                  <SelectItem key="suspended">Suspended</SelectItem>
                  <SelectItem key="blacklisted">Blacklisted</SelectItem>
               </Select>
               <Select
                  placeholder="Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  variant="bordered"
                  className="w-full sm:w-32"
               >
                  <SelectItem key="">All Categories</SelectItem>
                  <SelectItem key="premium">Premium</SelectItem>
                  <SelectItem key="vip">VIP</SelectItem>
                  <SelectItem key="standard">Standard</SelectItem>
                  <SelectItem key="basic">Basic</SelectItem>
               </Select>
            </div>
         </div>

         {/* Results Summary */}
         {data?.data && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-600 dark:text-gray-400 gap-2">
               <span>
                  Showing {data.data.data.length} of {data.data.pagination.totalCount} contacts
               </span>
               <span>
                  Page {data.data.pagination.currentPage} of {data.data.pagination.totalPages}
               </span>
            </div>
         )}
      </div>
   )

   if (error) {
      return (
         <div className="text-center py-8">
            <p className="text-red-500 mb-4">Error loading data: {error.message}</p>
            <Button color="primary" variant="flat" onClick={() => refetch()}>
               Retry
            </Button>
         </div>
      )
   }

   if (isLoading) {
      return (
         <div className="space-y-4">
            {topContent}
            <div className="flex justify-center py-8">
               <Spinner size="lg" />
            </div>
         </div>
      )
   }

   return (
      <div className="space-y-6">
         {topContent}
         
         {/* Cards Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {data?.data?.data?.map((item) => (
               <ContactCard key={item?._id} item={item} />
            ))}
         </div>

         {/* Empty State */}
         {!isLoading && (!data?.data?.data || data.data.data.length === 0) && (
            <div className="text-center py-12">
               <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto mb-4" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
               <p className="text-gray-500 dark:text-gray-300">Try adjusting your search or filter criteria</p>
            </div>
         )}

         {/* Pagination */}
         {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
            <div className="flex justify-center pt-4">
               <Pagination
                  page={page}
                  total={data?.data?.pagination?.totalPages}
                  onChange={setPage}
                  showControls
                  showShadow
                  color="primary"
               />
            </div>
         )}
      </div>
   )
}

export default SupplierCustomerCards