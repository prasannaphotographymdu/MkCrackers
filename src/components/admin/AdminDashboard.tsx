import React from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertTriangle,
  PackageX,
  Boxes,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DashboardStats, DailySalesData, MonthlySalesData, CategorySalesData, AdminTab } from '../../types';
import { formatINR, formatNumber } from '../../lib/utils';

interface AdminDashboardProps {
  stats: DashboardStats;
  dailySales: DailySalesData[];
  monthlySales: MonthlySalesData[];
  categorySales: CategorySalesData[];
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  dailySales,
  monthlySales,
  onNavigateTab
}) => {
  return (
    <div className="space-y-4">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-3 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Overview Analytics & B2B Performance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time track of sales, pending enquiries, stock alerts, and factory inventory value.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('pos')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
          >
            <span>POS Counter Billing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onNavigateTab('offline-orders')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
          >
            <span>Offline Bills</span>
          </button>

          <button
            onClick={() => onNavigateTab('enquiries')}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
          >
            <span>Enquiries ({stats.pendingOrders})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Today's Sales */}
        <div className="bg-white border border-slate-200 hover:border-emerald-500 rounded-md p-3 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Today's Sales</span>
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-black text-emerald-700">{formatINR(stats.todaySales)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Confirmed Invoices Today</span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white border border-slate-200 hover:border-red-500 rounded-md p-3 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Total Sales</span>
            <div className="p-1.5 rounded bg-red-50 text-red-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-black text-red-700">{formatINR(stats.totalSales)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Cumulative Generated Invoices</span>
          </div>
        </div>

        {/* Total Successful Orders */}
        <div className="bg-white border border-slate-200 hover:border-teal-500 rounded-md p-3 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Successful Orders</span>
            <div className="p-1.5 rounded bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-black text-slate-900">{formatNumber(stats.totalSuccessfulOrders)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Admin Confirmed + Paid</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => onNavigateTab('enquiries')}
          className="bg-white border border-amber-300 hover:border-amber-500 rounded-md p-3 shadow-sm transition-all cursor-pointer group bg-amber-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1 uppercase">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Orders
            </span>
            <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-mono font-black text-amber-700">{stats.pendingOrders}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting status update</span>
          </div>
        </div>

        {/* Closed Orders */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-md p-3 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Closed Orders</span>
            <div className="p-1.5 rounded bg-slate-100 text-slate-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-black text-slate-700">{formatNumber(stats.closedOrders)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Cancelled / Rejected</span>
          </div>
        </div>

        {/* Total Enquiries */}
        <div className="bg-white border border-slate-200 hover:border-blue-500 rounded-md p-3 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Total Enquiries</span>
            <div className="p-1.5 rounded bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-black text-slate-900">{formatNumber(stats.totalEnquiries)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All Customer Submissions</span>
          </div>
        </div>

        {/* Low Stock Products */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white border border-amber-300 hover:border-amber-500 rounded-md p-3 shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-800 font-bold uppercase">Low Stock Alert</span>
            <div className="p-1.5 rounded bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-black text-amber-700">{stats.lowStockProducts} Items</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Stock ≤ Low Stock Limit</span>
          </div>
        </div>

        {/* Out of Stock Products */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white border border-red-300 hover:border-red-500 rounded-md p-3 shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-red-800 font-bold uppercase">Out of Stock</span>
            <div className="p-1.5 rounded bg-red-50 text-red-600">
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-black text-red-700">{stats.outOfStockProducts} Items</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Stock = 0</span>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white border border-slate-200 hover:border-purple-500 rounded-md p-3 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Inventory Value</span>
            <div className="p-1.5 rounded bg-purple-50 text-purple-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-black text-purple-700">{formatINR(stats.inventoryValue)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Current Total Stock Value</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Sales Chart */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight">Daily Sales & Orders</h3>
            <span className="text-[10px] text-slate-500">Past 7 Days</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '11px' }}
                  formatter={(val: number) => [formatINR(val), 'Sales']}
                />
                <Bar dataKey="sales" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Sales Trend */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight">Monthly Sales Trend</h3>
            <span className="text-[10px] text-slate-500">Past 6 Months</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '11px' }}
                  formatter={(val: number) => [formatINR(val), 'Sales (₹)']}
                />
                <Line type="monotone" dataKey="sales" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
