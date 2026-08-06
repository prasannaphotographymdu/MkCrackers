import React from 'react';
import { Flame, ShieldCheck, ShoppingBag, PhoneCall, Sparkles, LogOut, LayoutDashboard, Home, Truck } from 'lucide-react';
import { ShopDetails } from '../types';
import { formatINR } from '../lib/utils';

interface HeaderProps {
  currentView: 'landing' | 'shop' | 'admin';
  onChangeView: (view: 'landing' | 'shop' | 'admin') => void;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin?: () => void;
  onAdminLogout: () => void;
  cartTotalItems: number;
  cartTotalAmount: number;
  onOpenCart: () => void;
  onOpenTracker?: () => void;
  shopDetails?: ShopDetails;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onAdminLogout,
  cartTotalItems,
  cartTotalAmount,
  onOpenCart,
  onOpenTracker,
  shopDetails
}) => {
  const companyName = shopDetails?.name || 'Sri Laxmi Fireworks';
  const phone = shopDetails?.phone || '+91 98421 99887';
  const gstin = shopDetails?.gstin || '33AAAAA0000A1Z5';
  const minOrder = shopDetails?.minimumOrderAmount ?? 500;
  const tagline = shopDetails?.tagline || 'Direct Manufacturer & Bulk Supplier';

  return (
    <header className="sticky top-0 z-40 bg-red-600 text-white shadow-sm border-b border-red-700 text-xs select-none">
      {/* Top Compact Banner Bar */}
      <div className="bg-red-700/90 px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] text-white font-medium flex justify-between items-center border-b border-red-800">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span className="truncate">Sivakasi Wholesale | <b className="text-amber-200">Min ₹{minOrder}</b></span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-red-100 shrink-0">
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 text-amber-200 hover:underline">
            <PhoneCall className="w-3 h-3 text-amber-300" /> <span className="hidden xs:inline">B2B:</span> {phone}
          </a>
          <span className="hidden md:inline font-mono bg-red-800/80 px-1.5 py-0.5 rounded text-[10px]">GSTIN: {gstin}</span>
        </div>
      </div>

      {/* Main Header Nav */}
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChangeView('landing')}>
          <div className="p-1 rounded bg-red-800 border border-red-500/50 flex items-center justify-center">
            <Flame className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white uppercase">
                {companyName}
              </h1>
              <span className="bg-red-800 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-red-500/40">
                SIVAKASI B2B
              </span>
            </div>
            <p className="text-[10px] text-red-100 hidden sm:block truncate max-w-xs">
              {tagline}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Main Navigation Tabs */}
          <button
            onClick={() => onChangeView('landing')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold text-xs transition-all ${
              currentView === 'landing'
                ? 'bg-red-800 text-amber-300 border border-red-500/60 shadow-inner'
                : 'text-red-100 hover:bg-red-700'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Home</span>
          </button>

          <button
            onClick={() => onChangeView('shop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs transition-all ${
              currentView === 'shop'
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md'
                : 'bg-red-700 text-white hover:bg-red-800 border border-red-500/50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Online Store</span>
          </button>

          {onOpenTracker && (
            <button
              onClick={onOpenTracker}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-800 hover:bg-red-900 border border-amber-300/60 text-amber-300 font-bold text-xs transition-all shadow-sm"
              title="Track your firecrackers order status"
            >
              <Truck className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Track Order</span>
            </button>
          )}

          {/* Cart Pill for Customer View */}
          {currentView === 'shop' && (
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-2.5 py-1 rounded bg-red-800 hover:bg-red-900 border border-amber-400/60 text-white shadow-sm transition-all"
            >
              <div className="text-left hidden md:block">
                <div className="text-[9px] uppercase font-bold text-amber-300 leading-none">
                  Cart Enquiry
                </div>
                <div className="text-xs font-mono font-bold text-white">
                  {cartTotalItems} items | {formatINR(cartTotalAmount)}
                </div>
              </div>
              <span className="md:hidden flex items-center justify-center px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-bold text-[10px]">
                {cartTotalItems}
              </span>
            </button>
          )}

          {/* Admin Controls (Only when admin is logged in or on admin view) */}
          {isAdminLoggedIn && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onChangeView(currentView === 'admin' ? 'landing' : 'admin')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold text-xs transition-all ${
                  currentView === 'admin'
                    ? 'bg-slate-900 text-amber-300 border border-slate-700'
                    : 'bg-red-800 text-white hover:bg-red-900 border border-red-500/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </button>

              <button
                onClick={onAdminLogout}
                title="Logout Admin"
                className="p-1 rounded bg-red-800 hover:bg-red-900 text-red-100 hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

