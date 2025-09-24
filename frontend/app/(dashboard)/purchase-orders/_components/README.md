# Purchase Order Module

This document explains how to use the complete Purchase Order module implementation for the inventory management system.

## Overview

The Purchase Order module provides a complete solution for managing purchase orders, including:

- Creating and managing purchase orders
- Supplier and product management
- Warehouse integration
- Status tracking and workflow
- Item receiving functionality
- Dashboard analytics

## Backend Components

### 1. Database Schema
**File:** `backend/src/models/purchase-order/purchase-order-scheema.js`

The schema includes:
- Order details (PO number, dates, amounts)
- Supplier and warehouse references
- Line items with products and quantities
- Status tracking (draft → submitted → approved → received)
- Automatic calculations and validations

### 2. Controller Functions
**File:** `backend/src/controllers/purchase-order/purchase-controller.js`

Available endpoints:
- `POST /api/purchase-orders` - Create new purchase order
- `GET /api/purchase-orders` - List all purchase orders with filtering
- `GET /api/purchase-orders/:id` - Get specific purchase order
- `PUT /api/purchase-orders/:id/submit` - Submit for approval
- `PUT /api/purchase-orders/:id/approve` - Approve purchase order
- `PUT /api/purchase-orders/:id/reject` - Reject purchase order
- `PUT /api/purchase-orders/:id/receive` - Receive items

### 3. Routes
**File:** `backend/src/routes/purchase-order-routes.js`

All routes include:
- Authentication middleware
- Role-based access control
- Input validation
- Error handling

## Frontend Components

### 1. Main Page
**File:** `frontend/app/(dashboard)/purchase-orders/page.jsx`

The main interface includes:
- Summary dashboard cards
- Purchase orders table with filtering
- Create purchase order button
- Real-time data fetching

### 2. Components Architecture

#### PurchaseOrdersTable.jsx
- Displays all purchase orders in a table format
- Includes filtering by status, supplier, date range
- Pagination support
- Action buttons for each order
- Status indicators

#### PurchaseOrdersSummary.jsx
- Dashboard cards showing key metrics
- Total orders, pending orders, completed orders
- Total value calculations
- Real-time updates

#### CreatePurchaseOrderModal.jsx
- Form for creating new purchase orders
- Product selection with search
- Automatic calculations
- Validation and error handling

#### PurchaseOrderDetailsModal.jsx
- Detailed view of purchase order
- All order information and line items
- Status history and actions
- Print functionality

#### ReceiveItemsModal.jsx
- Interface for receiving ordered items
- Quantity verification
- Stock updates
- Partial receiving support

#### PurchaseOrderStatusBadge.jsx
- Reusable status indicator component
- Color-coded status display
- Consistent styling

### 3. Data Management

#### React Query Hooks
**File:** `frontend/libs/mutation/purchase-order/purchase-order-mutation.js`

Available hooks:
- `useCreatePurchaseOrder()` - Create new orders
- `useFetchPurchaseOrders()` - List orders with caching
- `useFetchPurchaseOrderById()` - Get specific order
- `useSubmitPurchaseOrder()` - Submit for approval
- `useApprovePurchaseOrder()` - Approve orders
- `useRejectPurchaseOrder()` - Reject orders
- `useReceivePurchaseOrder()` - Receive items

#### Additional Query Hooks
- `useFetchSuppliers()` - Get suppliers list
- `useFetchWarehouses()` - Get warehouses list
- `useFetchProducts()` - Get products list

## How to Use

### 1. Creating a Purchase Order

1. Navigate to the Purchase Orders page
2. Click "Create Purchase Order" button
3. Fill in the form:
   - Select supplier
   - Choose warehouse
   - Add products with quantities and prices
   - Add notes if needed
4. Save as draft or submit for approval

### 2. Managing Purchase Orders

#### View Orders
- Use the main table to view all orders
- Filter by status, supplier, or date range
- Click on any order to view details

#### Approve/Reject Orders
- Orders with "submitted" status can be approved or rejected
- Use the action buttons in the table
- Add approval/rejection notes

#### Receive Items
- Approved orders can have items received
- Click "Receive" button on approved orders
- Verify quantities and update stock
- Support for partial receiving

### 3. Dashboard Analytics

The summary cards show:
- **Total Orders:** Count of all purchase orders
- **Pending Orders:** Orders awaiting approval
- **Completed Orders:** Fully received orders
- **Total Value:** Sum of all order amounts

## API Integration

### Authentication
All API calls require JWT authentication:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Error Handling
The system includes comprehensive error handling:
- Validation errors with specific field messages
- Network error recovery
- User-friendly error displays
- Automatic retry for failed requests

## Security Features

- Role-based access control (superadmin, admin, manager)
- JWT authentication on all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## Performance Optimizations

- React Query caching for API responses
- Lazy loading of components
- Optimized database queries with indexes
- Pagination for large datasets
- Debounced search inputs

## Styling and UI

- Built with HeroUI/NextUI components
- Responsive design for all screen sizes
- Consistent color scheme and typography
- Loading states and skeleton screens
- Accessible components with proper ARIA labels

## Future Enhancements

Potential improvements:
1. Email notifications for status changes
2. Purchase order templates
3. Bulk operations
4. Advanced reporting and analytics
5. Integration with accounting systems
6. Barcode scanning for receiving
7. Supplier portal access

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure valid JWT token
   - Check token expiration
   - Verify user permissions

2. **Data Not Loading**
   - Check network connectivity
   - Verify API endpoints
   - Check console for errors

3. **Form Validation Issues**
   - Ensure all required fields are filled
   - Check data formats (dates, numbers)
   - Verify product availability

4. **Permission Denied**
   - Check user role assignments
   - Verify page access permissions
   - Contact administrator if needed

For additional support, check the application logs or contact the development team.