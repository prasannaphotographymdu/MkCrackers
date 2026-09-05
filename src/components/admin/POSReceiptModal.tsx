import React from 'react';
import { X, Printer, Receipt } from 'lucide-react';
import { OfflineOrder, ShopDetails } from '../../types';
import { formatINR } from '../../lib/utils';
import { printPOSReceiptPDF } from '../../lib/printUtils';

interface POSReceiptModalProps {
  order: OfflineOrder;
  shopDetails: ShopDetails;
  onClose: () => void;
}

export const POSReceiptModal: React.FC<POSReceiptModalProps> = ({ order, shopDetails, onClose }) => {
  const handlePrint = () => {
    printPOSReceiptPDF(order, shopDetails);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 relative my-auto">
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-bold text-sm sm:text-base truncate">{order.isGstBill ? 'POS Tax Invoice / Receipt' : 'POS Estimate / Receipt'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs font-mono print:p-0 print:text-black">
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="font-black text-lg text-slate-900 uppercase tracking-wide">{shopDetails.name}</h2>
            <p className="text-[11px] text-slate-600 font-sans font-medium">{shopDetails.tagline}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">{shopDetails.address}, {shopDetails.cityState}</p>
            <p className="text-[10px] text-slate-500 font-sans">Phone: {shopDetails.phone}{order.isGstBill && shopDetails.gstin ? ` | GSTIN: ${shopDetails.gstin}` : ''}</p>
          </div>

          {/* Bill Info */}
          <div className="py-3 border-b border-dashed border-slate-300 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">Bill No:</span> <strong className="text-slate-900 font-bold">{order.billNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Date:</span> {new Date(order.createdAt).toLocaleString('en-IN')}
            </div>
            <div>
              <span className="text-slate-500">Customer:</span> {order.customerName || 'Walk-in Customer'}
            </div>
            <div className="text-right">
              <span className="text-slate-500">Payment Mode:</span> <strong className="uppercase font-bold text-amber-700">{order.paymentMode}</strong>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] uppercase text-slate-500">
                  <th className="pb-1">Item</th>
                  {order.isGstBill && <th className="pb-1 text-center">HSN</th>}
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Price</th>
                  <th className="pb-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.items || []).map((it, idx) => {
                  const lineAmount = typeof it.amount === 'number' && !isNaN(it.amount) ? it.amount : (it.qty || 1) * (it.unitPrice || 0);
                  const pName = it.productName || 'Firecracker Item';
                  const pSku = it.sku || 'N/A';
                  const pHsn = it.hsnCode || '36041000';
                  const gst = it.gstPercent || 18;
                  return (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-1.5 pr-2 font-medium text-slate-800">
                        <div>{pName}</div>
                        <div className="text-[9px] text-slate-400 font-sans">SKU: {pSku}{order.isGstBill ? ` \u2022 GST ${gst}%` : ''}</div>
                      </td>
                      {order.isGstBill && <td className="py-1.5 text-center font-mono text-slate-500">{pHsn}</td>}
                      <td className="py-1.5 text-center font-bold text-slate-900">{it.qty}</td>
                      <td className="py-1.5 text-right font-medium">{formatINR(it.unitPrice)}</td>
                      <td className="py-1.5 text-right font-bold text-slate-900">{formatINR(lineAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Payment Breakdown */}
          {(() => {
            const itemsList = order.items || [];
            const calcTotalSum = itemsList.reduce(
              (sum, i) => sum + (typeof i.amount === 'number' && !isNaN(i.amount) ? i.amount : (i.qty || 1) * (i.unitPrice || 0)),
              0
            );
            const calcBaseSum = itemsList.reduce((sum, i) => {
              const amt = typeof i.amount === 'number' && !isNaN(i.amount) ? i.amount : (i.qty || 1) * (i.unitPrice || 0);
              const g = i.gstPercent || 18;
              return sum + amt / (1 + g / 100);
            }, 0);
            const calcGstSum = calcTotalSum - calcBaseSum;
            
            const displayGrandTotal = order.grandTotal || Math.max(0, Math.round(calcTotalSum - (order.discountAmount || 0)));
            const displaySubtotal = order.isGstBill ? (order.subtotal ?? Number(calcBaseSum.toFixed(2))) : displayGrandTotal;
            const displayGst = order.isGstBill ? (order.gstAmount ?? Number(calcGstSum.toFixed(2))) : 0;

            return (
              <div className="pt-3 border-t border-dashed border-slate-300 space-y-1 text-right text-[11px]">
                {order.isGstBill ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (Excl. GST):</span>
                      <span>{formatINR(displaySubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST Total:</span>
                      <span>{formatINR(displayGst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>Items Total:</span>
                    <span>{formatINR(calcTotalSum)}</span>
                  </div>
                )}
                {Boolean(order.discountAmount) && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Discount:</span>
                    <span>-{formatINR(order.discountAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-900 font-black text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span>{formatINR(displayGrandTotal)}</span>
                </div>

                {/* Payment Details */}
                <div className="mt-3 pt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left font-sans text-[11px] space-y-1">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Payment Mode Received:</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[10px] uppercase">{order.paymentMode}</span>
                  </div>
                  {order.paymentMode === 'Cash' && (
                    <div className="flex justify-between text-slate-600">
                      <span>Cash Amount:</span>
                      <span className="font-bold text-slate-900">{formatINR(order.cashAmount || displayGrandTotal)}</span>
                    </div>
                  )}
                  {order.paymentMode === 'UPI' && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-600">
                        <span>UPI Received:</span>
                        <span className="font-bold text-slate-900">{formatINR(order.upiAmount || displayGrandTotal)}</span>
                      </div>
                      {order.upiRefNo && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          UPI Ref / Txn ID: {order.upiRefNo}
                        </div>
                      )}
                    </div>
                  )}
                  {order.paymentMode === 'Split' && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-600">
                        <span>Cash Portion:</span>
                        <span className="font-bold text-slate-900">{formatINR(order.cashAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>UPI Portion:</span>
                        <span className="font-bold text-slate-900">{formatINR(order.upiAmount || 0)}</span>
                      </div>
                      {order.upiRefNo && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          UPI Ref: {order.upiRefNo}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Footer Note */}
          <div className="mt-6 text-center text-[10px] text-slate-500 font-sans border-t border-slate-200 pt-3 space-y-1">
            <p className="font-semibold text-slate-700">Thank you for purchasing 100% Green Certified Crackers!</p>
            <p>Wish you a Safe, Joyous and Sparkling Festival of Lights.</p>
            <p className="text-[9px] text-slate-400 mt-2 font-mono">Computer Generated POS Invoice &bull; No Signature Required</p>
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="sm:hidden sticky bottom-0 z-30 bg-slate-900 text-white p-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg min-h-[44px] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl min-h-[44px] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
