import React, { useState } from 'react';
import { X, ShoppingBag, Send, Phone, User, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import { CartItem, CustomerDetails, ShopDetails } from '../../types';
import { formatINR } from '../../lib/utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  totalItems: number;
  onSubmitEnquiry: (details: CustomerDetails) => Promise<void>;
  isLoading: boolean;
  shopDetails?: ShopDetails;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount,
  totalItems,
  onSubmitEnquiry,
  isLoading,
  shopDetails
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const minOrderAmount = shopDetails?.minimumOrderAmount ?? 500;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name or store name.');
      return;
    }

    const cleanMobile = mobile.trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your complete delivery address for dispatch estimate.');
      return;
    }

    if (totalAmount < minOrderAmount) {
      setErrorMsg(`Minimum enquiry order total is ₹${minOrderAmount}.`);
      return;
    }

    try {
      await onSubmitEnquiry({
        name: name.trim(),
        mobile: cleanMobile,
        address: address.trim()
      });
      // Reset form
      setName('');
      setMobile('');
      setAddress('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit enquiry. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-md max-w-xl w-full my-6 p-4 shadow-2xl relative text-slate-900">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title Header */}
        <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-3">
          <div className="p-2 rounded bg-red-600 text-white shadow-sm">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Complete B2B Wholesale Enquiry</h2>
            <p className="text-[11px] text-slate-500">
              Submit your order request directly to Sivakasi dispatch team
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Form inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-red-600" /> Customer / Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Wholesale Stores"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-red-600" /> Mobile Number *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-600" /> Delivery & Transport Address *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Enter complete address, shop location, city, pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>

          {/* Selected Products Itemized Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
              <span>Order Summary ({totalItems} items)</span>
              <span>Wholesale Value</span>
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 my-1.5 pr-1">
              {cartItems.map((item) => (
                <div key={item.product.id} className="py-1.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{item.product.name}</span>
                    <span className="text-slate-500 block text-[10px]">
                      SKU: <span className="font-mono">{item.product.sku}</span> | Qty: {item.qty} ({item.product.itemsPerPack})
                    </span>
                  </div>
                  <span className="font-bold font-mono text-red-700">
                    {formatINR(item.product.sellingPrice * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500">Total Amount (+ GST applicable)</span>
                <span className="text-[10px] text-emerald-700 block font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Minimum Order ₹{minOrderAmount} Met
                </span>
              </div>
              <span className="text-lg font-black font-mono text-red-700">{formatINR(totalAmount)}</span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors text-xs font-semibold"
            >
              Back to Catalog
            </button>
            <button
              type="submit"
              disabled={isLoading || totalAmount < minOrderAmount}
              className="px-5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Submit B2B Enquiry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
