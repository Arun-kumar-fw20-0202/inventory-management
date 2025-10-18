import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/components/base-url'

const CACHE_CONFIG = {
  STALE_TIME: 1000 * 60 * 1,
  CACHE_TIME: 1000 * 60 * 5,
}

const ENDPOINTS = {
  BASE: '/notifications',
  UNREAD_COUNT: '/notifications/unread/count'
}

class NotificationsAPI {
  static async get(url, params = {}, signal) {
    const res = await api.get(url, { params, signal })
    return res.data
  }
  static async post(url, body) {
    const res = await api.post(url, body)
    return res.data
  }
  static async del(url) {
    const res = await api.delete(url)
    return res.data
  }
}

const createQueryKeys = () => ({
  all: ['notifications'],
  list: (params) => [...createQueryKeys().all, 'list', params || {}],
  unreadCount: () => [...createQueryKeys().all, 'unreadCount']
})

const queryKeys = createQueryKeys()

const defaultQueryOptions = (options = {}) => ({
  staleTime: CACHE_CONFIG.STALE_TIME,
  cacheTime: CACHE_CONFIG.CACHE_TIME,
  refetchOnWindowFocus: false,
  retry: 2,
  ...options,
})

export const useFetchNotifications = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.list(params),
    queryFn: ({ signal }) => NotificationsAPI.get(ENDPOINTS.BASE, params, signal),
    ...defaultQueryOptions(options)
  })
}

export const useFetchUnreadCount = (options = {}) => {
  const qk = queryKeys.unreadCount()
  return useQuery({ queryKey: qk, queryFn: () => NotificationsAPI.get(ENDPOINTS.UNREAD_COUNT), ...defaultQueryOptions(options) })
}

export const useCreateNotification = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => NotificationsAPI.post(ENDPOINTS.BASE, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.all })
    }
  })
}

export const useMarkAsRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) => NotificationsAPI.post(`${ENDPOINTS.BASE}/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.all })
    }
  })
}

export const useMarkAsDelivered = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, channel = 'IN_APP' }) => NotificationsAPI.post(`${ENDPOINTS.BASE}/${id}/delivered`, { channel }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.all })
  })
}

export const useDismissNotification = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) => NotificationsAPI.post(`${ENDPOINTS.BASE}/${id}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.all })
  })
}

export const useDeleteNotification = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) => NotificationsAPI.del(`${ENDPOINTS.BASE}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.all })
  })
}

export const useNotificationsCache = () => {
  const qc = useQueryClient()
  return {
    invalidate: () => qc.invalidateQueries({ queryKey: queryKeys.all }),
    remove: () => qc.removeQueries({ queryKey: queryKeys.all }),
    prefetchList: (params) => qc.prefetchQuery({ queryKey: queryKeys.list(params), queryFn: () => NotificationsAPI.get(ENDPOINTS.BASE, params), ...defaultQueryOptions() })
  }
}

export default {
  useFetchNotifications,
  useFetchUnreadCount,
  useCreateNotification,
  useMarkAsRead,
  useMarkAsDelivered,
  useDismissNotification,
  useDeleteNotification,
  useNotificationsCache,
  queryKeys
}
