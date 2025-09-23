import api from "@/components/base-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to create a sales transaction
 */
export const useCreateSalesTransaction = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
      mutationFn: async (transactionData) => {
         const response = await api.post("/sales/create-transaction", transactionData);
         return response.data;
      },
      onSuccess: () => {
         // Invalidate related queries
         queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
         queryClient.invalidateQueries({ queryKey: ["todays-sales-summary"] });
         queryClient.invalidateQueries({ queryKey: ["sales-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["sales-reports"] });
         queryClient.invalidateQueries({ queryKey: ["sales-top-products"] });
         queryClient.invalidateQueries({ queryKey: ["sales-top-customers"] });
         queryClient.invalidateQueries({ queryKey: ["daily-sales-report"] });
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         console.log("✅ Sales transaction created successfully!");
      },
      onError: (error) => {
         console.error("❌ Error creating sales transaction:", error);
      }
   });
};

/**
 * Hook to fetch sales transactions with cursor-based pagination
 */
export const useFetchSalesTransactions = ({
   limit = 20,
   after = null, // cursor for pagination
   startDate,
   endDate,
   customerName,
   paymentMethod,
   minAmount,
   maxAmount,
   sortBy = 'createdAt',
   sortOrder = 'desc'
} = {}) => {
   return useQuery({
      queryKey: ["sales-transactions", { 
         limit, after, startDate, endDate, customerName, 
         paymentMethod, minAmount, maxAmount, sortBy, sortOrder 
      }],
      queryFn: async () => {
         const params = { limit, sortBy, sortOrder };
         
         // Add cursor for pagination
         if (after) params.after = after;
         
         // Add optional filters
         if (startDate) params.startDate = new Date(startDate);
         if (endDate) params.endDate = new Date(endDate);
         if (customerName) params.customerName = customerName;
         if (paymentMethod) params.paymentMethod = paymentMethod;
         if (minAmount) params.minAmount = minAmount;
         if (maxAmount) params.maxAmount = maxAmount;

         const response = await api.get("/sales/transactions", { params });
         return response.data;
      },
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to fetch a single transaction by ID
 */
export const useFetchTransactionById = (transactionId) => {
   return useQuery({
      queryKey: ["transaction-by-id", transactionId],
      queryFn: async () => {
         const response = await api.get(`/sales/transaction/${transactionId}`);
         return response.data;
      },
      enabled: !!transactionId,
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to fetch today's sales summary
 */
export const useTodaysSalesSummary = () => {
   return useQuery({
      queryKey: ["todays-sales-summary"],
      queryFn: async () => {
         const response = await api.get("/sales/today-summary");
         return response.data;
      },
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to fetch sales analytics data
 */
export const useFetchSalesAnalytics = (filters = {}) => {
   return useQuery({
      queryKey: ["sales-analytics", filters],
      queryFn: async () => {
         const response = await api.get("/sales/analytics", { params: filters });
         return response.data;
      },
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

// fetch top products 
export const useFetchTopProducts = (filters = {}) => {
   return useQuery({
      queryKey: ["sales-top-products", filters],
      queryFn: async () => {
         const response = await api.get("/sales/analytics/top-products", { params: filters });
         return response.data;
      },
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

// Fetch top customers
export const useFetchTopCustomers = (filters = {}) => {
   return useQuery({
      queryKey: ["sales-top-customers", filters],
      queryFn: async () => {
         const response = await api.get("/sales/analytics/top-customers", { params: filters });
         return response.data;
      },
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to fetch sales reports
 */
export const useFetchSalesReports = (filters = {}) => {
   // Only pick serializable fields for queryKey and API params
   const {
      reportType,
      startDate,
      endDate,
      format,
      includeCharts,
      includeDetails,
      description
   } = filters || {};

   // Build a serializable key
   const queryKey = [
      "sales-reports",
      {
         reportType: reportType || "",
         startDate: startDate || "",
         endDate: endDate || "",
         format: format || "",
         includeCharts: !!includeCharts,
         includeDetails: !!includeDetails,
         description: description || ""
      }
   ];

   // Only send serializable params to API
   const params = {
      reportType,
      startDate,
      endDate,
      format,
      includeCharts,
      includeDetails,
      description
   };

   return useQuery({
      queryKey,
      queryFn: async () => {
         const response = await api.get("/sales/reports", { params });
         return response.data;
      },
      enabled: !!(startDate && endDate), // Only run when dates are provided
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};

/**
 * Hook to fetch daily sales report
 */
export const useFetchDailySalesReport = (date) => {
   return useQuery({
      queryKey: ["daily-sales-report", date],
      queryFn: async () => {
         const response = await api.get(`/reports/daily/${date}`);
         return response.data;
      },
      enabled: !!date,
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2
   });
};
