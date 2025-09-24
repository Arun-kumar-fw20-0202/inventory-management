import api from "@/components/base-url";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// ================================
// PURCHASE ORDER MUTATIONS
// ================================

/**
 * Create a new purchase order
 */
export const useCreatePurchaseOrder = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (data) => {
         const response = await api.post("/purchase-orders", data);
         return response.data;
      },
      onSuccess: (data) => {
         // Invalidate purchase orders list
         queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
         queryClient.invalidateQueries({ queryKey: ["purchase-orders-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
         
         toast.success(data?.message || "Purchase order created successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error creating purchase order";
         toast.error(errorMessage);
         console.error("❌ Error creating purchase order:", error);
      },
   });

   return mutate;
};

/**
 * Submit purchase order for approval
 */
export const useSubmitPurchaseOrder = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (id) => {
         const response = await api.patch(`/purchase-orders/${id}/submit`);
         return response.data;
      },
      onSuccess: (data, variables) => {
         // Invalidate purchase orders list and specific item
         queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
         queryClient.invalidateQueries({ queryKey: ["purchase-order", variables] });
         queryClient.invalidateQueries({ queryKey: ["purchase-orders-analytics"] });
         
         toast.success(data?.message || "Purchase order submitted for approval");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error submitting purchase order";
         toast.error(errorMessage);
         console.error("❌ Error submitting purchase order:", error);
      },
   });

   return mutate;
};

/**
 * Approve purchase order
 */
export const useApprovePurchaseOrder = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (id) => {
         const response = await api.patch(`/purchase-orders/${id}/approve`);
         return response.data;
      },
      onSuccess: (data, variables) => {
         // Invalidate purchase orders list and specific item
         queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
         queryClient.invalidateQueries({ queryKey: ["purchase-order", variables] });
         queryClient.invalidateQueries({ queryKey: ["purchase-orders-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
         
         toast.success(data?.message || "Purchase order approved successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error approving purchase order";
         toast.error(errorMessage);
         console.error("❌ Error approving purchase order:", error);
      },
   });

   return mutate;
};

/**
 * Reject purchase order
 */
export const useRejectPurchaseOrder = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async ({ id, reason }) => {
         const response = await api.patch(`/purchase-orders/${id}/reject`, { reason });
         return response.data;
      },
      onSuccess: (data, variables) => {
         // Invalidate purchase orders list and specific item
         queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
         queryClient.invalidateQueries({ queryKey: ["purchase-order", variables.id] });
         queryClient.invalidateQueries({ queryKey: ["purchase-orders-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
         
         toast.success(data?.message || "Purchase order rejected");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error rejecting purchase order";
         toast.error(errorMessage);
         console.error("❌ Error rejecting purchase order:", error);
      },
   });

   return mutate;
};

/**
 * Receive purchase order items and update stock
 */
export const useReceivePurchaseOrder = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async ({ id, receivedItems }) => {
         const response = await api.patch(`/purchase-orders/${id}/receive`, { receivedItems });
         return response.data;
      },
      onSuccess: (data, variables) => {
         // Invalidate multiple related queries
         queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
         queryClient.invalidateQueries({ queryKey: ["purchase-order", variables.id] });
         queryClient.invalidateQueries({ queryKey: ["purchase-orders-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         queryClient.invalidateQueries({ queryKey: ["stock-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
         
         toast.success(data?.message || "Items received successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error receiving purchase order items";
         toast.error(errorMessage);
         console.error("❌ Error receiving purchase order items:", error);
      },
   });

   return mutate;
};

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

/**
 * Invalidate all purchase order related queries
 */
export const useInvalidatePurchaseOrderQueries = () => {
   const queryClient = useQueryClient();

   const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
   };

   return invalidateAll;
};
