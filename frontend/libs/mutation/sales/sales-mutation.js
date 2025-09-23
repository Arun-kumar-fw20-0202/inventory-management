import api from "@/components/base-url";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

/**
 * Hook to create a new sales transaction
 */
export const useCreateSalesTransaction = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (saleData) => {
         const response = await api.post("/sales/create-transaction", saleData);
         return response.data;
      },
      onSuccess: (data) => {
         // Invalidate related queries
         queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
         queryClient.invalidateQueries({ queryKey: ["daily-sales-summary"] });
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] }); // Stock will be updated
         
         toast.success(data?.message || "Sale completed successfully! 🎉");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Failed to complete sale";
         
         // Show specific error messages for better UX
         if (error?.response?.data?.issues) {
            const issues = error.response.data.issues;
            const issueText = issues.map(issue => 
               `${issue.productName}: ${issue.error}`
            ).join("; ");
            toast.error(`Sale failed: ${issueText}`);
         } else {
            toast.error(errorMessage);
         }
         
         console.error("❌ Error creating sales transaction:", error);
      },
   });
};

/**
 * Hook to fetch sales transactions with filtering
 */
export const useFetchSalesTransactions = ({
   limit = 20,
   page = 1,
   startDate,
   endDate,
   customerName,
   paymentMethod,
   minAmount,
   maxAmount,
   sortBy = "createdAt",
   sortOrder = "desc"
} = {}) => {
   return useQuery({
      queryKey: ["sales-transactions", { 
         limit, page, startDate, endDate, customerName, 
         paymentMethod, minAmount, maxAmount, sortBy, sortOrder 
      }],
      queryFn: async () => {
         const params = { limit, page, sortBy, sortOrder };
         
         // Add optional filters
         if (startDate) params.startDate = startDate;
         if (endDate) params.endDate = endDate;
         if (customerName) params.customerName = customerName;
         if (paymentMethod) params.paymentMethod = paymentMethod;
         if (minAmount) params.minAmount = minAmount;
         if (maxAmount) params.maxAmount = maxAmount;

         const response = await api.get("/sales/transactions", { params });
         return response.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true, // Keep previous data while fetching new
      retry: 2 // Retry failed requests twice
   });
};

/**
 * Hook to get today's sales summary
 */
export const useTodaysSalesSummary = () => {
   return useQuery({
      queryKey: ["todays-sales-summary"],
      queryFn: async () => {
         const today = new Date().toISOString().split('T')[0];
         const response = await api.get("/sales/daily-summary", {
            params: { date: today }
         });
         return response.data;
      },
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to get sales summary for a date range
 */
export const useSalesSummary = ({ startDate, endDate }) => {
   return useQuery({
      queryKey: ["sales-summary", { startDate, endDate }],
      queryFn: async () => {
         const response = await api.get("/sales/summary", {
            params: { startDate, endDate }
         });
         return response.data;
      },
      enabled: !!(startDate && endDate), // Only run when dates are provided
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to get daily sales report
 */
export const useDailySalesReport = (date) => {
   return useQuery({
      queryKey: ["daily-sales-report", date],
      queryFn: async () => {
         const response = await api.get("/reports/daily-sales", {
            params: { date }
         });
         return response.data;
      },
      enabled: !!date,
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to get sales by product (for analytics)
 */
export const useSalesByProduct = ({ startDate, endDate, limit = 10 }) => {
   return useQuery({
      queryKey: ["sales-by-product", { startDate, endDate, limit }],
      queryFn: async () => {
         const response = await api.get("/sales/by-product", {
            params: { startDate, endDate, limit }
         });
         return response.data;
      },
      enabled: !!(startDate && endDate),
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to update a sales transaction (if needed)
 */
export const useUpdateSalesTransaction = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ transactionId, updateData }) => {
         const response = await api.put(`/sales/transaction/${transactionId}`, updateData);
         return response.data;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
         queryClient.invalidateQueries({ queryKey: ["daily-sales-summary"] });
         toast.success("Transaction updated successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || "Failed to update transaction";
         toast.error(errorMessage);
         console.error("❌ Error updating transaction:", error);
      },
   });
};

/**
 * Hook to cancel/void a sales transaction
 */
export const useVoidSalesTransaction = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ transactionId, reason }) => {
         const response = await api.post(`/sales/transaction/${transactionId}/void`, { reason });
         return response.data;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
         queryClient.invalidateQueries({ queryKey: ["daily-sales-summary"] });
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] }); // Stock will be restored
         toast.success("Transaction voided successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || "Failed to void transaction";
         toast.error(errorMessage);
         console.error("❌ Error voiding transaction:", error);
      },
   });
};
