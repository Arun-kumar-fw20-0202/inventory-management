// @ts-nocheck
import api from '@/components/base-url'
import { useQuery } from '@tanstack/react-query'

// Default options used by hooks
const DEFAULT_STALE = 2 * 60 * 1000 // 2 minutes
const DEFAULT_CACHE = 5 * 60 * 1000 // 5 minutes

function buildKey(base, params) {
  if (!params) return [base]
  // keep key stable and JSON-serializable
  return [base, JSON.stringify(params)]
}

export const useTopProducts = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'top-product'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/top-product', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    keepPreviousData: true,
    ...options,
  })
}

export const useLowStockProducts = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'low-stock-products'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/low-stock-products', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    keepPreviousData: true,
    ...options,
  })
}

export const useRecentSales = (params = {}, options = {}) => {
    // convert params to searchParams
    const searchParams = new URLSearchParams(params).toString();
    return useQuery({
        queryKey: buildKey(['dashboard', 'recent-sales'], params),
        queryFn: async () => {
        const res = await api.get(`/dashboard/recent-sales`, { params })
        return res.data
        },
        staleTime: DEFAULT_STALE,
        cacheTime: DEFAULT_CACHE,
        keepPreviousData: true,
        ...options,
    })
}

export const useSalesSummary = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'sales-summary'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/sales-summary', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    ...options,
  })
}

export const useRevenueSummary = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'revenue-summary'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/revenue-summary', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    ...options,
  })
}

export const useInventorySummary = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'inventory-summary'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/inventory-summary', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    ...options,
  })
}

export const useCustomerSummary = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'customer-summary'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/customer-summary', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    ...options,
  })
}

export const useSupplierSummary = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'supplier-summary'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/supplier-summary', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    ...options,
  })
}

export const useDashboardPurchaseOrderSummary = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'purchase-order-summary'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/purchase-order-summary', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    ...options,
  })
}

export const useRecentCustomers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'recent-customers'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/recent-customers', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    keepPreviousData: true,
    ...options,
  })
}

export const useRecentSuppliers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'recent-suppliers'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/recent-suppliers', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    keepPreviousData: true,
    ...options,
  })
}

export const useDashboardPendingPurchaseOrders = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'pending-purchase-orders'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/pending-purchase-orders', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    keepPreviousData: true,
    ...options,
  })
}

export const useOverduePurchaseOrders = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'overdue-purchase-orders'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/overdue-purchase-orders', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    keepPreviousData: true,
    ...options,
  })
}

export const useTopCustomers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: buildKey(['dashboard', 'top-customers'], params),
    queryFn: async () => {
      const res = await api.get('/dashboard/top-customers', { params })
      return res.data
    },
    staleTime: DEFAULT_STALE,
    cacheTime: DEFAULT_CACHE,
    ...options,
  })
}

export default {
  useTopProducts,
  useLowStockProducts,
  useRecentSales,
  useSalesSummary,
  useRevenueSummary,
  useInventorySummary,
  useCustomerSummary,
  useSupplierSummary,
  useDashboardPurchaseOrderSummary,
  useRecentCustomers,
  useRecentSuppliers,
  useDashboardPendingPurchaseOrders,
  useOverduePurchaseOrders,
  useTopCustomers
}
