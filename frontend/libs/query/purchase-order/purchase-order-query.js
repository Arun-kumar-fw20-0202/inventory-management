import api from "@/components/base-url";
import { useQuery } from "@tanstack/react-query";

// ================================
// PURCHASE ORDER QUERIES
// ================================

/**
 * Fetch paginated list of purchase orders with filters
 */
export const useFetchPurchaseOrders = (filters = {}) => {
   return useQuery({
      queryKey: ["purchase-orders", filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { params: filters });
         return response.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true, // For better pagination UX
   });
};

/**
 * Fetch single purchase order by ID with full details
 */
export const useFetchPurchaseOrderById = (id) => {
   return useQuery({
      queryKey: ["purchase-order", id],
      queryFn: async () => {
         const response = await api.get(`/purchase-orders/${id}`);
         return response.data;
      },
      enabled: !!id, // Only run query if ID is provided
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
   });
};

/**
 * Fetch purchase orders by status
 */
export const useFetchPurchaseOrdersByStatus = (status, otherFilters = {}) => {
   return useQuery({
      queryKey: ["purchase-orders-by-status", status, otherFilters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { status, ...otherFilters } 
         });
         return response.data;
      },
      enabled: !!status,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
   });
};

/**
 * Fetch draft purchase orders
 */
export const useFetchDraftPurchaseOrders = (filters = {}) => {
   return useQuery({
      queryKey: ["draft-purchase-orders", filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { status: "Draft", ...filters } 
         });
         return response.data;
      },
      staleTime: 1 * 60 * 1000,
      cacheTime: 3 * 60 * 1000,
   });
};

/**
 * Fetch pending approval purchase orders
 */
export const useFetchPendingApprovals = (filters = {}) => {
   return useQuery({
      queryKey: ["pending-approvals", filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { status: "PendingApproval", ...filters } 
         });
         return response.data;
      },
      staleTime: 30 * 1000, // 30 seconds (more frequent for pending items)
      cacheTime: 2 * 60 * 1000,
   });
};

/**
 * Fetch approved purchase orders
 */
export const useFetchApprovedPurchaseOrders = (filters = {}) => {
   return useQuery({
      queryKey: ["approved-purchase-orders", filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { status: "Approved", ...filters } 
         });
         return response.data;
      },
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
   });
};

/**
 * Fetch partially received purchase orders
 */
export const useFetchPartiallyReceivedOrders = (filters = {}) => {
   return useQuery({
      queryKey: ["partially-received-orders", filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { status: "PartiallyReceived", ...filters } 
         });
         return response.data;
      },
      staleTime: 1 * 60 * 1000,
      cacheTime: 3 * 60 * 1000,
   });
};

/**
 * Fetch completed purchase orders
 */
export const useFetchCompletedPurchaseOrders = (filters = {}) => {
   return useQuery({
      queryKey: ["completed-purchase-orders", filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { status: "Completed", ...filters } 
         });
         return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes (completed orders change less frequently)
      cacheTime: 10 * 60 * 1000,
   });
};

/**
 * Fetch purchase orders by supplier
 */
export const useFetchPurchaseOrdersBySupplier = (supplierId, filters = {}) => {
   return useQuery({
      queryKey: ["purchase-orders-by-supplier", supplierId, filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { supplierId, ...filters } 
         });
         return response.data;
      },
      enabled: !!supplierId,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
   });
};

/**
 * Fetch purchase orders by warehouse
 */
export const useFetchPurchaseOrdersByWarehouse = (warehouseId, filters = {}) => {
   return useQuery({
      queryKey: ["purchase-orders-by-warehouse", warehouseId, filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { warehouseId, ...filters } 
         });
         return response.data;
      },
      enabled: !!warehouseId,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
   });
};

/**
 * Fetch purchase orders by date range
 */
export const useFetchPurchaseOrdersByDateRange = (startDate, endDate, filters = {}) => {
   return useQuery({
      queryKey: ["purchase-orders-by-date", startDate, endDate, filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { startDate, endDate, ...filters } 
         });
         return response.data;
      },
      enabled: !!(startDate && endDate),
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
   });
};

/**
 * Search purchase orders by text
 */
export const useSearchPurchaseOrders = (searchTerm, filters = {}) => {
   return useQuery({
      queryKey: ["search-purchase-orders", searchTerm, filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { search: searchTerm, ...filters } 
         });
         return response.data;
      },
      enabled: !!searchTerm && searchTerm.length >= 2, // Only search if term has at least 2 characters
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 2 * 60 * 1000,
   });
};

// ================================
// ANALYTICS & DASHBOARD QUERIES
// ================================

/**
 * Fetch purchase orders analytics/dashboard data
 */
export const useFetchPurchaseOrdersAnalytics = (filters = {}) => {
   return useQuery({
      queryKey: ["purchase-orders-analytics", filters],
      queryFn: async () => {
         // This endpoint might need to be created in your backend
         const response = await api.get("/purchase-orders/analytics", { params: filters });
         return response.data;
      },
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
   });
};

/**
 * Fetch purchase orders summary for dashboard
 */
export const useFetchPurchaseOrdersSummary = () => {
   return useQuery({
      queryKey: ["purchase-orders-summary"],
      queryFn: async () => {
         // Get counts for each status
         const [draft, pending, approved, completed] = await Promise.all([
            api.get("/purchase-orders?status=Draft&limit=1"),
            api.get("/purchase-orders?status=PendingApproval&limit=1"),
            api.get("/purchase-orders?status=Approved&limit=1"),
            api.get("/purchase-orders?status=Completed&limit=1"),
         ]);

         return {
            draft: draft.data?.data?.pagination?.totalItems || 0,
            pending: pending.data?.data?.pagination?.totalItems || 0,
            approved: approved.data?.data?.pagination?.totalItems || 0,
            completed: completed.data?.data?.pagination?.totalItems || 0,
         };
      },
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 3 * 60 * 1000,
   });
};

/**
 * Fetch recent purchase orders for dashboard
 */
export const useFetchRecentPurchaseOrders = (limit = 5) => {
   return useQuery({
      queryKey: ["recent-purchase-orders", limit],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { 
               limit, 
               page: 1,
               sort: "createdAt",
               order: "desc" 
            } 
         });
         return response.data;
      },
      staleTime: 1 * 60 * 1000,
      cacheTime: 3 * 60 * 1000,
   });
};

/**
 * Fetch overdue purchase orders (past expected delivery date)
 */
export const useFetchOverduePurchaseOrders = (filters = {}) => {
   const today = new Date().toISOString().split('T')[0];
   
   return useQuery({
      queryKey: ["overdue-purchase-orders", filters],
      queryFn: async () => {
         const response = await api.get("/purchase-orders", { 
            params: { 
               status: "Approved",
               endDate: today,
               ...filters 
            } 
         });
         return response.data;
      },
      staleTime: 1 * 60 * 1000,
      cacheTime: 3 * 60 * 1000,
   });
};

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Prefetch purchase order details (useful for hover effects, etc.)
 */
export const usePrefetchPurchaseOrder = () => {
   const queryClient = useQueryClient();

   const prefetchPurchaseOrder = async (id) => {
      await queryClient.prefetchQuery({
         queryKey: ["purchase-order", id],
         queryFn: async () => {
            const response = await api.get(`/purchase-orders/${id}`);
            return response.data;
         },
         staleTime: 1 * 60 * 1000,
      });
   };

   return prefetchPurchaseOrder;
};