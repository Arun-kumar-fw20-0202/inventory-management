# Purchase Order Module Documentation

## Overview

This Purchase Order module provides a complete, production-ready solution for managing purchase orders in an inventory management system. It follows best practices for performance, scalability, and maintainability.

## Features

- ✅ **Complete Purchase Order Lifecycle Management**
- ✅ **Optimized Database Operations** (bulkWrite, lean queries, indexes)
- ✅ **Memory-Efficient Operations** (pagination, selective population)
- ✅ **Comprehensive Validation** (input validation, business rules)
- ✅ **Transaction Support** (stock updates with rollback capability)
- ✅ **Production-Ready Error Handling**
- ✅ **RESTful API Design**

## Architecture

### Schema Design (`purchase-order-scheema.js`)

**PurchaseOrder Schema:**
- `supplierId` - Reference to supplier (indexed)
- `warehouseId` - Reference to warehouse (indexed)
- `orderNumber` - Unique order identifier (auto-generated)
- `items[]` - Array of order items with product details
- `status` - Workflow status (Draft → PendingApproval → Approved → PartiallyReceived/Completed)
- `totalAmount` - Auto-calculated total (pre-save hook)
- `expectedDeliveryDate` - Delivery schedule
- `createdBy/approvedBy` - User references
- `notes` - Additional information

**Performance Optimizations:**
- Compound indexes for common query patterns
- Pre-save hooks for auto-calculations
- Lean queries for better memory usage
- Selective field population

### Controller Functions (`purchase-controller.js`)

#### 1. `createPurchaseOrder`
**Purpose:** Create new purchase order in Draft status
**Optimizations:**
- Validates all inputs before DB operations
- Generates unique order numbers
- Auto-calculates item totals and order total
- Returns populated response in single query

**Example Request:**
```json
{
  "supplierId": "60a7c5b5f8d4b8001f5e4a1b",
  "warehouseId": "60a7c5b5f8d4b8001f5e4a1c",
  "items": [
    {
      "productId": "60a7c5b5f8d4b8001f5e4a1d",
      "quantity": 100,
      "unitPrice": 25.50
    }
  ],
  "expectedDeliveryDate": "2025-10-15T09:00:00.000Z",
  "notes": "Urgent order for Q4 inventory"
}
```

#### 2. `submitPurchaseOrder`
**Purpose:** Change status from Draft to PendingApproval
**Business Rules:** Only Draft orders can be submitted

#### 3. `approvePurchaseOrder`
**Purpose:** Approve pending orders and set approver
**Business Rules:** Only PendingApproval orders can be approved

#### 4. `rejectPurchaseOrder`
**Purpose:** Cancel pending orders with reason
**Business Rules:** Only PendingApproval orders can be rejected

#### 5. `receivePurchaseOrder`
**Purpose:** Receive items and update stock levels
**Optimizations:**
- Uses MongoDB transactions for data consistency
- BulkWrite operations for stock updates (minimal DB calls)
- Validates received quantities against ordered quantities
- Auto-updates order status based on completion

**Example Request:**
```json
{
  "receivedItems": [
    {
      "productId": "60a7c5b5f8d4b8001f5e4a1d",
      "receivedQuantity": 80
    }
  ]
}
```

#### 6. `getPurchaseOrders`
**Purpose:** Paginated list with filtering
**Optimizations:**
- Lean queries for better performance
- Parallel execution of query and count
- Comprehensive filtering options
- Smart pagination metadata

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status
- `supplierId` - Filter by supplier
- `warehouseId` - Filter by warehouse
- `startDate/endDate` - Date range filtering
- `search` - Text search in order number and notes

#### 7. `getPurchaseOrderById`
**Purpose:** Get detailed purchase order information
**Optimizations:**
- Full population of related entities
- Lean query for memory efficiency

### API Endpoints (`purchase-order-routes.js`)

