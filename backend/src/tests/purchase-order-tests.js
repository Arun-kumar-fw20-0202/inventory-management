/**
 * Purchase Order Module Test File
 * This file demonstrates the usage of the Purchase Order API endpoints
 * and provides sample test data for testing the functionality
 */

const axios = require('axios');

// Base URL for your API
const BASE_URL = 'http://localhost:3000/api'; // Adjust according to your setup

// Sample authentication token (replace with actual token)
const AUTH_TOKEN = 'your_jwt_token_here';

// API client with authentication
const apiClient = axios.create({
   baseURL: BASE_URL,
   headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
   }
});

/**
 * Sample test data
 */
const samplePurchaseOrder = {
   supplierId: '60a7c5b5f8d4b8001f5e4a1b', // Replace with actual supplier ID
   warehouseId: '60a7c5b5f8d4b8001f5e4a1c', // Replace with actual warehouse ID
   items: [
      {
         productId: '60a7c5b5f8d4b8001f5e4a1d', // Replace with actual product ID
         quantity: 100,
         unitPrice: 25.50
      },
      {
         productId: '60a7c5b5f8d4b8001f5e4a1e', // Replace with actual product ID
         quantity: 50,
         unitPrice: 45.00
      }
   ],
   expectedDeliveryDate: '2025-10-15T09:00:00.000Z',
   notes: 'Urgent order for Q4 inventory replenishment'
};

const sampleReceiveItems = [
   {
      productId: '60a7c5b5f8d4b8001f5e4a1d',
      receivedQuantity: 80 // Partial delivery
   },
   {
      productId: '60a7c5b5f8d4b8001f5e4a1e',
      receivedQuantity: 50 // Full delivery
   }
];

/**
 * Test functions for each API endpoint
 */

// 1. Create Purchase Order
async function testCreatePurchaseOrder() {
   try {
      console.log('🔄 Testing Create Purchase Order...');
      const response = await apiClient.post('/purchase-orders', samplePurchaseOrder);
      console.log('✅ Purchase Order Created:', response.data);
      return response.data.data._id; // Return the created order ID
   } catch (error) {
      console.error('❌ Create Purchase Order Error:', error.response?.data || error.message);
      return null;
   }
}

// 2. Get All Purchase Orders with Filters
async function testGetPurchaseOrders() {
   try {
      console.log('🔄 Testing Get Purchase Orders...');
      const response = await apiClient.get('/purchase-orders', {
         params: {
            page: 1,
            limit: 10,
            status: 'Draft'
         }
      });
      console.log('✅ Purchase Orders Retrieved:', response.data);
      return response.data;
   } catch (error) {
      console.error('❌ Get Purchase Orders Error:', error.response?.data || error.message);
      return null;
   }
}

// 3. Get Purchase Order by ID
async function testGetPurchaseOrderById(orderId) {
   try {
      console.log('🔄 Testing Get Purchase Order by ID...');
      const response = await apiClient.get(`/purchase-orders/${orderId}`);
      console.log('✅ Purchase Order Details:', response.data);
      return response.data;
   } catch (error) {
      console.error('❌ Get Purchase Order by ID Error:', error.response?.data || error.message);
      return null;
   }
}

// 4. Submit Purchase Order
async function testSubmitPurchaseOrder(orderId) {
   try {
      console.log('🔄 Testing Submit Purchase Order...');
      const response = await apiClient.patch(`/purchase-orders/${orderId}/submit`);
      console.log('✅ Purchase Order Submitted:', response.data);
      return response.data;
   } catch (error) {
      console.error('❌ Submit Purchase Order Error:', error.response?.data || error.message);
      return null;
   }
}

// 5. Approve Purchase Order
async function testApprovePurchaseOrder(orderId) {
   try {
      console.log('🔄 Testing Approve Purchase Order...');
      const response = await apiClient.patch(`/purchase-orders/${orderId}/approve`);
      console.log('✅ Purchase Order Approved:', response.data);
      return response.data;
   } catch (error) {
      console.error('❌ Approve Purchase Order Error:', error.response?.data || error.message);
      return null;
   }
}

// 6. Reject Purchase Order
async function testRejectPurchaseOrder(orderId) {
   try {
      console.log('🔄 Testing Reject Purchase Order...');
      const response = await apiClient.patch(`/purchase-orders/${orderId}/reject`, {
         reason: 'Budget constraints - order delayed to next quarter'
      });
      console.log('✅ Purchase Order Rejected:', response.data);
      return response.data;
   } catch (error) {
      console.error('❌ Reject Purchase Order Error:', error.response?.data || error.message);
      return null;
   }
}

