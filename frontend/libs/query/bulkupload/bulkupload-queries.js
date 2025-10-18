import api from '@/components/base-url'
import { useQuery } from '@tanstack/react-query'

export const useBulkJobStatus = (jobId, enabled = !!jobId) => {
  return useQuery({
    queryKey: ['bulk-status', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const res = await api.get(`/bulk-upload/job/${jobId}/status`)
      return res.data
    },
    enabled: !!jobId && !!enabled,
    // robustly handle different response shapes and stop polling when terminal
    refetchInterval: (data) => {
      if (!data) return false
      const payload = data.data || data
      const status = payload?.status
      const total = payload?.total
      const processed = payload?.processed
      if (!status && (!total || !processed)) return 1000
      if (status === 'COMPLETED' || status === 'FAILED' || (total && processed >= total)) return false
      return 1000
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  })
}

export const useBulkJobResults = (jobId) => {
  return useQuery({
    queryKey: ['bulk-job-results', jobId],
    queryFn: async () => {
      const res = await api.get(`/bulk-upload/job/${jobId}/results`)
      return res.data
    },
    enabled: !!jobId
  })
}
