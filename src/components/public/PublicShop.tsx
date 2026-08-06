import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Flame,
  CheckCircle,
  AlertCircle,
  Filter,
  Layers,
  LayoutGrid,
  List
} from 'lucide-react';
import { Category, Product, CartItem, ShopDetails } from '../../types';
import { ProductCard } from './ProductCard';
import { formatINR } from '../../lib/utils';
import { Phone, MessageCircle, Mail, MapPin, Building2, ShieldCheck } from 'lucide-react';

interface PublicShopProps {
  categories: Category[];
  products: Product[];
  cart: { [productId: string]: number };
  onUpdateCartQty: (productId: string, qty: number) => void;
  onProceedToCheckout: () => void;
  onClearCart: () => void;
  shopDetails?: ShopDetails;
}

export const PublicShop: React.FC<PublicShopProps> = ({
  categories,
  products,
  cart,
  onUpdateCartQty,
  onProceedToCheckout,
  onClearCart,
  shopDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [expandedCategories, setExpandedCategories] = useState<{ [catId: string]: boolean }>({});

  const minOrderAmount = shopDetails?.minimumOrderAmount ?? 500;
  const companyName = shopDetails?.name || 'Sri Laxmi Fireworks';
  const tagline = shopDetails?.tagline || 'B2B Firecrackers Wholesale Price List';
  const phone = shopDetails?.phone || '+91 98421 99887';
  const whatsapp = shopDetails?.whatsapp || '+91 98421 99887';
  const email = shopDetails?.email || 'sales@srilaxmifireworks.com';
  const address = shopDetails?.address || '124 Factory Bypass Road, Sivakasi';
  const cityState = shopDetails?.cityState || 'Sivakasi, Tamil Nadu';
  const gstin = shopDetails?.gstin || '33AAAAA0000A1Z5';

  // Calculate totals
  const { totalItems, totalAmount, cartItemsList } = useMemo(() => {
    let items = 0;
    let amount = 0;
    const list: CartItem[] = [];

    Object.entries(cart).forEach(([prodId, qty]) => {
      const q = Number(qty);
      if (q > 0) {
        const product = products.find((p) => p.id === prodId);
        if (product) {
          items += q;
          amount += product.sellingPrice * q;
          list.push({ product, qty: q });
        }
      }
    });

    return { totalItems: items, totalAmount: amount, cartItemsList: list };
  }, [cart, products]);

  // Toggle single category collapse/expand
  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: prev[catId] === false ? true : false
    }));
  };

  // Expand / Collapse All
  const expandAll = () => {
    const allExpanded: { [catId: string]: boolean } = {};
    categories.forEach((c) => {
      allExpanded[c.id] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: { [catId: string]: boolean } = {};
    categories.forEach((c) => {
      allCollapsed[c.id] = false;
    });
    setExpandedCategories(allCollapsed);
  };

  // Filter products by search & active category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'active') return false;

      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Group filtered products by Category
  const groupedProducts = useMemo(() => {
    const map: { [catId: string]: Product[] } = {};

    categories.forEach((cat) => {
      map[cat.id] = filteredProducts.filter((p) => p.categoryId === cat.id);
    });

    return map;
  }, [categories, filteredProducts]);

  const minOrderMet = totalAmount >= minOrderAmount;
  const progressPercent = Math.min(100, (totalAmount / Math.max(1, minOrderAmount)) * 100);

  return (
    <div className="pb-24 sm:pb-28 min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 py-3 sm:py-4 px-3 sm:px-6 text-white shadow-inner">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/30 border border-red-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> SIVAKASI DIRECT FACTORY WHOLESALE
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug uppercase">
              {companyName}
            </h2>
            <p className="text-slate-300 text-xs mt-0.5 max-w-xl hidden xs:block">
              {tagline} | Minimum order ₹{minOrderAmount}.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto text-center">
            <div className="bg-slate-800/90 border border-slate-700/80 p-1.5 sm:p-2 rounded">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium uppercase">Min Order</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">₹{minOrderAmount}</span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 p-1.5 sm:p-2 rounded">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium uppercase">Categories</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">{categories.length} Types</span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 p-1.5 sm:p-2 rounded">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium uppercase">GSTIN</span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400">{gstin.slice(0, 10)}...</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 mt-3 sm:mt-4">
        {/* Search Bar & Category Filter Controls */}
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 sm:p-3 shadow-xs mb-3 sm:mb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
            {/* Search Input & View Switcher */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search firecrackers by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-red-500 transition-colors placeholder:text-slate-400"
                />
              </div>

              {/* View Mode Switcher Toggle (Grid vs List) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'list'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Compact List View for Fast Quick Ordering"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">List</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Grid</span>
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs no-scrollbar">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold uppercase shrink-0">
                <Filter className="w-3 h-3 text-red-600" /> Filter:
              </div>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All ({products.filter((p) => p.status === 'active').length})
              </button>
              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.categoryId === cat.id && p.status === 'active'
                ).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors shrink-0 ${
                      selectedCategory === cat.id
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Accordion Controls */}
            <div className="flex items-center gap-1.5 text-xs shrink-0 self-end md:self-auto">
              <button
                onClick={expandAll}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 text-[11px] font-semibold"
              >
                <ChevronDown className="w-3.5 h-3.5 text-red-600" /> Open All
              </button>
              <button
                onClick={collapseAll}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 text-[11px] font-semibold"
              >
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> Close All
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Categories & Product Catalog */}
        <div className="space-y-3 sm:space-y-4">
          {categories.map((cat) => {
            const catProducts = groupedProducts[cat.id] || [];
            if (catProducts.length === 0 && (searchTerm || selectedCategory !== 'all')) {
              return null; // Hide empty categories when filtering
            }

            const isExpanded = expandedCategories[cat.id] !== false; // default ALL categories OPEN

            return (
              <div
                key={cat.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs transition-all"
              >
                {/* Category Header Accordion Bar */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-left border-b border-slate-200"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="p-1 sm:p-1.5 rounded bg-red-600 text-white shadow-xs">
                      <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        {cat.name}
                        <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[10px] font-mono font-bold border border-red-200">
                          {catProducts.length} items
                        </span>
                      </h3>
                      {cat.description && (
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-red-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Products Container for this category */}
                {isExpanded && (
                  <div className="p-2 sm:p-4">
                    {catProducts.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        No active products available in this category.
                      </div>
                    ) : viewMode === 'list' ? (
                      <div className="space-y-1.5">
                        {catProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            quantity={cart[product.id] || 0}
                            onUpdateQuantity={onUpdateCartQty}
                            viewMode="list"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                        {catProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            quantity={cart[product.id] || 0}
                            onUpdateQuantity={onUpdateCartQty}
                            viewMode="grid"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-xs">
              <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900">No products found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for another keyword or clear your category filter.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Redesigned Compact Mobile & Desktop Sticky Footer Bar */}
      <div id="root-selected-footer" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2.5 py-2 text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Order Summary & Progress */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative p-1.5 sm:p-2 rounded-lg bg-red-600 text-white shadow-xs shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-mono font-black flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="text-base sm:text-xl font-black text-amber-400 font-mono leading-none">
                  {formatINR(totalAmount)}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-300 font-medium truncate">
                  ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
              </div>

              {/* Compact Min Order Status Line */}
              <div className="flex items-center gap-1 text-[10px] mt-0.5">
                {minOrderMet ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Min Order Met
                  </span>
                ) : (
                  <span className="text-amber-300 font-medium truncate">
                    Min ₹{minOrderAmount} (Add <b className="font-mono text-amber-200">{formatINR(minOrderAmount - totalAmount)}</b>)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {totalItems > 0 && (
              <button
                onClick={onClearCart}
                className="px-2 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors text-[11px] font-semibold"
              >
                Clear
              </button>
            )}

            <button
              onClick={onProceedToCheckout}
              disabled={!minOrderMet}
              className={`px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all ${
                minOrderMet
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900 active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
