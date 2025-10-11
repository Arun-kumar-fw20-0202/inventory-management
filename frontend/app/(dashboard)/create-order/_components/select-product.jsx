import { useFetchStock } from '@/libs/query/stock/stock-query'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal'
import { PlusIcon, SearchIcon, X } from 'lucide-react'
import React from 'react'

const SelectProductDrawr = ({
    isOpen,
    onOpenChange,
    onOpen,
    selectedProducts = [],
    onProductSelect,
    onProductRemove,
}) => {
    const [limit, setLimit] = React.useState(20)
    const [search, setSearch] = React.useState('')

    const { data: products, isLoading: productsLoading } = useFetchStock({
        search, limit,
        includeAnalytics: false,
        // exportData: true,
        fields: 'productId,productName, sku, quantity, purchasePrice, warehouseId',
    })

    
    return (
        <>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="bottom-center" size='5xl'>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Select Products</ModalHeader>
                        <ModalBody>

                            <div className="p-4 flex flex-col gap-4">
                                <Input 
                                    type="text" 
                                    placeholder="Search products..."
                                    startContent={<SearchIcon />}
                                    value={search}
                                    variant='bordered'
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {productsLoading ? (
                                    <p>Loading products...</p>
                                ) : (
                                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                                        {products && products?.data?.length > 0 ? products?.data?.map(product => {
                                            const isSelected = selectedProducts.some(p => p._id === product?._id)
                                            // find selected product data if present (may carry quantity/purchasePrice)
                                            const selected = selectedProducts.find(p => p._id === product?._id) || {}
                                            return (
                                            <li key={product?._id} className="p-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="font-medium">{product?.productName} (SKU: {product?.sku})</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Available: {product?.quantity} | Price: ₹{product?.purchasePrice}</p>
                                                </div>

                                                <div className="flex items-center gap-2 w-full md:w-auto">

                                                    {!isSelected ? (
                                                        <Button
                                                            isIconOnly
                                                            size='sm'
                                                            startContent={<PlusIcon size={22} />}
                                                            onPress={() => onProductSelect?.(product)}
                                                        />
                                                    ) : (
                                                        <Button
                                                            onPress={() => onProductRemove?.(product)}
                                                            color='danger'
                                                            isIconOnly
                                                            size='sm'
                                                            startContent={<X size={22} />}
                                                        />
                                                    )}
                                                </div>
                                            </li>
                                        )}) : (
                                            <p>No products found.</p>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant='light' onPress={onClose}>Cancel</Button>
                            <Button color='primary' onPress={onClose}>Done</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
            {/* <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => onOpenChange(false)}></div> */}
        </>
    )
}

export default SelectProductDrawr