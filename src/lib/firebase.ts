import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
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
  writeBatch,
  enableIndexedDbPersistence,
  runTransaction,
  limit
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

// Resolve dynamic config if environment variables are provided
function cleanEnv(val: string | undefined): string | undefined {
  if (!val) return undefined;
  let clean = val.trim();
  if (clean.endsWith(',')) {
    clean = clean.slice(0, -1).trim();
  }
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean || undefined;
}

const metaEnv = (import.meta as any).env || {};
const dynamicConfig = {
  apiKey: cleanEnv(metaEnv.VITE_FIREBASE_API_KEY) || firebaseConfig.apiKey,
  authDomain: cleanEnv(metaEnv.VITE_FIREBASE_AUTH_DOMAIN) || firebaseConfig.authDomain,
  projectId: cleanEnv(metaEnv.VITE_FIREBASE_PROJECT_ID) || firebaseConfig.projectId,
  storageBucket: cleanEnv(metaEnv.VITE_FIREBASE_STORAGE_BUCKET) || firebaseConfig.storageBucket,
  messagingSenderId: cleanEnv(metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) || firebaseConfig.messagingSenderId,
  appId: cleanEnv(metaEnv.VITE_FIREBASE_APP_ID) || firebaseConfig.appId,
};

const databaseId = cleanEnv(metaEnv.VITE_FIREBASE_DATABASE_ID) || firebaseConfig.firestoreDatabaseId;

// Initialize Firebase App
const app = !getApps().length ? initializeApp(dynamicConfig) : getApp();

// Initialize Firestore with custom database ID from config
export const auth = getAuth(app);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true }, databaseId || undefined);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    }
  });
} catch (e) {
  console.warn('Offline persistence setup failed:', e);
}

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
      console.warn('Firestore read error:', err.message);
      try {
        if (err.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.GET, PRODUCTS_COL);
        }
      } catch (e) {
        if (onError) onError(e);
      }
      if (onError) onError(err);
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
      snapshot.forEach((doc) => cats.push({ id: doc.id, ...doc.data() } as Category));
      callback(cats);
    },
    (err) => { 
      console.warn('Firestore read error:', err.message); 
      try {
        if (err.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.GET, CATEGORIES_COL);
        }
      } catch (e) {
        if (onError) onError(e);
      }
      if(onError) onError(err); 
    }
  );
}

export function subscribeEnquiries(
  callback: (enquiries: Enquiry[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    query(collection(db, ENQUIRIES_COL), orderBy('createdAt', 'desc'), limit(500)),
    (snapshot) => {
      const enqs: Enquiry[] = [];
      snapshot.forEach((doc) => enqs.push({ id: doc.id, ...doc.data() } as Enquiry));
      callback(enqs);
    },
    (err) => { 
      console.warn('Firestore read error:', err.message); 
      try {
        if (err.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.GET, ENQUIRIES_COL);
        }
      } catch (e) {
        if (onError) onError(e);
      }
      if(onError) onError(err); 
    }
  );
}

export function subscribeInvoices(
  callback: (invoices: Invoice[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    query(collection(db, INVOICES_COL), orderBy('createdAt', 'desc'), limit(500)),
    (snapshot) => {
      const invs: Invoice[] = [];
      snapshot.forEach((doc) => invs.push({ id: doc.id, ...doc.data() } as Invoice));
      callback(invs);
    },
    (err) => { 
      console.warn('Firestore read error:', err.message); 
      try {
        if (err.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.GET, INVOICES_COL);
        }
      } catch (e) {
        if (onError) onError(e);
      }
      if(onError) onError(err); 
    }
  );
}



export function subscribeOfflineOrders(
  callback: (orders: OfflineOrder[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    query(collection(db, OFFLINE_ORDERS_COL), orderBy('createdAt', 'desc'), limit(500)),
    (snapshot) => {
      const list: OfflineOrder[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as OfflineOrder);
      });
      callback(list);
    },
    (err) => {
      console.warn('Firestore read error:', err.message);
      try {
        if (err.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.GET, OFFLINE_ORDERS_COL);
        }
      } catch (e) {
        if (onError) onError(e);
      }
      if (onError) onError(err);
    }
  );
}

export function subscribeShopDetails(
  callback: (shopDetails: ShopDetails | null) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    doc(db, SHOP_COL, 'current'),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as ShopDetails);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('Firestore subscribeShopDetails error:', err.message);
      try {
        if (err.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.GET, SHOP_COL);
        }
      } catch (e) {
        if (onError) onError(e);
      }
      if (onError) onError(err);
    }
  );
}
export async function saveProductToFirestore(product: Product) {
  try {
    const ref = doc(db, PRODUCTS_COL, product.id);
    const prodSnap = await getDoc(ref);
    const isNew = !prodSnap.exists();
    const prevStock = isNew ? 0 : (prodSnap.data() as Product).currentStock || 0;
    const prevStatus = isNew ? null : (prodSnap.data() as Product).status;
    const newStock = product.currentStock || 0;
    const newStatus = product.status;

    await setDoc(ref, product, { merge: true });

    let shouldRegenerate = false;
    
    if (newStock === 0 && prevStock > 0) {
      shouldRegenerate = true;
      await createStockOutNotification(product);
    } else if (prevStock === 0 && newStock > 0) {
      shouldRegenerate = true;
    }

    if (isNew && (newStatus === 'active' || newStatus === 'inactive')) {
      shouldRegenerate = true;
    } else if (prevStatus && prevStatus !== newStatus && (newStatus === 'active' || newStatus === 'inactive')) {
      shouldRegenerate = true;
    }

    // Always regenerate if the product is active or was active to ensure image, price, name updates sync instantly
    if (newStatus === 'active' || prevStatus === 'active') {
      shouldRegenerate = true;
    }

    if (shouldRegenerate) {
      await generateStaticSKUCatalog();
    }
  } catch (err: any) {
    console.warn('Firestore product write notice:', err?.message || err);
  }
}

