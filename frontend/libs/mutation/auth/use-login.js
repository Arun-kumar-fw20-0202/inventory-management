import api from "@/components/base-url";
import { setUser } from "@/redux/slices/auth-slice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

export const UseAuthLogin = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async (data) => {
         const response = await api.post("/auth/login", data);
         return response.data;
      },
      onSuccess: (data) => {
         // Set user in Redux
         dispatch(setUser(data?.data));
         
         // Update the "use-me" query cache to prevent refetch
         queryClient.setQueryData(["use-me"], data);
         queryClient.invalidateQueries(["use-me"]);

         // Navigate to dashboard
         router.push("/");
         toast.success("Login Successful");
      },
      onError: (error) => {
         toast.error(error.response?.data?.message || "Login failed. Please try again.");
      },
   });

   return mutate;
};
