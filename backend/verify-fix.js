/**
 * Quick verification script to test the controller setup
 */

// Test logger
console.log('Testing logger...');
try {
   const logger = require('./src/utils/logger');
   logger.info('Logger test successful');
   logger.error('Error test', { test: true });
   console.log('✅ Logger working correctly');
} catch (err) {
   console.log('❌ Logger error:', err.message);
}

// Test response utilities
console.log('\nTesting response utilities...');
try {
   const { success, error } = require('./src/utils/response');
   console.log('✅ Response utilities loaded correctly');
} catch (err) {
   console.log('❌ Response utilities error:', err.message);
}

// Test controller
console.log('\nTesting controller...');
try {
   const controller = require('./src/controllers/customer-supplier/customer-supplier.controller');
   const methods = Object.keys(controller);
   console.log('✅ Controller loaded successfully');
   console.log('Available methods:', methods);
   
   // Verify all expected methods exist
   const expectedMethods = [
      'getAllSupplierCustomers',
      'getSupplierCustomerById', 
      'createSupplierCustomer',
      'updateSupplierCustomer',
      'deleteSupplierCustomer',
      'bulkOperations',
      'searchSupplierCustomers',
      'getAnalytics',
      'updateTransactionMetrics'
   ];
   
   const missingMethods = expectedMethods.filter(method => !methods.includes(method));
   if (missingMethods.length === 0) {
      console.log('✅ All expected methods are present');
   } else {
      console.log('❌ Missing methods:', missingMethods);
   }
   
} catch (err) {
   console.log('❌ Controller error:', err.message);
   console.log('Stack:', err.stack);
}

console.log('\n🎉 Verification complete!');