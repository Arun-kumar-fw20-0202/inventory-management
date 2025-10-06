// @ts-nocheck
import { useCreateSale } from '@/libs/mutation/sales/sales-mutations'
import React, { useCallback, useRef, useMemo } from 'react'
import { useFetchStock } from '@/libs/query/stock/stock-query'
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete"
import { Radio, RadioGroup } from '@heroui/radio'
import SupplierCustomerAutocomplete from '@/components/dynamic/supplier-customer/supplier-customer-autocomplete'
import { formatCurrency } from '@/libs/utils'
import { Button } from '@heroui/button'
import { Card } from '@heroui/card'
import { Input } from '@heroui/input'
import { Plus, Trash, Receipt, User, Package, Building2, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const SalesForm = () => {
  // State Management
  const [cusSupplierMode, setCusSupplierMode] = React.useState('customer')
  const [search, setSearch] = React.useState('')
  const [selectedProduct, setSelectedProduct] = React.useState('')
  const [quantity, setQuantity] = React.useState('1')
  const [cart, setCart] = React.useState([])
  const [customer, setCustomer] = React.useState(null)
  const [customerDetails, setCustomerDetails] = React.useState({})
  const [discountType, setDiscountType] = React.useState('fixed')
  const [discountValue, setDiscountValue] = React.useState(0)
  const [taxType, setTaxType] = React.useState('fixed')
  const [taxValue, setTaxValue] = React.useState(0)

  const searchRef = useRef()
  const createSale = useCreateSale()

  // Data Fetching
  const { data: stockData, isLoading: loadingStock } = useFetchStock({
    search,
    limit: 10,
  })

  // Debounced Search
  const handleSearchStockProduct = (value) => {
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => setSearch(value), 400)
  }

  // Validation
  const validateQuantity = (v) => {
    const n = Number(v)
    return !isNaN(n) && isFinite(n) && n > 0
  }

  // Cart Operations
  const addToCart = useCallback(() => {
    const qty = Number(quantity)

    if (!selectedProduct) {
      toast.error('Please select a product')
      return
    }
    
    if (!validateQuantity(quantity)) {
      toast.error('Please enter a valid quantity (minimum 1)')
      return
    }

    const product = stockData?.data?.find(item => String(item?._id) === String(selectedProduct))
    
    if (!product) {
      toast.error('Product not found')
      return
    }

    const available = Number(product.quantity ?? product.qty ?? 0)
    const existingIndex = cart.findIndex(c => String(c.productId) === String(selectedProduct))

    if (existingIndex >= 0) {
      setCart(prev => {
        const copy = [...prev]
        const newQty = copy[existingIndex].quantity + qty
        
        if (newQty > available) {
          toast.error(`Total quantity would exceed available stock. Available: ${available}`)
          return prev
        }
        
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: newQty,
          total: copy[existingIndex].unitPrice * newQty,
        }
        return copy
      })
    } else {
      if (qty > available) {
        toast.error(`Not enough stock. Available: ${available}`)
        return
      }
      
      const unitPrice = Number(product.sellingPrice ?? product.selling_price ?? 0)
      const cartItem = {
        productId: product._id,
        productName: product.productName ?? product.name,
        unitPrice,
        quantity: qty,
        total: unitPrice * qty,
        description: product.description,
        availableStock: available
      }
      setCart(prev => [...prev, cartItem])
    }

    setSelectedProduct('')
    setQuantity('1')
    toast.success('Product added to cart')
  }, [selectedProduct, quantity, stockData?.data, cart])

  const updateCartQuantity = (productId, newQty) => {
    if (!newQty || Number(newQty) < 1) return
    
    setCart(prev => {
      const copy = [...prev]
      const idx = copy.findIndex(c => String(c.productId) === String(productId))
      
      if (idx === -1) return prev
      
      const item = copy[idx]
      const available = Number(item.availableStock || 0)
      
      if (Number(newQty) > available) {
        toast.error(`Exceeds available stock (${available})`)
        return prev
      }
      
      copy[idx] = {
        ...item,
        quantity: Number(newQty),
        total: Number(item.unitPrice) * Number(newQty)
      }
      return copy
    })
  }

  const removeItem = (productId) => {
    setCart(prev => prev.filter(c => String(c.productId) !== String(productId)))
    toast.success('Item removed from cart')
  }

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = cart.reduce((s, it) => s + (Number(it.total) || 0), 0)
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * (Number(discountValue) || 0) / 100) 
      : (Number(discountValue) || 0)
    const taxable = Math.max(0, subtotal - discountAmount)
    const taxAmount = taxType === 'percentage' 
      ? (taxable * (Number(taxValue) || 0) / 100) 
      : (Number(taxValue) || 0)
    const grandTotal = Math.max(0, taxable + taxAmount)

    return { subtotal, discountAmount, taxable, taxAmount, grandTotal }
  }, [cart, discountType, discountValue, taxType, taxValue])

  // Submit Sale
  const handleCreateSale = async () => {
    if (!customer) {
      toast.error('Please select a customer')
      return
    }
    
    if (cart.length === 0) {
      toast.error('Add products to cart')
      return
    }

    const payload = {
      customerId: customerDetails._id || customerDetails.id,
      items: cart.map(i => ({
        stockId: i.productId,
        quantity: i.quantity,
        price: i.unitPrice,
        total: i.total
      })),
      subTotal: calculations.subtotal,
      tax: calculations.taxAmount,
      taxType,
      discount: calculations.discountAmount,
      discountType,
      grandTotal: calculations.grandTotal
    }

    try {
      await createSale.mutateAsync(payload)
      // toast.success('Sale created successfully!')
      setCart([])
      setCustomer(null)
      setCustomerDetails({})
      setDiscountValue(0)
      setTaxValue(0)
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.message || 'Error creating sale')
    }
  }

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Product Selection Section */}
      <Card className="p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Create New Sale</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Add products and complete the transaction</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Customer/Supplier Selection */}
          <div className="space-y-2">
            <RadioGroup 
              size="sm" 
              label="Select Type" 
              orientation="horizontal" 
              value={cusSupplierMode} 
              onValueChange={setCusSupplierMode}
              classNames={{ label: 'text-xs font-semibold text-gray-700 dark:text-gray-300' }}
            >
              <Radio value="customer">Customer</Radio>
              <Radio value="supplier">Supplier</Radio>
            </RadioGroup>
            <SupplierCustomerAutocomplete 
              label={`Select ${cusSupplierMode === 'customer' ? 'Customer' : 'Supplier'}`}
              type={cusSupplierMode}
              placeholder={`Search ${cusSupplierMode}...`}
              variant="bordered"
              size="sm"
              userData={(userdata) => setCustomerDetails(userdata)}
              onSelectChange={(it) => setCustomer(it)} 
              startContent={<User className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Product Selection */}
          <Autocomplete
            size="sm"
            variant="bordered"
            onInputChange={handleSearchStockProduct}
            defaultItems={stockData?.data || []}
            selectedKey={selectedProduct}
            onSelectionChange={(key) => setSelectedProduct(key)}
            label="Select Product"
            placeholder="Search products..."
            isLoading={loadingStock}
            startContent={<Package className="w-4 h-4 text-gray-400" />}
          >
            {(item) => (
              <AutocompleteItem key={item?._id} textValue={item?.productName}>
                <div className="flex justify-between items-center py-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item?.productName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-300 line-clamp-1">{item?.description}</span>
                    <span className="text-xs text-green-600 font-medium mt-1">
                      Stock: {item?.quantity || 0} | {formatCurrency(item?.sellingPrice || 0)}
                    </span>
                  </div>
                </div>
              </AutocompleteItem>
            )}
          </Autocomplete>

          {/* Add to Cart Button */}
          <Button 
            color="primary" 
            size="lg"
            onClick={addToCart} 
            startContent={<Plus className="w-5 h-5" />}
            className="self-end font-semibold"
          >
            Add To Cart
          </Button>
        </div>
      </Card>

      {/* Invoice Layout */}
      <Card className="shadow-2xl border-2 border-gray-200 dark:border-gray-700 ">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Calendar className="w-4 h-4" />
                <span>Date: {currentDate}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Invoice #</div>
              <div className="text-2xl font-bold">---</div>
            </div>
          </div>
        </div>

        {/* Bill To / Bill From Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 border-b-2 border-gray-200 dark:border-gray-700">
          {/* Bill From (Your Company) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bill From</h3>
            </div>
            <div className="space-y-2">
              <div className="text-xl font-bold">Your Company Name</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>123 Business Street, City, State 12345</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@yourcompany.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To (Customer) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bill To</h3>
            </div>
            {customer && customerDetails ? (
              <div className="space-y-2">
                <div className="text-xl font-bold">{customerDetails.name}</div>
                {customerDetails.companyName && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{customerDetails.companyName}</div>
                )}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {customerDetails.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {[customerDetails.address.street, customerDetails.address.city, customerDetails.address.state, customerDetails.address.zipCode, customerDetails.address.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {customerDetails.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{customerDetails.phone}</span>
                    </div>
                  )}
                  {customerDetails.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{customerDetails.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Credit Limit: </span>
                    <span className="font-semibold text-green-600">{formatCurrency(customerDetails.creditLimit || 0)}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Balance: </span>
                    <span className="font-semibold text-blue-600">{formatCurrency(customerDetails.currentBalance || 0)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500 italic h-32 flex items-center">
                Please select a customer to continue
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-2 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Item Description</th>
                  <th className="text-center py-3 px-2 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Available</th>
                  <th className="text-center py-3 px-2 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                  <th className="text-right py-3 px-2 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Unit Price</th>
                  <th className="text-right py-3 px-2 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total</th>
                  <th className="text-center py-3 px-2 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No items added yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Add products to create the invoice</p>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, index) => (
                    <tr key={item.productId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-4 px-2">
                        <div>
                          <div className="font-semibold text-sm">{item.productName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.description}</div>
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                          {item.availableStock}
                        </span>
                      </td>
                      <td className="text-center py-4 px-2">
                        <Input 
                          type="number" 
                          min={1} 
                          max={item.availableStock}
                          size="sm" 
                          variant="bordered"
                          value={item.quantity} 
                          onChange={(e) => updateCartQuantity(item.productId, e.target.value)} 
                          className="w-20 mx-auto"
                          classNames={{ 
                            input: 'text-center font-semibold'
                          }}
                        />
                      </td>
                      <td className="text-right py-4 px-2 font-medium">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right py-4 px-2 font-bold text-primary">{formatCurrency(item.total)}</td>
                      <td className="text-center py-4 px-2">
                        <Button 
                          color="danger" 
                          size="sm" 
                          variant="light" 
                          isIconOnly 
                          onPress={() => removeItem(item.productId)} 
                          aria-label="Remove item"
                        >
                          <Trash size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 pt-0">
          {/* Left side - Additional controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Discount</label>
              <Input 
                type="number" 
                min={0}
                variant="bordered"
                size="lg"
                startContent={
                  <div className="flex gap-x-2">
                    <Button 
                      variant={discountType === 'percentage' ? 'flat' : 'bordered'} 
                      isIconOnly 
                      size="sm" 
                      onPress={() => setDiscountType('percentage')} 
                      className={discountType === 'percentage' ? 'text-primary font-bold' : 'text-gray-400'}
                    >
                      %
                    </Button>
                    <Button 
                      variant={discountType === 'fixed' ? 'flat' : 'bordered'} 
                      isIconOnly 
                      size="sm" 
                      onPress={() => setDiscountType('fixed')} 
                      className={discountType === 'fixed' ? 'text-primary font-bold' : 'text-gray-400'}
                    >
                      ₹
                    </Button>
                  </div>
                }
                value={discountValue} 
                onChange={(e) => setDiscountValue(e.target.value)} 
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Tax</label>
              <Input 
                type="number" 
                min={0}
                variant="bordered"
                size="lg"
                startContent={
                  <div className="flex gap-x-2">
                    <Button 
                      variant={taxType === 'percentage' ? 'flat' : 'bordered'} 
                      isIconOnly 
                      size="sm" 
                      onPress={() => setTaxType('percentage')} 
                      className={taxType === 'percentage' ? 'text-primary font-bold' : 'text-gray-400'}
                    >
                      %
                    </Button>
                    <Button 
                      variant={taxType === 'fixed' ? 'flat' : 'bordered'} 
                      isIconOnly 
                      size="sm" 
                      onPress={() => setTaxType('fixed')} 
                      className={taxType === 'fixed' ? 'text-primary font-bold' : 'text-gray-400'}
                    >
                      ₹
                    </Button>
                  </div>
                }
                value={taxValue} 
                onChange={(e) => setTaxValue(e.target.value)} 
                placeholder="0"
              />
            </div>
          </div>

          {/* Right side - Totals */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Subtotal</span>
              <span className="text-lg font-bold">{formatCurrency(calculations.subtotal)}</span>
            </div>

            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Discount</span>
              <span className="text-lg font-bold text-red-600">-{formatCurrency(calculations.discountAmount)}</span>
            </div>

            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Tax</span>
              <span className="text-lg font-bold text-green-600">+{formatCurrency(calculations.taxAmount)}</span>
            </div>

            <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 rounded-lg border-2 border-primary/30">
              <span className="text-lg font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Total Amount</span>
              <span className="text-3xl font-bold text-primary">{formatCurrency(calculations.grandTotal)}</span>
            </div>

            <Button 
              color="primary" 
              size="lg"
              onPress={handleCreateSale} 
              isLoading={createSale.isLoading}
              isDisabled={cart.length === 0 || !customer}
              // className="w-full font-bold text-lg py-6"
              startContent={<Receipt className="w-6 h-6" />}
            >
              Generate Bill
            </Button>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold mb-1">Thank you for your business!</p>
            <p className="text-xs">If you have any questions, please contact us.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SalesForm