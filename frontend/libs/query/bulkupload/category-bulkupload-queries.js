import api from '@/components/base-url'
import { useQuery } from '@tanstack/react-query'

export const useCategoryBulkJobStatus = (jobId) => {
  return useQuery({
    queryKey: ['category-bulk-status', jobId],
    queryFn: async () => {
      if (!jobId) return null
  const resp = await api.get(`/bulk-upload/job/${jobId}/status`)
      return resp.data
    },
    enabled: !!jobId,
    refetchInterval: (data) => {
      if (!data) return false
      const status = data.data?.status
      if (!status) return 1000
      if (status === 'COMPLETED' || status === 'FAILED') return false
      return 1000
    }
  })
}

export const useCategoryBulkJobResults = (jobId) => {
  return useQuery({
    queryKey: ['category-bulk-results', jobId],
    queryFn: async () => {
      if (!jobId) return null
  const resp = await api.get(`/bulk-upload/job/${jobId}/results`)
      return resp.data
    },
    enabled: !!jobId,
  })
}

export default useCategoryBulkJobStatus
