import api from "@/components/base-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

/**
 * Hook for creating a new return transaction
 */
export const useCreateReturn = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (returnData) => {
         const response = await api.post("/sales/create-return", returnData);
         return response.data;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: ["returns"] });
         queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
         queryClient.invalidateQueries({ queryKey: ["todays-sales-summary"] });
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         toast.success(data?.message || "Return created successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error creating return";
         toast.error(errorMessage);
         console.error("❌ Error creating return:", error);
      },
   });
};

/**
 * Hook for approving a return transaction
 */
export const useApproveReturn = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ returnId, notes }) => {
         const response = await api.patch(`/sales/return/${returnId}/approve`, { notes });
         return response.data;
      },
      onSuccess: (data, variables) => {
         queryClient.invalidateQueries({ queryKey: ["returns"] });
         queryClient.invalidateQueries({ queryKey: ["return", variables.returnId] });
         toast.success(data?.message || "Return approved successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error approving return";
         toast.error(errorMessage);
         console.error("❌ Error approving return:", error);
      },
   });
};

/**
 * Hook for processing a return transaction
 */
export const useProcessReturn = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ returnId, notes }) => {
         const response = await api.patch(`/sales/return/${returnId}/process`, { notes });
         return response.data;
      },
      onSuccess: (data, variables) => {
         queryClient.invalidateQueries({ queryKey: ["returns"] });
         queryClient.invalidateQueries({ queryKey: ["return", variables.returnId] });
         queryClient.invalidateQueries({ queryKey: ["use-fetch-my-stock"] });
         queryClient.invalidateQueries({ queryKey: ["todays-sales-summary"] });
         toast.success(data?.message || "Return processed successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error processing return";
         toast.error(errorMessage);
         console.error("❌ Error processing return:", error);
      },
   });
};

/**
 * Hook for deleting a return transaction
 */
export const useDeleteReturn = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (returnId) => {
         const response = await api.delete(`/sales/return/${returnId}`);
         return response.data;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: ["returns"] });
         toast.success(data?.message || "Return deleted successfully");
      },
      onError: (error) => {
         const errorMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             "Error deleting return";
         toast.error(errorMessage);
         console.error("❌ Error deleting return:", error);
      },
   });
};
