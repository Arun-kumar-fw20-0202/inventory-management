// Example usage of StockModal in your stock page or component

import React, { useState } from 'react'
import { useDisclosure } from '@heroui/modal'
import { Button } from '@heroui/button'
import { Plus, Edit } from 'lucide-react'
import StockModal from './stock-modal'

const StockManagement = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [modalMode, setModalMode] = useState('create')
  const [selectedStock, setSelectedStock] = useState(null)

  // Handle create new stock
  const handleCreateStock = () => {
    setModalMode('create')
    setSelectedStock(null)
    onOpen()
  }

  // Handle edit existing stock
  const handleEditStock = (stockData) => {
    setModalMode('edit')
    setSelectedStock(stockData)
    onOpen()
  }

  // Handle form submission
  const handleStockSubmit = async (formData) => {
    try {
      if (modalMode === 'create') {
        // API call to create stock
        const response = await fetch('/api/v1/stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) {
          throw new Error('Failed to create stock item')
        }
        
        // Refresh stock list or update state
        console.log('Stock created successfully')
        
      } else if (modalMode === 'edit') {
        // API call to update stock
        const response = await fetch(`/api/v1/stock/${selectedStock._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) {
          throw new Error('Failed to update stock item')
        }
        
        // Refresh stock list or update state
        console.log('Stock updated successfully')
      }
      
    } catch (error) {
      throw error // Let the modal handle the error display
    }
  }

  return (
    <div>
      {/* Example buttons to trigger modal */}
      <div className="flex gap-2 mb-4">
        <Button 
          color="primary" 
          startContent={<Plus className="w-4 h-4" />}
          onPress={handleCreateStock}
        >
          Add Stock Item
        </Button>
      </div>

      {/* Example stock list with edit buttons */}
      <div className="space-y-2">
        {/* This would be your stock items list */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Sample Product</h3>
            <p className="text-sm text-gray-600">SKU: SAMPLE-001</p>
          </div>
          <Button
            size="sm"
            variant="light"
            startContent={<Edit className="w-4 h-4" />}
            onPress={() => handleEditStock({
              _id: '123',
              productName: 'Sample Product',
              sku: 'SAMPLE-001',
              category: 'Electronics',
              description: 'A sample product',
              quantity: 100,
              unit: 'pcs',
              purchasePrice: 50,
              sellingPrice: 75,
              lowStockThreshold: 10,
              status: 'active',
              tags: ['sample', 'electronics']
            })}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Stock Modal */}
      <StockModal
        isOpen={isOpen}
        onClose={onClose}
        mode={modalMode}
        stockData={selectedStock}
        onSubmit={handleStockSubmit}
      />
    </div>
  )
}

export default StockManagement