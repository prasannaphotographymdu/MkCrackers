import React, { useState, useMemo, useEffect } from 'react';
import { Pagination } from '../common/Pagination';
import {
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Banknote,
  QrCode,
  Layers,
  FileSpreadsheet,
  Receipt,
  Eye,
  ShoppingBag
} from 'lucide-react';
import { OfflineOrder, ShopDetails } from '../../types';
import { formatINR } from '../../lib/utils';
import { POSReceiptModal } from './POSReceiptModal';

interface OfflineOrdersViewProps {
  orders: OfflineOrder[];
  shopDetails: ShopDetails;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const OfflineOrdersView: React.FC<OfflineOrdersViewProps> = ({
  orders = [],
  shopDetails,
  onShowToast
}) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OfflineOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, paymentFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      const matchesPayment = paymentFilter === 'all' || o.paymentMode === paymentFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.billNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q));
      return matchesPayment && matchesSearch;
    });
  }, [orders, paymentFilter, search]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredOrders.slice(start, start + 10);
  }, [filteredOrders, currentPage]);

  // Summaries
  const stats = useMemo(() => {
    const totalRevenue = (orders || []).reduce((sum, o) => sum + o.grandTotal, 0);
    const totalCash = (orders || []).reduce((sum, o) => sum + (o.cashAmount || (o.paymentMode === 'Cash' ? o.grandTotal : 0)), 0);
    const totalUpi = (orders || []).reduce((sum, o) => sum + (o.upiAmount || (o.paymentMode === 'UPI' ? o.grandTotal : 0)), 0);
    return {
      totalRevenue,
      totalCash,
      totalUpi,
      totalCount: (orders || []).length
    };
  }, [orders]);

  // Export CSV of Offline Orders
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      onShowToast('info', 'No Data', 'No offline orders to export.');
      return;
    }

    const headers = ['Bill Number', 'Date', 'Customer Name', 'Customer Phone', 'Payment Mode', 'Subtotal', 'GST Amount', 'Discount', 'Grand Total', 'Cash Amount', 'UPI Amount', 'UPI Ref'];
    const rows = filteredOrders.map((o) => [
      o.billNumber,
      new Date(o.createdAt).toLocaleString('en-IN'),
      `"${o.customerName || 'Walk-in Customer'}"`,
      `"${o.customerPhone || ''}"`,
      o.paymentMode,
      o.subtotal,
      o.gstAmount,
      o.discountAmount || 0,
      o.grandTotal,
      o.cashAmount || 0,
      o.upiAmount || 0,
      `"${o.upiRefNo || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Offline_POS_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'Exported', 'Offline POS orders report downloaded as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total POS Revenue</div>
            <div className="text-xl font-black text-slate-900">{formatINR(stats.totalRevenue)}</div>
            <div className="text-[10px] text-slate-400 font-medium">{stats.totalCount} total counter bills</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Collected</div>
            <div className="text-xl font-black text-emerald-700">{formatINR(stats.totalCash)}</div>
            <div className="text-[10px] text-slate-400 font-medium">Counter cash drawer total</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">UPI Payments</div>
            <div className="text-xl font-black text-indigo-700">{formatINR(stats.totalUpi)}</div>
            <div className="text-[10px] text-slate-400 font-medium">Digital UPI / QR received</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Export POS Report</div>
            <div className="text-[11px] text-slate-400 mt-1">Download CSV register for accounting</div>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bill # or Customer Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium"
          />
        </div>

        {/* Payment mode filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['all', 'Cash', 'UPI', 'Split'].map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paymentFilter === mode
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {mode === 'all' ? 'All Payment Modes' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Offline Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <span>Offline Counter Bills ({filteredOrders.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Bill #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No offline POS orders found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900">{order.billNumber}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{order.customerName || 'Walk-in Customer'}</div>
                      {order.customerPhone && <div className="text-[10px] text-slate-400">{order.customerPhone}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-bold text-slate-900">{order.items.reduce((s, i) => s + i.qty, 0)} Pcs</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                        {order.items.map((i) => `${i.productName} (${i.qty})`).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          order.paymentMode === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentMode === 'UPI'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentMode === 'Cash' && <Banknote className="w-3 h-3" />}
                        {order.paymentMode === 'UPI' && <QrCode className="w-3 h-3" />}
                        {order.paymentMode === 'Split' && <Layers className="w-3 h-3" />}
                        {order.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                      {formatINR(order.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={filteredOrders.length}
          itemsPerPage={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* POS Receipt Modal when clicked */}
      {selectedOrder && (
        <POSReceiptModal
          order={selectedOrder}
          shopDetails={shopDetails}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
