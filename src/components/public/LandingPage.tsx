import React from 'react';
import {
  Flame,
  ShoppingBag,
  ShieldCheck,
  PhoneCall,
  MapPin,
  Mail,
  Truck,
  CheckCircle2,
  Sparkles,
  Zap,
  Award,
  Clock,
  Building2,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { ShopDetails, Category, Product } from '../../types';
import { formatINR } from '../../lib/utils';
import { SkyshotCanvas } from './SkyshotCanvas';

interface LandingPageProps {
  shopDetails: ShopDetails;
  categories: Category[];
  products: Product[];
  onGoToStore: () => void;
  onOpenAdminLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  shopDetails,
  categories,
  products,
  onGoToStore,
  onOpenAdminLogin
}) => {
  const companyName = shopDetails.name || 'Sri Laxmi Fireworks Wholesale';
  const tagline = shopDetails.tagline || 'Direct Sivakasi Factory Rates | Premium B2B Crackers';
  const phone = shopDetails.phone || '+91 98421 99887';
  const whatsapp = shopDetails.whatsapp || '+91 94431 22334';
  const email = shopDetails.email || 'sales@srilaxmifireworks.com';
  const address = shopDetails.address || '124 Factory Bypass Road, Sivakasi - 626123, Tamil Nadu';
  const gstin = shopDetails.gstin || '33AAAAA0000A1Z5';
  const minOrder = shopDetails.minimumOrderAmount ?? 500;

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-950 text-slate-100">
      {/* Hero Banner Section (Inspired by Vediworld Festive Design with Animated Skyshot Background) */}
      <section className="relative overflow-hidden bg-slate-950 border-b border-amber-500/40 py-16 px-4 sm:px-6">
        {/* Real Firework Background Image & HTML5 Skyshot Canvas */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=80"
            alt="Fireworks Festive Display"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-30 filter brightness-75 contrast-125"
          />
          {/* Realistic Physics Skyshot Canvas Layer */}
          <SkyshotCanvas className="opacity-85" />

          {/* Dual Overlay Gradient for High Contrast Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/75 to-slate-950"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.9)_100%)]"></div>
        </div>

        {/* Animated Firework Burst FX Layer 1 - Top Left Burst */}
        <div className="absolute top-6 left-6 sm:left-16 pointer-events-none z-0 opacity-70 animate-firework-1">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-amber-400/20 blur-xl animate-pulse-glow"></div>
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-amber-300 fill-none stroke-[1.5]">
              <path d="M50 10 L50 90 M10 50 L90 50 M22 22 L78 78 M22 78 L78 22" strokeDasharray="4 3" />
              <circle cx="50" cy="50" r="12" className="stroke-red-400 stroke-[2]" />
              <circle cx="50" cy="50" r="3" className="fill-amber-300" />
            </svg>
          </div>
        </div>

        {/* Animated Firework Burst FX Layer 2 - Top Right Burst */}
        <div className="absolute top-10 right-6 sm:right-20 pointer-events-none z-0 opacity-80 animate-firework-2">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full bg-red-500/25 blur-xl animate-pulse-glow"></div>
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-red-400 fill-none stroke-[1.5]">
              <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="20" className="stroke-amber-300 stroke-[1.5]" />
              <circle cx="50" cy="50" r="4" className="fill-amber-400" />
            </svg>
          </div>
        </div>

        {/* Animated Firework Burst FX Layer 3 - Bottom Center Sparkles */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-0 opacity-60 animate-sparkle-1">
          <div className="flex items-center gap-12">
            <Sparkles className="w-6 h-6 text-amber-300" />
            <Sparkles className="w-8 h-8 text-red-400" />
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
        </div>

        {/* Hero Main Card Container with Backdrop Blur */}
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Top Promotional Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 border border-amber-400/60 text-amber-300 text-xs font-bold mb-6 shadow-2xl backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="tracking-wide">Diwali Wholesale Booking Open &bull; Save Up to 80% Off MRP</span>
          </div>

          {/* Main Title - Crystal Clear White with High Contrast Shadow */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-3 uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            {companyName}
          </h1>

          {/* Tagline - High Contrast Vibrant Gold */}
          <p className="text-lg sm:text-2xl text-amber-300 font-extrabold max-w-3xl mx-auto mb-4 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {tagline}
          </p>

          {/* Description - High Visibility Soft White with Dark Text Shield */}
          <div className="max-w-2xl mx-auto mb-8 bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 backdrop-blur-md shadow-lg">
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
              Direct Sivakasi manufacturer rates for B2B dealers, retail shopkeepers, and bulk buyers. Experience 100% green certified fireworks, transparent GST billing, and safe door-step parcel dispatch across India.
            </p>
          </div>

          {/* Hero CTAs - Redirection Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-10">
            <button
              onClick={onGoToStore}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm uppercase tracking-wide shadow-2xl shadow-amber-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-slate-950" />
              <span>Go to Online Store</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={onOpenAdminLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-950/90 hover:bg-slate-900 text-slate-100 border-2 border-amber-500/50 hover:border-amber-400 font-bold text-sm shadow-xl transition-all hover:text-amber-300 backdrop-blur-md cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Key Quick Badges with High Contrast Dark Card Shields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-left">
            <div className="bg-slate-950/80 border border-amber-500/40 hover:border-amber-400 rounded-xl p-3.5 flex items-center gap-3 backdrop-blur-md shadow-lg transition-all">
              <Zap className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-black text-white">Direct Factory Rates</div>
                <div className="text-[10px] font-semibold text-amber-200/90">No agent commissions</div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/40 hover:border-amber-400 rounded-xl p-3.5 flex items-center gap-3 backdrop-blur-md shadow-lg transition-all">
              <Truck className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-black text-white">All India Dispatch</div>
                <div className="text-[10px] font-semibold text-amber-200/90">Express parcel transport</div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/40 hover:border-amber-400 rounded-xl p-3.5 flex items-center gap-3 backdrop-blur-md shadow-lg transition-all">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-black text-white">100% Green Crackers</div>
                <div className="text-[10px] font-semibold text-amber-200/90">CSIR-NEERI certified</div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/40 hover:border-amber-400 rounded-xl p-3.5 flex items-center gap-3 backdrop-blur-md shadow-lg transition-all">
              <Clock className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-black text-white">Min. Order ₹{minOrder}</div>
                <div className="text-[10px] font-semibold text-amber-200/90">Bulk B2B threshold</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Company Details Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Company Overview & Credentials Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Company Details & Licensing</h2>
              </div>
              <p className="text-xs text-slate-400">Registered Sivakasi Wholesale Firecrackers Manufacturer & Distributor</p>
            </div>
            <div className="bg-slate-950 border border-red-900/60 px-3 py-1.5 rounded-lg text-right">
              <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider">GSTIN Number</div>
              <div className="font-mono text-sm font-bold text-amber-300">{gstin}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-300">Factory & Office Address</div>
                  <div className="text-slate-400 leading-relaxed">{address}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <PhoneCall className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-300">Phone & Order Helpline</div>
                  <div className="text-slate-400">{phone} / {whatsapp}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-300">Sales Email Address</div>
                  <div className="text-slate-400">{email}</div>
                </div>
              </div>
            </div>

            {/* Bank Details Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs space-y-2">
              <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-2 border-b border-slate-800 pb-1">
                Official Bank Account Details (NEFT/IMPS)
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Bank Name:</span>
                <span className="font-semibold">{shopDetails.bankName || 'State Bank of India'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Account Name:</span>
                <span className="font-semibold">{shopDetails.accountName || companyName}</span>
              </div>
              <div className="flex justify-between text-slate-300 font-mono">
                <span className="text-slate-400">Account Number:</span>
                <span className="font-bold text-white">{shopDetails.accountNumber || '39482019382'}</span>
              </div>
              <div className="flex justify-between text-slate-300 font-mono">
                <span className="text-slate-400">IFSC Code:</span>
                <span className="font-bold text-white">{shopDetails.ifscCode || 'SBIN0000921'}</span>
              </div>
              {shopDetails.upiId && (
                <div className="flex justify-between text-slate-300 font-mono pt-1 border-t border-slate-800">
                  <span className="text-slate-400">UPI ID:</span>
                  <span className="font-bold text-amber-300">{shopDetails.upiId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Showcase Grid (Vediworld inspired) */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Product Categories Catalog</h2>
              <p className="text-xs text-slate-400">Explore our wide range of fireworks manufactured directly in Sivakasi</p>
            </div>
            <button
              onClick={onGoToStore}
              className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>View Full Online Store</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  onClick={onGoToStore}
                  className="bg-slate-900 border border-slate-800 hover:border-red-600/60 rounded-xl p-3 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-md group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-red-950 border border-red-700/60 flex items-center justify-center text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors mb-2">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white line-clamp-1">{cat.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{count} Products</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How B2B Order Works (Steps) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 text-center uppercase tracking-tight">
            How to Place Your Wholesale Firecracker Enquiry Order
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Select Products</h3>
              <p className="text-[11px] text-slate-400">Browse online store and select items with minimum ₹{minOrder} order total.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Submit Enquiry</h3>
              <p className="text-[11px] text-slate-400">Enter your business name, mobile number, and dispatch address.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Receive GST Proforma</h3>
              <p className="text-[11px] text-slate-400">Our admin team verifies stock & sends formal invoice with freight estimate.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-3">
                4
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Safe Dispatch</h3>
              <p className="text-[11px] text-slate-400">Parcel packed in heavy wooden boxes and dispatched via express freight.</p>
            </div>
          </div>
        </div>

        {/* Bottom Dual Action Callout Banner */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 rounded-xl p-6 sm:p-8 text-center border border-amber-500/40 shadow-2xl space-y-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">
            Ready to View Products & Pricing?
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl mx-auto">
            Click below to open the complete live product price list and add items directly to your enquiry cart.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 max-w-md mx-auto">
            <button
              onClick={onGoToStore}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-slate-950" />
              <span>Go to Online Store</span>
            </button>

            <button
              onClick={onOpenAdminLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-300 border border-slate-700 font-bold text-xs transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            &copy; {new Date().getFullYear()} {companyName}. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={onGoToStore} className="hover:text-amber-300 transition-colors">Online Store</button>
            <span>&bull;</span>
            <button onClick={onOpenAdminLogin} className="hover:text-amber-300 transition-colors">Admin Portal</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