// 7. Receive Purchase Order Items
async function testReceivePurchaseOrder(orderId) {
   try {
      console.log('🔄 Testing Receive Purchase Order Items...');
      const response = await apiClient.patch(`/purchase-orders/${orderId}/receive`, {
         receivedItems: sampleReceiveItems
      });
      console.log('✅ Purchase Order Items Received:', response.data);
      return response.data;
   } catch (error) {
      console.error('❌ Receive Purchase Order Error:', error.response?.data || error.message);
      return null;
   }
}

/**
 * Complete workflow test
 */
async function runCompleteWorkflowTest() {
   console.log('🚀 Starting Complete Purchase Order Workflow Test...\n');

   // Step 1: Create Purchase Order
   const orderId = await testCreatePurchaseOrder();
   if (!orderId) return;

   console.log('\n' + '='.repeat(50) + '\n');

   // Step 2: Get Purchase Order Details
   await testGetPurchaseOrderById(orderId);

   console.log('\n' + '='.repeat(50) + '\n');

   // Step 3: Submit for Approval
   await testSubmitPurchaseOrder(orderId);

   console.log('\n' + '='.repeat(50) + '\n');

   // Step 4: Approve Purchase Order
   await testApprovePurchaseOrder(orderId);

   console.log('\n' + '='.repeat(50) + '\n');

   // Step 5: Receive Items (Partial)
   await testReceivePurchaseOrder(orderId);

   console.log('\n' + '='.repeat(50) + '\n');

   // Step 6: Get All Purchase Orders
   await testGetPurchaseOrders();

   console.log('\n✅ Complete workflow test finished!');
}

/**
 * Individual test functions
 */
async function runIndividualTests() {
   console.log('🧪 Running Individual Tests...\n');

   await testGetPurchaseOrders();
   console.log('\n' + '-'.repeat(30) + '\n');

   // Add more individual tests as needed
}

/**
 * Performance test - bulk operations
 */
async function runPerformanceTest() {
   console.log('⚡ Running Performance Test...\n');

   const startTime = Date.now();
   
   // Create multiple purchase orders concurrently
   const promises = Array.from({ length: 5 }, () => testCreatePurchaseOrder());
   const results = await Promise.allSettled(promises);
   
   const endTime = Date.now();
   const duration = endTime - startTime;
   
   console.log(`⏱️ Created 5 purchase orders in ${duration}ms`);
   console.log(`📊 Success rate: ${results.filter(r => r.status === 'fulfilled').length}/5`);
}

/**
 * Error handling test
 */
async function runErrorHandlingTest() {
   console.log('🛡️ Running Error Handling Test...\n');

   // Test with invalid data
   try {
      await apiClient.post('/purchase-orders', {
         // Missing required fields
         items: []
      });
   } catch (error) {
      console.log('✅ Validation error handled correctly:', error.response?.data?.message);
   }

   // Test with invalid ID
   try {
      await apiClient.get('/purchase-orders/invalid-id');
   } catch (error) {
      console.log('✅ Invalid ID error handled correctly:', error.response?.data?.message);
   }
}

/**
 * Main test runner
 */
async function main() {
   console.log('📋 Purchase Order Module Test Suite\n');
   console.log('Choose test type:');
   console.log('1. Complete Workflow Test');
   console.log('2. Individual Tests');
   console.log('3. Performance Test');
   console.log('4. Error Handling Test');
   console.log('5. All Tests\n');

   // For this example, we'll run the complete workflow
   // In a real scenario, you might use command line arguments or prompts
   const testType = process.argv[2] || '1';

   switch (testType) {
      case '1':
         await runCompleteWorkflowTest();
         break;
      case '2':
         await runIndividualTests();
         break;
      case '3':
         await runPerformanceTest();
         break;
      case '4':
         await runErrorHandlingTest();
         break;
      case '5':
         await runCompleteWorkflowTest();
         await runIndividualTests();
         await runPerformanceTest();
         await runErrorHandlingTest();
         break;
      default:
         console.log('Invalid test type. Using default: Complete Workflow Test');
         await runCompleteWorkflowTest();
   }
}

// Run tests if this file is executed directly
if (require.main === module) {
   main().catch(console.error);
}

module.exports = {
   testCreatePurchaseOrder,
   testGetPurchaseOrders,
   testGetPurchaseOrderById,
   testSubmitPurchaseOrder,
   testApprovePurchaseOrder,
   testRejectPurchaseOrder,
   testReceivePurchaseOrder,
   runCompleteWorkflowTest,
   samplePurchaseOrder,
   sampleReceiveItems
};