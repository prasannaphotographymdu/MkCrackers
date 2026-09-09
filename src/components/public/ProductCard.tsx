import React from 'react';
import { Minus, Plus, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { formatINR } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onUpdateQuantity: (productId: string, newQty: number) => void;
  viewMode?: 'grid' | 'list';
}

console.log("ProductCard loaded version 2");
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onUpdateQuantity,
  viewMode = 'grid'
}) => {
  const isOutOfStock = product.currentStock === 0;
  const isLowStock = product.currentStock > 0 && product.currentStock <= product.lowStockLimit;

  const discountPercent = product.discountPercent !== undefined ? product.discountPercent : 50;
  const discountedPrice = discountPercent > 0 ? product.sellingPrice * (1 - discountPercent / 100) : product.sellingPrice;

  const handleIncrement = () => {
    if (isOutOfStock) return;
    if (quantity >= product.currentStock) return;
    onUpdateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity <= 0) return;
    onUpdateQuantity(product.id, quantity - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOutOfStock) return;
    const val = parseInt(e.target.value) || 0;
    const clamped = Math.max(0, Math.min(val, product.currentStock));
    onUpdateQuantity(product.id, clamped);
  };

  // Compact List View Mode
  if (viewMode === 'list') {
    return (
      <div
        className={`group flex items-center justify-between gap-2 bg-white border rounded-lg p-2 sm:p-2.5 transition-all duration-150 hover:shadow-sm ${
          isOutOfStock
            ? 'border-slate-200 opacity-70 bg-slate-50'
            : 'border-slate-200 hover:border-red-400'
        } ${quantity > 0 ? 'bg-red-50/30 border-red-300 ring-1 ring-red-200' : ''}`}
      >
        {/* Left: Thumbnail & Main Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            <img
              src={product.image || undefined}
              alt={product.name}
              className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
              loading="lazy"
            />
            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-mono text-slate-200 text-center py-0.2">
              {product.sku}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                {product.name}
              </h3>
              {isOutOfStock ? (
                <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[9px] font-bold uppercase shrink-0">
                  Out
                </span>
              ) : null}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{product.itemsPerPack}</span>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                {discountPercent > 0 ? (
                  <>
                    <span className="font-mono font-semibold text-slate-400 line-through text-[10px]">
                      {formatINR(product.sellingPrice)}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 text-xs">
                      {formatINR(discountedPrice)}
                    </span>
                  </>
                ) : (
                  <span className="font-mono font-bold text-emerald-600 text-xs">
                    {formatINR(discountedPrice)}
                  </span>
                )}
                {quantity > 0 && (
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 ml-1">
                    Sub: {formatINR(discountedPrice * quantity)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quantity Selector */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-md border border-slate-200">
          <button
            onClick={handleDecrement}
            disabled={isOutOfStock || quantity <= 0}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            type="number"
            min="0"
            max={product.currentStock}
            value={quantity}
            onChange={handleInputChange}
            disabled={isOutOfStock}
            className="w-8 sm:w-10 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none disabled:opacity-40 bg-transparent"
          />

          <button
            onClick={handleIncrement}
            disabled={isOutOfStock || quantity >= product.currentStock}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm active:scale-95"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Grid View Mode (Default)
  return (
    <div
      className={`group relative flex flex-col justify-between bg-white border rounded-md p-2.5 transition-all duration-200 hover:shadow-md ${
        isOutOfStock
          ? 'border-slate-200 opacity-75 bg-slate-50'
          : 'border-slate-200 hover:border-red-500'
      } ${quantity > 0 ? 'ring-1 ring-red-400 border-red-300' : ''}`}
    >
      {/* Top Image & Badges Container */}
      <div>
        <div className="relative aspect-video sm:aspect-[4/3] w-full rounded-sm overflow-hidden bg-slate-100 mb-2 border border-slate-200">
          <img
            src={product.image || undefined}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              isOutOfStock ? 'grayscale opacity-50' : ''
            }`}
            loading="lazy"
          />

          {/* SKU Badge */}
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold text-slate-100">
            {product.sku}
          </div>

          <div className="absolute top-1.5 right-1.5">
            {isOutOfStock ? (
              <span className="px-1.5 py-0.5 rounded bg-red-100 border border-red-300 text-red-800 text-[10px] font-bold uppercase tracking-wider">
                Out of Stock
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                In Stock ({product.currentStock})
              </span>
            )}
          </div>

          {/* Items Per Pack overlay tag */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center px-2 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-200 backdrop-blur-sm">
            <span className="flex items-center gap-1 font-bold text-amber-300">
              <Package className="w-3 h-3 text-amber-400" /> {product.itemsPerPack}
            </span>
            <span className="text-[9px] text-slate-300 uppercase font-semibold">B2B Pack</span>
          </div>
        </div>

        {/* Product Details */}
        <h3 className="font-bold text-xs text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 min-h-[28px] leading-tight">
          {product.description || 'Direct Sivakasi factory standard quality firecracker.'}
        </p>
      </div>

      {/* Pricing & Quantity Selector */}
      <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block font-medium uppercase">Wholesale Rate</span>
            <div className="flex items-baseline gap-1">
              {discountPercent > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-400 line-through font-mono">
                    {formatINR(product.sellingPrice)}
                  </span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    {formatINR(discountedPrice)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-black text-emerald-600 font-mono">
                  {formatINR(discountedPrice)}
                </span>
              )}
              <span className="text-[9px] text-slate-400 font-medium">+18% GST</span>
            </div>
          </div>
          {quantity > 0 && (
            <div className="text-right">
              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Subtotal</span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {formatINR(discountedPrice * quantity)}
              </span>
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-50 p-1 rounded border border-slate-200">
          <button
            onClick={handleDecrement}
            disabled={isOutOfStock || quantity <= 0}
            className="w-7 h-7 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors active:scale-95"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            type="number"
            min="0"
            max={product.currentStock}
            value={quantity}
            onChange={handleInputChange}
            disabled={isOutOfStock}
            className="w-10 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none disabled:opacity-40"
          />

          <button
            onClick={handleIncrement}
            disabled={isOutOfStock || quantity >= product.currentStock}
            className="w-7 h-7 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm active:scale-95"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
