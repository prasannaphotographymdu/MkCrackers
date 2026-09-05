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

const CATEGORY_IMAGES: Record<string, string> = {
  'cat-1': 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80', // Loud cracker explosion
  'cat-2': 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=80', // Garland sound series / sparkles
  'cat-3': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80', // Spinner ground fireworks / sparkles circle
  'cat-4': 'https://images.unsplash.com/photo-1533234427049-9e9bb093186d?w=500&auto=format&fit=crop&q=80', // Flower pots fountain
  'cat-5': 'https://images.unsplash.com/photo-1498931290022-91a53b3a159e?w=500&auto=format&fit=crop&q=80', // Soaring rocket sky trail
  'cat-6': 'https://images.unsplash.com/photo-1507508019881-3edd12850e2a?w=500&auto=format&fit=crop&q=80', // Sky multi shot repeater
  'cat-7': 'https://images.unsplash.com/photo-1489641493513-ba4ee84ccea9?w=500&auto=format&fit=crop&q=80', // Handheld sparkler
  'cat-8': 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=500&auto=format&fit=crop&q=80', // Kid novelty sparklers
  'cat-9': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80'  // Gift Box assortment
};

interface LandingPageProps {
  shopDetails: ShopDetails;
  categories: Category[];
  products: Product[];
  onGoToStore: () => void;
  onOpenTracker?: (query?: string) => void;
  onOpenAdminLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  shopDetails,
  categories,
  products,
  onGoToStore,
  onOpenTracker
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
        <div className="absolute inset-0 z-0 bg-black">
          <img
            src="https://www.vediworld.com/skyshot.gif"
            alt="Vediworld Skyshots Display"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-100"
          />
          {/* Subtle bottom fade to transition to the black background, but no dark cover gradients on the GIF itself */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent"></div>
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

          {/* Hero CTAs - Redirection Buttons & Tracking */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-xl mx-auto mb-8">
            <button
              onClick={onGoToStore}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm uppercase tracking-wide shadow-2xl shadow-amber-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-slate-950" />
              <span>Go to Online Store</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>

            {onOpenTracker && (
              <button
                onClick={() => onOpenTracker()}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-sm border border-amber-400/50 hover:border-amber-400 shadow-xl backdrop-blur-md hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Truck className="w-5 h-5 text-amber-400" />
                <span>Track Order Status</span>
              </button>
            )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  onClick={onGoToStore}
                  className="bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1.5 shadow-lg group flex flex-col h-full"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-slate-950">
                    <img
                      src={cat.image || CATEGORY_IMAGES[cat.id] || CATEGORY_IMAGES['cat-1']}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    {/* Floating category count */}
                    <span className="absolute top-2.5 right-2.5 bg-red-600 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
                      {count} Products
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {cat.description || 'Premium quality Sivakasi firecracker catalog'}
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                      <span>Browse Products</span>
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
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
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 pt-12 pb-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h4 className="font-black text-white uppercase tracking-wider text-sm">{companyName}</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {address}
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
              Contact Details
            </h4>
            <div className="space-y-1.5 text-slate-400">
              <p className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Phone:</span> {phone}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold text-slate-300">WhatsApp:</span> {whatsapp}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Email:</span> {email}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
              Quick Links
            </h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={onGoToStore}
                className="text-left text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Online Store
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {companyName}. All Rights Reserved.
          </div>
          <div>
            Sivakasi Firecrackers B2B Portal
          </div>
        </div>
      </footer>
    </div>
  );
};