export async function deleteProductFromFirestore(productId: string) {
  try {
    const ref = doc(db, PRODUCTS_COL, productId);
    await deleteDoc(ref);
    await generateStaticSKUCatalog();
  } catch (err: any) {
    console.warn('Firestore product delete notice:', err?.message || err);
  }
}

export async function saveCategoryToFirestore(category: Category) {
  try {
    const ref = doc(db, CATEGORIES_COL, category.id);
    await setDoc(ref, category, { merge: true });
    await generateStaticSKUCatalog();
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
    let shouldRegenerate = false;
    await runTransaction(db, async (transaction) => {
      shouldRegenerate = false;
      const stockOutProducts: any[] = [];
      const prodRefs = invoice.items.map(item => doc(db, PRODUCTS_COL, item.productId));
      const prodSnaps = await Promise.all(prodRefs.map(ref => transaction.get(ref)));
      
      const invRef = doc(db, INVOICES_COL, invoice.id);
      transaction.set(invRef, invoice, { merge: true });
      
      const enqRef = doc(db, ENQUIRIES_COL, invoice.enquiryId);
      transaction.update(enqRef, {
        invoiceGenerated: true,
        invoiceId: invoice.id,
        status: 'Success'
      });
      
      invoice.items.forEach((item, index) => {
        const prodSnap = prodSnaps[index];
        if (prodSnap.exists()) {
          const prod = prodSnap.data() as Product;
          const current = prod.currentStock || 0;
          const newStock = Math.max(0, current - item.qty);
          transaction.update(prodRefs[index], {
            currentStock: newStock,
            updatedAt: new Date().toISOString()
          });
          if (newStock === 0 && current > 0) {
            shouldRegenerate = true;
            stockOutProducts.push({ ...prod, id: item.productId });
          }
        }
      });
      
      stockOutProducts.forEach(prod => {
        const notifId = `NOTIF-STK-${prod.id}-${Date.now()}`;
        const notifRef = doc(db, NOTIFICATIONS_COL, notifId);
        transaction.set(notifRef, {
          id: notifId,
          type: 'stock-out',
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          createdAt: new Date().toISOString(),
          status: 'unread'
        });
      });
      
      if (shouldRegenerate) {
        const catalogRef = doc(db, CONFIGS_COL, 'catalog_sku');
        transaction.set(catalogRef, { isStale: true }, { merge: true });
      }
    });

    if (shouldRegenerate) {
      await generateStaticSKUCatalog();
    }
  } catch (err: any) {
    console.warn('Firestore invoice write notice:', err?.message || err);
  }
}

export async function saveOfflineOrderToFirestore(order: OfflineOrder) {
  try {
    let shouldRegenerate = false;
    await runTransaction(db, async (transaction) => {
      shouldRegenerate = false;
      const stockOutProducts: any[] = [];
      const prodRefs = order.items.map(item => doc(db, PRODUCTS_COL, item.productId));
      const prodSnaps = await Promise.all(prodRefs.map(ref => transaction.get(ref)));
      
      const orderRef = doc(db, OFFLINE_ORDERS_COL, order.id);
      transaction.set(orderRef, order, { merge: true });
      
      order.items.forEach((item, index) => {
        const prodSnap = prodSnaps[index];
        if (prodSnap.exists()) {
          const prod = prodSnap.data() as Product;
          const current = prod.currentStock || 0;
          const newStock = Math.max(0, current - item.qty);
          transaction.update(prodRefs[index], {
            currentStock: newStock,
            updatedAt: new Date().toISOString()
          });
          if (newStock === 0 && current > 0) {
            shouldRegenerate = true;
            stockOutProducts.push({ ...prod, id: item.productId });
          }
        }
      });
      
      stockOutProducts.forEach(prod => {
        const notifId = `NOTIF-STK-${prod.id}-${Date.now()}`;
        const notifRef = doc(db, NOTIFICATIONS_COL, notifId);
        transaction.set(notifRef, {
          id: notifId,
          type: 'stock-out',
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          createdAt: new Date().toISOString(),
          status: 'unread'
        });
      });
      
      if (shouldRegenerate) {
        const catalogRef = doc(db, CONFIGS_COL, 'catalog_sku');
        transaction.set(catalogRef, { isStale: true }, { merge: true });
      }
    });

    if (shouldRegenerate) {
      await generateStaticSKUCatalog();
    }
  } catch (err: any) {
    console.warn('Firestore offline order write notice:', err?.message || err);
  }
}

export async function resetDataInFirestore(options: {
  resetOnlineEnquiries?: boolean;
  resetOfflineOrders?: boolean;
  resetGstInvoices?: boolean;
}) {
  try {
    if (options.resetOnlineEnquiries) {
      const snap = await getDocs(collection(db, ENQUIRIES_COL));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    if (options.resetOfflineOrders) {
      const snap = await getDocs(collection(db, OFFLINE_ORDERS_COL));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    if (options.resetGstInvoices) {
      const snap = await getDocs(collection(db, INVOICES_COL));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Firestore reset data notice:', err?.message || err);
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined | null;
    email: string | undefined | null;
    emailVerified: boolean | undefined | null;
    isAnonymous: boolean | undefined | null;
    tenantId: string | undefined | null;
    providerInfo: any[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
        productsList.push({ id: docSnap.id, ...p, image: '' });
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
    console.warn('Failed to generate static SKU catalog:', err?.message || err);
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
