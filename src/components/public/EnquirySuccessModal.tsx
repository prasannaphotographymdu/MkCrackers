import React from 'react';
import { CheckCircle2, MessageCircle, FileText, ArrowRight, Sparkles, Truck } from 'lucide-react';
import { Enquiry, ShopDetails } from '../../types';
import { formatINR } from '../../lib/utils';

interface EnquirySuccessModalProps {
  enquiry: Enquiry | null;
  onClose: () => void;
  onOpenTracker?: (query?: string) => void;
  shopDetails?: ShopDetails;
}

export const EnquirySuccessModal: React.FC<EnquirySuccessModalProps> = ({
  enquiry,
  onClose,
  onOpenTracker,
  shopDetails
}) => {
  if (!enquiry) return null;

  const companyName = shopDetails?.name || 'Sri Laxmi Fireworks';
  const rawWa = (shopDetails?.whatsapp || '919842199887').replace(/\D/g, '');
  const waNumber = rawWa.length === 10 ? `91${rawWa}` : rawWa;

  const whatsappMessage = encodeURIComponent(
    `Hello ${companyName}, I have placed a B2B Enquiry on your website!\n\nEnquiry No: ${enquiry.id}\nCustomer: ${enquiry.customerDetails.name}\nPhone: ${enquiry.customerDetails.mobile}\nTotal Items: ${enquiry.totalItems}\nTotal Amount: ₹${enquiry.totalAmount}\n\nPlease confirm price and dispatch details!`
  );

  const whatsappUrl = `https://wa.me/${waNumber}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-black text-white">Enquiry Submitted Successfully!</h2>
        <p className="text-xs text-slate-300 mt-1">
          Your B2B Wholesale Firecracker Enquiry has been registered with our Sivakasi office.
        </p>

        {/* Enquiry Details Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 my-5 text-left text-xs space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Enquiry No:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{enquiry.id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Customer Name:</span>
            <span className="font-semibold text-white">{enquiry.customerDetails.name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Mobile Number:</span>
            <span className="font-semibold text-white">{enquiry.customerDetails.mobile}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status:</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 text-[11px] font-bold">
              1. Pending Confirmation
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <span className="text-slate-300 font-bold">Enquiry Total:</span>
            <span className="text-base font-black text-amber-400">
              {formatINR(enquiry.totalAmount)}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Our Sivakasi sales manager will contact your mobile number shortly.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> Send Copy to WhatsApp
          </a>

          {onOpenTracker && (
            <button
              onClick={() => {
                const orderId = enquiry.id;
                onClose();
                onOpenTracker(orderId);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" /> Track Order Live
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
