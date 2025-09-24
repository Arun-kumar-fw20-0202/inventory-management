// ================================
// PURCHASE ORDER TYPES
// ================================

export interface PurchaseOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  total: number;
}

export interface CreatePurchaseOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  _id: string;
  supplierId: string | SupplierInfo;
  warehouseId: string | WarehouseInfo;
  orderNumber: string;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  totalAmount: number;
  expectedDeliveryDate?: string;
  createdBy: string | UserInfo;
  approvedBy?: string | UserInfo;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus = 
  | "Draft"
  | "PendingApproval"
  | "Approved"
  | "PartiallyReceived"
  | "Completed"
  | "Cancelled";

export interface CreatePurchaseOrderData {
  supplierId: string;
  warehouseId: string;
  items: CreatePurchaseOrderItem[];
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface ReceivePurchaseOrderItem {
  productId: string;
  receivedQuantity: number;
}

export interface ReceivePurchaseOrderData {
  id: string;
  receivedItems: ReceivePurchaseOrderItem[];
}

export interface RejectPurchaseOrderData {
  id: string;
  reason?: string;
}

// ================================
// RELATED ENTITY TYPES
// ================================

export interface SupplierInfo {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface WarehouseInfo {
  _id: string;
  name: string;
  location: string;
  active_status?: boolean;
}

export interface UserInfo {
  _id: string;
  name: string;
  email: string;
}

export interface ProductInfo {
  _id: string;
  name: string;
  sku: string;
  description?: string;
}

// ================================
// API RESPONSE TYPES
// ================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    orders: T[];
    pagination: PaginationInfo;
  };
  timestamp: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ================================
// FILTER TYPES
// ================================

export interface PurchaseOrderFilters {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

// ================================
// ANALYTICS TYPES
// ================================

export interface PurchaseOrderSummary {
  draft: number;
  pending: number;
  approved: number;
  completed: number;
  cancelled?: number;
  partiallyReceived?: number;
}

export interface PurchaseOrderAnalytics {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  statusDistribution: PurchaseOrderSummary;
  monthlyTrends?: MonthlyTrend[];
  topSuppliers?: SupplierAnalytics[];
  topWarehouses?: WarehouseAnalytics[];
}

export interface MonthlyTrend {
  month: string;
  totalOrders: number;
  totalValue: number;
}

export interface SupplierAnalytics {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalValue: number;
}

export interface WarehouseAnalytics {
  warehouseId: string;
  warehouseName: string;
  totalOrders: number;
  totalValue: number;
}

// ================================
// HOOK RETURN TYPES
// ================================

export interface UseMutationResult<TData, TError, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data?: TData;
  error?: TError;
  isError: boolean;
  isIdle: boolean;
  isLoading: boolean;
  isPending: boolean;
  isSuccess: boolean;
  reset: () => void;
  status: "idle" | "pending" | "error" | "success";
}

export interface UseQueryResult<TData, TError> {
  data?: TData;
  error?: TError;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  refetch: () => Promise<any>;
  status: "pending" | "error" | "success";
  fetchStatus: "fetching" | "paused" | "idle";
}

// ================================
// FORM TYPES
// ================================

export interface PurchaseOrderFormData {
  supplierId: string;
  warehouseId: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface ReceiveItemsFormData {
  receivedItems: {
    productId: string;
    receivedQuantity: number;
  }[];
}

// ================================
// TABLE/DISPLAY TYPES
// ================================

export interface PurchaseOrderTableRow {
  id: string;
  orderNumber: string;
  supplierName: string;
  warehouseName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  expectedDeliveryDate?: string;
  createdAt: string;
  createdBy: string;
}

export interface PurchaseOrderDetailsView extends PurchaseOrder {
  supplierId: SupplierInfo;
  warehouseId: WarehouseInfo;
  createdBy: UserInfo;
  approvedBy?: UserInfo;
  items: (PurchaseOrderItem & {
    productId: ProductInfo;
  })[];
}

// ================================
// STATUS BADGE TYPES
// ================================

export interface StatusBadgeProps {
  status: PurchaseOrderStatus;
  className?: string;
}

export const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  Draft: "bg-gray-100 text-gray-800",
  PendingApproval: "bg-yellow-100 text-yellow-800",
  Approved: "bg-blue-100 text-blue-800",
  PartiallyReceived: "bg-orange-100 text-orange-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

// ================================
// VALIDATION SCHEMAS (if using Zod)
// ================================

export const purchaseOrderItemSchema = {
  productId: "string",
  quantity: "number (min: 1)",
  unitPrice: "number (min: 0)",
};

export const createPurchaseOrderSchema = {
  supplierId: "string (required)",
  warehouseId: "string (required)",
  items: "array (min: 1)",
  expectedDeliveryDate: "date (optional)",
  notes: "string (optional, max: 1000)",
};

// ================================
// UTILITY TYPES
// ================================

export type PurchaseOrderMutationFunctions = {
  createPurchaseOrder: (data: CreatePurchaseOrderData) => Promise<ApiResponse<PurchaseOrder>>;
  submitPurchaseOrder: (id: string) => Promise<ApiResponse<{ id: string; status: string }>>;
  approvePurchaseOrder: (id: string) => Promise<ApiResponse<{ id: string; status: string }>>;
  rejectPurchaseOrder: (data: RejectPurchaseOrderData) => Promise<ApiResponse<{ id: string; status: string }>>;
  receivePurchaseOrder: (data: ReceivePurchaseOrderData) => Promise<ApiResponse<{ id: string; status: string }>>;
};

export type PurchaseOrderQueryFunctions = {
  fetchPurchaseOrders: (filters?: PurchaseOrderFilters) => Promise<PaginatedResponse<PurchaseOrder>>;
  fetchPurchaseOrderById: (id: string) => Promise<ApiResponse<PurchaseOrderDetailsView>>;
  fetchPurchaseOrdersSummary: () => Promise<ApiResponse<PurchaseOrderSummary>>;
  fetchPurchaseOrdersAnalytics: (filters?: PurchaseOrderFilters) => Promise<ApiResponse<PurchaseOrderAnalytics>>;
};