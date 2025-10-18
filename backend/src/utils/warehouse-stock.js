const mongoose = require('mongoose');
const { StockModal } = require('../models/stock/stock-scheema');
const { WherehouseModel } = require('../models/warehouse/wherehouse-model');

/**
 * Updates warehouse stock count atomically
 * @param {String|ObjectId} warehouseId - The warehouse ID
 * @param {Number} count - The count to increment/decrement (can be negative)
 * @returns {Promise<Object|null>} Updated warehouse document or null
 * @throws {Error} When validation fails or database operation fails
 */
async function updateWarehouseStockCount(warehouseId, count) {
    try {
        // Input validation
        if (!warehouseId) {
            throw new Error('Warehouse ID is required');
        }
        
        if (typeof count !== 'number' || isNaN(count)) {
            throw new Error('Count must be a valid number');
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
            throw new Error('Invalid warehouse ID format');
        }

        // Check if warehouse exists first
        const warehouseExists = await WherehouseModel.exists(
            { _id: warehouseId },
        );
        
        if (!warehouseExists) {
            throw new Error(`Warehouse with ID ${warehouseId} not found`);
        }

        // Atomically increment the stockCount field
        const updated = await WherehouseModel.findByIdAndUpdate(
            warehouseId,
            { $inc: { stockCount: count } },
            { 
                new: true, 
                runValidators: true 
            }
        );

        return updated;

    } catch (error) {
        // Log error for monitoring (replace with your logging solution)
        console.error('Error updating warehouse stock count:', {
            warehouseId,
            count,
            error: error.message,
            stack: error.stack
        });
        
        throw error;
    }
}

module.exports = {
    updateWarehouseStockCount
};
