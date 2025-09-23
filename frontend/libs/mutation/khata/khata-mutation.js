import api from "@/components/base-url";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API = '/khata/contacts';

// Add single or multiple contacts
export function useAddKhataContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contacts) => {
      const res = await api.post(API, contacts);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['khata-contacts'])
  });
}

// Get contacts (cursor-based, with all filters)
export function useGetKhataContacts({
  limit = 100,
  search = '',
  fromDate = '',
  toDate = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
  status = '',
  type = '',
  tag = '',
  minBalance = '',
  maxBalance = '',
  cursor = '',
} = {}) {
  return useQuery({
    queryKey: ['khata-contacts', limit, search, fromDate, toDate, sortBy, sortOrder, status, type, tag, minBalance, maxBalance, cursor],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit,
        ...(search && { search }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(status && { status }),
        ...(type && { type }),
        ...(tag && { tag }),
        ...(minBalance && { minBalance }),
        ...(maxBalance && { maxBalance }),
        ...(cursor && { cursor }),
      });
      const res = await api.get(`${API}?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
    staleTime: 20 * 60 * 1000, // Cache for 20 minutes
    retry: 2
  });
}

// Update contact by ID
export function useUpdateKhataContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await api.patch(`${API}/${id}`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['khata-contacts'])
  });
}

// Delete contact by ID
export function useDeleteKhataContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`${API}/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['khata-contacts'])
  });
}
