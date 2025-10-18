import api from "@/components/base-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useCreateProductsCategory = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (data) => {
         const response = await api.post("/category/create-category", data);
         return response.data;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries("products-categories");
         toast.success(data.message);
      },
      onError: (error) => {
         toast.error(error?.response?.data?.message);
      },
   });

   return mutate;
};

export const useUpdateCategory = () => {
   const queryClient = useQueryClient();
   const mutate = useMutation({
      mutationFn: async (data) => {
         const response = await api.patch("/category/update", data);
         return response.data;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries("products-categories");
         console.log('Update success data:', data); // Debugging line
         toast.success(data?.message?.message || 'Category updated successfully');
      },
      onError: (error) => {
         toast.error(error?.response?.data?.message);
      },
   });
   return mutate;
}

export const useDeleteCategory = () => {
   const queryClient = useQueryClient();
   const mutate = useMutation({
      mutationFn: async (data) => {
         const response = await api.post("/category/delete", data);
         return response.data;
      },
      onSuccess: (data) => {
         console.log('Delete success data:', data); // Debugging line
         queryClient.invalidateQueries("products-categories");
         toast.success(data.message.message || 'Category deleted successfully');
      },
      onError: (error) => {
         toast.error(error?.response?.data?.message);
      },
   });
   return mutate;
}
