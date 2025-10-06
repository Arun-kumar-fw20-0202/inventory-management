import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import api from '@/components/base-url'

// Constants
const CACHE_CONFIG = {
    STALE_TIME: 1000 * 60 * 2, // 2 minutes
    CACHE_TIME: 1000 * 60 * 10, // 10 minutes
}

const ENDPOINTS = {
    SUMMARY: '/analytics/summary',
    REVENUE_TRENDS: '/analytics/revenue-trends',
    TOP_PRODUCTS: '/analytics/top-selling-products',
    CUSTOMER_INSIGHTS: '/analytics/customer-insights',
    INVENTORY_TURNOVER: '/analytics/inventory-turnover',
    SALES_BY_REGION: '/analytics/sales-by-region',
    PROFIT_MARGINS: '/analytics/profit-margins',
}

// Enhanced API client with error handling
class AnalyticsAPI {
    static async get(url, params = {}, signal) {
        try {
            const response = await api.get(url, { params, signal })
            return response.data
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Request was cancelled')
                throw error
            }
            throw new Error(`Analytics API Error: ${error.message}`)
        }
    }
}

// Query key factory
const createQueryKeys = () => ({
    all: ['analytics'],
    summaries: () => [...createQueryKeys().all, 'summary'],
    summary: (params) => [...createQueryKeys().summaries(), params],
    revenueTrends: (params) => [...createQueryKeys().all, 'revenueTrends', params],
    topProducts: (params) => [...createQueryKeys().all, 'topProducts', params],
    customers: (params) => [...createQueryKeys().all, 'customers', params],
    inventoryTurnover: (params) => [...createQueryKeys().all, 'inventoryTurnover', params],
    salesByRegion: (params) => [...createQueryKeys().all, 'salesByRegion', params],
    profitMargins: (params) => [...createQueryKeys().all, 'profitMargins', params],
})

const queryKeys = createQueryKeys()

// Default query configuration
const getDefaultQueryConfig = (options = {}) => ({
    staleTime: CACHE_CONFIG.STALE_TIME,
    cacheTime: CACHE_CONFIG.CACHE_TIME,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
})

// Query hook factory
const createAnalyticsHook = (endpoint, keyFactory) => {
    return (params = {}, options = {}) => {
        return useQuery({
            queryKey: keyFactory(params),
            queryFn: ({ signal }) => AnalyticsAPI.get(endpoint, params, signal),
            ...getDefaultQueryConfig(options),
        })
    }
}

// Individual hooks
export const useFetchSummary = createAnalyticsHook(
    ENDPOINTS.SUMMARY,
    queryKeys.summary
)

export const useFetchRevenueTrends = createAnalyticsHook(
    ENDPOINTS.REVENUE_TRENDS,
    queryKeys.revenueTrends
)

export const useFetchTopSellingProducts = createAnalyticsHook(
    ENDPOINTS.TOP_PRODUCTS,
    queryKeys.topProducts
)

export const useFetchCustomerInsights = createAnalyticsHook(
    ENDPOINTS.CUSTOMER_INSIGHTS,
    queryKeys.customers
)

export const useFetchInventoryTurnover = createAnalyticsHook(
    ENDPOINTS.INVENTORY_TURNOVER,
    queryKeys.inventoryTurnover
)

export const useFetchSalesByRegion = createAnalyticsHook(
    ENDPOINTS.SALES_BY_REGION,
    queryKeys.salesByRegion
)

export const useFetchProfitMargins = createAnalyticsHook(
    ENDPOINTS.PROFIT_MARGINS,
    queryKeys.profitMargins
)

// Batch operations
export const usePrefetchAnalytics = () => {
    const queryClient = useQueryClient()
    
    const prefetchSummary = useCallback((params = {}) => {
        return queryClient.prefetchQuery({
            queryKey: queryKeys.summary(params),
            queryFn: ({ signal }) => AnalyticsAPI.get(ENDPOINTS.SUMMARY, params, signal),
            ...getDefaultQueryConfig(),
        })
    }, [queryClient])

    const prefetchRevenueTrends = useCallback((params = {}) => {
        return queryClient.prefetchQuery({
            queryKey: queryKeys.revenueTrends(params),
            queryFn: ({ signal }) => AnalyticsAPI.get(ENDPOINTS.REVENUE_TRENDS, params, signal),
            ...getDefaultQueryConfig(),
        })
    }, [queryClient])

    const prefetchAll = useCallback(async (params = {}) => {
        const prefetchPromises = [
            prefetchSummary(params),
            prefetchRevenueTrends(params),
        ]
        
        try {
            await Promise.allSettled(prefetchPromises)
        } catch (error) {
            console.error('Error prefetching analytics data:', error)
        }
    }, [prefetchSummary, prefetchRevenueTrends])

    return {
        prefetchSummary,
        prefetchRevenueTrends,
        prefetchAll,
    }
}

// Cache invalidation helpers
export const useAnalyticsCache = () => {
    const queryClient = useQueryClient()

    return {
        invalidateAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),
        invalidateSummary: () => queryClient.invalidateQueries({ queryKey: queryKeys.summaries() }),
        removeAll: () => queryClient.removeQueries({ queryKey: queryKeys.all }),
        clear: () => queryClient.clear(),
    }
}

// Main export with all hooks
const analyticsQueries = {
    // Data fetching hooks
    useFetchSummary,
    useFetchRevenueTrends,
    useFetchTopSellingProducts,
    useFetchCustomerInsights,
    useFetchInventoryTurnover,
    useFetchSalesByRegion,
    useFetchProfitMargins,
    
    // Utility hooks
    usePrefetchAnalytics,
    useAnalyticsCache,
    
    // Query keys for external use
    queryKeys,
}

export default analyticsQueries
