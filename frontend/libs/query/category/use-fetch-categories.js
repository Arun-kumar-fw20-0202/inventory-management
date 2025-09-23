import api from "@/components/base-url";
import { useQuery } from "@tanstack/react-query";

export const useFetchProductCategory = ({ limit=10 , page=1, search='' } = {}) => {
   return useQuery({
      queryKey: ["products-categories", { limit, page, search }],
      queryFn: async () => {
         const response = await api.get(`/category/fetch-category?limit=${limit}&page=${page}&search=${search}`);
         return response.data;
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
   });
};
