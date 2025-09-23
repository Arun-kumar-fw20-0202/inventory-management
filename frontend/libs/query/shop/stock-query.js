import api from "@/components/base-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to fetch user's stock with advanced filtering
 */
export const useFetchMyStock = ({
   limit = 50, 
   page = 1, 
   search = '',
   sortBy = 'createdAt',
   sortOrder = 'desc',
   minPrice,
   maxPrice,
   baseUnit,
   stockStatus,
   minQty,
   maxQty
} = {}) => {
   return useQuery({
      queryKey: ["use-fetch-my-stock", { 
         limit, page, search, sortBy, sortOrder, 
         minPrice, maxPrice, baseUnit, stockStatus, minQty, maxQty 
      }],
      queryFn: async () => {
         const params = { limit, page, search, sortBy, sortOrder };
         
         // Add optional filters only if they have values
         if (minPrice) params.minPrice = minPrice;
         if (maxPrice) params.maxPrice = maxPrice;
         if (baseUnit) params.baseUnit = baseUnit;
         if (stockStatus) params.stockStatus = stockStatus;
         if (minQty) params.minQty = minQty;
         if (maxQty) params.maxQty = maxQty;

         const response = await api.get("/shop/my-stock", { params });
         return response.data;
      },
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to fetch a single stock item by ID
 */
export const useFetchStockById = (id) => {
   return useQuery({
      queryKey: ["stock-by-id", id],
      queryFn: async () => {
         const response = await api.get(`/shop/stock/${id}`);
         return response.data;
      },
      enabled: !!id, // Only run if ID is provided
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to add new stock item
 */
export const useAddStock = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
      mutationFn: async (stockData) => {
         const response = await api.post("/shop/add-stock", stockData);
         return response.data;
      },
      onSuccess: () => {
         // Invalidate and refetch stock queries
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         console.log("✅ Stock added successfully!");
      },
      onError: (error) => {
         console.error("❌ Error adding stock:", error);
      }
   });
};

/**
 * Hook to update stock item
 */
export const useUpdateStock = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
      mutationFn: async ({ id, updateData }) => {
         const response = await api.put(`/shop/stock/${id}`, updateData);
         return response.data;
      },
      onSuccess: (data, variables) => {
         // Invalidate related queries
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         queryClient.invalidateQueries({ queryKey: ["stock-by-id", variables.id] });
         console.log("✅ Stock updated successfully!");
      },
      onError: (error) => {
         console.error("❌ Error updating stock:", error);
      }
   });
};

/**
 * Hook to delete stock item
 */
export const useDeleteStock = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
      mutationFn: async (id) => {
         const response = await api.delete(`/shop/stock/${id}`);
         return response.data;
      },
      onSuccess: () => {
         // Invalidate and refetch stock queries
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         console.log("✅ Stock deleted successfully!");
      },
      onError: (error) => {
         console.error("❌ Error deleting stock:", error);
      }
   });
};


/**
 * search global stock names
 */
export const useGetGlobalStocksName = ({
   page=1, limit=10, search=''
}) => {
   return useQuery({
      queryKey: ["search-global-stock-names", { page, limit, search }],
      queryFn: async () => {
         const response = await api.get(`/shop/search-stock-names?search=${search}&page=${page}&limit=${limit}`);
         return response.data;
      },
      enabled: !!search,
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to fetch stock analytics overview
 */
export const useStockAnalytics = () => {
   return useQuery({
      queryKey: ["stock-analytics"],
      queryFn: async () => {
         const response = await api.get("/shop/stock-analytics");
         return response.data;
      },
      staleTime: 10 * 60 * 1000, // Cache for 10 minutes (analytics can be slightly stale)
      retry: 2
   });
};

/**
 * Hook to fetch low stock items
 */
export const useLowStockItems = () => {
   return useQuery({
      queryKey: ["low-stock-items"],
      queryFn: async () => {
         const response = await api.get("/shop/low-stock");
         return response.data;
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes (low stock needs frequent updates)
      retry: 2
   });
};

/**
 * Hook to fetch category breakdown analytics
 */
export const useCategoryAnalytics = () => {
   return useQuery({
      queryKey: ["category-analytics"],
      queryFn: async () => {
         const response = await api.get("/shop/category-analytics");
         return response.data;
      },
      staleTime: 15 * 60 * 1000, // Cache for 15 minutes
      retry: 2
   });
};

/**
 * Hook to fetch unit-wise analytics
 */
export const useUnitAnalytics = () => {
   return useQuery({
      queryKey: ["unit-analytics"],
      queryFn: async () => {
         const response = await api.get("/shop/unit-analytics");
         return response.data;
      },
      staleTime: 15 * 60 * 1000, // Cache for 15 minutes
      retry: 2
   });
};

/**
 * Hook to fetch top value items
 */
export const useTopValueItems = (limit = 10) => {
   return useQuery({
      queryKey: ["top-value-items", limit],
      queryFn: async () => {
         const response = await api.get(`/shop/top-value-items?limit=${limit}`);
         return response.data;
      },
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to search stock with advanced filters (for dashboard)
 */
export const useAdvancedStockSearch = (filters = {}) => {
   const {
      search = '',
      category = '',
      status = '',
      unit = '',
      minPrice = '',
      maxPrice = '',
      lowStock = false,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
   } = filters;

   return useQuery({
      queryKey: ["advanced-stock-search", filters],
      queryFn: async () => {
         const params = {
            search,
            category,
            status,
            unit,
            minPrice,
            maxPrice,
            lowStock,
            sortBy,
            sortOrder,
            page,
            limit
         };
         
         // Remove empty values
         Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
               delete params[key];
            }
         });

         const response = await api.get("/shop/my-stock", { params });
         return response.data;
      },
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 2,
      enabled: Object.keys(filters).length > 0 // Only run if filters are provided
   });
};