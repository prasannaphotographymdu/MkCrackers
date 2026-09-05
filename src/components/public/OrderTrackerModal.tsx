import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  User,
  MapPin,
  Calendar,
  MessageCircle,
  FileText,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Enquiry, ShopDetails } from '../../types';
import { formatINR, formatDate } from '../../lib/utils';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  enquiriesList?: Enquiry[];
  shopDetails?: ShopDetails;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  enquiriesList = [],
  shopDetails
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Enquiry[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const companyName = shopDetails?.name || 'Sri Laxmi Fireworks';
  const rawWa = (shopDetails?.whatsapp || '919842199887').replace(/\D/g, '');
  const waNumber = rawWa.length === 10 ? `91${rawWa}` : rawWa;

  // Perform search locally or via API
  const performSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) {
      setErrorMsg('Please enter an Order ID or 10-digit Mobile Number.');
      setResults([]);
      return;
    }

    setIsSearching(true);
    setErrorMsg('');
    setHasSearched(true);

    try {
      // First try local filtering from parent enquiries list if available
      const qLower = q.toLowerCase();
      const qClean = q.replace(/\D/g, '');

      const localMatches = enquiriesList.filter((e) => {
        const eId = e.id.toLowerCase();
        const mob = (e.customerDetails?.mobile || '').replace(/\D/g, '');
        const invId = (e.invoiceId || '').toLowerCase();

        if (eId === qLower || eId.replace(/[^a-z0-9]/g, '') === qLower) return true;
        if (eId.includes(qLower)) return true;
        if (invId && (invId === qLower || invId.includes(qLower))) return true;
        if (qClean.length >= 4 && mob.includes(qClean)) return true;
        return false;
      });

      if (localMatches.length > 0) {
        setResults(localMatches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsSearching(false);
        return;
      }

      // Fallback to Server API
      const res = await fetch(`/api/orders/track/${encodeURIComponent(q)}`);
      if (res.ok) {
        const firestoreMatches: Enquiry[] = await res.json();
        if (firestoreMatches.length > 0) {
          setResults(firestoreMatches);
        } else {
          setResults([]);
          setErrorMsg(`No orders found for "${q}". Please verify your Order ID or Mobile Number.`);
        }
      } else {
        setResults([]);
        setErrorMsg(`No orders found for "${q}". Please verify your Order ID or Mobile Number.`);
      }
    } catch (err: any) {
      setErrorMsg('Failed to fetch tracking details. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setSearchQuery(initialQuery);
        performSearch(initialQuery);
      } else {
        setResults([]);
        setHasSearched(false);
        setErrorMsg('');
      }
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // Helper to render Status Stepper
  const renderStatusTimeline = (status: Enquiry['status'], notes?: string) => {
    if (status === 'Cancelled') {
      return (
        <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-3 text-red-200 flex items-center gap-2.5 text-xs">
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <div className="font-bold text-red-300">Order Status: Cancelled</div>
            <div className="text-[11px] text-red-300/80">This enquiry or order was cancelled. Please contact sales for assistance.</div>
          </div>
        </div>
      );
    }

    const steps = [
      {
        key: 'Pending',
        title: 'Order Placed',
        desc: 'Registered with Sivakasi HQ',
        icon: Clock
      },
      {
        key: 'Confirmed',
        title: 'Confirmed',
        desc: 'Order accepted',
        icon: CheckCircle2
      },
      {
        key: 'Shipped',
        title: 'Shipped / Dispatched',
        desc: 'In transit via courier/transport',
        icon: Truck
      },
      {
        key: 'Success',
        title: 'Delivered',
        desc: 'Delivered & Invoice issued',
        icon: Sparkles
      }
    ];

    const currentStepIndex =
      status === 'Pending' ? 0 : status === 'Confirmed' ? 1 : status === 'Shipped' ? 2 : status === 'Success' ? 3 : 0;

    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 my-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Live Dispatch Tracking Timeline
        </div>

        <div className="grid grid-cols-4 gap-2 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all shadow-md ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 scale-110'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div
                  className={`mt-2 font-bold text-[11px] leading-tight ${
                    isCurrent ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{step.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Display Dispatch / Tracking Notes if available */}
        {notes && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-start gap-2 text-xs text-amber-200 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20">
            <Truck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Dispatch / LR Info: </span>
              <span>{typeof notes === 'string' ? notes : JSON.stringify(notes)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Live Order & Dispatch Tracker</h2>
              <p className="text-xs text-slate-400">Track your Sivakasi firecrackers B2B order status</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Section */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Order ID (e.g. ENQ-1001) or Mobile Number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Status</span>
                </>
              )}
            </button>
          </form>

          {/* Quick help chips */}
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span>Tip:</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('ENQ-1001');
                performSearch('ENQ-1001');
              }}
              className="text-amber-400 hover:underline font-mono"
            >
              Try ENQ-1001
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('ENQ-1002');
                performSearch('ENQ-1002');
              }}
              className="text-amber-400 hover:underline font-mono"
            >
              Try ENQ-1002
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-300 mb-0.5">Order Not Found</div>
                <div>{errorMsg}</div>
              </div>
            </div>
          )}

          {!hasSearched && !isSearching && (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Package className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-300">Enter your Order ID or Mobile Number above</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Track your B2B order status, dispatch stage, transport LR number, and itemized bill details instantly.
              </p>
            </div>
          )}

          {/* Search Results */}
          {results.map((order) => {
            const waMsg = encodeURIComponent(
              `Hello ${companyName}, I would like an update on my Order #${order.id} (${order.customerDetails?.name}). Current Status: ${order.status}`
            );

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Order ID:</span>
                      <span className="font-mono font-black text-amber-400 text-base">{order.id}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                          order.status === 'Shipped'
                            ? 'bg-blue-950 text-blue-300 border-blue-500/50'
                            : order.status === 'Confirmed'
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50'
                            : order.status === 'Success'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                            : order.status === 'Cancelled'
                            ? 'bg-red-950 text-red-300 border-red-500/50'
                            : 'bg-amber-950 text-amber-300 border-amber-500/50'
                        }`}
                      >
                        {order.status === 'Shipped'
                          ? 'Shipped / Dispatched'
                          : order.status === 'Confirmed'
                          ? 'Order Confirmed'
                          : order.status === 'Success'
                          ? 'Delivered'
                          : order.status === 'Cancelled'
                          ? 'Cancelled'
                          : 'Order Received (Pending)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Placed on: {formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Amount</div>
                    <div className="text-lg font-black text-amber-400">{formatINR(order.totalAmount)}</div>
                  </div>
                </div>

                {/* Timeline Visual Progress */}
                {renderStatusTimeline(order.status, order.notes)}

                {/* Customer Details Grid */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><b>Customer:</b> {order.customerDetails?.name || 'Valued Customer'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><b>Mobile:</b> {order.customerDetails?.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><b>Delivery Address:</b> {order.customerDetails?.address || 'Sivakasi Warehouse Pick-up'}</span>
                  </div>
                </div>

                {/* Item breakdown preview */}
                <div>
                  <div className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Order Items ({order.items?.length || 0})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Factory Direct Price</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[9px]">
                        <tr>
                          <th className="py-1.5 px-2.5">Item</th>
                          <th className="py-1.5 px-2.5 text-center">Qty</th>
                          <th className="py-1.5 px-2.5 text-right">Price</th>
                          <th className="py-1.5 px-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                        {(order.items || []).map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2.5 font-sans font-semibold text-white">
                              {item.productName}
                              <span className="block text-[9px] text-slate-500 font-mono">{item.sku}</span>
                            </td>
                            <td className="py-1.5 px-2.5 text-center">{item.qty}</td>
                            <td className="py-1.5 px-2.5 text-right">{formatINR(item.unitPrice)}</td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-amber-400">{formatINR(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Contact Support Footer Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/${waNumber}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Order Support</span>
                  </a>

                  {order.invoiceGenerated && order.invoiceId && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Official Invoice Issued: #{order.invoiceId}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
