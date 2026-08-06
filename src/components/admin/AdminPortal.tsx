import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  FileText,
  Boxes,
  FileSpreadsheet,
  LogOut,
  RefreshCw,
  Sparkles,
  Building2,
  Receipt,
  ShoppingBag
} from 'lucide-react';
import {
  AdminTab,
  Category,
  Product,
  Enquiry,
  Invoice,
  DashboardStats,
  DailySalesData,
  MonthlySalesData,
  CategorySalesData,
  ShopDetails,
  OfflineOrder
} from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { ProductManagement } from './ProductManagement';
import { EnquiryManagement } from './EnquiryManagement';
import { InventoryManagement } from './InventoryManagement';
import { ReportsView } from './ReportsView';
import { CompanyProfileSettings } from './CompanyProfileSettings';
import { POSBilling } from './POSBilling';
import { OfflineOrdersView } from './OfflineOrdersView';
import {
  subscribeProducts,
  subscribeCategories,
  subscribeEnquiries,
  subscribeInvoices,
  subscribeOfflineOrders,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveCategoryToFirestore,
  updateEnquiryStatusInFirestore,
  saveInvoiceToFirestore,
  saveOfflineOrderToFirestore
} from '../../lib/firebase';

interface AdminPortalProps {
  onLogout: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  shopDetails: ShopDetails;
  onSaveShopDetails: (updated: ShopDetails) => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onLogout,
  onShowToast,
  activeTab: externalTab,
  onTabChange,
  shopDetails,
  onSaveShopDetails
}) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>(externalTab || 'dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [offlineOrders, setOfflineOrders] = useState<OfflineOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const setTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  useEffect(() => {
    if (externalTab) setCurrentTab(externalTab);
  }, [externalTab]);

  useEffect(() => {
    loadAllAdminData();

    // Firestore Real-time subscriptions for Admin Console
    const unsubProds = subscribeProducts((liveProds) => setProducts(liveProds));
    const unsubCats = subscribeCategories((liveCats) => setCategories(liveCats));
    const unsubEnqs = subscribeEnquiries((liveEnqs) => setEnquiries(liveEnqs));
    const unsubInvs = subscribeInvoices((liveInvs) => setInvoices(liveInvs));
    const unsubOffline = subscribeOfflineOrders((liveOrders) => setOfflineOrders(liveOrders));

    return () => {
      unsubProds();
      unsubCats();
      unsubEnqs();
      unsubInvs();
      unsubOffline();
    };
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [catsRes, prodsRes, enqRes, invRes, offlineRes, statsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products?status=all'),
        fetch('/api/enquiries'),
        fetch('/api/invoices'),
        fetch('/api/offline-orders'),
        fetch('/api/stats')
      ]);

      const [cats, prods, enqs, invs, offOrders, statsData] = await Promise.all([
        catsRes.json(),
        prodsRes.json(),
        enqRes.json(),
        invRes.json(),
        offlineRes.json(),
        statsRes.json()
      ]);

      if (cats && cats.length) setCategories(cats);
      if (prods && prods.length) setProducts(prods);
      if (enqs && enqs.length) setEnquiries(enqs);
      if (invs && invs.length) setInvoices(invs);
      if (offOrders && offOrders.length) setOfflineOrders(offOrders);

      if (statsData) {
        setStats(statsData.stats);
        setDailySales(statsData.dailySales);
        setMonthlySales(statsData.monthlySales);
        setCategorySales(statsData.categorySales);
      }
    } catch (err) {
      console.warn('Falling back to Firestore snapshot data...');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOfflineOrder = async (orderPayload: any): Promise<OfflineOrder> => {
    const res = await fetch('/api/offline-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to generate offline POS bill');
    }

    // Atomic sync to Firestore offlineOrders collection & deduct stock in Firestore
    try {
      await saveOfflineOrderToFirestore(data);
    } catch (fsErr) {
      console.warn('Firestore offline sync notice:', fsErr);
    }

    await loadAllAdminData();
    return data;
  };

  // Product CRUD
  const handleCreateProduct = async (prodData: Partial<Product>) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create product');
    }
    const created: Product = await res.json();
    await saveProductToFirestore(created);
    await loadAllAdminData();
  };

  const handleUpdateProduct = async (id: string, prodData: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update product');
    }
    const updated: Product = await res.json();
    await saveProductToFirestore(updated);
    await loadAllAdminData();
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    await deleteProductFromFirestore(id);
    await loadAllAdminData();
  };

  const handleBulkImportCSV = async (items: any[]) => {
    const res = await fetch('/api/products/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Bulk import failed');

    // Sync imported products to Firestore
    try {
      const refreshedProds = await (await fetch('/api/products?status=all')).json();
      for (const p of refreshedProds) {
        await saveProductToFirestore(p);
      }
    } catch (fsErr) {
      console.warn('Firestore bulk sync notice:', fsErr);
    }

    await loadAllAdminData();
    return data;
  };

  // Stock Update
  const handleUpdateStock = async (productId: string, newStock: number) => {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentStock: newStock })
    });
    if (!res.ok) throw new Error('Failed to update stock');
    const updated: Product = await res.json();
    await saveProductToFirestore(updated);
    await loadAllAdminData();
  };

  // Enquiry Status Update
  const handleUpdateEnquiryStatus = async (
    id: string,
    status: 'Pending' | 'Success' | 'Closed',
    notes?: string
  ) => {
    const res = await fetch(`/api/enquiries/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update status');
    }
    await updateEnquiryStatusInFirestore(id, status, notes);
    await loadAllAdminData();
  };

  // Generate Invoice Action
  const handleGenerateInvoice = async (enquiryId: string): Promise<Invoice> => {
    const res = await fetch('/api/invoices/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiryId })
    });

    const data: Invoice = await res.json();
    if (!res.ok) {
      throw new Error((data as any).message || 'Failed to generate invoice');
    }

    await saveInvoiceToFirestore(data);
    await loadAllAdminData();
    return data;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-slate-900 font-sans">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading B2B Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Admin Sub Navigation Bar */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 sticky top-12 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-1 py-1.5 text-xs">
            <button
              onClick={() => setTab('dashboard')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'dashboard'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" /> Dashboard
            </button>

            <button
              onClick={() => setTab('pos')}
              className={`px-3 py-1 rounded text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'pos'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-amber-400 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> POS Counter
            </button>

            <button
              onClick={() => setTab('offline-orders')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'offline-orders'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-300" /> Offline Bills ({offlineOrders.length})
            </button>

            <button
              onClick={() => setTab('products')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'products'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Products ({products.length})
            </button>

            <button
              onClick={() => setTab('enquiries')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 relative ${
                currentTab === 'enquiries'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Enquiries ({enquiries.length})
              {stats?.pendingOrders ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              ) : null}
            </button>

            <button
              onClick={() => setTab('inventory')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'inventory'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" /> Stock & Inventory
            </button>

            <button
              onClick={() => setTab('reports')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'reports'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Reports & Export
            </button>

            <button
              onClick={() => setTab('settings')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'settings'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-300" /> Company Profile
            </button>
          </div>

          <div className="flex items-center gap-1.5 py-1.5 shrink-0">
            <button
              onClick={loadAllAdminData}
              title="Refresh Data"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin View Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        {currentTab === 'dashboard' && stats && (
          <AdminDashboard
            stats={stats}
            dailySales={dailySales}
            monthlySales={monthlySales}
            categorySales={categorySales}
            onNavigateTab={setTab}
          />
        )}

        {currentTab === 'pos' && (
          <POSBilling
            products={products}
            categories={categories}
            shopDetails={shopDetails}
            onCreateOfflineOrder={handleCreateOfflineOrder}
            onShowToast={onShowToast}
          />
        )}

        {currentTab === 'offline-orders' && (
          <OfflineOrdersView
            orders={offlineOrders}
            shopDetails={shopDetails}
            onShowToast={onShowToast}
          />
        )}

        {currentTab === 'products' && (
          <ProductManagement
            products={products}
            categories={categories}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onBulkImportCSV={handleBulkImportCSV}
            onShowToast={onShowToast}
          />
        )}

        {currentTab === 'enquiries' && (
          <EnquiryManagement
            enquiries={enquiries}
            invoices={invoices}
            onUpdateStatus={handleUpdateEnquiryStatus}
            onGenerateInvoice={handleGenerateInvoice}
            onShowToast={onShowToast}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryManagement
            products={products}
            categories={categories}
            onUpdateStock={handleUpdateStock}
            onShowToast={onShowToast}
          />
        )}

        {currentTab === 'reports' && <ReportsView onShowToast={onShowToast} />}

        {currentTab === 'settings' && (
          <CompanyProfileSettings
            shopDetails={shopDetails}
            onSaveShopDetails={onSaveShopDetails}
            onShowToast={onShowToast}
          />
        )}
      </main>
    </div>
  );
};
