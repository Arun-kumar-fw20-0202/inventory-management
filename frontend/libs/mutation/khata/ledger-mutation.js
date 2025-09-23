import api from "@/components/base-url";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const LEDGER_API = '/khata/ledger-entries';

// Create a new ledger entry
export function useCreateLedgerEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`${LEDGER_API}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ledger-entries'])
      queryClient.invalidateQueries(['khata-contacts'])
    }
  });
}

// Get all ledger entries for a customer (paginated, filter, sort)
export function useGetLedgerEntriesForCustomer({ customerId, page = 1, limit = 50, type = '', fromDate = '', toDate = '', sortBy = 'createdAt', sortOrder = 'desc' }) {
  //  console.log(customerId)
  return useQuery({
    queryKey: ['ledger-entries', customerId, page, limit, type, fromDate, toDate, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
         page, limit, customerId,
         ...(type && { type }),
         ...(fromDate && { fromDate }),
         ...(toDate && { toDate }),
         ...(sortBy && { sortBy }),
         ...(sortOrder && { sortOrder }),
      });
      const res = await api.get(`${LEDGER_API}?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
    staleTime: 20 * 60 * 1000, // Cache for 20 minutes
    retry: 2
   //  enabled: !!customerId
  });
}

// Get a single ledger entry by ID
export function useGetSingleLedgerEntry({userId, limit, page, type, fromDate, toDate, sortBy, sortOrder} = {}) {
  return useQuery({
    queryKey: ['ledger-entry', userId, limit, page, type, fromDate, toDate, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        //  ...(userId && { userId }),
         ...(limit && { limit }),
          ...(page && { page }),
          ...(type && { type }),
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
      });
      const res = await api.get(`${LEDGER_API}/${userId}?${params.toString()}`);
      return res.data;
    },
    enabled: !!userId,
    keepPreviousData: true,
    staleTime: 20 * 60 * 1000, // Cache for 20 minutes
    retry: 2
  });
}

// Update a ledger entry
export function useUpdateLedgerEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await api.put(`${LEDGER_API}/${id}`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['ledger-entries'])
  });
}

// Delete a ledger entry
export function useDeleteLedgerEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`${LEDGER_API}/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['ledger-entries'])
  });
}
