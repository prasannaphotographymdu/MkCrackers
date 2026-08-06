import React, { useState, useEffect } from 'react';
import { Category, Product, CartItem, CustomerDetails, Enquiry, AdminTab, ShopDetails } from './types';
import { SHOP_INFO } from './data/seed';
import { Header } from './components/Header';
import { LandingPage } from './components/public/LandingPage';
import { PublicShop } from './components/public/PublicShop';
import { CheckoutModal } from './components/public/CheckoutModal';
import { EnquirySuccessModal } from './components/public/EnquirySuccessModal';
import { OrderTrackerModal } from './components/public/OrderTrackerModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminPortal } from './components/admin/AdminPortal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import {
  seedFirestoreIfEmpty,
  subscribeProducts,
  subscribeCategories,
  subscribeShopDetails,
  saveEnquiryToFirestore,
  saveShopDetailsToFirestore
} from './lib/firebase';

export default function App() {
  // Check if current hostname or path is for admin (e.g., admin.mkcrackers.in or /admin or #admin)
  const checkIsAdminHostOrPath = () => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      host.startsWith('admin.') ||
      host.includes('admin.mkcrackers.in') ||
      path.startsWith('/admin') ||
      hash.includes('admin') ||
      search.includes('view=admin')
    );
  };

  // Views & Auth: 'landing' (Default Company Home), 'shop' (Online Store), 'admin' (Dashboard)
  const [view, setView] = useState<'landing' | 'shop' | 'admin'>(() =>
    checkIsAdminHostOrPath() ? 'admin' : 'landing'
  );
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Shop Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [shopDetails, setShopDetails] = useState<ShopDetails>(SHOP_INFO);

  // Modals & UI
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<Enquiry | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerQuery, setTrackerQuery] = useState('');

  const handleOpenTracker = (query?: string) => {
    setTrackerQuery(query || '');
    setIsTrackerOpen(true);
  };

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Data Fetch & Firestore Real-time Synchronization
  useEffect(() => {
    // 1. Check if admin route
    if (checkIsAdminHostOrPath()) {
      setView('admin');
    }

    const handleLocationChange = () => {
      if (checkIsAdminHostOrPath()) {
        setView('admin');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // 2. Seed initial data to Firestore if empty
    seedFirestoreIfEmpty();

    // 3. Fallback REST API initial fetch
    fetchShopCatalog();
    fetchShopInfo();

    // 4. Real-time Firestore Subscriptions
    const unsubProds = subscribeProducts((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts.filter((p) => p.status === 'active'));
      }
    });

    const unsubCats = subscribeCategories((liveCats) => {
      if (liveCats && liveCats.length > 0) {
        setCategories(liveCats);
      }
    });

    const unsubShop = subscribeShopDetails((liveShop) => {
      if (liveShop) {
        setShopDetails(liveShop);
      }
    });

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      unsubProds();
      unsubCats();
      unsubShop();
    };
  }, []);

  const fetchShopCatalog = async () => {
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products?status=active')
      ]);

      const isCatsJson = catsRes.ok && catsRes.headers.get('content-type')?.includes('application/json');
      const isProdsJson = prodsRes.ok && prodsRes.headers.get('content-type')?.includes('application/json');

      if (isCatsJson && isProdsJson) {
        const [catsData, prodsData] = await Promise.all([catsRes.json(), prodsRes.json()]);
        if (catsData && catsData.length > 0) setCategories(catsData);
        if (prodsData && prodsData.length > 0) setProducts(prodsData);
      }
    } catch (err) {
      console.warn('Falling back to Firestore snapshot...');
    }
  };

  const fetchShopInfo = async () => {
    try {
      const res = await fetch('/api/shop-info');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setShopDetails(data);
      }
    } catch (err) {
      console.error('Failed to fetch shop details:', err);
    }
  };

  const handleSaveShopDetails = async (updated: ShopDetails) => {
    // Save to Firestore
    await saveShopDetailsToFirestore(updated);
    setShopDetails(updated);

    // Sync to Express API if running
    try {
      const res = await fetch('/api/shop-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
        // Static hosting mode
      }
    } catch (err) {
      console.warn('Backend API sync fallback warning:', err);
    }
  };

  // Cart Qty Management
  const handleUpdateCartQty = (productId: string, newQty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (newQty <= 0) {
        delete next[productId];
      } else {
        next[productId] = newQty;
      }
      return next;
    });
  };

  const handleClearCart = () => {
    setCart({});
    showToast('info', 'Cart Cleared', 'Your enquiry list has been reset.');
  };

  // Total calculation for cart badge in header
  const cartTotalItems = (Object.values(cart) as number[]).reduce((sum: number, q: number) => sum + Number(q), 0);
  const cartTotalAmount = Object.entries(cart).reduce((sum: number, [pId, qty]) => {
    const q = Number(qty);
    const prod = products.find((p) => p.id === pId);
    return sum + (prod ? prod.sellingPrice * q : 0);
  }, 0);

  // Submit Enquiry Handler
  const handleSubmitEnquiry = async (customerDetails: CustomerDetails) => {
    setIsSubmittingEnquiry(true);

    const items = Object.entries(cart)
      .filter(([_, q]) => Number(q) > 0)
      .map(([pId, qty]) => {
        const q = Number(qty);
        const prod = products.find((p) => p.id === pId);
        return {
          productId: pId,
          qty: q,
          unitPrice: prod ? prod.sellingPrice : 0,
          productName: prod ? prod.name : '',
          sku: prod ? prod.sku : ''
        };
      });

    try {
      let data: Enquiry;

      try {
        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerDetails, items })
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          throw new Error('Static hosting mode');
        }
      } catch (apiErr) {
        // Fallback for Firebase Hosting static deployment without Express backend
        const enqId = `ENQ-${Date.now().toString().slice(-6)}`;
        const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
        const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

        data = {
          id: enqId,
          customerId: `CUST-${Date.now().toString().slice(-4)}`,
          customerDetails: {
            name: customerDetails.name,
            mobile: customerDetails.mobile,
            address: customerDetails.address
          },
          totalItems,
          totalAmount,
          status: 'Pending',
          items: items.map((item, idx) => {
            const prod = products.find((p) => p.id === item.productId);
            return {
              id: `EI-${Date.now()}-${idx}`,
              enquiryId: enqId,
              productId: item.productId,
              productName: item.productName || prod?.name || 'Firecracker Item',
              sku: item.sku || prod?.sku || '',
              qty: item.qty,
              unitPrice: item.unitPrice,
              amount: item.qty * item.unitPrice,
              itemsPerPack: prod?.itemsPerPack || '1 Box'
            };
          }),
          createdAt: new Date().toISOString(),
          invoiceGenerated: false
        };
      }

      // Sync enquiry to Firestore
      try {
        await saveEnquiryToFirestore(data);
      } catch (fsErr) {
        console.warn('Firestore enquiry sync notice:', fsErr);
      }

      setCart({});
      setIsCheckoutOpen(false);
      setSubmittedEnquiry(data);
      showToast('success', 'Enquiry Created!', `Enquiry ${data.id} registered.`);
    } catch (err: any) {
      showToast('error', 'Enquiry Failed', err?.message || 'Failed to submit enquiry');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  // Admin Auth handlers
  const handleAdminLoginSuccess = (token: string) => {
    setIsAdminLoggedIn(true);
    setView('admin');
    showToast('success', 'Admin Authenticated', 'Welcome to Store Manager Portal.');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    if (checkIsAdminHostOrPath()) {
      setView('admin');
    } else {
      setView('landing');
    }
    showToast('info', 'Logged Out', 'Returned to login page.');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Overlay */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Persistent App Header */}
      <Header
        currentView={view}
        onChangeView={(targetView) => {
          setView(targetView);
          if (targetView === 'shop') fetchShopCatalog();
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
        cartTotalItems={cartTotalItems}
        cartTotalAmount={cartTotalAmount}
        shopDetails={shopDetails}
        onOpenCart={() => {
          const minAmt = shopDetails.minimumOrderAmount || 500;
          if (cartTotalItems > 0 && cartTotalAmount >= minAmt) {
            setIsCheckoutOpen(true);
          } else if (cartTotalAmount < minAmt && cartTotalItems > 0) {
            showToast('info', 'Minimum Order Alert', `Minimum enquiry total must be ₹${minAmt}.`);
          } else {
            showToast('info', 'Cart Empty', 'Please select firecrackers from the catalog first.');
          }
        }}
        onOpenTracker={handleOpenTracker}
      />

      {/* Main Content Router */}
      {view === 'landing' ? (
        <LandingPage
          shopDetails={shopDetails}
          categories={categories}
          products={products}
          onGoToStore={() => {
            setView('shop');
            fetchShopCatalog();
          }}
          onOpenTracker={handleOpenTracker}
        />
      ) : view === 'shop' ? (
        <PublicShop
          categories={categories}
          products={products}
          cart={cart}
          onUpdateCartQty={handleUpdateCartQty}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
          onClearCart={handleClearCart}
          onOpenTracker={handleOpenTracker}
          shopDetails={shopDetails}
        />
      ) : isAdminLoggedIn ? (
        <AdminPortal
          onLogout={handleAdminLogout}
          onShowToast={showToast}
          activeTab={adminTab}
          onTabChange={setAdminTab}
          shopDetails={shopDetails}
          onSaveShopDetails={handleSaveShopDetails}
        />
      ) : (
        <AdminLoginModal
          isPage={true}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      )}

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={Object.entries(cart)
          .filter(([_, qty]) => Number(qty) > 0)
          .map(([pId, qty]) => ({
            product: products.find((p) => p.id === pId)!,
            qty: Number(qty)
          }))
          .filter((ci) => ci.product !== undefined)}
        totalAmount={cartTotalAmount}
        totalItems={cartTotalItems}
        onSubmitEnquiry={handleSubmitEnquiry}
        isLoading={isSubmittingEnquiry}
        shopDetails={shopDetails}
      />

      <EnquirySuccessModal
        enquiry={submittedEnquiry}
        onClose={() => setSubmittedEnquiry(null)}
        onOpenTracker={handleOpenTracker}
        shopDetails={shopDetails}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialQuery={trackerQuery}
        shopDetails={shopDetails}
      />
    </div>
  );
}

