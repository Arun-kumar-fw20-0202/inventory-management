import api from "@/components/base-url";
import { useQuery } from "@tanstack/react-query";

export const useFetchWarehouses = ({ limit=10 , page=1, search='' } = {}) => {
   return useQuery({
      queryKey: ["warehouses", { limit, page, search }],
      queryFn: async () => {
         const response = await api.get(`/warehouse/fetch?limit=${limit}&page=${page}&search=${search}`);
         return response.data;
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
   });
};
