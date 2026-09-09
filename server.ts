const originalConsoleError = console.error;
console.error = function (...args) {
  const msg = args.map(a => {
    try {
      return typeof a === 'string' ? a : JSON.stringify(a);
    } catch(e) {
      return String(a);
    }
  }).join(' ');
  if (msg.includes("CANCELLED: Disconnecting idle stream") || msg.includes("Timed out waiting for new targets")) {
    return;
  }
  originalConsoleError.apply(console, args);
};

process.env.GCE_METADATA_HOST = "127.0.0.1:9999";
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.GCLOUD_PROJECT;
delete process.env.GCP_PROJECT;
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import adminCreds from './admin-credentials.json';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ENQUIRIES,
  INITIAL_INVOICES,
  SHOP_INFO
} from './src/data/seed.js';
import {
  Category,
  Product,
  Enquiry,
  Invoice,
  InvoiceItem,
  EnquiryItem,
  CustomerDetails,
  OfflineOrder,
  OfflineOrderItem,
  PaymentMode,
  SequenceSettings,
  ShopDetails
} from './src/types.js';

const __dirname = process.cwd();

// Initialize Firebase App
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch, onSnapshot, query, orderBy, limit, setLogLevel } from 'firebase/firestore';
setLogLevel('silent');
import firebaseConfig from './firebase-applet-config.json';

// Resolve dynamic config if server-side environment variables are provided
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

const serverDynamicConfig = {
  apiKey: cleanEnv(process.env.FIREBASE_API_KEY) || firebaseConfig.apiKey,
  authDomain: cleanEnv(process.env.FIREBASE_AUTH_DOMAIN) || firebaseConfig.authDomain,
  projectId: cleanEnv(process.env.FIREBASE_PROJECT_ID) || firebaseConfig.projectId,
  storageBucket: cleanEnv(process.env.FIREBASE_STORAGE_BUCKET) || firebaseConfig.storageBucket,
  messagingSenderId: cleanEnv(process.env.FIREBASE_MESSAGING_SENDER_ID) || firebaseConfig.messagingSenderId,
  appId: cleanEnv(process.env.FIREBASE_APP_ID) || firebaseConfig.appId,
};

const serverDatabaseId = cleanEnv(process.env.FIREBASE_DATABASE_ID) || firebaseConfig.firestoreDatabaseId;

const firebaseApp = initializeApp(serverDynamicConfig);
const db = initializeFirestore(firebaseApp, {
  ignoreUndefinedProperties: true
}, serverDatabaseId || undefined);

// In-Memory Database State (Persists during server lifecycle, resets to seed on restart)
let categories: Category[] = [...INITIAL_CATEGORIES];
let products: Product[] = [...INITIAL_PRODUCTS];
let enquiries: Enquiry[] = [...INITIAL_ENQUIRIES];
let invoices: Invoice[] = [...INITIAL_INVOICES];
let offlineOrders: OfflineOrder[] = [];
let shopInfo: ShopDetails = { gstEnabled: false, ...SHOP_INFO };

let enquiryCounter = 1004;
let invoiceCounter = 502;
let posCounter = 9001;
let gstCounter = 1;

let sequenceSettingsLoaded = false;
let sequenceSettings: SequenceSettings = {
  posPrefix: 'POS',
  posNextNumber: 9001,
  posUseYear: true,
  posPadding: 4,
  enquiryPrefix: 'ENQ',
  enquiryNextNumber: 1004,
  enquiryUseYear: true,
  enquiryPadding: 4,
  gstPrefix: 'GST',
  gstNextNumber: 1,
  gstUseYear: true,
  gstPadding: 4,
  invoicePrefix: 'INV',
  invoiceNextNumber: 501,
  invoiceUseYear: true,
  invoicePadding: 4
};

function generateSequenceNumber(prefix: string, nextNumber: number, useYear: boolean, padding: number): string {
  const yearStr = useYear ? `${new Date().getFullYear()}-` : '';
  const numStr = String(nextNumber).padStart(padding, '0');
  return `${prefix}-${yearStr}${numStr}`;
}

async function seedFirestoreIfEmpty() {
  try {
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      console.log('Seeding initial categories to Firestore...');
      const batch = writeBatch(db);
      INITIAL_CATEGORIES.forEach((cat) => {
        batch.set(doc(db, 'categories', cat.id), cat);
      });
      await batch.commit();
    }

    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      console.log('Seeding initial products to Firestore...');
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach((prod) => {
        batch.set(doc(db, 'products', prod.id), prod);
      });
      await batch.commit();
    }

    const enqSnap = await getDocs(collection(db, 'enquiries'));
    if (enqSnap.empty) {
      console.log('Seeding initial enquiries to Firestore...');
      const batch = writeBatch(db);
      INITIAL_ENQUIRIES.forEach((enq) => {
        batch.set(doc(db, 'enquiries', enq.id), enq);
      });
      await batch.commit();
    }

    const invSnap = await getDocs(collection(db, 'invoices'));
    if (invSnap.empty) {
      console.log('Seeding initial invoices to Firestore...');
      const batch = writeBatch(db);
      INITIAL_INVOICES.forEach((inv) => {
        batch.set(doc(db, 'invoices', inv.id), inv);
      });
      await batch.commit();
    }

    const shopDocRef = doc(db, 'shopDetails', 'current');
    const shopSnap = await getDoc(shopDocRef);
    if (!shopSnap.exists()) {
      console.log('Seeding initial shopDetails to Firestore...');
      await setDoc(shopDocRef, SHOP_INFO);
    }

    const sequenceDocRef = doc(db, 'settings', 'sequences');
    const sequenceSnap = await getDoc(sequenceDocRef);
    if (!sequenceSnap.exists()) {
      console.log('Seeding initial sequence settings to Firestore...');
      const defaultSequenceSettings: SequenceSettings = {
        posPrefix: 'POS',
        posNextNumber: 9001,
        posUseYear: true,
        posPadding: 4,
        enquiryPrefix: 'ENQ',
        enquiryNextNumber: 1004,
        enquiryUseYear: true,
        enquiryPadding: 4,
        gstPrefix: 'GST',
        gstNextNumber: 1,
        gstUseYear: true,
        gstPadding: 4
      };
      await setDoc(sequenceDocRef, defaultSequenceSettings);
    }
  } catch (error) {
    console.error('Error seeding Firestore on startup:', error);
  }
}

function setupShopInfoListener() {
  onSnapshot(doc(db, 'shopDetails', 'current'), (docSnap) => {
    if (docSnap.exists()) {
      shopInfo = { ...shopInfo, ...docSnap.data() };
    }
  }, (error) => {
    console.error('Error listening to shopDetails:', error);
  });
}

