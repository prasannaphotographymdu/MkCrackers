import React from 'react';
import { X, Printer, Download, Sparkles, Building2, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Invoice } from '../../types';
import { formatINR, formatDate } from '../../lib/utils';
import { printInvoicePDF } from '../../lib/printUtils';

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const isGst = invoice.isGstBill ?? (invoice.gstAmount > 0);
  
  const handlePrint = () => {
    printInvoicePDF(invoice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full my-auto shadow-2xl relative text-slate-900 flex flex-col max-h-[92vh] overflow-hidden printable-document print:shadow-none print:border-none print:bg-white print:text-black print:my-0 print:w-full print:max-h-none">
        {/* Sticky Modal Header Actions (Hidden on print) */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 shrink-0 print:hidden no-print">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center gap-1 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> GST Invoice
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">{invoice.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Sheet */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 print:text-black print:p-0">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-4 gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 print:text-black">
                {invoice.shopDetails.name}
              </h1>
              <p className="text-xs text-red-700 print:text-slate-600 font-semibold mt-0.5">
                {invoice.shopDetails.tagline}
              </p>
              <div className="text-[11px] text-slate-600 mt-1.5 space-y-0.5">
                <p>{invoice.shopDetails.address}</p>
                <p>Phone: {invoice.shopDetails.phone} | WhatsApp: {invoice.shopDetails.whatsapp}</p>
                <p>Email: {invoice.shopDetails.email}</p>
                <p className="font-mono font-bold text-red-700 print:text-black">
                  GSTIN: {invoice.shopDetails.gstin}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 p-3 rounded border border-slate-200 min-w-[180px]">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-700 print:text-black block mb-0.5">
                GST TAX INVOICE
              </span>
              <div className="text-base font-mono font-bold text-slate-900 print:text-black">
                {invoice.id}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Date: <b>{formatDate(invoice.date)}</b>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                Ref Enquiry: <b>{invoice.enquiryNo}</b>
              </div>
            </div>
          </div>

          {/* Customer Details Block */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-0.5">
              Billed To (Customer Details)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 print:text-black text-xs block">
                  {invoice.customerDetails.name}
                </span>
                <span className="text-slate-600 mt-0.5 block">
                  Mobile: {invoice.customerDetails.mobile}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block">
                  <b>Dispatch Address:</b> {invoice.customerDetails.address}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Invoice Table */}
          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
                <tr>
                  <th className="py-1.5 px-2.5">#</th>
                  <th className="py-1.5 px-2.5">SKU</th>
                  {isGst && <th className="py-1.5 px-2.5">HSN</th>}
                  <th className="py-1.5 px-2.5">Item Description</th>
                  <th className="py-1.5 px-2.5 text-center">Qty</th>
                  <th className="py-1.5 px-2.5 text-right">Rate (₹)</th>
                  {isGst && <th className="py-1.5 px-2.5 text-right">GST %</th>}
                  {isGst && <th className="py-1.5 px-2.5 text-right">GST Amt (₹)</th>}
                  <th className="py-1.5 px-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-1.5 px-2.5 font-mono font-bold text-red-700">{item.sku}</td>
                    {isGst && <td className="py-1.5 px-2.5 font-mono text-slate-500">{item.hsnCode || "36041000"}</td>}
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">{item.productName}</td>
                    <td className="py-1.5 px-2.5 text-center font-mono font-bold">{item.qty}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono">{formatINR(item.sellingPrice)}</td>
                    {isGst && <td className="py-1.5 px-2.5 text-right font-mono">{item.gstPercent}%</td>}
                    {isGst && <td className="py-1.5 px-2.5 text-right font-mono text-slate-600">{formatINR(item.gstAmount)}</td>}
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-red-700">
                      {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal & Taxes Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pt-1">
            <div className="text-[11px] text-slate-500 max-w-sm space-y-1">
              {invoice.shopDetails.bankName && (
                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[10px] space-y-0.5 font-mono">
                  <p className="font-bold text-slate-800 uppercase font-sans">Bank Payment Details:</p>
                  <p>Bank: <b>{invoice.shopDetails.bankName}</b> | A/C Name: <b>{invoice.shopDetails.accountName}</b></p>
                  <p>A/C No: <b>{invoice.shopDetails.accountNumber}</b> | IFSC: <b>{invoice.shopDetails.ifscCode}</b></p>
                  {invoice.shopDetails.upiId && <p>UPI ID: <b>{invoice.shopDetails.upiId}</b></p>}
                </div>
              )}

              <div>
                <p className="font-bold text-slate-800">Terms & Conditions:</p>
                <div className="whitespace-pre-line text-[10px] text-slate-600">
                  {invoice.shopDetails.terms || '1. Goods once sold will not be taken back or exchanged.\n2. Transport & freight charges extra at actuals during dispatch.\n3. Subject to Sivakasi Jurisdiction.'}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-60 bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1.5 shrink-0">
              <div className="flex justify-between text-slate-600 font-mono">
                <span>Subtotal (Base):</span>
                <span>{formatINR(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-mono">
                <span>Total GST (18%):</span>
                <span>{formatINR(invoice.gstAmount)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-mono font-bold text-sm text-red-700">
                <span>Grand Total:</span>
                <span>{formatINR(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Authorized Signature Block */}
          <div className="pt-6 flex justify-between items-end text-[11px] text-slate-600">
            <div>
              <p>Customer Seal & Signature</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">For {invoice.shopDetails.name}</p>
              <div className="h-10" />
              <p className="border-t border-slate-300 pt-1">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="sm:hidden sticky bottom-0 z-30 bg-slate-900 text-white p-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0 print:hidden no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg min-h-[44px] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Download PDF</span>
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