```
POST   /purchase-orders           # Create new purchase order
GET    /purchase-orders           # Get paginated list with filters
GET    /purchase-orders/:id       # Get purchase order details
PATCH  /purchase-orders/:id/submit   # Submit for approval
PATCH  /purchase-orders/:id/approve  # Approve purchase order
PATCH  /purchase-orders/:id/reject   # Reject purchase order
PATCH  /purchase-orders/:id/receive  # Receive items and update stock
```

### Validation Middleware (`purchase-order-validation.js`)

**Input Validation:**
- MongoDB ObjectId validation
- Required field validation
- Data type and range validation
- Business rule validation

**Error Handling:**
- Standardized error responses
- Detailed validation error messages
- Development vs production error details

## Status Workflow

```
Draft → PendingApproval → Approved → PartiallyReceived → Completed
   ↓                        ↓              ↓
Cancelled ←──────────────────┘              ↓
                                      Completed
```

**Status Descriptions:**
- `Draft` - Initial state, can be edited
- `PendingApproval` - Submitted for approval
- `Approved` - Ready for receiving
- `PartiallyReceived` - Some items received
- `Completed` - All items received
- `Cancelled` - Order cancelled/rejected

## Performance Features

### Database Optimizations
- **Indexes:** Strategic compound indexes for common queries
- **Lean Queries:** Memory-efficient queries without Mongoose overhead
- **BulkWrite:** Minimal database calls for stock updates
- **Aggregation:** Efficient data processing on database side

### Memory Management
- **Pagination:** Limited result sets to prevent memory issues
- **Selective Population:** Only populate required fields
- **Stream Processing:** For large data operations

### Scalability Features
- **Transaction Support:** ACID compliance for critical operations
- **Connection Pooling:** Efficient database connection management
- **Async/Await:** Non-blocking operations
- **Error Boundaries:** Graceful error handling

## Usage Examples

### Basic Workflow
```javascript
// 1. Create Purchase Order
const newOrder = await createPurchaseOrder(orderData);

// 2. Submit for Approval
await submitPurchaseOrder(newOrder.id);

// 3. Approve Order
await approvePurchaseOrder(newOrder.id);

// 4. Receive Items
await receivePurchaseOrder(newOrder.id, receivedItems);
```

### Advanced Filtering
```javascript
// Get recent approved orders for specific warehouse
const orders = await getPurchaseOrders({
  status: 'Approved',
  warehouseId: 'warehouse_id',
  startDate: '2025-09-01',
  page: 1,
  limit: 20
});
```

## Security Considerations

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** User-based access control
3. **Input Validation:** Comprehensive validation on all inputs
4. **SQL Injection Prevention:** MongoDB parameterized queries
5. **Rate Limiting:** Recommended for production deployment

## Monitoring and Logging

1. **Error Logging:** Comprehensive error logging with context
2. **Performance Metrics:** Query timing and resource usage
3. **Business Metrics:** Order volumes, approval rates, etc.
4. **Health Checks:** Database connectivity and system status

## Testing

The module includes comprehensive test coverage:
- Unit tests for individual functions
- Integration tests for complete workflows
- Performance tests for bulk operations
- Error handling tests for edge cases

Run tests with:
```bash
node src/tests/purchase-order-tests.js
```

## Production Deployment Checklist

- [ ] Configure MongoDB indexes
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Set up backup strategies
- [ ] Configure logging aggregation
- [ ] Set up health checks
- [ ] Configure auto-scaling
- [ ] Security audit

## Dependencies

- `mongoose` - MongoDB ODM
- `express` - Web framework
- `express-validator` - Input validation
- Standard Node.js libraries

## API Response Format

All endpoints return consistent JSON responses:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-09-23T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-09-23T10:30:00.000Z",
  "error": { ... } // Only in development
}
```

**Paginated Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "orders": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Contributing

1. Follow existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility
5. Performance test new optimizations

## License

[Add your license information here]

---

*This module is designed for production use and follows enterprise-grade best practices for scalability, performance, and maintainability.*