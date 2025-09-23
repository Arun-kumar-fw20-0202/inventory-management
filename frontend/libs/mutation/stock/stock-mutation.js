import api from "@/components/base-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useAddStock = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (data) => {
         const response = await api.post("/stock/create", data);
         return response.data;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         queryClient.invalidateQueries({ queryKey: ["stock-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["todays-sales-summary"] });
         toast.success(data?.message || "Stock added successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error adding stock";
         toast.error(errorMessage);
         console.error("❌ Error adding stock:", error);
      },
   });

   return mutate;
};

export const useUpdateStock = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async ({ id, data }) => {
         const response = await api.patch(`/stock/${id}`, data);
         return response.data;
      },
      onSuccess: (data, variables) => {
         // Invalidate and refetch stock list
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         
         // Invalidate specific stock item query
         queryClient.invalidateQueries({ queryKey: ["stock-by-id", variables.id] });
         
         // Refresh analytics and dashboard data
         queryClient.invalidateQueries({ queryKey: ["stock-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["todays-sales-summary"] });
         
         toast.success(data?.message || "Stock updated successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error updating stock";
         toast.error(errorMessage);
         console.error("❌ Error updating stock:", error);
      },
   });

   return mutate;
};

export const useDeleteStock = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (id) => {
         const response = await api.delete(`/stock/${id}`);
         return response.data;
      },
      onSuccess: (data, variables) => {
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         queryClient.invalidateQueries({ queryKey: ["stock-analytics"] });
         queryClient.invalidateQueries({ queryKey: ["todays-sales-summary"] });
         
         // Also remove the specific stock item from cache
         queryClient.removeQueries({ queryKey: ["stock-by-id", variables] });
         
         toast.success(data?.message || "Stock deleted successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error deleting stock";
         toast.error(errorMessage);
         console.error("❌ Error deleting stock:", error);
      },
   });

   return mutate;
};
