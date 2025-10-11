import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/components/base-url'
import toast from 'react-hot-toast'

export const pricingKeys = {
  all: ['pricing'],
  lists: () => [...pricingKeys.all, 'list'],
  list: (filters) => [...pricingKeys.lists(), { filters }],
  details: () => [...pricingKeys.all, 'detail'],
  detail: (id) => [...pricingKeys.details(), id],
}

// ----- API wrappers -----
const fetchPlansApi = async (params = {}) => {
  try {
    const res = await api.get('/pricing', { params })
    return res.data
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch plans')
  }
}

const fetchPlanApi = async (id) => {
  try {
    const res = await api.get(`/pricing/${id}`)
    return res.data
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch plan')
  }
}

const createPlanApi = async (payload) => {
  try {
    const res = await api.post('/pricing', payload)
    return res.data
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to create plan')
  }
}

const updatePlanApi = async ({ id, data }) => {
  try {
    const res = await api.put(`/pricing/${id}`, data)
    return res.data
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to update plan')
  }
}

const deletePlanApi = async ({ id, hard = false }) => {
  try {
    const url = `/pricing/${id}${hard ? '?hard=true' : ''}`
    const res = await api.delete(url)
    return res.data
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to delete plan')
  }
}

// ----- Hooks -----
export const useFetchPlans = (params = {}, options = {}) => {
  return useQuery({
    queryKey: pricingKeys.list(params),
    queryFn: () => fetchPlansApi(params),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

export const usePlan = (id, options = {}) => {
  return useQuery({
    queryKey: pricingKeys.detail(id),
    queryFn: () => fetchPlanApi(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

export const useCreatePlan = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPlanApi,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: pricingKeys.lists() })
      toast.success(res?.message || 'Plan created')
      options.onSuccess?.(res)
    },
    onError: (err) => {
      console.error('createPlan error', err)
      toast.error(err.message || 'Failed to create plan')
      options.onError?.(err)
    },
    ...options,
  })
}

export const useUpdatePlan = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updatePlanApi,
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: pricingKeys.lists() })
      const previousLists = qc.getQueryData(pricingKeys.lists())
      const previousDetail = qc.getQueryData(pricingKeys.detail(id))

      // optimistic update: update detail
      if (previousDetail) {
        qc.setQueryData(pricingKeys.detail(id), (old) => ({ ...old, data: { ...old.data, ...data } }))
      }

      // optimistic update in paginated lists if shape matches { data: { plans: [...] } }
      if (previousLists && previousLists.data && Array.isArray(previousLists.data.plans)) {
        const next = { ...previousLists, data: { ...previousLists.data, plans: previousLists.data.plans.map(p => p._id === id ? { ...p, ...data } : p) } }
        qc.setQueryData(pricingKeys.lists(), next)
      }

      return { previousLists, previousDetail }
    },
    onError: (err, vars, context) => {
      if (context?.previousDetail) qc.setQueryData(pricingKeys.detail(vars.id), context.previousDetail)
      if (context?.previousLists) qc.setQueryData(pricingKeys.lists(), context.previousLists)
      toast.error(err.message || 'Failed to update plan')
      options.onError?.(err)
    },
    onSuccess: (res, vars) => {
      qc.setQueryData(pricingKeys.detail(vars.id), res)
      qc.invalidateQueries({ queryKey: pricingKeys.lists() })
      toast.success(res?.message || 'Plan updated')
      options.onSuccess?.(res)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: pricingKeys.lists() }),
    ...options,
  })
}

export const useDeletePlan = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePlanApi,
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: pricingKeys.lists() })
      const previous = qc.getQueryData(pricingKeys.lists())

      if (previous && previous.data && Array.isArray(previous.data.plans)) {
        const next = { ...previous, data: { ...previous.data, plans: previous.data.plans.filter(p => p._id !== id) } }
        qc.setQueryData(pricingKeys.lists(), next)
      }

      qc.removeQueries({ queryKey: pricingKeys.detail(id) })
      return { previous }
    },
    onError: (err, vars, context) => {
      if (context?.previous) qc.setQueryData(pricingKeys.lists(), context.previous)
      toast.error(err.message || 'Failed to delete plan')
      options.onError?.(err)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: pricingKeys.lists() })
      toast.success(res?.message || 'Plan deleted')
      options.onSuccess?.(res)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: pricingKeys.lists() }),
    ...options,
  })
}

export default {
  useFetchPlans,
  usePlan,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
}