function setupSequenceSettingsListener() {
  onSnapshot(doc(db, 'settings', 'sequences'), (docSnap) => {
    if (docSnap.exists()) {
      sequenceSettings = { ...sequenceSettings, ...docSnap.data() as Partial<SequenceSettings> };
      posCounter = sequenceSettings.posNextNumber;
      enquiryCounter = sequenceSettings.enquiryNextNumber;
      if (sequenceSettings.gstNextNumber) gstCounter = sequenceSettings.gstNextNumber;
      sequenceSettingsLoaded = true;
    }
  }, (error) => {
    console.error('Error listening to sequence settings:', error);
  });
}

function setupCategoriesListener() {
  onSnapshot(query(collection(db, 'categories'), orderBy('displayOrder')), (snapshot) => {
    const liveCats: Category[] = [];
    snapshot.forEach(docSnap => {
      liveCats.push({ id: docSnap.id, ...docSnap.data() } as Category);
    });
    categories = liveCats;
  }, (error) => {
    console.error('Error listening to categories:', error);
  });
}

function setupProductsListener() {
  onSnapshot(collection(db, 'products'), (snapshot) => {
    const liveProds: Product[] = [];
    snapshot.forEach(docSnap => {
      liveProds.push({ id: docSnap.id, ...docSnap.data() } as Product);
    });
    products = liveProds;
  }, (error) => {
    console.error('Error listening to products:', error);
  });
}

function setupEnquiriesListener() {
  // Query only recent enquiries for server-side cache to limit reads
  onSnapshot(query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'), limit(1000)), (snapshot) => {
    const liveEnqs: Enquiry[] = [];
    snapshot.forEach(docSnap => {
      liveEnqs.push({ id: docSnap.id, ...docSnap.data() } as Enquiry);
    });
    enquiries = liveEnqs;
    
    const numericIds = enquiries
      .map(e => parseInt(e.id.replace(/\D/g, '')))
      .filter(n => !isNaN(n));
    if (!sequenceSettingsLoaded && numericIds.length > 0) {
      const maxId = Math.max(...numericIds);
      enquiryCounter = Math.max(enquiryCounter, maxId + 1);
    }
  }, (error) => {
    console.error('Error listening to enquiries:', error);
  });
}

function setupInvoicesListener() {
  onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(1000)), (snapshot) => {
    const liveInvs: Invoice[] = [];
    snapshot.forEach(docSnap => {
      liveInvs.push({ id: docSnap.id, ...docSnap.data() } as Invoice);
    });
    invoices = liveInvs;
    
    const numericIds = invoices
      .map(i => parseInt(i.id.replace(/\D/g, '')))
      .filter(n => !isNaN(n));
    if (numericIds.length > 0) {
      const maxId = Math.max(...numericIds);
      invoiceCounter = Math.max(invoiceCounter, maxId + 1);
    }
  }, (error) => {
    console.error('Error listening to invoices:', error);
  });
}

function setupOfflineOrdersListener() {
  onSnapshot(query(collection(db, 'offlineOrders'), orderBy('createdAt', 'desc'), limit(1000)), (snapshot) => {
    const liveOff: OfflineOrder[] = [];
    snapshot.forEach(docSnap => {
      liveOff.push({ id: docSnap.id, ...docSnap.data() } as OfflineOrder);
    });
    offlineOrders = liveOff;
    
    const numericIds = offlineOrders
      .map(o => parseInt(o.id.replace(/\D/g, '')))
      .filter(n => !isNaN(n));
    if (!sequenceSettingsLoaded && numericIds.length > 0) {
      const maxId = Math.max(...numericIds);
      posCounter = Math.max(posCounter, maxId + 1);
    }
  }, (error) => {
    console.error('Error listening to offlineOrders:', error);
  });
}

function syncFromFirestore() {
  console.log('Setting up real-time server listeners for Firestore (Database ID:', firebaseConfig.firestoreDatabaseId || 'default', ')...');
  setupShopInfoListener();
  setupSequenceSettingsListener();
  setupCategoriesListener();
  setupProductsListener();
  setupEnquiriesListener();
  setupInvoicesListener();
  setupOfflineOrdersListener();
}

// --- STATIC CATALOG REGENERATION HELPERS ---
async function generateStaticSKUCatalogServer() {
  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    const productsList: Product[] = [];
    prodSnap.forEach((docSnap) => {
      const p = docSnap.data() as Product;
      if (p.status === 'active') {
        productsList.push({ id: docSnap.id, ...p, image: '' }); // Strip heavy base64 to avoid 1MB document limit
      }
    });

    const catSnap = await getDocs(collection(db, 'categories'));
    const categoriesList: Category[] = [];
    catSnap.forEach((docSnap) => {
      categoriesList.push({ id: docSnap.id, ...docSnap.data() } as Category);
    });
    categoriesList.sort((a, b) => a.displayOrder - b.displayOrder);

    const catalogRef = doc(db, 'configs', 'catalog_sku');
    await setDoc(catalogRef, {
      products: productsList,
      categories: categoriesList,
      lastUpdated: new Date().toISOString(),
      isStale: false
    });

    // Clear notifications
    try {
      const notifSnap = await getDocs(collection(db, 'notifications'));
      const batch = writeBatch(db);
      notifSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (e) {
      console.warn('Failed to clear notifications on server:', e);
    }
  } catch (err: any) {
    console.error('Failed to generate static SKU catalog on server:', err?.message || err);
  }
}

