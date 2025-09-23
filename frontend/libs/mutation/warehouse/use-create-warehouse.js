import api from "@/components/base-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const usecreateWarehouse = () => {
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (data) => {
         // const data = {
         //    name: "123",
         //    location: "123",
         // }
         
         try {
            // Ensure awaiting the API call
            const response = await api.post("/warehouse/create", data);
            return response.data;
         } catch (error) {
            // Ensure API errors are thrown and handled by `onError`
            throw error?.response?.data?.message || "Something went wrong";
         }
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries("warehouses");
         toast.success(data.message);
      },
      onError: (error) => {
         toast.error(error?.response?.data?.message);
      },
   });

   return mutate;
};
