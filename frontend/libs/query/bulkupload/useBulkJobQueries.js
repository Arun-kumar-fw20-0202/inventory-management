import api from '@/components/base-url'
import { useQuery } from '@tanstack/react-query'

export const useBulkJobStatus = (jobId, enabled = !!jobId) => {
  return useQuery({
    queryKey: ['bulk-status', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const resp = await api.get(`/bulk-upload/job/${jobId}/status`)
      return resp.data
    },
    enabled: !!jobId && !!enabled,
    // robustly extract status/total/processed regardless of whether the
    // response is { data: { ... } } or { ... }
    refetchInterval: (data) => {
      if (!data) return false
      const payload = data.data || data
      const status = payload?.status
      const total = payload?.total
      const processed = payload?.processed
      // if we can't determine status, poll for a short while
      if (!status && (!total || !processed)) return 1000
      // stop polling when status is terminal or processed >= total
      if (status === 'COMPLETED' || status === 'FAILED' || (total && processed >= total)) return false
      return 3000
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  })
}

export const useBulkJobResults = (jobId) => {
  return useQuery({
    queryKey: ['bulk-results', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const resp = await api.get(`/bulk-upload/job/${jobId}/results`)
      return resp.data
    },
    enabled: !!jobId,
  })
}

export default useBulkJobStatus