async function createStockOutNotificationServer(product: any) {
  try {
    const notifId = `NOTIF-STK-${product.id}-${Date.now()}`;
    const notifRef = doc(db, 'notifications', notifId);
    await setDoc(notifRef, {
      id: notifId,
      type: 'stock-out',
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      createdAt: new Date().toISOString(),
      status: 'unread'
    });
  } catch (err: any) {
    console.warn('Failed to create stock-out notification on server:', err?.message || err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Seed and Sync with Firestore in the background
  Promise.resolve().then(async () => {
    try {
      await seedFirestoreIfEmpty();
      syncFromFirestore();
      
      await generateStaticSKUCatalogServer();
    } catch (syncErr) {
      console.error('Firestore start synchronization notice:', syncErr);
    }
  });

  // ==========================================
  // REST API ENDPOINTS
  // ==========================================

  // Apply cache headers to all GET /api/* requests for Cloud Functions efficiency
  app.get('/api/*', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    next();
  });

  // --- SHOP CONFIG & INFO ---
  app.get('/api/shop-info', async (req, res) => {
    
    res.json(shopInfo);
  });

  app.put('/api/shop-info', (req, res) => {
    const updated = req.body;
    if (!updated || typeof updated !== 'object') {
      return res.status(400).json({ message: 'Invalid shop profile data' });
    }

    shopInfo = {
      ...shopInfo,
      ...updated,
      minimumOrderAmount: Number(updated.minimumOrderAmount) || shopInfo.minimumOrderAmount || 500
    };

    // Sync to Firestore
    setDoc(doc(db, 'shopDetails', 'current'), shopInfo).catch(e => console.error('Firestore save shop details error:', e));

    res.json(shopInfo);
  });

  // --- SEQUENCE SETTINGS ---
  app.get('/api/settings/sequences', (req, res) => {
    res.json(sequenceSettings);
  });

  app.put('/api/settings/sequences', (req, res) => {
    const updated = req.body;
    if (!updated || typeof updated !== 'object') {
      return res.status(400).json({ message: 'Invalid sequence settings data' });
    }

    sequenceSettings = {
      ...sequenceSettings,
      posPrefix: updated.posPrefix !== undefined ? String(updated.posPrefix).trim() : sequenceSettings.posPrefix,
      posNextNumber: updated.posNextNumber !== undefined ? Number(updated.posNextNumber) : sequenceSettings.posNextNumber,
      posUseYear: updated.posUseYear !== undefined ? Boolean(updated.posUseYear) : sequenceSettings.posUseYear,
      posPadding: updated.posPadding !== undefined ? Number(updated.posPadding) : sequenceSettings.posPadding,
      enquiryPrefix: updated.enquiryPrefix !== undefined ? String(updated.enquiryPrefix).trim() : sequenceSettings.enquiryPrefix,
      enquiryNextNumber: updated.enquiryNextNumber !== undefined ? Number(updated.enquiryNextNumber) : sequenceSettings.enquiryNextNumber,
      enquiryUseYear: updated.enquiryUseYear !== undefined ? Boolean(updated.enquiryUseYear) : sequenceSettings.enquiryUseYear,
      enquiryPadding: updated.enquiryPadding !== undefined ? Number(updated.enquiryPadding) : sequenceSettings.enquiryPadding,
      gstPrefix: updated.gstPrefix !== undefined ? String(updated.gstPrefix).trim() : sequenceSettings.gstPrefix || 'GST',
      gstNextNumber: updated.gstNextNumber !== undefined ? Number(updated.gstNextNumber) : sequenceSettings.gstNextNumber || 1,
      gstUseYear: updated.gstUseYear !== undefined ? Boolean(updated.gstUseYear) : sequenceSettings.gstUseYear !== false,
      gstPadding: updated.gstPadding !== undefined ? Number(updated.gstPadding) : sequenceSettings.gstPadding || 4,
    };

    // Update in memory counters
    posCounter = sequenceSettings.posNextNumber;
    enquiryCounter = sequenceSettings.enquiryNextNumber;
    gstCounter = sequenceSettings.gstNextNumber;

    // Sync to Firestore
    setDoc(doc(db, 'settings', 'sequences'), sequenceSettings)
      .catch(e => console.error('Firestore save sequence settings error:', e));

    res.json(sequenceSettings);
  });

  // --- ADMIN RESET DATA ENDPOINT ---
  app.post('/api/admin/reset-data', async (req, res) => {
    try {
      const { resetOnlineEnquiries, resetOfflineOrders, resetGstInvoices, resetSequences } = req.body;

      const resetReport = {
        enquiriesCleared: 0,
        offlineOrdersCleared: 0,
        invoicesCleared: 0
      };

      if (resetOnlineEnquiries) {
        resetReport.enquiriesCleared = enquiries.length;
        enquiries = [];
        if (resetSequences) {
          sequenceSettings.enquiryNextNumber = 1001;
          enquiryCounter = 1001;
        }
        try {
          const snap = await getDocs(collection(db, 'enquiries'));
          const batch = writeBatch(db);
          snap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        } catch (err: any) {
          console.warn('Firestore reset enquiries notice:', err?.message || err);
        }
      }

      if (resetOfflineOrders) {
        resetReport.offlineOrdersCleared = offlineOrders.length;
        offlineOrders = [];
        if (resetSequences) {
          sequenceSettings.posNextNumber = 9001;
          posCounter = 9001;
        }
        try {
          const snap = await getDocs(collection(db, 'offlineOrders'));
          const batch = writeBatch(db);
          snap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        } catch (err: any) {
          console.warn('Firestore reset offlineOrders notice:', err?.message || err);
        }
      }

      if (resetGstInvoices) {
        resetReport.invoicesCleared = invoices.length;
        invoices = [];
        if (resetSequences) {
          sequenceSettings.gstNextNumber = 1;
          gstCounter = 1;
        }
        try {
          const snap = await getDocs(collection(db, 'invoices'));
          const batch = writeBatch(db);
          snap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        } catch (err: any) {
          console.warn('Firestore reset invoices notice:', err?.message || err);
        }
      }

      if (resetSequences) {
        setDoc(doc(db, 'settings', 'sequences'), sequenceSettings).catch(e => console.error(e));
      }

      res.json({
        success: true,
        message: 'Selected data reset successfully',
        report: resetReport,
        sequenceSettings
      });
    } catch (err: any) {
      console.error('Reset data error:', err);
      res.status(500).json({ message: 'Failed to reset selected data', error: err.message });
    }
  });

  // --- ADMIN AUTH ---
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminCreds.username && password === adminCreds.password) {
      res.json({
        success: true,
        token: 'demo-admin-jwt-token-2026',
        admin: { username: adminCreds.username, name: 'Store Owner', role: 'Super Admin' }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
    }
  });

  // --- CATEGORIES ---
  app.get('/api/categories', async (req, res) => {
    
    res.json(categories.sort((a, b) => a.displayOrder - b.displayOrder));
  });

  app.post('/api/categories', (req, res) => {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      description: description || '',
      icon: icon || 'Flame',
      displayOrder: categories.length + 1
    };
    categories.push(newCat);
    setDoc(doc(db, 'categories', newCat.id), newCat).catch(e => console.error('Firestore save category error:', e));
    res.status(201).json(newCat);
  });

  app.put('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, icon, displayOrder } = req.body;
    const catIndex = categories.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }
    categories[catIndex] = {
      ...categories[catIndex],
      name: name ?? categories[catIndex].name,
      description: description ?? categories[catIndex].description,
      icon: icon ?? categories[catIndex].icon,
      displayOrder: displayOrder ?? categories[catIndex].displayOrder
    };
    setDoc(doc(db, 'categories', id), categories[catIndex]).catch(e => console.error('Firestore update category error:', e));
    res.json(categories[catIndex]);
  });

  app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    categories = categories.filter((c) => c.id !== id);
    deleteDoc(doc(db, 'categories', id)).catch(e => console.error('Firestore delete category error:', e));
    res.json({ success: true, message: 'Category deleted' });
  });

  // --- PRODUCTS ---
  app.get('/api/products', async (req, res) => {
    const { search, categoryId, stockStatus, status } = req.query;

    
    let filtered = [...products];

    if (status && status !== 'all') {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (categoryId && categoryId !== 'all') {
      filtered = filtered.filter((p) => p.categoryId === categoryId);
    }

    if (stockStatus) {
      if (stockStatus === 'out') {
        filtered = filtered.filter((p) => (p.currentStock || 0) === 0);
      } else if (stockStatus === 'low') {
        filtered = filtered.filter((p) => (p.currentStock || 0) > 0 && (p.currentStock || 0) <= (p.lowStockLimit || 5));
      } else if (stockStatus === 'in') {
        filtered = filtered.filter((p) => (p.currentStock || 0) > (p.lowStockLimit || 5));
      }
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Attach category name to product
    const result = filtered.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      return {
        ...p,
        categoryName: cat ? cat.name : 'Uncategorized'
      };
    });

    res.json(result);
  });

  app.get('/api/products/:id', async (req, res) => {
    
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const cat = categories.find((c) => c.id === product.categoryId);
    res.json({ ...product, categoryName: cat ? cat.name : 'Uncategorized' });
  });

  // Create Product
  app.post('/api/products', (req, res) => {
    const {
      sku,
      categoryId,
      name,
      description,
      itemsPerPack,
      image,
      purchasePrice,
      sellingPrice,
      discountPercent,
      gstPercent,
      openingStock,
      currentStock,
      lowStockLimit,
      status,
      displayOrder,
      hsnCode
    } = req.body;

    if (!sku || !name || !categoryId || sellingPrice === undefined) {
      return res.status(400).json({ message: 'SKU, Name, Category, and Selling Price are required' });
    }

    // Check SKU uniqueness
    const normalizedSKU = sku.trim().toUpperCase();
    const existing = products.find((p) => p.sku.toUpperCase() === normalizedSKU);
    if (existing) {
      return res.status(400).json({ message: `SKU "${sku}" already exists! SKU must be unique.` });
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: normalizedSKU,
      categoryId,
      categoryName: categories.find(c => c.id === categoryId)?.name || '',
      name: name.trim(),
      description: description || '',
      itemsPerPack: itemsPerPack || '1 Pcs',
      image: image || '',
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : 50,
      gstPercent: Number(gstPercent) !== undefined ? Number(gstPercent) : 18,
      openingStock: Number(openingStock) || 0,
      currentStock: Number(currentStock) !== undefined ? Number(currentStock) : (Number(openingStock) || 0),
      lowStockLimit: Number(lowStockLimit) || 10,
      status: status || 'active',
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
      hsnCode: hsnCode || '36041000',
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    setDoc(doc(db, 'products', newProduct.id), newProduct).catch(e => console.error('Firestore save product error:', e));

    // Trigger catalog generation on stock out or status change
    if (newProduct.currentStock === 0) {
      createStockOutNotificationServer(newProduct).catch(e => console.error(e));
      generateStaticSKUCatalogServer().catch(e => console.error(e));
    } else if (newProduct.status === 'active' || newProduct.status === 'inactive') {
      generateStaticSKUCatalogServer().catch(e => console.error(e));
    }

    res.status(201).json(newProduct);
  });

  // Update Product
  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const prevProduct = { ...products[index] };

    const {
      sku,
      categoryId,
      name,
      description,
      itemsPerPack,
      image,
      purchasePrice,
      sellingPrice,
      discountPercent,
      gstPercent,
      currentStock,
      lowStockLimit,
      status,
      displayOrder,
      hsnCode
    } = req.body;

    if (sku) {
      const normalizedSKU = sku.trim().toUpperCase();
      const existing = products.find((p) => p.sku.toUpperCase() === normalizedSKU && p.id !== id);
      if (existing) {
        return res.status(400).json({ message: `SKU "${sku}" is already assigned to another product!` });
      }
      products[index].sku = normalizedSKU;
    }

    if (name) products[index].name = name.trim();
    if (categoryId) {
      products[index].categoryId = categoryId;
      products[index].categoryName = categories.find(c => c.id === categoryId)?.name || '';
    }
    if (description !== undefined) products[index].description = description;
    if (itemsPerPack !== undefined) products[index].itemsPerPack = itemsPerPack;
    
    if (image !== undefined) products[index].image = image;
    if (purchasePrice !== undefined) products[index].purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) products[index].sellingPrice = Number(sellingPrice);
    if (discountPercent !== undefined) products[index].discountPercent = Number(discountPercent);
    if (gstPercent !== undefined) products[index].gstPercent = Number(gstPercent);
    if (currentStock !== undefined) products[index].currentStock = Math.max(0, Number(currentStock));
    if (lowStockLimit !== undefined) products[index].lowStockLimit = Number(lowStockLimit);
    if (status) products[index].status = status;
    if (displayOrder !== undefined) products[index].displayOrder = displayOrder ? Number(displayOrder) : undefined;
    if (hsnCode) products[index].hsnCode = hsnCode;
    products[index].updatedAt = new Date().toISOString();

    setDoc(doc(db, 'products', id), products[index]).catch(e => console.error('Firestore update product error:', e));

    // Trigger catalog generation on stock out or status change
    const prevStock = prevProduct.currentStock || 0;
    const newStock = products[index].currentStock || 0;
    const prevStatus = prevProduct.status;
    const newStatus = products[index].status;

    const becameStockOut = (newStock === 0 && prevStock > 0);
    const becameInStock = (newStock > 0 && prevStock === 0);
    const statusChanged = (prevStatus !== newStatus && (newStatus === 'active' || newStatus === 'inactive'));

    if (becameStockOut) {
      createStockOutNotificationServer(products[index]).catch(e => console.error(e));
      generateStaticSKUCatalogServer().catch(e => console.error(e));
    } else if (becameInStock || statusChanged || newStatus === 'active' || prevStatus === 'active') {
      generateStaticSKUCatalogServer().catch(e => console.error(e));
    }

    res.json(products[index]);
  });

  // Delete Product
  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    products = products.filter((p) => p.id !== id);
    deleteDoc(doc(db, 'products', id))
      .then(() => generateStaticSKUCatalogServer())
      .catch(e => console.error('Firestore delete product error:', e));
    res.json({ success: true, message: 'Product deleted' });
  });

  // Bulk CSV Import
  app.post('/api/products/bulk-import', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for bulk import' });
    }

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    items.forEach((item: any, idx: number) => {
      if (!item.sku || !item.name) {
        skippedCount++;
        errors.push(`Row ${idx + 1}: Missing required SKU or Name`);
        return;
      }

      const normalizedSKU = String(item.sku).trim().toUpperCase();
      let cat = categories.find(
        (c) => c.name.toLowerCase() === String(item.category || '').toLowerCase().trim()
      );

      if (!cat) {
        // Assign to first category or create default
        cat = categories[0] || { id: 'cat-1', name: 'General', displayOrder: 1 };
      }

      const existingIndex = products.findIndex((p) => p.sku.toUpperCase() === normalizedSKU);

      if (existingIndex !== -1) {
        // Update existing product stock/prices
        products[existingIndex] = {
          ...products[existingIndex],
          name: String(item.name || products[existingIndex].name),
          description: item.description || products[existingIndex].description,
          sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : products[existingIndex].sellingPrice,
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : products[existingIndex].purchasePrice,
          currentStock: item.currentStock !== undefined ? Number(item.currentStock) : products[existingIndex].currentStock,
          itemsPerPack: item.itemsPerPack || products[existingIndex].itemsPerPack
        };
        updatedCount++;
      } else {
        // Create new product
        const newP: Product = {
          id: `prod-${Date.now()}-${idx}`,
          sku: normalizedSKU,
          categoryId: cat.id,
          name: String(item.name).trim(),
          description: item.description || '',
          itemsPerPack: item.itemsPerPack || '1 Box',
          image: item.image || '',
          purchasePrice: Number(item.purchasePrice) || 0,
          sellingPrice: Number(item.sellingPrice) || 0,
          gstPercent: Number(item.gstPercent) || 18,
          openingStock: Number(item.currentStock) || 100,
          currentStock: Number(item.currentStock) || 100,
          lowStockLimit: Number(item.lowStockLimit) || 10,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        products.push(newP);
        addedCount++;
      }
    });

    // Sync bulk CSV import to Firestore
    try {
      const batch = writeBatch(db);
      products.forEach((p) => {
        batch.set(doc(db, 'products', p.id), p);
      });
      batch.commit()
        .then(() => {
          generateStaticSKUCatalogServer().catch(e => console.error(e));
        })
        .catch(e => console.error('Bulk import Firestore batch save error:', e));
    } catch (e) {
      console.error('Bulk import Firestore error:', e);
    }

    res.json({
      success: true,
      addedCount,
      updatedCount,
      skippedCount,
      errors
    });
  });

  // --- ENQUIRIES ---
  app.get('/api/enquiries', async (req, res) => {
    const { status, date, phone, customer } = req.query;
    
    let list = [...enquiries];

    if (status && status !== 'all') {
      list = list.filter((e) => e.status === status);
    }

    if (phone) {
      list = list.filter((e) => e.customerDetails.mobile.includes(String(phone)));
    }

    if (customer) {
      list = list.filter((e) =>
        e.customerDetails.name.toLowerCase().includes(String(customer).toLowerCase())
      );
    }

    if (date) {
      list = list.filter((e) => e.createdAt.startsWith(String(date)));
    }

    res.json(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.get('/api/enquiries/:id', async (req, res) => {
    
    const enq = enquiries.find((e) => e.id === req.params.id);
    if (!enq) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(enq);
  });

  // Public Submit Enquiry
  app.post('/api/enquiries', (req, res) => {
    const { customerDetails, items } = req.body;

    if (!customerDetails || !customerDetails.name || !customerDetails.mobile || !customerDetails.address) {
      return res.status(400).json({ message: 'Name, Mobile number, and Address are required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your enquiry cart is empty' });
    }

    let totalAmount = 0;
    let totalItems = 0;

    const enquiryItems: EnquiryItem[] = items.map((it: any, index: number) => {
      const prod = products.find((p) => p.id === it.productId);
      const unitPrice = prod ? (prod.discountPercent !== undefined ? (prod.discountPercent > 0 ? prod.sellingPrice * (1 - prod.discountPercent / 100) : prod.sellingPrice) : (prod.sellingPrice * 0.5)) : Number(it.unitPrice || 0);
      const qty = Math.max(1, Number(it.qty || 1));
      const lineAmount = unitPrice * qty;

      totalAmount += lineAmount;
      totalItems += qty;

      return {
        id: `eqi-${Date.now()}-${index}`,
        enquiryId: '',
        productId: it.productId,
        productName: prod ? prod.name : it.productName || 'Firecracker Product',
        sku: prod ? prod.sku : it.sku || 'N/A',
        qty,
        unitPrice,
        amount: lineAmount,
        itemsPerPack: prod ? prod.itemsPerPack : '1 Pcs'
      };
    });

    if (totalAmount < shopInfo.minimumOrderAmount) {
      return res.status(400).json({
        message: `Minimum order total must be at least ₹${shopInfo.minimumOrderAmount}. Current total: ₹${totalAmount}`
      });
    }

    const currentEnqNum = sequenceSettings.enquiryNextNumber;
    sequenceSettings.enquiryNextNumber += 1;
    setDoc(doc(db, 'settings', 'sequences'), sequenceSettings)
      .catch(e => console.error('Error auto-saving updated enquiry sequence settings:', e));

    const enqId = generateSequenceNumber(
      sequenceSettings.enquiryPrefix,
      currentEnqNum,
      sequenceSettings.enquiryUseYear,
      sequenceSettings.enquiryPadding
    );

    const newEnquiry: Enquiry = {
      id: enqId,
      customerId: `cust-${Date.now()}`,
      customerDetails: {
        name: customerDetails.name.trim(),
        mobile: customerDetails.mobile.trim(),
        address: customerDetails.address.trim()
      },
      totalItems,
      totalAmount,
      status: 'Pending',
      items: enquiryItems.map((item) => ({ ...item, enquiryId: enqId })),
      createdAt: new Date().toISOString()
    };

    enquiries.unshift(newEnquiry);
    setDoc(doc(db, 'enquiries', newEnquiry.id), newEnquiry).catch(e => console.error('Firestore save enquiry error:', e));

    res.status(201).json(newEnquiry);
  });

  // Update Enquiry Status (Pending, Confirmed, Shipped, Success, Cancelled)
  app.put('/api/enquiries/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['Pending', 'Confirmed', 'Shipped', 'Success', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Pending, Confirmed, Shipped, Success, or Cancelled' });
    }

    const index = enquiries.findIndex((e) => e.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    enquiries[index].status = status;
    if (notes !== undefined) enquiries[index].notes = notes;

    setDoc(doc(db, 'enquiries', enquiries[index].id), enquiries[index]).catch(e => console.error('Firestore update enquiry error:', e));

    res.json(enquiries[index]);
  });

  // Track Order / Enquiry API
  app.get('/api/orders/track/:query', async (req, res) => {
    const rawQuery = (req.params.query || '').trim().toLowerCase();
    
    if (!rawQuery) {
      return res.status(400).json({ message: 'Please enter a valid Order ID or Mobile Number' });
    }

    // Match exact ID, numeric part, invoice ID, or customer mobile
    const matches = enquiries.filter((e) => {
      const eId = e.id.toLowerCase();
      const mob = (e.customerDetails?.mobile || '').replace(/\D/g, '');
      const queryClean = rawQuery.replace(/\D/g, '');
      const invId = (e.invoiceId || '').toLowerCase();

      // Check ID match e.g. "ENQ-1001" or "1001" or "ENQ1001"
      if (eId === rawQuery || eId.replace(/[^a-z0-0]/g, '') === rawQuery) return true;
      if (eId.includes(rawQuery)) return true;
      if (invId && (invId === rawQuery || invId.includes(rawQuery))) return true;

      // Check Mobile match
      if (queryClean.length >= 4 && mob.includes(queryClean)) return true;

      return false;
    });

    if (matches.length === 0) {
      return res.status(404).json({ message: `No order found matching "${req.params.query}". Please check your Order ID or registered Mobile Number.` });
    }

    // Return matched enquiries sorted by latest
    res.json({
      success: true,
      count: matches.length,
      orders: matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });
  });

  // --- INVOICES ---
  app.get('/api/invoices', async (req, res) => {
    
    res.json(invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.get('/api/invoices/:id', async (req, res) => {
    
    const inv = invoices.find((i) => i.id === req.params.id);
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json(inv);
  });

  // Generate Invoice for Success Order
  app.post('/api/invoices/generate', (req, res) => {
    const { enquiryId } = req.body;

    const enqIndex = enquiries.findIndex((e) => e.id === enquiryId);
    if (enqIndex === -1) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    const enq = enquiries[enqIndex];

    if (enq.status !== 'Success') {
      return res.status(400).json({
        message: 'Invoice can only be generated for enquiries marked as "Success"!'
      });
    }

    if (enq.invoiceGenerated && enq.invoiceId) {
      const existingInv = invoices.find((i) => i.id === enq.invoiceId);
      if (existingInv) return res.json(existingInv);
    }

    // Prepare Invoice Items & Inventory Deductions
    const invoiceItems: InvoiceItem[] = [];
    let grandTotal = 0;
    let subtotal = 0;
    let totalGstAmount = 0;
    let anyProductStockedOut = false;

    // Deduct stock for each item & ensure non-negative stock
    for (const item of enq.items) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      const gstPercent = pIndex !== -1 ? products[pIndex].gstPercent : 18;
      const itemPrice = item.unitPrice;
      const lineTotal = itemPrice * item.qty;

      // GST Calculation: lineTotal includes GST or add tax
      // Standard B2B calculation: Base price = lineTotal / (1 + gstPercent/100)
      const basePrice = lineTotal / (1 + gstPercent / 100);
      const itemGst = lineTotal - basePrice;

      subtotal += basePrice;
      totalGstAmount += itemGst;
      grandTotal += lineTotal;

      if (pIndex !== -1) {
        // AUTOMATIC INVENTORY DEDUCTION
        const prevStock = products[pIndex].currentStock;
        const newStock = Math.max(0, products[pIndex].currentStock - item.qty);
        products[pIndex].currentStock = newStock;
        products[pIndex].updatedAt = new Date().toISOString();

        if (newStock === 0 && prevStock > 0) {
          anyProductStockedOut = true;
          createStockOutNotificationServer(products[pIndex]).catch(e => console.error(e));
        }
      }

      invoiceItems.push({
        id: `ini-${Date.now()}-${invoiceItems.length}`,
        invoiceId: '',
        productId: item.productId,
        sku: item.sku,
        hsnCode: pIndex !== -1 ? products[pIndex].hsnCode || '36041000' : '36041000',
        productName: item.productName,
        qty: item.qty,
        unitPrice: itemPrice,
        sellingPrice: itemPrice,
        gstPercent,
        gstAmount: Number(itemGst.toFixed(2)),
        amount: lineTotal
      });
    }

    const isGstEnabled = shopInfo.gstEnabled || false;
    let invId = '';
    
    if (isGstEnabled) {
      const currentGstNum = sequenceSettings.gstNextNumber || 1;
      sequenceSettings.gstNextNumber = currentGstNum + 1;
      setDoc(doc(db, 'settings', 'sequences'), sequenceSettings)
        .catch(e => console.error('Error auto-saving updated GST sequence settings:', e));
        
      invId = generateSequenceNumber(
        sequenceSettings.gstPrefix || 'GST',
        currentGstNum,
        sequenceSettings.gstUseYear !== false,
        sequenceSettings.gstPadding || 4
      );
    } else {
      const currentInvNum = sequenceSettings.invoiceNextNumber || 501;
      sequenceSettings.invoiceNextNumber = currentInvNum + 1;
      setDoc(doc(db, 'settings', 'sequences'), sequenceSettings)
        .catch(e => console.error('Error auto-saving updated INV sequence settings:', e));
      invId = generateSequenceNumber(
        sequenceSettings.invoicePrefix || 'INV',
        currentInvNum,
        sequenceSettings.invoiceUseYear !== false,
        sequenceSettings.invoicePadding || 4
      );
    }

    const newInvoice: Invoice = {
      id: invId,
      enquiryId: enq.id,
      enquiryNo: enq.id,
      customerId: enq.customerId,
      customerDetails: enq.customerDetails,
      date: new Date().toISOString(),
      isGstBill: isGstEnabled,
      subtotal: isGstEnabled ? Number(subtotal.toFixed(2)) : Math.round(grandTotal),
      gstAmount: isGstEnabled ? Number(totalGstAmount.toFixed(2)) : 0,
      grandTotal: Math.round(grandTotal),
      status: 'Generated',
      items: invoiceItems.map((invItem) => ({ ...invItem, invoiceId: invId })),
      shopDetails: {
        name: shopInfo.name,
        tagline: shopInfo.tagline,
        address: shopInfo.address,
        cityState: shopInfo.cityState,
        phone: shopInfo.phone,
        secondaryPhone: shopInfo.secondaryPhone,
        whatsapp: shopInfo.whatsapp,
        email: shopInfo.email,
        gstin: shopInfo.gstin,
        minimumOrderAmount: shopInfo.minimumOrderAmount,
        bankName: shopInfo.bankName,
        accountName: shopInfo.accountName,
        accountNumber: shopInfo.accountNumber,
        ifscCode: shopInfo.ifscCode,
        upiId: shopInfo.upiId,
        terms: shopInfo.terms
      },
      createdAt: new Date().toISOString()
    };

    invoices.unshift(newInvoice);

    // Update enquiry record
    enquiries[enqIndex].invoiceGenerated = true;
    enquiries[enqIndex].invoiceId = invId;

    // Sync invoice, updated stock, and updated enquiry to Firestore
    try {
      const batch = writeBatch(db);
      
      // Save updated products stock
      enq.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          batch.set(doc(db, 'products', prod.id), prod);
        }
      });

      // Save new invoice
      batch.set(doc(db, 'invoices', newInvoice.id), newInvoice);

      // Save updated enquiry
      batch.set(doc(db, 'enquiries', enquiries[enqIndex].id), enquiries[enqIndex]);

      batch.commit()
        .then(() => {
          if (anyProductStockedOut) {
            generateStaticSKUCatalogServer().catch(e => console.error(e));
          }
        })
        .catch(e => console.error('Firestore invoice generate batch save error:', e));
    } catch (e) {
      console.error('Firestore invoice generate error:', e);
    }

    res.status(201).json(newInvoice);
  });

  // --- OFFLINE ORDERS / POS BILLING ---
  app.get('/api/offline-orders', async (req, res) => {
    const { paymentMode, date, search } = req.query;
    
    let list = [...offlineOrders];

    if (paymentMode && paymentMode !== 'all') {
      list = list.filter((o) => o.paymentMode === paymentMode);
    }

    if (date) {
      list = list.filter((o) => o.createdAt.startsWith(String(date)));
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.billNumber.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerPhone && o.customerPhone.includes(q))
      );
    }

    res.json(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.post('/api/offline-orders', (req, res) => {
    const { customerName, customerPhone, items, paymentMode, cashAmount, upiAmount, upiRefNo, discountAmount, isGstBill } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'POS order must contain at least 1 item' });
    }

    if (!['Cash', 'UPI', 'Split'].includes(paymentMode)) {
      return res.status(400).json({ message: 'Invalid payment mode. Must be Cash, UPI, or Split' });
    }

    let subtotal = 0;
    let totalGstAmount = 0;
    let grandTotal = 0;
    let anyProductStockedOut = false;

    const orderItems: OfflineOrderItem[] = [];

    // Deduct stock and process line items
    for (const it of items) {
      const isCustom = it.productId?.startsWith('custom-');
      const pIndex = products.findIndex((p) => p.id === it.productId);
      
      if (pIndex === -1 && !isCustom) {
        return res.status(400).json({ message: `Product with ID ${it.productId} not found` });
      }

      const qty = Math.max(1, Number(it.qty || 1));
      let prodName = it.productName || 'Custom Item';
      let prodSku = it.sku || 'CUSTOM';
      let prodHsn = it.hsnCode || '36041000';
      let gstPercent = Number(it.gstPercent) || 18;
      let sellingPrice = Number(it.unitPrice) || 0;

      if (!isCustom && pIndex !== -1) {
        const prod = products[pIndex];
        if (prod.currentStock < qty) {
          return res.status(400).json({
            message: `Insufficient stock for ${prod.name}. Available: ${prod.currentStock}, Requested: ${qty}`
          });
        }
        prodName = prod.name;
        prodSku = prod.sku;
        prodHsn = prod.hsnCode || '36041000';
        gstPercent = prod.gstPercent || 18;
        sellingPrice = prod.sellingPrice;
        
        // Update Stock
        const prevStock = products[pIndex].currentStock;
        const newStock = products[pIndex].currentStock - qty;
        products[pIndex].currentStock = newStock;
        products[pIndex].updatedAt = new Date().toISOString();

        if (newStock === 0 && prevStock > 0) {
          anyProductStockedOut = true;
          createStockOutNotificationServer(products[pIndex]).catch(e => console.error(e));
        }
      }

      const unitPrice = Number(it.unitPrice) || sellingPrice;
      const lineTotal = unitPrice * qty;
      const basePrice = lineTotal / (1 + gstPercent / 100);
      const itemGst = lineTotal - basePrice;

      subtotal += basePrice;
      totalGstAmount += itemGst;
      grandTotal += lineTotal;

      orderItems.push({
        productId: it.productId,
        sku: prodSku,
        hsnCode: prodHsn,
        productName: prodName,
        qty,
        unitPrice,
        gstPercent,
        gstAmount: Number(itemGst.toFixed(2)),
        amount: lineTotal
      });
    }

    const discount = Number(discountAmount) || 0;
    const finalGrandTotal = Math.max(0, Math.round(grandTotal - discount));
    
    let billNumber = '';
    
    if (isGstBill) {
      const currentGstNum = sequenceSettings.gstNextNumber || 1;
      sequenceSettings.gstNextNumber = currentGstNum + 1;
      setDoc(doc(db, 'settings', 'sequences'), sequenceSettings)
        .catch(e => console.error('Error auto-saving updated GST sequence settings:', e));
        
      billNumber = generateSequenceNumber(
        sequenceSettings.gstPrefix || 'GST',
        currentGstNum,
        sequenceSettings.gstUseYear !== false,
        sequenceSettings.gstPadding || 4
      );
    } else {
      const currentPosNum = sequenceSettings.posNextNumber;
      sequenceSettings.posNextNumber += 1;
      setDoc(doc(db, 'settings', 'sequences'), sequenceSettings)
        .catch(e => console.error('Error auto-saving updated POS sequence settings:', e));
  
      billNumber = generateSequenceNumber(
        sequenceSettings.posPrefix,
        currentPosNum,
        sequenceSettings.posUseYear,
        sequenceSettings.posPadding
      );
    }

    const newOrder: OfflineOrder = {
      id: billNumber,
      billNumber,
      customerName: customerName ? String(customerName).trim() : 'Walk-in Customer',
      customerPhone: customerPhone ? String(customerPhone).trim() : '',
      items: orderItems,
      subtotal: isGstBill ? Number(subtotal.toFixed(2)) : Number(grandTotal.toFixed(2)),
      gstAmount: isGstBill ? Number(totalGstAmount.toFixed(2)) : 0,
      discountAmount: discount,
      grandTotal: finalGrandTotal,
      paymentMode,
      cashAmount: paymentMode === 'Cash' ? finalGrandTotal : paymentMode === 'Split' ? Number(cashAmount) || 0 : 0,
      upiAmount: paymentMode === 'UPI' ? finalGrandTotal : paymentMode === 'Split' ? Number(upiAmount) || 0 : 0,
      upiRefNo: upiRefNo ? String(upiRefNo).trim() : undefined,
      createdAt: new Date().toISOString(),
      cashierName: 'Admin Counter',
      isGstBill: !!isGstBill
    };

    offlineOrders.unshift(newOrder);

    // Sync POS order and updated stock to Firestore
    try {
      const batch = writeBatch(db);
      
      // Save updated products stock
      orderItems.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          batch.set(doc(db, 'products', prod.id), prod);
        }
      });

      // Save new offline order
      batch.set(doc(db, 'offlineOrders', newOrder.id), newOrder);

      batch.commit()
        .then(() => {
          if (anyProductStockedOut) {
            generateStaticSKUCatalogServer().catch(e => console.error(e));
          }
        })
        .catch(e => console.error('Firestore POS order batch save error:', e));
    } catch (e) {
      console.error('Firestore POS order error:', e);
    }

    res.status(201).json(newOrder);
  });

  // --- DASHBOARD STATS & ANALYTICS ---
  app.get('/api/stats', async (req, res) => {
    const todayStr = new Date().toISOString().split('T')[0];
    

    const todayInvoices = invoices.filter((inv) => inv.date.startsWith(todayStr));
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalSuccessfulOrders = enquiries.filter((e) => e.status === 'Success').length;
    const pendingOrders = enquiries.filter((e) => e.status === 'Pending').length;
    const closedOrders = enquiries.filter((e) => e.status === 'Cancelled').length;
    const totalEnquiries = enquiries.length;

    const lowStockProducts = products.filter(
      (p) => (p.currentStock || 0) > 0 && (p.currentStock || 0) <= (p.lowStockLimit || 5)
    ).length;

    const outOfStockProducts = products.filter((p) => (p.currentStock || 0) === 0).length;

    const inventoryValue = products.reduce(
      (sum, p) => sum + (p.currentStock || 0) * (p.sellingPrice || 0),
      0
    );

    // Daily Sales chart data (past 7 days)
    const dailySalesMap: { [key: string]: { sales: number; orders: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailySalesMap[displayLabel] = { sales: 0, orders: 0 };
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailySalesMap[displayLabel]) {
        dailySalesMap[displayLabel].sales += inv.grandTotal;
        dailySalesMap[displayLabel].orders += 1;
      }
    });

    const dailySales = Object.entries(dailySalesMap).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders
    }));

    // Monthly Sales chart data (past 6 months)
    const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const monthlySales = [];
    for (let i = 5; i >= 0; i--) {
      let idx = currentMonthIdx - i;
      if (idx < 0) idx += 12;
      const mName = monthsList[idx];
      // Generate realistic demo curve + actual invoice data
      const monthInvoices = invoices.filter(
        (inv) => new Date(inv.date).toLocaleString('en-US', { month: 'short' }) === mName
      );
      const actualSales = monthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      monthlySales.push({
        month: mName,
        sales: actualSales > 0 ? actualSales : (i === 0 ? totalSales || 15000 : 12000 + (6 - i) * 3500),
        enquiries: enquiries.length + Math.floor(Math.random() * 5)
      });
    }

    // Category Sales data
    const catSalesMap: { [key: string]: { sales: number; itemsCount: number } } = {};
    categories.forEach((cat) => {
      catSalesMap[cat.name] = { sales: 0, itemsCount: 0 };
    });

    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = categories.find((c) => c.id === prod?.categoryId);
        const catName = cat ? cat.name : 'Other';
        if (!catSalesMap[catName]) catSalesMap[catName] = { sales: 0, itemsCount: 0 };
        catSalesMap[catName].sales += item.amount;
        catSalesMap[catName].itemsCount += item.qty;
      });
    });

    const categorySales = Object.entries(catSalesMap)
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        itemsCount: data.itemsCount
      }))
      .filter((c) => c.sales > 0 || c.itemsCount > 0);

    // If empty category sales, provide top active category distribution for charts
    if (categorySales.length === 0) {
      categories.slice(0, 5).forEach((cat, idx) => {
        categorySales.push({
          category: cat.name,
          sales: (5 - idx) * 4500,
          itemsCount: (5 - idx) * 25
        });
      });
    }

    res.json({
      stats: {
        todaySales,
        totalSales,
        totalSuccessfulOrders,
        pendingOrders,
        closedOrders,
        totalEnquiries,
        lowStockProducts,
        outOfStockProducts,
        inventoryValue
      },
      dailySales,
      monthlySales,
      categorySales
    });
  });

  // --- REPORTS DATA ---
  app.get('/api/reports', async (req, res) => {
    
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
        lowStockLimit: p.lowStockLimit,
        totalValue: (p.currentStock || 0) * (p.sellingPrice || 0),
        stockStatus
      };
    });

    // Order Report
    const orderReport = enquiries.map((e) => ({
      enquiryNo: e.id,
      date: new Date(e.createdAt).toLocaleDateString(),
      customerName: e.customerDetails.name,
      mobile: e.customerDetails.mobile,
      address: e.customerDetails.address,
      itemsCount: e.totalItems,
      totalAmount: e.totalAmount,
      status: e.status,
      invoiceGenerated: e.invoiceGenerated ? 'Yes' : 'No'
    }));

    // Category Report
    const categoryReportMap: { [catName: string]: { totalProducts: number; totalStock: number; stockValue: number; salesValue: number } } = {};
    categories.forEach((cat) => {
      categoryReportMap[cat.name] = { totalProducts: 0, totalStock: 0, stockValue: 0, salesValue: 0 };
    });

    products.forEach((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      const catName = cat ? cat.name : 'Uncategorized';
      if (!categoryReportMap[catName]) {
        categoryReportMap[catName] = { totalProducts: 0, totalStock: 0, stockValue: 0, salesValue: 0 };
      }
      categoryReportMap[catName].totalProducts += 1;
      categoryReportMap[catName].totalStock += p.currentStock;
      categoryReportMap[catName].stockValue += (p.currentStock || 0) * (p.sellingPrice || 0);
    });

    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = categories.find((c) => c.id === prod?.categoryId);
        const catName = cat ? cat.name : 'Uncategorized';
        if (categoryReportMap[catName]) {
          categoryReportMap[catName].salesValue += item.amount;
        }
      });
    });

    const categoryReport = Object.entries(categoryReportMap).map(([category, data]) => ({
      category,
      totalProducts: data.totalProducts,
      totalStock: data.totalStock,
      stockValue: data.stockValue,
      salesValue: data.salesValue
    }));

    // Offline POS Orders Report
    const offlineReport = offlineOrders.map((o) => ({
      billNumber: o.billNumber,
      date: new Date(o.createdAt).toLocaleString('en-IN'),
      customerName: o.customerName || 'Walk-in Customer',
      customerPhone: o.customerPhone || 'N/A',
      paymentMode: o.paymentMode,
      cashAmount: o.cashAmount || 0,
      upiAmount: o.upiAmount || 0,
      upiRefNo: o.upiRefNo || '-',
      itemsCount: o.items.reduce((s, i) => s + i.qty, 0),
      subtotal: o.subtotal,
      gstAmount: o.gstAmount,
      discountAmount: o.discountAmount || 0,
      grandTotal: o.grandTotal
    }));

    // GST Bills Report (Combined Online & POS)
    const gstReport: any[] = [];
    
    invoices.filter(inv => inv.isGstBill).forEach(inv => {
      gstReport.push({
        billNo: inv.id,
        source: 'Online B2B',
        date: new Date(inv.date).toLocaleDateString(),
        customerName: inv.customerDetails.name,
        customerPhone: inv.customerDetails.mobile,
        itemsCount: inv.items.reduce((s, i) => s + i.qty, 0),
        subtotal: inv.subtotal,
        gstAmount: inv.gstAmount,
        grandTotal: inv.grandTotal
      });
    });

    offlineOrders.filter(o => o.isGstBill).forEach(o => {
      gstReport.push({
        billNo: o.billNumber,
        source: 'POS Offline',
        date: new Date(o.createdAt).toLocaleString('en-IN'),
        customerName: o.customerName || 'Walk-in Customer',
        customerPhone: o.customerPhone || 'N/A',
        itemsCount: o.items.reduce((s, i) => s + i.qty, 0),
        subtotal: o.subtotal,
        gstAmount: o.gstAmount,
        grandTotal: o.grandTotal
      });
    });

    res.json({
      salesReport,
      inventoryReport,
      orderReport,
      categoryReport,
      offlineReport,
      gstReport
    });
  });

  // ==========================================
  // VITE SERVING MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Firecracker B2B Shop server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
