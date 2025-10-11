
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/components/base-url'
import { useDispatch } from 'react-redux'
import { setOrganisation } from '@/redux/slices/organisation-slice'

// Query keys
export const organisationKeys = {
	all: ['organisations'],
	list: (params) => ['organisations', 'list', params],
	detail: (id) => ['organisations', 'detail', id],
	my: ['organisations', 'my'],
	members: (id, params) => ['organisations', 'members', id, params],
}

// API functions
export const fetchOrganisations = async (params = {}) => {
	const { data } = await api.get('/organisation', { params })
	return data
}

export const fetchOrganisationById = async (id) => {
	const { data } = await api.get(`/organisation/${id}`)
	return data
}

export const fetchMyOrganisation = async () => {
	const { data } = await api.get('/organisation/me')
	return data
}

export const createOrganisation = async (payload) => {
	const { data } = await api.post('/organisation', payload)
	return data
}

export const updateOrganisation = async ({ data: payload }) => {
	const { data } = await api.patch(`/organisation`, payload)
	return data
}

export const deleteOrganisation = async (id) => {
	const { data } = await api.delete(`/organisation/${id}`)
	return data
}

export const fetchOrganisationMembers = async (id, params = {}) => {
	const { data } = await api.get(`/organisation/${id}/members`, { params })
	return data
}

// React Query hooks
export function useFetchOrganisations(params) {
	return useQuery({
		queryKey: organisationKeys.list(params),
		queryFn: () => fetchOrganisations(params),
	})
}

export function useFetchOrganisationById(id, options) {
	return useQuery({
		queryKey: organisationKeys.detail(id),
		queryFn: () => fetchOrganisationById(id),
		enabled: !!id,
		...options,
	})
}

export function useFetchMyOrganisation(options) {
	return useQuery({
		queryKey: organisationKeys.my,
		queryFn: fetchMyOrganisation,
		...options,
        refetchOnWindowFocus: false,
	})
}

export function useCreateOrganisation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createOrganisation,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organisationKeys.all })
		},
	})
}

export function useUpdateOrganisation() {
    const dispatch = useDispatch();
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: updateOrganisation,
		onSuccess: (data, variables) => {
            dispatch(setOrganisation({ organisation: data?.data?.organisation || null }));
			queryClient.invalidateQueries({ queryKey: organisationKeys.detail(variables.id) })
			queryClient.invalidateQueries({ queryKey: organisationKeys.all })
		},
	})
}

export function useDeleteOrganisation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteOrganisation,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organisationKeys.all })
		},
	})
}

export function useFetchOrganisationMembers(id, params, options) {
	return useQuery({
		queryKey: organisationKeys.members(id, params),
		queryFn: () => fetchOrganisationMembers(id, params),
		enabled: !!id,
		...options,
	})
}
