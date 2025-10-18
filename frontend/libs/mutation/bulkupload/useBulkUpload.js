import api from '@/components/base-url'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export const useBulkUpload = (type) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file }) => {
      const fd = new FormData()
      fd.append('file', file)
      const resp = await api.post(`/bulk-upload/${type}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      return resp.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Upload started')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Upload failed')
    }
  })
}

export default useBulkUpload
