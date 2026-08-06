import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Upload,
  Download,
  Package,
  AlertCircle,
  X,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  Layers,
  Sparkles
} from 'lucide-react';
import { Product, Category } from '../../types';
import { formatINR, downloadCSV } from '../../lib/utils';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onCreateProduct: (prodData: Partial<Product>) => Promise<void>;
  onUpdateProduct: (id: string, prodData: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onBulkImportCSV: (items: any[]) => Promise<any>;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkImportCSV,
  onShowToast
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | ''>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [importStatus, setImportStatus] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    categoryId: categories[0]?.id || '',
    name: '',
    description: '',
    itemsPerPack: '1 Box',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 0,
    sellingPrice: 0,
    gstPercent: 18,
    openingStock: 100,
    currentStock: 100,
    lowStockLimit: 10,
    status: 'active'
  });

  const [formError, setFormError] = useState('');

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: `CRK-${Math.floor(100 + Math.random() * 900)}`,
      categoryId: categories[0]?.id || '',
      name: '',
      description: '',
      itemsPerPack: '1 Box (10 Pcs)',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
      purchasePrice: 50,
      sellingPrice: 100,
      gstPercent: 18,
      openingStock: 100,
      currentStock: 100,
      lowStockLimit: 10,
      status: 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Product Form Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.sku || !formData.sku.trim()) {
      setFormError('SKU is strictly required.');
      return;
    }

    if (!formData.name || !formData.name.trim()) {
      setFormError('Product Name is required.');
      return;
    }

    if (!formData.categoryId) {
      setFormError('Category is required.');
      return;
    }

    const cleanSKU = formData.sku.trim().toUpperCase();

    // Enforce SKU Uniqueness locally
    const existing = products.find(
      (p) => p.sku.toUpperCase() === cleanSKU && p.id !== editingProduct?.id
    );

    if (existing) {
      setFormError(`SKU "${cleanSKU}" is already assigned to "${existing.name}". SKU must be unique!`);
      return;
    }

    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, { ...formData, sku: cleanSKU });
        onShowToast('success', 'Product Updated', `${formData.name} updated successfully.`);
      } else {
        await onCreateProduct({ ...formData, sku: cleanSKU });
        onShowToast('success', 'Product Created', `${formData.name} added to catalog.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    }
  };

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // SKU Search
      if (skuFilter && !p.sku.toLowerCase().includes(skuFilter.toLowerCase().trim())) {
        return false;
      }

      // Name / Desc Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      // Stock filter
      if (stockFilter === 'out' && p.currentStock !== 0) return false;
      if (stockFilter === 'low' && (p.currentStock === 0 || p.currentStock > p.lowStockLimit)) return false;
      if (stockFilter === 'in' && p.currentStock <= p.lowStockLimit) return false;

      // Price filter
      if (maxPriceFilter !== '' && p.sellingPrice > Number(maxPriceFilter)) return false;

      return true;
    });
  }, [products, skuFilter, searchTerm, selectedCategory, statusFilter, stockFilter, maxPriceFilter]);

  // Handle CSV Sample Download
  const handleDownloadSampleCSV = () => {
    const sampleRows = [
      {
        sku: 'SAMPLE-101',
        category: 'Single Sound Crackers',
        name: '4" Deluxe Sound Boom',
        description: 'Heavy loud bang cracker',
        itemsPerPack: '1 Box (10 Pcs)',
        purchasePrice: 40,
        sellingPrice: 85,
        gstPercent: 18,
        currentStock: 200,
        lowStockLimit: 20,
        status: 'active'
      },
      {
        sku: 'SAMPLE-102',
        category: 'Flower Pots & Fountains',
        name: 'Golden Tri-Color Pot',
        description: 'Color fountain pot',
        itemsPerPack: '1 Box (5 Pcs)',
        purchasePrice: 90,
        sellingPrice: 180,
        gstPercent: 18,
        currentStock: 150,
        lowStockLimit: 15,
        status: 'active'
      }
    ];

    downloadCSV('firecracker_products_sample.csv', sampleRows);
    onShowToast('info', 'Sample CSV Downloaded', 'Use this format for bulk importing products.');
  };

  // Process CSV Text Import
  const handleProcessCSVImport = async () => {
    if (!csvRawText.trim()) return;

    try {
      // Simple CSV parser
      const lines = csvRawText.trim().split('\n');
      if (lines.length < 2) {
        setImportStatus({ errors: ['CSV must contain header row and at least 1 product data row.'] });
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const items: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        items.push(rowObj);
      }

      const result = await onBulkImportCSV(items);
      setImportStatus(result);
      onShowToast(
        'success',
        'Bulk Import Completed',
        `Added: ${result.addedCount}, Updated: ${result.updatedCount}, Skipped: ${result.skippedCount}`
      );
    } catch (err: any) {
      setImportStatus({ errors: [err.message || 'Error parsing CSV file'] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-3 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-red-600" /> Firecracker Product Catalog Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {products.length} Products registered in inventory across {categories.length} Categories.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setCsvRawText('');
              setImportStatus(null);
              setIsImportModalOpen(true);
            }}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs flex items-center gap-1 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-red-600" /> Bulk Import CSV
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Product
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-tight">
          <Filter className="w-3.5 h-3.5 text-red-600" /> Filter Catalog
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Instant Search */}
          <div>
            <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Search Name</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder="Product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* SKU Filter */}
          <div>
            <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Filter SKU</label>
            <input
              type="text"
              placeholder="e.g. SSC-001"
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Stock Status</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Product Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
            >
              <option value="all">Active & Inactive</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products High Density Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
              <tr>
                <th className="py-2 px-3">Image</th>
                <th className="py-2 px-3">SKU</th>
                <th className="py-2 px-3">Product Name</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Pack Info</th>
                <th className="py-2 px-3 text-right">Selling Price</th>
                <th className="py-2 px-3 text-center">Stock</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((p) => {
                const isOut = p.currentStock === 0;
                const isLow = p.currentStock > 0 && p.currentStock <= p.lowStockLimit;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-8 h-8 object-cover rounded bg-slate-100 border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80';
                        }}
                      />
                    </td>
                    <td className="py-1.5 px-3 font-mono font-bold text-red-700">{p.sku}</td>
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{p.description}</div>
                    </td>
                    <td className="py-1.5 px-3 text-slate-700 font-medium">
                      {p.categoryName || 'General'}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600">{p.itemsPerPack}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-red-700">
                      {formatINR(p.sellingPrice)}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                          isOut
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.currentStock} {isOut ? '(Out)' : isLow ? '(Low)' : ''}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                          p.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete product ${p.name}?`)) {
                              onDeleteProduct(p.id);
                              onShowToast('info', 'Deleted', `${p.name} removed.`);
                            }
                          }}
                          className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No products match current search and filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-md max-w-xl w-full my-6 p-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
              {editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add New Firecracker Product'}
            </h3>

            {formError && (
              <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* SKU */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    SKU (Unique Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CRK-001"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-red-700 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1000 Wala Heavy Deluxe Garland"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Description & Items Per Pack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Items Per Pack
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Box (10 Pcs)"
                    value={formData.itemsPerPack || ''}
                    onChange={(e) => setFormData({ ...formData, itemsPerPack: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Pricing & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchasePrice || 0}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sellingPrice || 0}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-red-700 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={formData.gstPercent !== undefined ? formData.gstPercent : 18}
                    onChange={(e) => setFormData({ ...formData, gstPercent: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Stock Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock !== undefined ? formData.currentStock : 100}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Low Stock Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lowStockLimit || 10}
                    onChange={(e) => setFormData({ ...formData, lowStockLimit: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm"
                >
                  Save Product Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-md max-w-xl w-full my-6 p-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-red-600" /> Bulk Product CSV Import
            </h3>

            <p className="text-xs text-slate-500 mb-3">
              Paste CSV contents below or download our sample template. Existing SKUs will be updated automatically.
            </p>

            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="text-xs text-red-700 hover:text-red-800 font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
              </button>
            </div>

            <textarea
              rows={7}
              placeholder={`sku,category,name,itemsPerPack,purchasePrice,sellingPrice,gstPercent,currentStock,lowStockLimit\nCRK-501,Single Sound Crackers,5 Inch Boom,1 Box,50,110,18,200,20`}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              className="w-full p-2.5 rounded bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-red-500 resize-none"
            />

            {importStatus && (
              <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                {importStatus.errors && importStatus.errors.length > 0 ? (
                  <div className="text-red-700 space-y-1">
                    <span className="font-bold block">Import Warnings/Errors:</span>
                    {importStatus.errors.map((err: string, i: number) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Import Success! Added: {importStatus.addedCount}, Updated: {importStatus.updatedCount}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleProcessCSVImport}
                disabled={!csvRawText.trim()}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
              >
                Import CSV Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
