import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/components/base-url';
import toast from 'react-hot-toast';

// ============================
// QUERY KEYS
// ============================
export const supplierCustomerKeys = {
   all: ['supplier-customers'],
   lists: () => [...supplierCustomerKeys.all, 'list'],
   list: (filters) => [...supplierCustomerKeys.lists(), { filters }],
   details: () => [...supplierCustomerKeys.all, 'detail'],
   detail: (id) => [...supplierCustomerKeys.details(), id],
   search: (term) => [...supplierCustomerKeys.all, 'search', term],
   analytics: (type) => [...supplierCustomerKeys.all, 'analytics', type],
};

// ============================
// API FUNCTIONS
// ============================

/**
 * Fetch supplier/customers with advanced filtering
 */
const fetchSupplierCustomers = async (params = {}) => {
   try {
      const response = await api.get('/supplier-customers', { params });
      return response.data;
   } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch supplier/customers');
   }
};

/**
 * Fetch supplier/customer by ID
 */
const fetchSupplierCustomerById = async (id) => {
   try {
      const response = await api.get(`/supplier-customers/${id}`);
      return response.data;
   } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch supplier/customer details');
   }
};

/**
 * Search supplier/customers
 */
const searchSupplierCustomers = async (searchTerm, options = {}) => {
   try {
      const params = {
         q: searchTerm,
         ...options
      };
      const response = await api.get('/supplier-customers/search', { params });
      return response.data;
   } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search supplier/customers');
   }
};

/**
 * Fetch analytics
 */
const fetchAnalytics = async (type = null) => {
   try {
      const params = {};
      if (type) params.type = type;
      
      const response = await api.get('/supplier-customers/analytics', { params });
      return response.data;
   } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
   }
};

/**
 * Create supplier/customer
 */
const createSupplierCustomer = async (data) => {
   try {
      const response = await api.post('/supplier-customers', data);
      return response.data;
   } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create supplier/customer');
   }
};

/**
 * Update supplier/customer
 */
const updateSupplierCustomer = async ({ id, data }) => {
   try {
      const response = await api.put(`/supplier-customers/${id}`, data);
      return response.data;
   } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update supplier/customer');
   }
};

/**
 * Delete supplier/customer
 */
const deleteSupplierCustomer = async (id) => {
   try {
      const response = await api.delete(`/supplier-customers/${id}`);
      return response.data;
   } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete supplier/customer');
   }
};

/**
 * Bulk operations
 */
const bulkOperations = async (data) => {
   try {
      const response = await api.post('/supplier-customers/bulk', data);
      return response.data;
   } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to perform bulk operation');
   }
};

// ============================
// QUERY HOOKS
// ============================

/**
 * Use supplier/customers list with advanced filtering
 */
export const useSupplierCustomers = (filters = {}, options = {}) => {
   return useQuery({
      queryKey: supplierCustomerKeys.list(filters),
      queryFn: () => fetchSupplierCustomers(filters),
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      ...options,
   });
};

/**
 * Use supplier/customer detail
 */
export const useSupplierCustomer = (id, options = {}) => {
   return useQuery({
      queryKey: supplierCustomerKeys.detail(id),
      queryFn: () => fetchSupplierCustomerById(id),
      enabled: !!id,
      staleTime: 3 * 60 * 1000, // 3 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      ...options,
   });
};

/**
 * Use supplier/customer search
 */
export const useSupplierCustomerSearch = (searchTerm, options = {}, queryOptions = {}) => {
   return useQuery({
      queryKey: supplierCustomerKeys.search(searchTerm),
      queryFn: () => searchSupplierCustomers(searchTerm, options),
      enabled: !!searchTerm && searchTerm.length >= 2,
      staleTime: 1 * 60 * 1000, // 1 minute
      gcTime: 3 * 60 * 1000, // 3 minutes
      retry: 1,
      ...queryOptions,
   });
};

/**
 * Use analytics data
 */
