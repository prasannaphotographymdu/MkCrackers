import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Category, Enquiry, Invoice, ShopDetails, OfflineOrder } from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ENQUIRIES,
  INITIAL_INVOICES,
  SHOP_INFO
} from '../data/seed';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Collection References
export const PRODUCTS_COL = 'products';
export const CATEGORIES_COL = 'categories';
export const ENQUIRIES_COL = 'enquiries';
export const INVOICES_COL = 'invoices';
export const SHOP_COL = 'shopDetails';
export const OFFLINE_ORDERS_COL = 'offlineOrders';

/**
 * Initializes Firestore collections with seed data if they are empty
 */
export async function seedFirestoreIfEmpty() {
  try {
    // Check Products
    const prodSnap = await getDocs(collection(db, PRODUCTS_COL));
    if (prodSnap.empty) {
      console.log('Seeding products to Firestore...');
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach((prod) => {
        const ref = doc(db, PRODUCTS_COL, prod.id);
        batch.set(ref, prod);
      });
      await batch.commit();
    }

    // Check Categories
    const catSnap = await getDocs(collection(db, CATEGORIES_COL));
    if (catSnap.empty) {
      console.log('Seeding categories to Firestore...');
      const batch = writeBatch(db);
      INITIAL_CATEGORIES.forEach((cat) => {
        const ref = doc(db, CATEGORIES_COL, cat.id);
        batch.set(ref, cat);
      });
      await batch.commit();
    }

    // Check Enquiries
    const enqSnap = await getDocs(collection(db, ENQUIRIES_COL));
    if (enqSnap.empty) {
      console.log('Seeding enquiries to Firestore...');
      const batch = writeBatch(db);
      INITIAL_ENQUIRIES.forEach((enq) => {
        const ref = doc(db, ENQUIRIES_COL, enq.id);
        batch.set(ref, enq);
      });
      await batch.commit();
    }

    // Check Invoices
    const invSnap = await getDocs(collection(db, INVOICES_COL));
    if (invSnap.empty) {
      console.log('Seeding invoices to Firestore...');
      const batch = writeBatch(db);
      INITIAL_INVOICES.forEach((inv) => {
        const ref = doc(db, INVOICES_COL, inv.id);
        batch.set(ref, inv);
      });
      await batch.commit();
    }

    // Check Shop Details
    const shopDocRef = doc(db, SHOP_COL, 'current');
    const shopSnap = await getDoc(shopDocRef);
    if (!shopSnap.exists()) {
      console.log('Seeding shopDetails to Firestore...');
      await setDoc(shopDocRef, SHOP_INFO);
    }
  } catch (error: any) {
    console.warn('Firestore seed notice (Security Rules or connection restricted):', error?.message || error);
  }
}

// --- Firestore Real-time Listeners & Sync Operations ---

export function subscribeProducts(
  callback: (products: Product[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, PRODUCTS_COL),
    (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      callback(prods);
    },
    (err) => {
      console.warn('Firestore products read restricted, using REST API fallback:', err.message);
      if (onError) onError(err);
      fetch('/api/products?status=all')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) callback(data);
        })
        .catch(() => {});
    }
  );
}

export function subscribeCategories(
  callback: (categories: Category[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, CATEGORIES_COL),
    (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      cats.sort((a, b) => a.displayOrder - b.displayOrder);
      callback(cats);
    },
    (err) => {
      console.warn('Firestore categories read restricted, using REST API fallback:', err.message);
      if (onError) onError(err);
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) callback(data);
        })
        .catch(() => {});
    }
  );
}

export function subscribeEnquiries(
  callback: (enquiries: Enquiry[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, ENQUIRIES_COL),
    (snapshot) => {
      const enqs: Enquiry[] = [];
      snapshot.forEach((doc) => {
        enqs.push({ id: doc.id, ...doc.data() } as Enquiry);
      });
      enqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(enqs);
    },
    (err) => {
      console.warn('Firestore enquiries read restricted, using REST API fallback:', err.message);
      if (onError) onError(err);
      fetch('/api/enquiries')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) callback(data);
        })
        .catch(() => {});
    }
  );
}

export function subscribeInvoices(
  callback: (invoices: Invoice[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, INVOICES_COL),
    (snapshot) => {
      const invs: Invoice[] = [];
      snapshot.forEach((doc) => {
        invs.push({ id: doc.id, ...doc.data() } as Invoice);
      });
      invs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(invs);
    },
    (err) => {
      console.warn('Firestore invoices read restricted, using REST API fallback:', err.message);
      if (onError) onError(err);
      fetch('/api/invoices')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) callback(data);
        })
        .catch(() => {});
    }
  );
}

