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
  const [shopDetails, setShopDetails] = useState<ShopDetails>(SHOP_INFO);  const [isInitializing, setIsInitializing] = useState(true);

  // Modals & UI
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<Enquiry | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerQuery, setTrackerQuery] = useState('');

  const handleOpenTracker = (query?: string | any) => {
    setTrackerQuery(typeof query === 'string' ? query : '');
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

    // 2. Fallback REST API initial fetch
    fetchShopInfo();

    // 4. Real-time Shop Details Subscription - loaded dynamically
    let unsubShop = () => {};
    import('./lib/firebase').then(({ subscribeShopDetails }) => {
      unsubShop = subscribeShopDetails((liveShop) => {
        if (liveShop) {
          setShopDetails(liveShop);
        }
        setIsInitializing(false);
      }, (err) => {
        console.warn('Firebase Shop details subscription failed', err);
        setIsInitializing(false);
      });
    }).catch(err => {
      console.warn('Firebase lazy load failed:', err);
      setIsInitializing(false);
    });

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      unsubShop();
    };
  }, []);

    // Always use live subscriptions for both admin and public to ensure real-time accuracy and bypass the 1MB catalog limit
  useEffect(() => {
    // 1. Fetch from REST API immediately for instant paint and offline/permission fallback
    fetch('/api/products')
      .then(res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          const sortedProducts = [...data].sort((a, b) => (a.displayOrder ?? 999999) - (b.displayOrder ?? 999999));
          setProducts(prev => prev.length === 0 ? sortedProducts : prev);
        }
      })
      .catch(err => console.warn('REST Products fetch failed:', err));

    fetch('/api/categories')
      .then(res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          const sortedCats = [...data].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          setCategories(prev => prev.length === 0 ? sortedCats : prev);
        }
      })
      .catch(err => console.warn('REST Categories fetch failed:', err));

    let unsubProds = () => {};
    let unsubCats = () => {};

    import('./lib/firebase').then(({ subscribeProducts, subscribeCategories }) => {
      unsubProds = subscribeProducts((liveProducts) => {
        if (liveProducts && liveProducts.length > 0) {
          const sortedProducts = [...liveProducts].sort((a, b) => (a.displayOrder ?? 999999) - (b.displayOrder ?? 999999));
          setProducts(sortedProducts);
        }
      }, (err) => console.warn('Firebase Products subscription failed', err));
      unsubCats = subscribeCategories((liveCats) => {
        if (liveCats && liveCats.length > 0) {
          const sortedCats = [...liveCats].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          setCategories(sortedCats);
        }
      }, (err) => console.warn('Firebase Categories subscription failed', err));
    }).catch(err => console.warn('Firebase lazy load failed:', err));

    return () => {
      unsubProds();
      unsubCats();
    };
  }, []);

    const fetchShopInfo = async () => {
    try {
      const res = await fetch('/api/shop-info');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        // Only override if the backend has actual data, to avoid flashing the default if Firestore is slower
        if (data && data.name !== SHOP_INFO.name) {
          setShopDetails(data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch shop details:', err);
    }
  };

  const handleSaveShopDetails = async (updated: ShopDetails) => {
    // Save to Firestore
    try {
      const { saveShopDetailsToFirestore } = await import('./lib/firebase');
      await saveShopDetailsToFirestore(updated);
    } catch (e) {
      console.warn('Firebase lazy load failed:', e);
    }
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
    return sum + (prod ? (prod.discountPercent !== undefined ? (prod.discountPercent > 0 ? prod.sellingPrice * (1 - prod.discountPercent / 100) : prod.sellingPrice) : (prod.sellingPrice * 0.5)) * q : 0);
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
          unitPrice: prod ? (prod.discountPercent !== undefined ? (prod.discountPercent > 0 ? prod.sellingPrice * (1 - prod.discountPercent / 100) : prod.sellingPrice) : (prod.sellingPrice * 0.5)) : 0,
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
        const { saveEnquiryToFirestore } = await import('./lib/firebase');
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

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Loading store details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Overlay */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Persistent App Header */}
      <Header
        currentView={view}
        onChangeView={(targetView) => {
          setView(targetView);
          
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

