import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/components/base-url';
import toast from 'react-hot-toast';

// Query keys for user cache
export const userKeys = {
	all: ['users'],
	lists: () => [...userKeys.all, 'list'],
	list: (filters) => [...userKeys.lists(), { filters }],
	details: () => [...userKeys.all, 'detail'],
	detail: (id) => [...userKeys.details(), id],
};

// API call to create user
const createUser = async (data) => {
	try {
		const response = await api.post('/user', data);
		return response.data;
	} catch (err) {
		throw new Error(err.response?.data?.message || 'Failed to create user');
	}
};

// Mutation hook
export const useCreateUser = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createUser,
		onSuccess: (response) => {
			// Invalidate user lists so UI can refresh
			queryClient.invalidateQueries({ queryKey: userKeys.lists() });
			toast.success(response?.message || 'User created successfully');
			options.onSuccess?.(response);
		},
		onError: (error) => {
			console.error('Create user error:', error);
			toast.error(error.message || 'Failed to create user');
			options.onError?.(error);
		},
		...options,
	});
};

export default useCreateUser;

// ============================
// Additional API functions
// ============================

const fetchUsers = async (params = {}) => {
	try {
		const response = await api.get('/user', { params });
		return response.data;
	} catch (err) {
		throw new Error(err.response?.data?.message || 'Failed to fetch users');
	}
};

const fetchUserById = async (id) => {
	try {
		const response = await api.get(`/user/${id}`);
		return response.data;
	} catch (err) {
		throw new Error(err.response?.data?.message || 'Failed to fetch user');
	}
};

const updateUserApi = async ({ id, data }) => {
	try {
		const response = await api.put(`/user/${id}`, data);
		return response.data;
	} catch (err) {
		throw new Error(err.response?.data?.message || 'Failed to update user');
	}
};

const deleteUserApi = async ({ id, hard = false }) => {
	try {
		const url = `/user/${id}${hard ? '?hard=true' : ''}`;
		const response = await api.delete(url);
		return response.data;
	} catch (err) {
		throw new Error(err.response?.data?.message || 'Failed to delete user');
	}
};

// ============================
// Query & Mutation Hooks
// ============================

/**
 * useFetchUsers - paginated, cached list of users
 * params: { page, limit, q, role, orgNo, startDate, endDate, block_status, sortBy, sortOrder }
 */
export const useFetchUsers = (params = {}, options = {}) => {
	return useQuery({
		queryKey: userKeys.list(params),
		queryFn: () => fetchUsers(params),
		keepPreviousData: true,
		staleTime: 2 * 60 * 1000, // 2 minutes
		cacheTime: 10 * 60 * 1000, // 10 minutes
		retry: 1,
		...options,
	});
};

export const useUser = (id, options = {}) => {
	return useQuery({
		queryKey: userKeys.detail(id),
		queryFn: () => fetchUserById(id),
		enabled: !!id,
		staleTime: 3 * 60 * 1000,
		cacheTime: 15 * 60 * 1000,
		...options,
	});
};

export const useUpdateUser = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateUserApi,
		// optimistic update
			onMutate: async ({ id, data }) => {
				await queryClient.cancelQueries({ queryKey: userKeys.lists() });
				const previousList = queryClient.getQueryData(userKeys.lists())
				const previousDetail = queryClient.getQueryData(userKeys.detail(id))

				// update detail cache immediately
				if (previousDetail) {
					queryClient.setQueryData(userKeys.detail(id), (old) => ({ ...old, data: { ...old.data, ...data } }))
				}

				// update lists (best-effort): if cached as paginated object with users array, update that
				if (previousList && previousList.users && Array.isArray(previousList.users)) {
					const next = { ...previousList, users: previousList.users.map(u => u._id === id ? { ...u, ...data } : u) }
					queryClient.setQueryData(userKeys.lists(), next)
				}

				return { previousList, previousDetail }
		},
		onError: (err, variables, context) => {
				// rollback
				if (context?.previousDetail) queryClient.setQueryData(userKeys.detail(variables.id), context.previousDetail)
				if (context?.previousList) queryClient.setQueryData(userKeys.lists(), context.previousList)
			toast.error(err.message || 'Failed to update user')
			options.onError?.(err)
		},
		onSuccess: (res, variables) => {
				const id = variables.id
				// update specific caches
				queryClient.setQueryData(userKeys.detail(id), res)
				// ensure list cache refreshed
				queryClient.invalidateQueries({ queryKey: userKeys.lists() })
			toast.success(res?.message || 'User updated successfully')
			options.onSuccess?.(res)
		},
		onSettled: () => {
				queryClient.invalidateQueries({ queryKey: userKeys.lists() })
		},
		...options,
	})
}

export const useDeleteUser = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteUserApi,
			onMutate: async ({ id }) => {
				await queryClient.cancelQueries({ queryKey: userKeys.lists() })
				const previous = queryClient.getQueryData(userKeys.lists())

				// optimistic remove from cached paginated lists: remove from .users if present
				if (previous && Array.isArray(previous.users)) {
					const next = { ...previous, users: previous.users.filter(u => u._id !== id) }
					queryClient.setQueryData(userKeys.lists(), next)
				}

				// remove detail cache
				queryClient.removeQueries({ queryKey: userKeys.detail(id) })

				return { previous }
		},
		onError: (err, vars, context) => {
				if (context?.previous) queryClient.setQueryData(userKeys.lists(), context.previous)
			toast.error(err.message || 'Failed to delete user')
			options.onError?.(err)
		},
		onSuccess: (res) => {
			queryClient.invalidateQueries({ queryKey: userKeys.lists() })
			toast.success(res?.message || 'User deleted')
			options.onSuccess?.(res)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.lists() })
		},
		...options,
	})
}
