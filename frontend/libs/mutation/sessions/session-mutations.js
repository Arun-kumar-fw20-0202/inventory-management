import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/components/base-url'
import toast from 'react-hot-toast'

// =====================
// Query Keys
// =====================
export const sessionKeys = {
	all: ['sessions'],
	lists: () => [...sessionKeys.all, 'list'],
	list: (params = {}) => [...sessionKeys.lists(), { params }],
	details: () => [...sessionKeys.all, 'detail'],
	detail: (id) => [...sessionKeys.details(), id]
}

// =====================
// API calls
// =====================
const fetchSessions = async (params = {}) => {
	try {
		const res = await api.get('/auth/sessions', { params })
		return res.data
	} catch (err) {
		throw new Error(err.response?.data?.message || 'Failed to fetch sessions')
	}
}

const terminateSessionApi = async (sessionId) => {
	try {
		const res = await api.post(`/auth/sessions/${sessionId}`)
		return res.data
	} catch (err) {
		throw new Error(err.response?.data?.message || 'Failed to terminate session')
	}
}

// =====================
// Hooks
// =====================

/**
 * useFetchSessions
 * params: { page, limit, userId, activeOnly }
 */
export const useFetchSessions = (params = {}, options = {}) => {
	return useQuery({
		queryKey: sessionKeys.list(params),
		queryFn: () => fetchSessions(params),
		keepPreviousData: true,
		staleTime: 2 * 60 * 1000, // 2 minutes
		cacheTime: 10 * 60 * 1000, // 10 minutes
		retry: 1,
		...options
	})
}

export const useTerminateSession = (options = {}) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: terminateSessionApi,
		onMutate: async (sessionId) => {
			await queryClient.cancelQueries({ queryKey: sessionKeys.lists() })

			const previous = queryClient.getQueryData(sessionKeys.lists())

			// optimistic update: mark session as revoked in cached lists
			queryClient.setQueriesData({ queryKey: sessionKeys.lists() }, (old) => {
				if (!old) return old
				// support both paginated responses and plain arrays
				if (Array.isArray(old)) {
					return old.map(s => s._id === sessionId ? { ...s, revoked: true } : s)
				}

				// if paginated object { data: [...], pagination: {} } or plain items
				if (old && old.length === undefined && old.data) {
					const next = { ...old, data: old.data.map(s => s._id === sessionId ? { ...s, revoked: true } : s) }
					return next
				}

				return old
			})

			return { previous }
		},
		onError: (err, sessionId, context) => {
			if (context?.previous) queryClient.setQueryData(sessionKeys.lists(), context.previous)
			toast.error(err.message || 'Failed to terminate session')
			options.onError?.(err)
		},
		onSuccess: (res, sessionId) => {
			// invalidate lists to refresh accurate server state
			queryClient.invalidateQueries({ queryKey: sessionKeys.lists() })
			toast.success(res?.message || 'Session terminated')
			options.onSuccess?.(res)
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: sessionKeys.lists() }),
		...options
	})
}

export default {
	useFetchSessions,
	useTerminateSession
}

