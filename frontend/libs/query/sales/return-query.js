import api from "@/components/base-url";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch return transactions
 */
export const useFetchReturns = ({
   limit = 20,
   page = 1,
   search = '',
   status,
   returnType,
   refundMethod,
   startDate,
   endDate,
   sortBy = 'returnDate',
   sortOrder = 'desc'
} = {}) => {
   return useQuery({
      queryKey: ["returns", { 
         limit, page, search, status, returnType, refundMethod,
         startDate, endDate, sortBy, sortOrder 
      }],
      queryFn: async () => {
         const params = { limit, page, search, sortBy, sortOrder };
         
         // Add optional filters
         if (status) params.status = status;
         if (returnType) params.returnType = returnType;
         if (refundMethod) params.refundMethod = refundMethod;
         if (startDate) params.startDate = startDate;
         if (endDate) params.endDate = endDate;

         const response = await api.get("/sales/returns", { params });
         return response.data;
      },
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
   });
};

/**
 * Hook to fetch a single return transaction by ID
 */
export const useFetchReturnById = (returnId) => {
   return useQuery({
      queryKey: ["return", returnId],
      queryFn: async () => {
         const response = await api.get(`/sales/return/${returnId}`);
         return response.data;
      },
      enabled: !!returnId,
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
   });
};
