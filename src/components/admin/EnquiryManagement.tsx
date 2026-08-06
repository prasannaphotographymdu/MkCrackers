import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Eye,
  Phone,
  User,
  MapPin,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Enquiry, Invoice } from '../../types';
import { formatINR, formatDate } from '../../lib/utils';
import { InvoiceViewModal } from './InvoiceViewModal';

interface EnquiryManagementProps {
  enquiries: Enquiry[];
  invoices: Invoice[];
  onUpdateStatus: (id: string, status: 'Pending' | 'Success' | 'Closed', notes?: string) => Promise<void>;
  onGenerateInvoice: (enquiryId: string) => Promise<Invoice>;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const EnquiryManagement: React.FC<EnquiryManagementProps> = ({
  enquiries,
  invoices,
  onUpdateStatus,
  onGenerateInvoice,
  onShowToast
}) => {
  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [dateSearch, setDateSearch] = useState('');

  // Selected Enquiry for Details Drawer / Invoice
  const [activeEnquiry, setActiveEnquiry] = useState<Enquiry | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Filtered List
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      if (selectedStatus !== 'all' && e.status !== selectedStatus) {
        return false;
      }
      if (
        customerSearch &&
        !e.customerDetails.name.toLowerCase().includes(customerSearch.toLowerCase().trim())
      ) {
        return false;
      }
      if (phoneSearch && !e.customerDetails.mobile.includes(phoneSearch.trim())) {
        return false;
      }
      if (dateSearch && !e.createdAt.startsWith(dateSearch)) {
        return false;
      }
      return true;
    });
  }, [enquiries, selectedStatus, customerSearch, phoneSearch, dateSearch]);

  // Handle Status Change
  const handleStatusChange = async (enquiryId: string, newStatus: 'Pending' | 'Success' | 'Closed') => {
    try {
      await onUpdateStatus(enquiryId, newStatus);
      onShowToast(
        newStatus === 'Success' ? 'success' : newStatus === 'Closed' ? 'error' : 'info',
        'Enquiry Status Updated',
        `Enquiry ${enquiryId} set to ${newStatus}`
      );
    } catch (err: any) {
      onShowToast('error', 'Update Failed', err.message || 'Could not update enquiry status.');
    }
  };

  // Handle Generate Invoice Action
  const handleGenerateInvoiceAction = async (enquiry: Enquiry) => {
    if (enquiry.status !== 'Success') {
      onShowToast('error', 'Action Restricted', 'Invoice can only be generated for enquiries marked as "Success".');
      return;
    }

    setIsLoadingInvoice(true);
    try {
      const inv = await onGenerateInvoice(enquiry.id);
      setSelectedInvoice(inv);
      onShowToast(
        'success',
        'Invoice Generated & Stock Deducted!',
        `Invoice ${inv.id} created for ${enquiry.id}. Inventory updated automatically.`
      );
    } catch (err: any) {
      onShowToast('error', 'Invoice Error', err.message || 'Failed to generate invoice.');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  // View Existing Invoice if generated
  const handleViewInvoice = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
    } else {
      onShowToast('error', 'Invoice Not Found', `Invoice ${invoiceId} could not be loaded.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-3 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-600" /> Customer Enquiry & Workflow Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process B2B enquiries, confirm orders, update stage status, and generate official GST Invoices.
          </p>
        </div>

        {/* Status Tab Counter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
          {[
            { key: 'all', label: 'All', count: enquiries.length },
            { key: 'Pending', label: '1. Pending', count: enquiries.filter((e) => e.status === 'Pending').length },
            { key: 'Success', label: '2. Success', count: enquiries.filter((e) => e.status === 'Success').length },
            { key: 'Closed', label: '3. Closed', count: enquiries.filter((e) => e.status === 'Closed').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors shrink-0 ${
                selectedStatus === tab.key
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Search Customer Name</label>
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Ramesh Stores"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Search Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. 98421..."
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Filter Date</label>
          <input
            type="date"
            value={dateSearch}
            onChange={(e) => setDateSearch(e.target.value)}
            className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
              <tr>
                <th className="py-2 px-3">Enquiry No</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Customer Details</th>
                <th className="py-2 px-3 text-center">Items</th>
                <th className="py-2 px-3 text-right">Amount (₹)</th>
                <th className="py-2 px-3 text-center">Status Workflow</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEnquiries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-red-700">{e.id}</td>
                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{formatDate(e.createdAt)}</td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-slate-900">{e.customerDetails.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{e.customerDetails.mobile}</div>
                  </td>
                  <td className="py-2 px-3 text-center font-semibold text-slate-800">
                    {e.totalItems} Pcs
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-red-700">
                    {formatINR(e.totalAmount)}
                  </td>

                  {/* Status Dropdown / Workflow Badge */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <select
                        value={e.status}
                        onChange={(ev) =>
                          handleStatusChange(e.id, ev.target.value as 'Pending' | 'Success' | 'Closed')
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border focus:outline-none ${
                          e.status === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : e.status === 'Success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-red-50 text-red-800 border-red-300'
                        }`}
                      >
                        <option value="Pending">1. Pending</option>
                        <option value="Success">2. Success (Confirmed)</option>
                        <option value="Closed">3. Closed (Rejected)</option>
                      </select>
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveEnquiry(e)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold transition-colors flex items-center gap-1 text-[11px]"
                        title="View Items"
                      >
                        <Eye className="w-3.5 h-3.5 text-red-600" /> Details
                      </button>

                      {/* Invoice Generation Trigger */}
                      {e.status === 'Success' && (
                        e.invoiceGenerated && e.invoiceId ? (
                          <button
                            onClick={() => handleViewInvoice(e.invoiceId!)}
                            className="px-2 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" /> View Invoice
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateInvoiceAction(e)}
                            disabled={isLoadingInvoice}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Generate Invoice
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEnquiries.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No enquiries match the selected filters.
            </div>
          )}
        </div>
      </div>

      {/* Enquiry Items Detail Drawer / Modal */}
      {activeEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-md max-w-xl w-full my-6 p-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setActiveEnquiry(null)}
              className="absolute top-3 right-3 p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-0.5">
              Enquiry Details: {activeEnquiry.id}
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Submitted on {formatDate(activeEnquiry.createdAt)}
            </p>

            {/* Customer Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Customer Name:</span>
                <span className="font-bold text-slate-900">{activeEnquiry.customerDetails.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Mobile Number:</span>
                <span className="font-mono font-bold text-red-700">{activeEnquiry.customerDetails.mobile}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Dispatch Address:</span>
                <span className="text-slate-800">{activeEnquiry.customerDetails.address}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-200 rounded overflow-x-auto mb-3">
              <table className="w-full min-w-[480px] text-left text-xs text-slate-800">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
                  <tr>
                    <th className="py-2 px-2.5">SKU</th>
                    <th className="py-2 px-2.5">Product Name</th>
                    <th className="py-2 px-2.5 text-center">Qty</th>
                    <th className="py-2 px-2.5 text-right">Selling Rate</th>
                    <th className="py-2 px-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeEnquiry.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-1.5 px-2.5 font-mono font-bold text-red-700 whitespace-nowrap">{it.sku}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">{it.productName}</td>
                      <td className="py-1.5 px-2.5 text-center font-bold whitespace-nowrap">{it.qty}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono whitespace-nowrap">{formatINR(it.unitPrice)}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-red-700 whitespace-nowrap">
                        {formatINR(it.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="text-xs">
                <span className="text-slate-500">Current Status: </span>
                <b className="text-red-700">{activeEnquiry.status}</b>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Total Amount</span>
                <span className="text-lg font-mono font-black text-red-700">
                  {formatINR(activeEnquiry.totalAmount)}
                </span>
              </div>
            </div>

            {/* Workflow Action inside Drawer */}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200">
              {activeEnquiry.status === 'Pending' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusChange(activeEnquiry.id, 'Closed');
                      setActiveEnquiry(null);
                    }}
                    className="px-3 py-1.5 rounded bg-red-50 border border-red-200 text-red-800 font-bold text-xs hover:bg-red-100 transition-colors"
                  >
                    Mark as Closed (Reject)
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(activeEnquiry.id, 'Success');
                      setActiveEnquiry(null);
                    }}
                    className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Confirm Order (Mark Success)
                  </button>
                </>
              )}

              {activeEnquiry.status === 'Success' && !activeEnquiry.invoiceGenerated && (
                <button
                  onClick={() => {
                    const enq = activeEnquiry;
                    setActiveEnquiry(null);
                    handleGenerateInvoiceAction(enq);
                  }}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate GST Invoice & Deduct Stock
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Viewer */}
      <InvoiceViewModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
};
