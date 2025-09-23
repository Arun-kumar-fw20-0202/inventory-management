import api from "@/components/base-url";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAdmin = () => {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (data) => {
         try {
            // Ensure awaiting the API call
            const response = await api.post("/superadmin/create-admin", data);
            return response.data;
         } catch (error) {
            // Ensure API errors are thrown and handled by `onError`
            throw error?.response?.data?.message || "Something went wrong";
         }
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries("admins");
         toast({
            title: data?.message || "Success",
            description: "Admin created successfully",
            status: "success",
         });
      },
      onError: (error) => {
         toast({
            title: "Login Failed",
            description: error || "Something went wrong",
            variant: "destructive"
         });
      },
   });

   return mutate;
};