export function subscribeShopDetails(
  callback: (shop: ShopDetails) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    doc(db, SHOP_COL, 'current'),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as ShopDetails);
      }
    },
    (err) => {
      console.warn('Firestore shopDetails read restricted, using REST API fallback:', err.message);
      if (onError) onError(err);
      fetch('/api/shop-info')
        .then((res) => res.json())
        .then((data) => {
          if (data) callback(data);
        })
        .catch(() => {});
    }
  );
}

export function subscribeOfflineOrders(
  callback: (orders: OfflineOrder[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, OFFLINE_ORDERS_COL),
    (snapshot) => {
      const list: OfflineOrder[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as OfflineOrder);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      console.warn('Firestore offline orders read restricted, using REST API fallback:', err.message);
      if (onError) onError(err);
      fetch('/api/offline-orders')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) callback(data);
        })
        .catch(() => {});
    }
  );
}

// --- Firestore CRUD Mutations ---

export async function saveProductToFirestore(product: Product) {
  try {
    const ref = doc(db, PRODUCTS_COL, product.id);
    await setDoc(ref, product, { merge: true });

    if (product.currentStock === 0) {
      await createStockOutNotification(product);
    }
  } catch (err: any) {
    console.warn('Firestore product write notice:', err?.message || err);
  }
}

export async function deleteProductFromFirestore(productId: string) {
  try {
    const ref = doc(db, PRODUCTS_COL, productId);
    await deleteDoc(ref);
  } catch (err: any) {
    console.warn('Firestore product delete notice:', err?.message || err);
  }
}

export async function saveCategoryToFirestore(category: Category) {
  try {
    const ref = doc(db, CATEGORIES_COL, category.id);
    await setDoc(ref, category, { merge: true });
  } catch (err: any) {
    console.warn('Firestore category write notice:', err?.message || err);
  }
}

export async function saveEnquiryToFirestore(enquiry: Enquiry) {
  try {
    const ref = doc(db, ENQUIRIES_COL, enquiry.id);
    await setDoc(ref, enquiry, { merge: true });
  } catch (err: any) {
    console.warn('Firestore enquiry write notice:', err?.message || err);
  }
}

export async function updateEnquiryStatusInFirestore(enquiryId: string, status: Enquiry['status'], notes?: string) {
  try {
    const ref = doc(db, ENQUIRIES_COL, enquiryId);
    const updatePayload: any = { status };
    if (notes !== undefined) updatePayload.notes = notes;
    await updateDoc(ref, updatePayload);
  } catch (err: any) {
    console.warn('Firestore enquiry status update notice:', err?.message || err);
  }
}

export async function saveInvoiceToFirestore(invoice: Invoice) {
  try {
    const batch = writeBatch(db);
    // 1. Save invoice
    const invRef = doc(db, INVOICES_COL, invoice.id);
    batch.set(invRef, invoice, { merge: true });

    // 2. Mark enquiry as invoiced
    const enqRef = doc(db, ENQUIRIES_COL, invoice.enquiryId);
    batch.update(enqRef, {
      invoiceGenerated: true,
      invoiceId: invoice.id,
      status: 'Success'
    });

    // 3. Deduct stock for each item & check for stock-out
    for (const item of invoice.items) {
      const prodRef = doc(db, PRODUCTS_COL, item.productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const prod = prodSnap.data() as Product;
        const current = prod.currentStock || 0;
        const newStock = Math.max(0, current - item.qty);
        batch.update(prodRef, {
          currentStock: newStock,
          updatedAt: new Date().toISOString()
        });

        if (newStock === 0 && current > 0) {
          await createStockOutNotification({ ...prod, id: item.productId });
        }
      }
    }

    await batch.commit();
  } catch (err: any) {
    console.warn('Firestore invoice write notice:', err?.message || err);
  }
}

