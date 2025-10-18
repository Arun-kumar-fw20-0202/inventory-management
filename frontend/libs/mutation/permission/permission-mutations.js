import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/components/base-url'
import toast from 'react-hot-toast'

const CACHE_CONFIG = {
  STALE_TIME: 1000 * 60 * 2,
  CACHE_TIME: 1000 * 60 * 10,
}

const ENDPOINTS = {
  BASE: '/permissions'
}

class PermissionAPI {
  static async get(url, params = {}, signal) {
    const res = await api.get(url, { params, signal })
    return res.data
  }

  static async post(url, body) {
    const res = await api.post(url, body)
    return res.data
  }
}

const createQueryKeys = () => ({
  byUser: (userId) => ['permissions', 'byUser', userId || 'me']
})

const queryKeys = createQueryKeys()

const defaultQueryOptions = (options = {}) => ({
  staleTime: CACHE_CONFIG.STALE_TIME,
  cacheTime: CACHE_CONFIG.CACHE_TIME,
  refetchOnWindowFocus: false,
  retry: 2,
  ...options,
})

export const useFetchPermission = (userId, options = {}) => {
  if (!userId) throw new Error('useFetchPermission requires userId')
  return useQuery({
    queryKey: queryKeys.byUser(userId),
    queryFn: ({ signal }) => PermissionAPI.get(`${ENDPOINTS.BASE}/${userId}`, {}, signal),
    ...defaultQueryOptions(options)
  })
}

export const useUpsertPermission = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, permissions }) => PermissionAPI.post(`${ENDPOINTS.BASE}/${userId}`, { permissions }),
    onMutate: async ({ userId, permissions }) => {
      await qc.cancelQueries({ queryKey: queryKeys.byUser(userId) })
      const previous = qc.getQueryData(queryKeys.byUser(userId))
      qc.setQueryData(queryKeys.byUser(userId), { permission: { userId, permissions } })
      return { previous }
    },
    onError: (err, vars, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.byUser(vars.userId), context.previous)
    },
    onSettled: (data, error, vars) => {
        qc.invalidateQueries({ queryKey: queryKeys.byUser(vars.userId) })
        toast.success(data?.message || 'Permissions saved')
        // console.log()
    }
  })
}

export const useFetchMyPermissions = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.byUser('me'),
    queryFn: ({ signal }) => PermissionAPI.get(`${ENDPOINTS.BASE}/me`, {}, signal),
    ...defaultQueryOptions(options)
    })
}



export const useResetPermissionDefaults = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId }) => PermissionAPI.post(`${ENDPOINTS.BASE}/${userId}/reset`, {}),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: queryKeys.byUser(vars.userId) })
  })
}

export const usePermissionsCache = () => {
  const qc = useQueryClient()
  return {
    invalidateByUser: (userId) => qc.invalidateQueries({ queryKey: queryKeys.byUser(userId) }),
    prefetchByUser: (userId) => qc.prefetchQuery({ queryKey: queryKeys.byUser(userId), queryFn: () => PermissionAPI.get(`${ENDPOINTS.BASE}/${userId}`), ...defaultQueryOptions() })
  }
}

export default {
  useFetchPermission,
  useUpsertPermission,
  useResetPermissionDefaults,
  usePermissionsCache,
  queryKeys
}
