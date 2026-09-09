import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  Boxes,
  FileText,
  Layers,
  Sparkles,
  Receipt
} from 'lucide-react';
import { formatINR, downloadCSV } from '../../lib/utils';
import { printReportPDF } from '../../lib/printUtils';
import { Product, Category, Invoice, Enquiry, OfflineOrder } from '../../types';

interface ReportsViewProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  products: Product[];
  categories: Category[];
  invoices: Invoice[];
  enquiries: Enquiry[];
  offlineOrders: OfflineOrder[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  onShowToast, 
  products, 
  categories, 
  invoices, 
  enquiries, 
  offlineOrders 
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'orders' | 'categories' | 'offline' | 'gst'>('sales');

  const reportData = useMemo(() => {
    // Sales Report
    const salesReport = invoices.map((inv) => ({
      invoiceNo: inv.id,
      enquiryNo: inv.enquiryNo,
      date: new Date(inv.date).toLocaleDateString(),
      customerName: inv.customerDetails.name,
      mobile: inv.customerDetails.mobile,
      itemsCount: inv.items.reduce((s, i) => s + i.qty, 0),
      subtotal: inv.subtotal,
      gstAmount: inv.gstAmount,
      grandTotal: inv.grandTotal,
      status: inv.status
    }));

    // Inventory Report
    const inventoryReport = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      let stockStatus = 'In Stock';
      if ((p.currentStock || 0) === 0) stockStatus = 'Out of Stock';
      else if ((p.currentStock || 0) <= (p.lowStockLimit || 5)) stockStatus = 'Low Stock';

      return {
        sku: p.sku,
        name: p.name,
        category: cat ? cat.name : 'Uncategorized',
        itemsPerPack: p.itemsPerPack,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        currentStock: p.currentStock,
        status: stockStatus,
        stockValue: (p.currentStock || 0) * p.purchasePrice
      };
    });

    // Orders/Enquiries Report
    const orderReport = enquiries.map((enq) => ({
      enquiryNo: enq.id,
      date: new Date(enq.createdAt).toLocaleDateString(),
      customerName: enq.customerDetails.name,
      mobile: enq.customerDetails.mobile,
      itemsCount: enq.items.reduce((s, i) => s + i.qty, 0),
      totalAmount: enq.totalAmount,
      status: enq.status,
      invoiceGenerated: enq.invoiceGenerated ? 'YES' : 'NO'
    }));

    // Categories Sales & Stock Value
    const categoryReport = categories.map((cat) => {
      const catProds = products.filter((p) => p.categoryId === cat.id);
      const totalStock = catProds.reduce((s, p) => s + (p.currentStock || 0), 0);
      const stockValue = catProds.reduce((s, p) => s + ((p.currentStock || 0) * p.purchasePrice), 0);

      // Calc sales value from invoices
      let salesValue = 0;
      invoices.forEach(inv => {
        if (inv.status === 'confirmed') {
          inv.items.forEach(item => {
            const prod = products.find(p => p.id === item.productId);
            if (prod && prod.categoryId === cat.id) {
              salesValue += (item.qty * item.price);
            }
          });
        }
      });

      return {
        category: cat.name,
        totalProducts: catProds.length,
        totalStock,
        stockValue,
        salesValue
      };
    });

    const offlineReport = offlineOrders.map(o => ({
      billNumber: o.billNumber,
      date: new Date(o.createdAt).toLocaleString(),
      customerName: o.customerName || 'Walk-in Customer',
      customerPhone: o.customerPhone || 'N/A',
      paymentMode: o.paymentMode,
      cashAmount: o.cashAmount || 0,
      upiAmount: o.upiAmount || 0,
      subtotal: o.subtotal,
      gstAmount: o.gstAmount,
      grandTotal: o.grandTotal
    }));

    const gstReport = [
      ...invoices.filter(i => i.isGstBill).map(i => ({
        billNo: i.id,
        source: 'Online B2B',
        date: new Date(i.date).toLocaleDateString(),
        customerName: i.customerDetails.name,
        customerPhone: i.customerDetails.mobile,
        itemsCount: i.items.reduce((sum, item) => sum + item.qty, 0),
        subtotal: i.subtotal,
        gstAmount: i.gstAmount,
        grandTotal: i.grandTotal
      })),
      ...offlineOrders.filter(o => o.isGstBill).map(o => ({
        billNo: o.billNumber,
        source: 'POS Offline',
        date: new Date(o.date || o.createdAt).toLocaleDateString(),
        customerName: o.customerName || 'Walk-in',
        customerPhone: o.customerPhone || 'N/A',
        itemsCount: o.items.reduce((sum, item) => sum + item.qty, 0),
        subtotal: o.subtotal,
        gstAmount: o.gstAmount,
        grandTotal: o.grandTotal
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      salesReport,
      inventoryReport,
      orderReport,
      categoryReport,
      offlineReport,
      gstReport
    };
  }, [products, categories, invoices, enquiries, offlineOrders]);

  const isLoading = false;

  const handleExportCSV = () => {
    if (!reportData) return;

    if (activeTab === 'sales') {
      downloadCSV('b2b_sales_report.csv', reportData.salesReport);
    } else if (activeTab === 'inventory') {
      downloadCSV('inventory_stock_report.csv', reportData.inventoryReport);
    } else if (activeTab === 'orders') {
      downloadCSV('customer_enquiries_report.csv', reportData.orderReport);
    } else if (activeTab === 'categories') {
      downloadCSV('category_sales_report.csv', reportData.categoryReport);
    } else if (activeTab === 'offline') {
      downloadCSV('offline_pos_sales_report.csv', reportData.offlineReport || []);
    } else if (activeTab === 'gst') {
      downloadCSV('gst_bills_report.csv', reportData.gstReport || []);
    }

    onShowToast('success', 'CSV Exported', `${activeTab.toUpperCase()} report saved to downloads.`);
  };

  const handlePrint = () => {
    const el = document.getElementById('report-table-container');
    if (el) {
      printReportPDF(`${activeTab.toUpperCase()} REPORT`, el.innerHTML);
    } else {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Generating business reports...
      </div>
    );
  }

  return (
    <div className="space-y-4 print:space-y-4">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-3 shadow-sm print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-red-600" /> Business Reports & Export Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed sales history, stock valuation, order conversion rates, and category performance.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel / CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print PDF Summary
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 print:hidden">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'sales'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Sales Report
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'inventory'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" /> Inventory Report
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'orders'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Order Report
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'categories'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Category Report
        </button>

        <button
          onClick={() => setActiveTab('offline')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'offline'
              ? 'bg-amber-600 text-slate-950 shadow-sm font-black'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-amber-500" /> POS Offline Sales
        </button>
        <button
          onClick={() => setActiveTab('gst')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'gst'
              ? 'bg-emerald-600 text-white shadow-sm font-black'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> GST Bills
        </button>
      </div>

      {/* Report Table View */}
      <div id="report-table-container" className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm printable-document print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Printable Title */}
        <div className="p-3 border-b border-slate-200 hidden print:block">
          <h2 className="text-lg font-bold">Sri Laxmi Fireworks Wholesale - B2B {activeTab.toUpperCase()} REPORT</h2>
          <p className="text-xs text-slate-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* 1. SALES REPORT */}
        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
                <tr>
                  <th className="py-2 px-3">Invoice No</th>
                  <th className="py-2 px-3">Enquiry Ref</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3 text-center">Items</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-3 text-right">GST (18%)</th>
                  <th className="py-2 px-3 text-right">Grand Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.salesReport.map((r: any) => (
                  <tr key={r.invoiceNo} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-mono font-bold text-red-700">{r.invoiceNo}</td>
                    <td className="py-1.5 px-3 text-slate-600 font-mono">{r.enquiryNo}</td>
                    <td className="py-1.5 px-3 text-slate-600">{r.date}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">{r.customerName}</td>
                    <td className="py-1.5 px-3 text-center font-mono">{r.itemsCount}</td>
                    <td className="py-1.5 px-3 text-right font-mono">{formatINR(r.subtotal)}</td>
                    <td className="py-1.5 px-3 text-right font-mono">{formatINR(r.gstAmount)}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-red-700">
                      {formatINR(r.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. INVENTORY REPORT */}
        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
                <tr>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Product Name</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Pack Info</th>
                  <th className="py-2 px-3 text-right">Selling Rate</th>
                  <th className="py-2 px-3 text-center">Stock</th>
                  <th className="py-2 px-3 text-right">Total Stock Value</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.inventoryReport.map((r: any) => (
                  <tr key={r.sku} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-mono font-bold text-red-700">{r.sku}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">{r.name}</td>
                    <td className="py-1.5 px-3 text-slate-600">{r.category}</td>
                    <td className="py-1.5 px-3 text-slate-600">{r.itemsPerPack}</td>
                    <td className="py-1.5 px-3 text-right font-mono">{formatINR(r.sellingPrice)}</td>
                    <td className="py-1.5 px-3 text-center font-bold font-mono">{r.currentStock}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-red-700">
                      {formatINR(r.totalValue)}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {r.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. ORDER REPORT */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
                <tr>
                  <th className="py-2 px-3">Enquiry No</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3 text-center">Items</th>
                  <th className="py-2 px-3 text-right">Total Amount</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Invoice Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.orderReport.map((r: any) => (
                  <tr key={r.enquiryNo} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-mono font-bold text-red-700">{r.enquiryNo}</td>
                    <td className="py-1.5 px-3 text-slate-600">{r.date}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">{r.customerName}</td>
                    <td className="py-1.5 px-3 font-mono text-slate-600">{r.mobile}</td>
                    <td className="py-1.5 px-3 text-center font-mono">{r.itemsCount}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-red-700">
                      {formatINR(r.totalAmount)}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold">{r.status}</td>
                    <td className="py-1.5 px-3 text-center font-bold text-emerald-700">
                      {r.invoiceGenerated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. CATEGORY REPORT */}
        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-tight text-[10px]">
                <tr>
                  <th className="py-2 px-3">Category Name</th>
                  <th className="py-2 px-3 text-center">Products Count</th>
                  <th className="py-2 px-3 text-center">Total Units Stock</th>
                  <th className="py-2 px-3 text-right">Total Stock Value</th>
                  <th className="py-2 px-3 text-right">Confirmed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.categoryReport.map((r: any) => (
                  <tr key={r.category} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-bold text-slate-900">{r.category}</td>
                    <td className="py-1.5 px-3 text-center font-mono">{r.totalProducts}</td>
                    <td className="py-1.5 px-3 text-center font-mono">{r.totalStock}</td>
                    <td className="py-1.5 px-3 text-right font-mono">{formatINR(r.stockValue)}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-red-700">
                      {formatINR(r.salesValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. OFFLINE POS REPORT */}
        {activeTab === 'offline' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-amber-50 text-slate-900 font-bold border-b border-amber-200 uppercase tracking-tight text-[10px]">
                <tr>
                  <th className="py-2 px-3">Bill Number</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3 text-center">Payment Mode</th>
                  <th className="py-2 px-3 text-right">Cash Amount</th>
                  <th className="py-2 px-3 text-right">UPI Amount</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-3 text-right">GST</th>
                  <th className="py-2 px-3 text-right">Grand Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(!reportData.offlineReport || reportData.offlineReport.length === 0) ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">
                      No offline POS bills recorded yet. Create one in POS Counter Billing!
                    </td>
                  </tr>
                ) : (
                  reportData.offlineReport.map((r: any) => (
                    <tr key={r.billNumber} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-mono font-bold text-amber-800">{r.billNumber}</td>
                      <td className="py-1.5 px-3 text-slate-600">{r.date}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900">{r.customerName}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600">{r.customerPhone}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-black text-[10px] uppercase bg-amber-100 text-amber-900">
                          {r.paymentMode}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-emerald-700">{formatINR(r.cashAmount)}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-indigo-700">{formatINR(r.upiAmount)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{formatINR(r.subtotal)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{formatINR(r.gstAmount)}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-900">
                        {formatINR(r.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. GST BILLS REPORT */}
        {activeTab === 'gst' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-emerald-50 text-slate-900 font-bold border-b border-emerald-200 uppercase tracking-tight text-[10px]">
                <tr>
                  <th className="py-2 px-3">Bill/Inv No</th>
                  <th className="py-2 px-3">Source</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3 text-center">Items</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-3 text-right">GST Amount</th>
                  <th className="py-2 px-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!reportData.gstReport || reportData.gstReport.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No GST Bills found.
                    </td>
                  </tr>
                ) : (
                  reportData.gstReport.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-bold text-slate-900 font-mono">{r.billNo}</td>
                      <td className="py-1.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${r.source === 'Online B2B' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'}`}>
                          {r.source}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-600">{r.date}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900">{r.customerName}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600">{r.customerPhone}</td>
                      <td className="py-1.5 px-3 text-center font-mono">{r.itemsCount}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{formatINR(r.subtotal)}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-emerald-700 font-bold">{formatINR(r.gstAmount)}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(r.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
