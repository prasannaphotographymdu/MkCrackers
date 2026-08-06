import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  PackageX,
  Plus,
  Minus,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Product, Category } from '../../types';
import { formatINR } from '../../lib/utils';

interface InventoryManagementProps {
  products: Product[];
  categories: Category[];
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  products,
  categories,
  onUpdateStock,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Filtered Inventory Products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

    if (stockStatusFilter === 'low' && (p.currentStock === 0 || p.currentStock > p.lowStockLimit))
      return false;
    if (stockStatusFilter === 'out' && p.currentStock !== 0) return false;
    if (stockStatusFilter === 'in' && p.currentStock <= p.lowStockLimit) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase().trim();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }

    return true;
  });

  const lowStockCount = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.lowStockLimit
  ).length;

  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.currentStock * p.sellingPrice,
    0
  );

  const handleOpenAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    setNewStockVal(product.currentStock);
  };

  const handleSaveStock = async () => {
    if (!adjustingProduct) return;
    setIsSaving(true);
    try {
      await onUpdateStock(adjustingProduct.id, Math.max(0, newStockVal));
      onShowToast(
        'success',
        'Stock Updated',
        `${adjustingProduct.sku} stock updated to ${newStockVal}. Public website updated immediately!`
      );
      setAdjustingProduct(null);
    } catch (err: any) {
      onShowToast('error', 'Stock Update Failed', err.message || 'Could not update stock.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Total Inventory Value</span>
            <Boxes className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-mono font-black text-slate-900">
              {formatINR(totalInventoryValue)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Valued at wholesale rate</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-700 font-bold uppercase tracking-tight">Low Stock Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold text-amber-700">{lowStockCount} Products</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Stock ≤ Low Stock Limit</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-red-700 font-bold uppercase tracking-tight">Out of Stock Alert</span>
            <PackageX className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold text-red-700">{outOfStockCount} Products</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Quantity controls disabled in shop</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or Product Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock Only</option>
            <option value="in">Normal Stock Only</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
              <tr>
                <th className="py-2 px-3">SKU</th>
                <th className="py-2 px-3">Product Name</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3 text-center">Opening Stock</th>
                <th className="py-2 px-3 text-center">Current Stock</th>
                <th className="py-2 px-3 text-center">Low Limit</th>
                <th className="py-2 px-3 text-right">Stock Value (₹)</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((p) => {
                const isOut = p.currentStock === 0;
                const isLow = p.currentStock > 0 && p.currentStock <= p.lowStockLimit;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-3 font-mono font-bold text-red-700">{p.sku}</td>
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500">{p.itemsPerPack}</div>
                    </td>
                    <td className="py-1.5 px-3 text-slate-700">{p.categoryName || 'General'}</td>
                    <td className="py-1.5 px-3 text-center text-slate-600 font-mono">{p.openingStock}</td>
                    <td className="py-1.5 px-3 text-center font-bold font-mono text-slate-900">
                      {p.currentStock}
                    </td>
                    <td className="py-1.5 px-3 text-center text-slate-600 font-mono">{p.lowStockLimit}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-red-700">
                      {formatINR(p.currentStock * p.sellingPrice)}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOut
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenAdjustModal(p)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3 text-red-600" /> Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No products found matching stock filters.
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-fade-in">
          <div className="bg-white border border-slate-300 rounded-md max-w-sm w-full p-4 shadow-2xl relative text-slate-900">
            <h3 className="text-base font-bold text-slate-900 mb-0.5">
              Adjust Factory Stock: {adjustingProduct.sku}
            </h3>
            <p className="text-xs text-slate-500 mb-3">{adjustingProduct.name}</p>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mb-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Factory Stock:</span>
                <span className="font-bold font-mono text-slate-900">{adjustingProduct.currentStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Low Limit Trigger:</span>
                <span className="font-semibold font-mono text-amber-700">{adjustingProduct.lowStockLimit}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Set New Stock Quantity:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewStockVal(Math.max(0, newStockVal - 10))}
                  className="px-2.5 py-1.5 rounded bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 font-bold text-xs"
                >
                  -10
                </button>
                <input
                  type="number"
                  min="0"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(parseInt(e.target.value) || 0)}
                  className="w-full text-center px-2 py-1 rounded bg-slate-50 border border-slate-300 text-red-700 font-mono font-bold text-base focus:bg-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setNewStockVal(newStockVal + 10)}
                  className="px-2.5 py-1.5 rounded bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 font-bold text-xs"
                >
                  +10
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                disabled={isSaving}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Updating...' : 'Save Stock Quantity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
