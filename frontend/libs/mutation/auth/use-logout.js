
'use client'
import api from "@/components/base-url";
// import api from "@/components/base-url";
import { setUser } from "@/redux/slices/auth-slice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

export const useAuthLogout = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const queryClient = useQueryClient();

   const mutate = useMutation({
      mutationFn: async () => {
         const response = await api.post("/auth/logout");
         return response.data;
      },
      onSuccess: (data) => {
         // Clear Redux state
         dispatch(setUser(null));
         
         // Clear React Query cache
         queryClient.clear();
         
         // Force remove cookie on client side as backup
         if (typeof window !== 'undefined') {
            document.cookie = 'daily_sale_report_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
            document.cookie = 'daily_sale_report_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
         }
         
         // Navigate to login
         router.push("/login");
         toast.success("Logout Successful");
         
         // Force page reload after a short delay to ensure clean state
         setTimeout(() => {
            window.location.href = '/login';
         }, 100);
      },
      onError: (error) => {
         // Even if logout API fails, clear client-side data
         dispatch(setUser(null));
         queryClient.clear();
         
         if (typeof window !== 'undefined') {
            document.cookie = 'daily_sale_report_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
            document.cookie = 'daily_sale_report_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
         }
         
         router.push("/login");
         toast.error(error?.response?.data?.message || "Logged out locally due to error.");
      },
   });

   return mutate;
};