export async function saveOfflineOrderToFirestore(order: OfflineOrder) {
  try {
    const batch = writeBatch(db);
    // 1. Save offline order
    const orderRef = doc(db, OFFLINE_ORDERS_COL, order.id);
    batch.set(orderRef, order, { merge: true });

    // 2. Deduct inventory in Firestore & check for stock-out
    for (const item of order.items) {
      const prodRef = doc(db, PRODUCTS_COL, item.productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const prod = prodSnap.data() as Product;
        const current = prod.currentStock || 0;
        const newStock = Math.max(0, current - item.qty);
        batch.update(prodRef, {
          currentStock: newStock,
          updatedAt: new Date().toISOString()
        });

        if (newStock === 0 && current > 0) {
          await createStockOutNotification({ ...prod, id: item.productId });
        }
      }
    }

    await batch.commit();
  } catch (err: any) {
    console.warn('Firestore offline order write notice:', err?.message || err);
  }
}

export async function saveShopDetailsToFirestore(shopDetails: ShopDetails) {
  try {
    const ref = doc(db, SHOP_COL, 'current');
    await setDoc(ref, shopDetails, { merge: true });
  } catch (err: any) {
    console.warn('Firestore shop details write notice:', err?.message || err);
  }
}

// --- Dynamic SKU Static Catalog Generation & Notifications Optimization ---

export const CONFIGS_COL = 'configs';
export const NOTIFICATIONS_COL = 'notifications';

export async function createStockOutNotification(product: any) {
  try {
    const notifId = `NOTIF-STK-${product.id}-${Date.now()}`;
    const notifRef = doc(db, NOTIFICATIONS_COL, notifId);
    await setDoc(notifRef, {
      id: notifId,
      type: 'stock-out',
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      createdAt: new Date().toISOString(),
      status: 'unread'
    });

    // Set static catalog state as stale
    const catalogRef = doc(db, CONFIGS_COL, 'catalog_sku');
    await setDoc(catalogRef, { isStale: true }, { merge: true });
  } catch (err: any) {
    console.warn('Failed to create stock-out notification:', err?.message || err);
  }
}

export function subscribeStockOutNotifications(callback: (notifications: any[]) => void) {
  return onSnapshot(
    collection(db, NOTIFICATIONS_COL),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      console.warn('Failed to subscribe notifications:', err.message);
    }
  );
}

export async function clearNotifications() {
  try {
    const notifSnap = await getDocs(collection(db, NOTIFICATIONS_COL));
    const batch = writeBatch(db);
    notifSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err: any) {
    console.warn('Failed to clear notifications:', err.message);
  }
}

export async function generateStaticSKUCatalog() {
  try {
    // 1. Fetch active products from DB
    const prodSnap = await getDocs(collection(db, PRODUCTS_COL));
    const productsList: Product[] = [];
    prodSnap.forEach((docSnap) => {
      const p = docSnap.data() as Product;
      if (p.status === 'active') {
        productsList.push({ id: docSnap.id, ...p });
      }
    });

    // 2. Fetch categories
    const catSnap = await getDocs(collection(db, CATEGORIES_COL));
    const categoriesList: Category[] = [];
    catSnap.forEach((docSnap) => {
      categoriesList.push({ id: docSnap.id, ...docSnap.data() } as Category);
    });
    categoriesList.sort((a, b) => a.displayOrder - b.displayOrder);

    // 3. Write all as one consolidated document inside configs/catalog_sku
    const catalogRef = doc(db, CONFIGS_COL, 'catalog_sku');
    await setDoc(catalogRef, {
      products: productsList,
      categories: categoriesList,
      lastUpdated: new Date().toISOString(),
      isStale: false
    });

    // 4. Reset stockout alerts
    await clearNotifications();
  } catch (err: any) {
    console.error('Failed to generate static SKU catalog:', err?.message || err);
  }
}

export async function fetchStaticSKUCatalog() {
  try {
    const catalogRef = doc(db, CONFIGS_COL, 'catalog_sku');
    const catalogSnap = await getDoc(catalogRef);
    if (catalogSnap.exists()) {
      return catalogSnap.data() as {
        products: Product[];
        categories: Category[];
        lastUpdated: string;
        isStale?: boolean;
      };
    }

    // First-time fallback: build dynamically and save
    console.log('Static SKU Catalog not found, compiling first-time snapshot...');
    await generateStaticSKUCatalog();

    const freshSnap = await getDoc(catalogRef);
    if (freshSnap.exists()) {
      return freshSnap.data() as {
        products: Product[];
        categories: Category[];
        lastUpdated: string;
        isStale?: boolean;
      };
    }
  } catch (err: any) {
    console.warn('Failed to fetch static SKU catalog:', err?.message || err);
  }
  return null;
}