export const useSupplierCustomerAnalytics = (type = null, options = {}) => {
   return useQuery({
      queryKey: supplierCustomerKeys.analytics(type),
      queryFn: () => fetchAnalytics(type),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
      retry: 2,
      ...options,
   });
};

/**
 * Use suppliers only
 */
export const useSuppliers = (filters = {}, options = {}) => {
   return useSupplierCustomers(
      { ...filters, type: 'supplier' },
      options
   );
};

/**
 * Use customers only
 */
export const useCustomers = (filters = {}, options = {}) => {
   return useSupplierCustomers(
      { ...filters, type: 'customer' },
      options
   );
};

// ============================
// MUTATION HOOKS
// ============================

/**
 * Create supplier/customer mutation
 */
export const useCreateSupplierCustomer = (options = {}) => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: createSupplierCustomer,
      onSuccess: (data) => {
         // Invalidate and refetch
         queryClient.invalidateQueries({ queryKey: supplierCustomerKeys.lists() });
         toast.success('Contact created successfully');
         options.onSuccess?.(data);
      },
      onError: (error) => {
         console.error('Create error:', error);
         toast.error(error.message || 'Failed to create contact');
         options.onError?.(error);
      },
      ...options,
   });
};

/**
 * Update supplier/customer mutation
 */
export const useUpdateSupplierCustomer = (options = {}) => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: updateSupplierCustomer,
      onSuccess: (data, { id }) => {
         // Update cache
         queryClient.setQueryData(supplierCustomerKeys.detail(id), data);
         queryClient.invalidateQueries({ queryKey: supplierCustomerKeys.lists() });
         toast.success('Contact updated successfully');
         options.onSuccess?.(data, { id });
      },
      onError: (error) => {
         console.error('Update error:', error);
         toast.error(error.message || 'Failed to update contact');
         options.onError?.(error);
      },
      ...options,
   });
};

/**
 * Delete supplier/customer mutation
 */
export const useDeleteSupplierCustomer = (options = {}) => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: deleteSupplierCustomer,
      onSuccess: (data, id) => {
         queryClient.invalidateQueries({ queryKey: supplierCustomerKeys.all });
         toast.success('Contact deleted successfully');
         options.onSuccess?.(data, id);
      },
      onError: (error) => {
         console.error('Delete error:', error);
         toast.error(error.message || 'Failed to delete contact');
         options.onError?.(error);
      },
      ...options,
   });
};

/**
 * Bulk operations mutation
 */
export const useBulkOperations = (options = {}) => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: bulkOperations,
      onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: supplierCustomerKeys.all });
         const { operation, affectedCount } = data.data;
         toast.success(`Bulk ${operation} completed. ${affectedCount} items affected.`);
         options.onSuccess?.(data);
      },
      onError: (error) => {
         console.error('Bulk operation error:', error);
         toast.error(error.message || 'Failed to perform bulk operation');
         options.onError?.(error);
      },
      ...options,
   });
};

// ============================
// SPECIALIZED MUTATION HOOKS
// ============================

/**
 * Create supplier mutation
 */
export const useCreateSupplier = (options = {}) => {
   return useCreateSupplierCustomer({
      ...options,
      mutationFn: (data) => createSupplierCustomer({ ...data, type: 'supplier' }),
   });
};

/**
 * Create customer mutation
 */
export const useCreateCustomer = (options = {}) => {
   return useCreateSupplierCustomer({
      ...options,
      mutationFn: (data) => createSupplierCustomer({ ...data, type: 'customer' }),
   });
};

// ============================
// CACHE UTILITIES
// ============================

/**
 * Invalidate all supplier/customer queries
 */
export const invalidateSupplierCustomerQueries = (queryClient) => {
   return queryClient.invalidateQueries({
      queryKey: supplierCustomerKeys.all,
   });
};

/**
 * Prefetch supplier/customer detail
 */
export const prefetchSupplierCustomer = (queryClient, id) => {
   return queryClient.prefetchQuery({
      queryKey: supplierCustomerKeys.detail(id),
      queryFn: () => fetchSupplierCustomerById(id),
      staleTime: 3 * 60 * 1000,
   });
};