// @ts-nocheck
import api from '@/components/base-url'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// ================================
// SALES MUTATIONS & QUERIES
// ================================

export const useCreateSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/sales', data)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success(data?.message || 'Sale created')
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Error creating sale'
      toast.error(msg)
      console.error('Create sale error', err)
    }
  })
}

export const useUpdateSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.patch(`/sales/${id}/update`, data)
      return res.data
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['sale', vars.id] })
      qc.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success(data?.message || 'Sale updated')
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Error updating sale' 
      toast.error(msg)
      console.error('Update sale error', err)
    }
  })
}

export const useSubmitSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/sales/${id}/submit`)
      return res.data
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['sale', id] })
      qc.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success(data?.message || 'Sale submitted')
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Error submitting sale'
      toast.error(msg)
      console.error('Submit sale error', err)
    }
  })
}

export const useApproveSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/sales/${id}/approve`)
      return res.data
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['sale', id] })
      qc.invalidateQueries({ queryKey: ['sales-analytics'] })
      qc.invalidateQueries({ queryKey: ['use-fetch-my-stock'] })
      toast.success(data?.message || 'Sale approved')
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error approving sale'
      toast.error(msg)
      console.error('Approve sale error', err)
    }
  })
}


export const useUpdatePaymentStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({id, status='pending'}) => {
      const res = await api.patch(`/sales/${id}/payment-status?status=${status}`)
      return res.data
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['sale'] })
      qc.invalidateQueries({ queryKey: ['sales-analytics'] })
      qc.invalidateQueries({ queryKey: ['use-fetch-my-stock'] })
      toast.success(data?.message || 'Payment status updated')
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error updating payment status'
      toast.error(msg)
      console.error('Approve sale error', err)
    }
  })
}

export const useRejectSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await api.patch(`/sales/${id}/reject`, { reason })
      return res.data
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['sale', vars.id] })
      qc.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success(data?.message || 'Sale rejected')
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error rejecting sale'
      toast.error(msg)
      console.error('Reject sale error', err)
    }
  })
}

export const useCompleteSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/sales/${id}/complete`)
      return res.data
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['sale', id] })
      qc.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success(data?.message || 'Sale completed')
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error completing sale'
      toast.error(msg)
      console.error('Complete sale error', err)
    }
  })
}

export const useDeleteSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/sales/${id}`)
      return res.data
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['sale', id] })
      qc.invalidateQueries({ queryKey: ['sales-analytics'] })
      toast.success(data?.message || 'Sale deleted')
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error deleting sale'
      toast.error(msg)
      console.error('Delete sale error', err)
    }
  })
}

// ================================
// QUERIES
// ================================

export const useFetchSales = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      const res = await api.get('/sales', { params: filters })
      return res.data
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    keepPreviousData: true,
    ...options
  })
}

export const useFetchSaleById = (id) => {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const res = await api.get(`/sales/${id}`)
      return res.data
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  })
}

export const useFetchSalesAnalytics = () => {
  return useQuery({
    queryKey: ['sales-analytics'],
    queryFn: async () => {
      const res = await api.get('/sales/analytics')
      return res.data
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  })
}

export default {
  useCreateSale,
  useSubmitSale,
  useApproveSale,
  useUpdateSale,
  useRejectSale,
  useCompleteSale,
  useDeleteSale,
  useFetchSales,
  useFetchSaleById,
  useFetchSalesAnalytics
}
