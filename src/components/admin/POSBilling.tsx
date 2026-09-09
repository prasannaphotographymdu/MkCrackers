import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Phone,
  Tag,
  CheckCircle2,
  Printer,
  Sparkles,
  Layers,
  Flame,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { Product, Category, ShopDetails, OfflineOrder, PaymentMode, Invoice } from '../../types';
import { formatINR } from '../../lib/utils';
import { POSReceiptModal } from './POSReceiptModal';

interface POSBillingProps {
  products: Product[];
  categories: Category[];
  shopDetails: ShopDetails;
  offlineOrders?: OfflineOrder[];
  invoices?: Invoice[];
  onCreateOfflineOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    items: { productId: string; qty: number; unitPrice: number }[];
    paymentMode: PaymentMode;
    cashAmount?: number;
    upiAmount?: number;
    upiRefNo?: string;
    discountAmount?: number;
    isGstBill?: boolean;
  }) => Promise<OfflineOrder>;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const POSBilling: React.FC<POSBillingProps> = ({
  products = [],
  categories = [],
  shopDetails,
  offlineOrders = [],
  invoices = [],
  onCreateOfflineOrder,
  onShowToast
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Cart State for POS
  const [cartItems, setCartItems] = useState<
    { product: Product; qty: number; unitPrice: number }[]
  >([]);

  // Customer Details & Payment
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [upiAmountInput, setUpiAmountInput] = useState<string>('');
  const [upiRefNo, setUpiRefNo] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed order for receipt popup
  const [completedOrder, setCompletedOrder] = useState<OfflineOrder | null>(null);
  
  // GST Temp Toggle
  const [isGstBill, setIsGstBill] = useState(false);

  // Manual Item Entry State
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemSku, setManualItemSku] = useState('');
  const [manualItemHsn, setManualItemHsn] = useState('');
  const [manualItemQty, setManualItemQty] = useState('1');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [manualItemGst, setManualItemGst] = useState('18');

  // Compute product sales frequencies
  const productSalesCount = useMemo(() => {
    const counts: Record<string, number> = {};
    (offlineOrders || []).forEach(order => {
      order.items.forEach(item => {
        counts[item.productId] = (counts[item.productId] || 0) + item.qty;
      });
    });
    (invoices || []).forEach(inv => {
      inv.items.forEach(item => {
        counts[item.productId] = (counts[item.productId] || 0) + item.qty;
      });
    });
    return counts;
  }, [offlineOrders, invoices]);

  // Filter products (active only and with stock > 0 preferred)
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      if (p.status !== 'active') return false;
      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });

    if (search === '' && selectedCategory === 'all') {
      // Sort by highest purchased and keep only top 10
      filtered.sort((a, b) => (productSalesCount[b.id] || 0) - (productSalesCount[a.id] || 0));
      return filtered.slice(0, 10);
    }
    
    return filtered;
  }, [products, selectedCategory, search, productSalesCount]);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountInput);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [discountInput]);

  const grandTotal = useMemo(() => {
    return Math.max(0, Math.round(subtotal - discountAmount));
  }, [subtotal, discountAmount]);

  const cashReceived = parseFloat(cashAmountInput) || 0;
  const cashChangeToReturn = Math.max(0, cashReceived - grandTotal);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      onShowToast('error', 'Out of Stock', `${product.name} has no available stock.`);
      return;
    }

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx !== -1) {
        const currentQty = prev[existingIdx].qty;
        if (currentQty >= product.currentStock) {
          onShowToast('error', 'Stock Limit', `Maximum available stock is ${product.currentStock}.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: currentQty + 1
        };
        return updated;
      }
      return [...prev, { product, qty: 1, unitPrice: product.discountPercent !== undefined ? (product.discountPercent > 0 ? product.sellingPrice * (1 - product.discountPercent / 100) : product.sellingPrice) : (product.sellingPrice * 0.5) }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            if (newQty > item.product.currentStock) {
              onShowToast('error', 'Stock Limit', `Maximum stock available is ${item.product.currentStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; qty: number; unitPrice: number }[];
    });
  };

  const handleUpdatePrice = (productId: string, newPrice: number) => {
    setCartItems((prev) => {
      return prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, unitPrice: Math.max(0, newPrice) };
        }
        return item;
      });
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleAddManualItem = () => {
    const qty = parseInt(manualItemQty) || 1;
    const price = parseFloat(manualItemPrice) || 0;
    const gst = parseFloat(manualItemGst) || 0;
    const name = manualItemName.trim() || 'Custom Item';

    if (price <= 0) {
      onShowToast('error', 'Invalid Price', 'Please enter a valid unit price.');
      return;
    }

    const customProduct: Product = {
      hsnCode: manualItemHsn.trim() || '36041000',
      id: `custom-${Date.now()}`,
      sku: manualItemSku.trim() || 'CUSTOM',
      name: name,
      description: 'Manually added POS item',
      categoryId: '',
      categoryName: 'Custom',
      image: '',
      purchasePrice: price,
      sellingPrice: price,
      discountPercent: 0,
      itemsPerPack: '1',
      gstPercent: gst,
      openingStock: 9999,
      currentStock: 9999,
      lowStockLimit: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    setCartItems((prev) => {
      return [...prev, { product: customProduct, qty, unitPrice: price }];
    });

    setManualItemName('');
    setManualItemSku('');
    setManualItemHsn('');
    setManualItemQty('1');
    setManualItemPrice('');
    setManualItemGst('18');
    setShowManualEntry(false);
  };

  const handleResetBill = () => {
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMode('Cash');
    setCashAmountInput('');
    setUpiAmountInput('');
    setUpiRefNo('');
    setDiscountInput('0');
    setIsGstBill(false);
    setShowManualEntry(false);
  };

  const handleCompleteOrder = async () => {
    if (cartItems.length === 0) {
      onShowToast('error', 'Empty Bill', 'Please add at least one product to the POS bill.');
      return;
    }

    if (paymentMode === 'Split') {
      const cash = parseFloat(cashAmountInput) || 0;
      const upi = parseFloat(upiAmountInput) || 0;
      if (cash + upi < grandTotal) {
        onShowToast('error', 'Split Amount Mismatch', `Combined Cash (₹${cash}) + UPI (₹${upi}) must equal total ₹${grandTotal}.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const processedItems = cartItems.map((it) => {
        const lineTotal = it.unitPrice * it.qty;
        const gstPercent = it.product.gstPercent || 18;
        const basePrice = lineTotal / (1 + gstPercent / 100);
        const itemGst = lineTotal - basePrice;
        return {
          productId: it.product.id,
          productName: it.product.name,
          sku: it.product.sku,
          hsnCode: it.product.hsnCode || '36041000',
          qty: it.qty,
          unitPrice: it.unitPrice,
          gstPercent,
          gstAmount: Number(itemGst.toFixed(2)),
          amount: lineTotal
        };
      });

      const calcSubtotal = processedItems.reduce((acc, i) => acc + (i.amount / (1 + i.gstPercent / 100)), 0);
      const calcGstTotal = processedItems.reduce((acc, i) => acc + i.gstAmount, 0);

      const newOrder = await onCreateOfflineOrder({
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        items: processedItems,
        subtotal: Number(calcSubtotal.toFixed(2)),
        gstAmount: Number(calcGstTotal.toFixed(2)),
        discountAmount,
        grandTotal,
        paymentMode,
        cashAmount: paymentMode === 'Cash' ? grandTotal : paymentMode === 'Split' ? parseFloat(cashAmountInput) || 0 : 0,
        upiAmount: paymentMode === 'UPI' ? grandTotal : paymentMode === 'Split' ? parseFloat(upiAmountInput) || 0 : 0,
        upiRefNo: upiRefNo.trim(),
        isGstBill
      });

      onShowToast('success', 'Bill Completed', `POS Invoice ${newOrder.billNumber} created successfully!`);
      setCompletedOrder(newOrder);
      handleResetBill();
    } catch (err: any) {
      onShowToast('error', 'POS Order Failed', err.message || 'Could not complete POS bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-5 rounded-2xl border border-amber-500/30 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wide text-amber-300">POS Counter Billing & Instant Receipt</h2>
            <p className="text-xs text-slate-300">Create walk-in offline bills, accept Cash/UPI payments, auto-deduct stock & print tax invoices.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetBill}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Counter</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Catalog, Right Cart/Bill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Picker (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Quick search firecracker by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Categories ({products.length})
              </button>
              {(categories || []).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {search === '' && selectedCategory === 'all' && (
            <div className="flex items-center justify-between mb-1 mt-2 px-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Top 10 Quick Select Items
              </h4>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inCart = cartItems.find((item) => item.product.id === p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => handleAddToCart(p)}
                  className={`bg-white p-3 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                    p.currentStock <= 0
                      ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                      : inCart
                      ? 'border-amber-500 ring-2 ring-amber-400/30 shadow-md'
                      : 'border-slate-200 hover:border-amber-400 hover:shadow-md'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                      {inCart.qty}
                    </span>
                  )}
                  <div>
                    <div className="aspect-video w-full mb-2 overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={p.image || undefined}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{p.sku}</div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                    <p className="text-[10px] text-slate-500">{p.itemsPerPack}</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {(() => {
                        const dp = p.discountPercent !== undefined ? p.discountPercent : 50;
                        const discountedPrice = dp > 0 ? p.sellingPrice * (1 - dp / 100) : p.sellingPrice;
                        return dp > 0 ? (
                          <>
                            <span className="text-xs font-extrabold text-emerald-600">{formatINR(discountedPrice)}</span>
                            <span className="text-[9px] text-slate-400 block line-through">{formatINR(p.sellingPrice)}</span>
                          </>
                        ) : (
                          <span className="text-xs font-extrabold text-slate-900">{formatINR(discountedPrice)}</span>
                        );
                      })()}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          p.currentStock <= 0
                            ? 'bg-red-100 text-red-700'
                            : p.currentStock <= p.lowStockLimit
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.currentStock <= 0 ? 'Out' : `${p.currentStock} left`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: POS Cart & Checkout Controls (5 Columns) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-lg flex flex-col justify-between space-y-5">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-base">Current POS Bill</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Custom Item
                </button>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  {cartItems.length} items
                </span>
              </div>
            </div>

            {/* Manual Entry Form */}
            {showManualEntry && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Item Name</label>
                    <input
                      type="text"
                      value={manualItemName}
                      onChange={(e) => setManualItemName(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      placeholder="Custom Product"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">SKU</label>
                    <input
                      type="text"
                      value={manualItemSku}
                      onChange={(e) => setManualItemSku(e.target.value.toUpperCase())}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      placeholder="CUSTOM"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">HSN Code</label>
                    <input
                      type="text"
                      value={manualItemHsn}
                      onChange={(e) => setManualItemHsn(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      placeholder="36041000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={manualItemQty}
                      onChange={(e) => setManualItemQty(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={manualItemPrice}
                      onChange={(e) => setManualItemPrice(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">GST %</label>
                    <select
                      value={manualItemGst}
                      onChange={(e) => setManualItemGst(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    >
                      <option value="0">0% (None)</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddManualItem}
                  className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 mt-1 hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" />
                  Add to Bill
                </button>
              </div>
            )}

            {/* Cart Items List */}
            <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100 my-3 pr-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Flame className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No products selected yet.</p>
                  <p className="text-[10px]">Click any product from left catalog to add to POS bill.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h5>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>SKU: {item.product.sku}</span>
                        <span>&bull;</span>
                        <div className="flex items-center gap-1">
                          <span>Price: ₹</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                            className="w-16 px-1 py-0.5 border border-slate-200 rounded text-[10px] font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-900">{item.qty}</span>
                      <button
                        onClick={() => handleUpdateQty(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[65px]">
                      <div className="text-xs font-extrabold text-slate-900">
                        {formatINR(item.unitPrice * item.qty)}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-[10px] text-red-500 hover:underline flex items-center justify-end gap-0.5 ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Details Input */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-500" />
                <span>Customer Info (Optional for walk-in)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>

            {/* Mode of Payment Selector */}
            <div className="mt-3 p-3 bg-amber-500/10 rounded-xl border border-amber-400/30 space-y-2">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Select Mode of Payment:</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('Cash')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMode === 'Cash'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>CASH</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMode === 'UPI'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('Split')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMode === 'Split'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>SPLIT</span>
                </button>
              </div>

              {/* Dynamic Inputs based on Payment Mode */}
              {paymentMode === 'Cash' && (
                <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Cash Tendered (₹):</label>
                    <input
                      type="number"
                      placeholder={`e.g. ${grandTotal}`}
                      value={cashAmountInput}
                      onChange={(e) => setCashAmountInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Change to Return:</label>
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 font-extrabold text-emerald-800">
                      {formatINR(cashChangeToReturn)}
                    </div>
                  </div>
                </div>
              )}

              {paymentMode === 'UPI' && (
                <div className="pt-2 space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <QrCode className="w-8 h-8 text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Shop UPI ID:</div>
                      <div className="font-extrabold text-slate-900">{shopDetails.upiId || 'srilaxmicrackers@upi'}</div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter UPI Transaction / Ref No. (Optional)"
                    value={upiRefNo}
                    onChange={(e) => setUpiRefNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                </div>
              )}

              {paymentMode === 'Split' && (
                <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Cash Portion (₹):</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={cashAmountInput}
                      onChange={(e) => setCashAmountInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">UPI Portion (₹):</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={upiAmountInput}
                      onChange={(e) => setUpiAmountInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subtotals & Generate Bill Button */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded-lg">
              <span className="text-xs font-bold text-red-900">Generate GST Bill</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGstBill}
                  onChange={(e) => setIsGstBill(e.target.checked)}
                  className="rounded border-red-300 text-red-600 focus:ring-red-500 w-4 h-4"
                />
              </label>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Counter Discount (₹):</span>
                <input
                  type="number"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-20 px-2 py-0.5 border border-slate-200 rounded text-right font-bold text-slate-900"
                />
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-black text-slate-900">
                <span>Final Payable:</span>
                <span className="text-amber-600 text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteOrder}
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wide shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? 'Processing Bill...' : 'Complete & Print POS Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* POS Receipt Modal on successful bill creation */}
      {completedOrder && (
        <POSReceiptModal
          order={completedOrder}
          shopDetails={shopDetails}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
};
