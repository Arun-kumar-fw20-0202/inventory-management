import api from "@/components/base-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useCreateProductsCategory = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (data) => {
         // const data = {
         //    name: "string",
         //    description: "string",
         
         // }
         
         try {
            // Ensure awaiting the API call
            const response = await api.post("/category/create-category", data);
            return response.data;
         } catch (error) {
            // Ensure API errors are thrown and handled by `onError`
            throw error?.response?.data?.message || "Something went wrong";
         }
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
