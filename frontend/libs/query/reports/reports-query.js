import api from "@/components/base-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to generate daily report
 */
export const useGenerateDailyReport = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
      mutationFn: async (reportData) => {
         const response = await api.post("/reports/generate-daily", reportData);
         return response.data;
      },
      onSuccess: () => {
         // Invalidate related queries
         queryClient.invalidateQueries({ queryKey: ["daily-report"] });
         queryClient.invalidateQueries({ queryKey: ["reports-list"] });
         console.log("✅ Daily report generated successfully!");
      },
      onError: (error) => {
         console.error("❌ Error generating daily report:", error);
      }
   });
};

/**
 * Hook to fetch daily report for a specific date
 */
export const useFetchDailyReport = (date) => {
   return useQuery({
      queryKey: ["daily-report", date],
      queryFn: async () => {
         const response = await api.get(`/reports/daily/${date}`);
         return response.data;
      },
      enabled: !!date,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
   });
};

/**
 * Hook to fetch list of reports
 */
export const useFetchReportsList = ({
   limit = 10,
   page = 1,
   startDate,
   endDate,
   sortOrder = 'desc'
} = {}) => {
   return useQuery({
      queryKey: ["reports-list", { limit, page, startDate, endDate, sortOrder }],
      queryFn: async () => {
         const params = { limit, page, sortOrder };
         
         if (startDate) params.startDate = startDate;
         if (endDate) params.endDate = endDate;

         const response = await api.get("/reports/list", { params });
         return response.data;
      },
      staleTime: 2 * 60 * 1000, // Cache for 2 minutes
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
   });
};

/**
 * Hook to delete daily report
 */
export const useDeleteDailyReport = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
      mutationFn: async (date) => {
         const response = await api.delete(`/reports/daily/${date}`);
         return response.data;
      },
      onSuccess: () => {
         // Invalidate related queries
         queryClient.invalidateQueries({ queryKey: ["reports-list"] });
         queryClient.invalidateQueries({ queryKey: ["daily-report"] });
         console.log("✅ Daily report deleted successfully!");
      },
      onError: (error) => {
         console.error("❌ Error deleting daily report:", error);
      }
   });
};
