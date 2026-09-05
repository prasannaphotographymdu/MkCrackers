import React, { useState, useEffect, useMemo } from 'react';
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
  ShoppingBag,
  AlertCircle
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
import { CategoryManagement } from './CategoryManagement';
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
  saveOfflineOrderToFirestore,
  subscribeStockOutNotifications,
  generateStaticSKUCatalog,
  clearNotifications
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

    const [notifications, setNotifications] = useState<any[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const setTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  useEffect(() => {
    if (externalTab) setCurrentTab(externalTab);
  }, [externalTab]);

  useEffect(() => {
    
    // Firestore Real-time subscriptions for Admin Console
    const unsubProds = subscribeProducts((liveProds) => setProducts(liveProds), (err) => console.warn(err));
    const unsubCats = subscribeCategories((liveCats) => setCategories(liveCats), (err) => console.warn(err));
    const unsubEnqs = subscribeEnquiries((liveEnqs) => setEnquiries(liveEnqs), (err) => console.warn(err));
    const unsubInvs = subscribeInvoices((liveInvs) => setInvoices(liveInvs), (err) => console.warn(err));
    const unsubOffline = subscribeOfflineOrders((liveOrders) => setOfflineOrders(liveOrders), (err) => console.warn(err));
    const unsubNotifs = subscribeStockOutNotifications((liveNotifs) => {
      setNotifications(liveNotifs.filter((n) => n.status === 'unread'));
    });

    return () => {
      unsubProds();
      unsubCats();
      unsubEnqs();
      unsubInvs();
      unsubOffline();
      unsubNotifs();
    };
  }, []);

  const handleRegenerateCatalog = async () => {
    setIsRegenerating(true);
    try {
      await generateStaticSKUCatalog();
      onShowToast(
        'success',
        'Static Catalog Regenerated!',
        'Successfully compiled active items and categories into configs/catalog_sku. Public visitors will now view these instantly with 1 document read.'
      );
    } catch (err: any) {
      onShowToast('error', 'Regeneration Failed', err?.message || 'Could not compile static snap.');
    } finally {
      setIsRegenerating(false);
    }
  };

  
  // Compute live fallbacks so Dashboard is NEVER empty even on static hosting or offline
  const computedStats: DashboardStats = useMemo(() => {
    if (stats) return stats;

    const todayStr = new Date().toISOString().split('T')[0];

    const todayInvoiceSales = (invoices || [])
      .filter((i) => i.createdAt && i.createdAt.startsWith(todayStr))
      .reduce((s, i) => s + (i.grandTotal || 0), 0);
    const todayPOSSales = (offlineOrders || [])
      .filter((o) => o.createdAt && o.createdAt.startsWith(todayStr))
      .reduce((s, o) => s + (o.grandTotal || 0), 0);
    const todaySales = todayInvoiceSales + todayPOSSales;

    const totalInvoiceSales = (invoices || []).reduce((s, i) => s + (i.grandTotal || 0), 0);
    const totalPOSSales = (offlineOrders || []).reduce((s, o) => s + (o.grandTotal || 0), 0);
    const totalSales = totalInvoiceSales + totalPOSSales;

    const pendingOrders = (enquiries || []).filter((e) => e.status === 'Pending').length;
    const closedOrders = (enquiries || []).filter((e) => e.status === 'Cancelled').length;
    const totalSuccessfulOrders = (invoices || []).length + (offlineOrders || []).length;
    const totalEnquiries = (enquiries || []).length;

    const lowStockProducts = (products || []).filter((p) => (p.currentStock || 0) > 0 && (p.currentStock || 0) <= (p.lowStockLimit || 5)).length;
    const outOfStockProducts = (products || []).filter((p) => (p.currentStock || 0) === 0).length;
    const inventoryValue = (products || []).reduce((s, p) => s + (p.currentStock || 0) * (p.sellingPrice || 0), 0);

    return {
      todaySales,
      totalSales,
      totalSuccessfulOrders,
      pendingOrders,
      closedOrders,
      totalEnquiries,
      lowStockProducts,
      outOfStockProducts,
      inventoryValue
    };
  }, [stats, invoices, offlineOrders, enquiries, products]);

  const computedDailySales: DailySalesData[] = useMemo(() => {
    if (dailySales && dailySales.length > 0) return dailySales;

    const days: { [key: string]: { sales: number; orders: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = { sales: 0, orders: 0 };
    }

    (invoices || []).forEach((inv) => {
      const day = inv.createdAt ? inv.createdAt.split('T')[0] : '';
      if (days[day]) {
        days[day].sales += inv.grandTotal || 0;
        days[day].orders += 1;
      }
    });

    (offlineOrders || []).forEach((off) => {
      const day = off.createdAt ? off.createdAt.split('T')[0] : '';
      if (days[day]) {
        days[day].sales += off.grandTotal || 0;
        days[day].orders += 1;
      }
    });

    return Object.entries(days).map(([dateStr, val]) => ({
      date: new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      sales: val.sales,
      orders: val.orders
    }));
  }, [dailySales, invoices, offlineOrders]);

  const computedMonthlySales: MonthlySalesData[] = useMemo(() => {
    if (monthlySales && monthlySales.length > 0) return monthlySales;

    const months: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    (invoices || []).forEach((inv) => {
      if (inv.createdAt) {
        const key = inv.createdAt.slice(0, 7);
        if (months[key] !== undefined) {
          months[key] += inv.grandTotal || 0;
        }
      }
    });

    (offlineOrders || []).forEach((off) => {
      if (off.createdAt) {
        const key = off.createdAt.slice(0, 7);
        if (months[key] !== undefined) {
          months[key] += off.grandTotal || 0;
        }
      }
    });

    return Object.entries(months).map(([mKey, sales]) => {
      const [yr, mo] = mKey.split('-');
      const dateObj = new Date(parseInt(yr), parseInt(mo) - 1, 1);
      return {
        month: dateObj.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        sales
      };
    });
  }, [monthlySales, invoices, offlineOrders]);

  const computedCategorySales: CategorySalesData[] = useMemo(() => {
    if (categorySales && categorySales.length > 0) return categorySales;

    const catMap: { [key: string]: number } = {};
    (categories || []).forEach((c) => {
      catMap[c.name] = 0;
    });

    (invoices || []).forEach((inv) => {
      (inv.items || []).forEach((it) => {
        const cat = it.category || 'General Crackers';
        catMap[cat] = (catMap[cat] || 0) + (it.amount || 0);
      });
    });

    (offlineOrders || []).forEach((off) => {
      (off.items || []).forEach((it) => {
        const cat = it.category || 'General Crackers';
        catMap[cat] = (catMap[cat] || 0) + (it.amount || 0);
      });
    });

    const result = Object.entries(catMap).map(([category, sales]) => ({
      category,
      sales
    }));

    if (result.length === 0) {
      return [{ category: 'General Crackers', sales: 0 }];
    }
    return result;
  }, [categorySales, categories, invoices, offlineOrders]);

  const handleCreateOfflineOrder = async (orderPayload: any): Promise<OfflineOrder> => {
    let data: OfflineOrder;
    try {
      const res = await fetch('/api/offline-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Static hosting fallback');
      }
    } catch (err) {
      const processedItems = (orderPayload.items || []).map((i: any) => {
        const prod = products.find((p) => p.id === i.productId);
        const productName = i.productName || prod?.name || 'Firecracker Item';
        const sku = i.sku || prod?.sku || 'SKU-000';
        const qty = Number(i.qty) || 1;
        const unitPrice = Number(i.unitPrice) || prod?.sellingPrice || 0;
        const gstPercent = Number(i.gstPercent) || prod?.gstPercent || 18;
        const lineTotal = Number(i.amount) || (qty * unitPrice);
        const basePrice = lineTotal / (1 + gstPercent / 100);
        const itemGst = lineTotal - basePrice;
        return {
          productId: i.productId || prod?.id || '',
          productName,
          sku,
          qty,
          unitPrice,
          gstPercent,
          gstAmount: Number(itemGst.toFixed(2)),
          amount: lineTotal
        };
      });

      const subtotalCalc = processedItems.reduce((sum: number, i: any) => sum + (i.amount / (1 + i.gstPercent / 100)), 0);
      const gstCalc = processedItems.reduce((sum: number, i: any) => sum + i.gstAmount, 0);
      const totalCalc = processedItems.reduce((sum: number, i: any) => sum + i.amount, 0);

      data = {
        id: `POS-${Date.now().toString().slice(-6)}`,
        billNumber: `POS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        customerName: orderPayload.customerName || 'Walk-in Customer',
        customerPhone: orderPayload.customerPhone || orderPayload.phone || '',
        subtotal: orderPayload.subtotal ?? Number(subtotalCalc.toFixed(2)),
        gstAmount: orderPayload.gstAmount ?? Number(gstCalc.toFixed(2)),
        discountAmount: orderPayload.discountAmount || 0,
        grandTotal: orderPayload.grandTotal || orderPayload.totalAmount || Math.max(0, Math.round(totalCalc - (orderPayload.discountAmount || 0))),
        paymentMode: orderPayload.paymentMode || 'Cash',
        cashAmount: orderPayload.cashAmount,
        upiAmount: orderPayload.upiAmount,
        upiRefNo: orderPayload.upiRefNo,
        items: processedItems,
        createdAt: new Date().toISOString()
      };
    }

    setOfflineOrders((prev) => [data, ...prev]);

    try {
      await saveOfflineOrderToFirestore(data);
    } catch (fsErr) {
      console.warn('Firestore offline sync notice:', fsErr);
    }

    return data;
  };

  // Product CRUD
  const handleCreateProduct = async (prodData: Partial<Product>) => {
    let created: Product;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodData)
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        created = await res.json();
      } else {
        throw new Error('Static mode');
      }
    } catch (err) {
      created = {
        id: `PROD-${Date.now().toString().slice(-6)}`,
        name: prodData.name || 'New Product',
        sku: prodData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        categoryId: prodData.categoryId || 'c1',
        purchasePrice: prodData.purchasePrice || 0,
        sellingPrice: prodData.sellingPrice || 0,
        itemsPerPack: prodData.itemsPerPack || '1 Box',
        gstPercent: prodData.gstPercent || 18,
        openingStock: prodData.openingStock || 0,
        currentStock: prodData.currentStock || 0,
        lowStockLimit: prodData.lowStockLimit || 10,
        status: prodData.status || 'active',
        description: prodData.description || '',
        image: prodData.image || ''
      };
    }
    await saveProductToFirestore(created);
  };

  const handleUpdateProduct = async (id: string, prodData: Partial<Product>) => {
    let updated: Product;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodData)
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        updated = await res.json();
      } else {
        throw new Error('Static mode');
      }
    } catch (err) {
      const existing = products.find((p) => p.id === id);
      updated = {
        ...(existing || {
          id,
          name: '',
          sku: '',
          categoryId: '',
          purchasePrice: 0,
          sellingPrice: 0,
          itemsPerPack: '1 Box',
          gstPercent: 18,
          openingStock: 0,
          currentStock: 0,
          lowStockLimit: 10,
          description: '',
          image: '',
          status: 'active'
        }),
        ...prodData
      };
    }
    await saveProductToFirestore(updated);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (err) {}
    await deleteProductFromFirestore(id);
  };

  const handleBulkImportCSV = async (items: any[]) => {
    try {
      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        return data;
      }
    } catch (err) {}

    // Firestore direct bulk import fallback
    for (const item of items) {
      const p: Product = {
        id: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: item.name || 'Imported Product',
        sku: item.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        categoryId: item.categoryId || 'c1',
        purchasePrice: Number(item.purchasePrice) || 0,
        sellingPrice: Number(item.sellingPrice) || 0,
        itemsPerPack: item.itemsPerPack || '1 Box',
        gstPercent: Number(item.gstPercent) || 18,
        openingStock: Number(item.currentStock) || 0,
        currentStock: Number(item.currentStock) || 0,
        lowStockLimit: Number(item.lowStockLimit) || 10,
        status: item.status === 'inactive' ? 'inactive' : 'active',
        description: item.description || '',
        image: item.image || ''
      };
      await saveProductToFirestore(p);
    }
    return { count: items.length };
  };

  // Stock Update
  const handleUpdateStock = async (productId: string, newStock: number) => {
    const existing = products.find((p) => p.id === productId);
    if (existing) {
      const updated = { ...existing, currentStock: newStock, updatedAt: new Date().toISOString() };
      
      // Update local React state instantly for immediate feedback
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      
      try {
        const res = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentStock: newStock })
        });
        if (res.ok) {
          onShowToast('success', 'Stock Adjusted', `Successfully adjusted stock for ${existing.sku} to ${newStock}.`);
        } else {
          throw new Error('Failed to update stock on backend');
        }
      } catch (err) {
        console.warn('Backend stock update failed, falling back to direct Firestore write:', err);
        await saveProductToFirestore(updated);
      }
      
      // Refresh all admin data (such as statistics and charts) to guarantee synchronization
    }
  };

  // Enquiry Status Update
  const handleUpdateEnquiryStatus = async (
    id: string,
    status: Enquiry['status'],
    notes?: string
  ) => {
    try {
      await fetch(`/api/enquiries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
    } catch (err) {}
    await updateEnquiryStatusInFirestore(id, status, notes);
  };

  // Generate Invoice Action
  const handleGenerateInvoice = async (enquiryId: string): Promise<Invoice> => {
    let data: Invoice;
    try {
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiryId })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Static mode');
      }
    } catch (err) {
      const enq = enquiries.find((e) => e.id === enquiryId);
      const invId = `INV-${Date.now().toString().slice(-6)}`;
      data = {
        id: invId,
        enquiryId,
        enquiryNo: enquiryId,
        customerId: enq?.customerId || 'CUST-001',
        customerDetails: enq?.customerDetails || {
          name: 'Customer',
          mobile: '',
          address: ''
        },
        date: new Date().toISOString().split('T')[0],
        subtotal: enq?.totalAmount || 0,
        gstAmount: Math.round((enq?.totalAmount || 0) * 0.18),
        grandTotal: Math.round((enq?.totalAmount || 0) * 1.18),
        status: 'Generated',
        items: (enq?.items || []).map((i, idx) => ({
          id: `II-${Date.now()}-${idx}`,
          invoiceId: invId,
          productId: i.productId,
          productName: i.productName || 'Firecracker Item',
          sku: i.sku || '',
          qty: i.qty,
          unitPrice: i.unitPrice,
          sellingPrice: i.unitPrice,
          gstPercent: 18,
          gstAmount: Math.round(i.qty * i.unitPrice * 0.18),
          amount: Math.round(i.qty * i.unitPrice * 1.18)
        })),
        shopDetails,
        createdAt: new Date().toISOString()
      };
    }

    await saveInvoiceToFirestore(data);
    return data;
  };



  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Admin Sub Navigation Bar */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 sticky top-12 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between overflow-x-auto gap-4 hide-scrollbar">
          <div className="flex items-center gap-1 py-1.5 text-xs shrink-0 min-w-max">
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
              onClick={() => setTab('categories')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'categories'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" /> Categories
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
              onClick={handleRegenerateCatalog}
              disabled={isRegenerating}
              title="Update SKU / Regenerate Public Catalog"
              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              Update SKU Catalog
            </button>
            <button
              onClick={() => {}}
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
        {/* Stock-out & Stale Catalog Alert Banner */}
        {notifications.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md p-3.5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
            <div className="flex gap-2.5">
              <span className="p-1 rounded bg-amber-100 text-amber-800 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  Stock-out Alert! ({notifications.length} item{notifications.length > 1 ? 's' : ''} out of stock)
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  The following items are out of stock: <span className="font-semibold font-mono">{notifications.map((n) => `${n.productName} (${n.sku})`).join(', ')}</span>.
                  Regenerate the static online catalog to ensure buyers see live stock levels and avoid ordering unavailable items.
                </p>
              </div>
            </div>
            <button
              onClick={handleRegenerateCatalog}
              disabled={isRegenerating}
              className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Updating...' : 'Update SKU Catalog Now'}
            </button>
          </div>
        )}
        {currentTab === 'dashboard' && (
          <AdminDashboard
            stats={computedStats}
            dailySales={computedDailySales}
            monthlySales={computedMonthlySales}
            categorySales={computedCategorySales}
            onNavigateTab={setTab}
          />
        )}

        {currentTab === 'pos' && (
          <POSBilling
            products={products}
            categories={categories}
            shopDetails={shopDetails}
            offlineOrders={offlineOrders}
            invoices={invoices}
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
        {currentTab === 'categories' && (
          <CategoryManagement categories={categories} />
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
