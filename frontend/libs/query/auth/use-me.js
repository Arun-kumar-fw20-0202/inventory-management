import api from "@/components/base-url";
import { useQuery } from "@tanstack/react-query";

export const useMe = (options = {}) => {
   const { enabled = true, ...rest } = options
   return useQuery({
      queryKey: ["use-me"],
      queryFn: async () => {
         const response = await api.get("/auth/me");
         return response.data;
      },
      enabled,
      keepPreviousData: true,
      staleTime: 20 * 60 * 1000, // Cache for 20 minutes
      retry: 2,
      ...rest,
   });
};
