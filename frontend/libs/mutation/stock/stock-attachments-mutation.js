import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/components/base-url';

async function fetchAttachments({ page = 1, limit = 25, search, status, sortBy, sortDir } = {}) {
  try {
    const params = { page: Number(page), limit: Number(limit) };
    if (search) params.search = search;
    if (status) params.status = status;
    if (sortBy) params.sortBy = sortBy;
    if (sortDir) params.sortDir = sortDir;

    const res = await api.get(`/stock/attachments?${new URLSearchParams(params).toString()}`);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Failed to load attachments';
    throw new Error(msg);
  }
}

export function useAttachments(query = {}) {
  return useQuery({
    queryKey: ['attachments', query],
    queryFn: () => fetchAttachments(query),
    keepPreviousData: true,
    staleTime: 1000 * 30
  });
}

async function postCreate(payload) {
  try {
    const res = await api.post('/stock/attachments', payload);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Failed to create attachment';
    throw new Error(msg);
  }
}

export function useCreateAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postCreate,
    onSuccess: () => qc.invalidateQueries(['attachments'])
  });
}

async function postAttach(payload) {
  try {
    const res = await api.post('/stock/attachments/attach', payload);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Failed to create attachment';
    throw new Error(msg);
  }
}

export function useAttachAttachments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postAttach,
    onSuccess: () => qc.invalidateQueries(['attachments'])
  });
}

async function patchUpdate(id, payload) {
  try {
    const res = await api.patch(`/stock/attachments/${id}`, payload);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Failed to update attachment';
    throw new Error(msg);
  }
}

export function useUpdateAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => patchUpdate(id, payload),
    onSuccess: () => qc.invalidateQueries(['attachments'])
  });
}

async function delAttachment(id) {
  try {
    const res = await api.delete(`/stock/attachments/${id}`);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Failed to delete attachment';
    throw new Error(msg);
  }
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => delAttachment(id),
    onSuccess: () => qc.invalidateQueries(['attachments'])
  });
}

async function postAdjust(payload) {
  try {
    const res = await api.post('/stock/attachments/adjust', payload);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Failed to adjust attachments';
    throw new Error(msg);
  }
}

export function useAdjustAttachments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => postAdjust(payload),
    onSuccess: () => qc.invalidateQueries(['attachments'])
  });
}

export default {
  useAttachments,
  useCreateAttachment,
  useUpdateAttachment,
  useDeleteAttachment,
  useAdjustAttachments
};
