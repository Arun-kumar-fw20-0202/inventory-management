import api from "@/components/base-url";
import { useQuery } from "@tanstack/react-query";

// Fetch all stock items
export const useFetchStock = (filters) => {
   return useQuery({
      queryKey: ["use-fetch-my-stock", filters],
      queryFn: async () => {
         const response = await api.get("/stock", { params: filters });
         return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
   });
};

// Fetch single stock item by ID
export const useFetchStockById = ({id , includeAnalytics=false, includeHistory=false}) => {
   return useQuery({
      queryKey: ["stock-by-id", id],
      queryFn: async () => {
         const response = await api.get(`/stock/${id}?includeAnalytics=${includeAnalytics}&includeHistory=${includeHistory}`);
         return response.data;
      },
      enabled: !!id, // Only run query if ID is provided
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
   });
};

// Fetch stock analytics
export const useFetchStockAnalytics = () => {
   return useQuery({
      queryKey: ["stock-analytics"],
      queryFn: async () => {
         const response = await api.get("/stock/analytics");
         return response.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
   });
};

// Fetch low stock items
export const useFetchLowStock = () => {
   return useQuery({
      queryKey: ["low-stock-items"],
      queryFn: async () => {
         const response = await api.get("/stock?lowStock=true");
         return response.data;
      },
      staleTime: 1 * 60 * 1000, // 1 minute - more frequent updates for critical data
      cacheTime: 3 * 60 * 1000, // 3 minutes
   });
};