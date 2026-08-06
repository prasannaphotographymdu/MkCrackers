import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
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
  PaymentMode
} from './src/types.js';

const __dirname = process.cwd();

// In-Memory Database State (Persists during server lifecycle, resets to seed on restart)
let categories: Category[] = [...INITIAL_CATEGORIES];
let products: Product[] = [...INITIAL_PRODUCTS];
let enquiries: Enquiry[] = [...INITIAL_ENQUIRIES];
let invoices: Invoice[] = [...INITIAL_INVOICES];
let offlineOrders: OfflineOrder[] = [];
let shopInfo = { ...SHOP_INFO };

let enquiryCounter = 1004;
let invoiceCounter = 502;
let posCounter = 9001;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ==========================================
  // REST API ENDPOINTS
  // ==========================================

  // --- SHOP CONFIG & INFO ---
  app.get('/api/shop-info', (req, res) => {
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

    res.json(shopInfo);
  });

  // --- ADMIN AUTH ---
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if ((username === 'admin' && password === 'admin123') || (username === 'admin' && password === 'admin')) {
      res.json({
        success: true,
        token: 'demo-admin-jwt-token-2026',
        admin: { username: 'admin', name: 'Store Owner', role: 'Super Admin' }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
    }
  });

  // --- CATEGORIES ---
  app.get('/api/categories', (req, res) => {
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
    res.json(categories[catIndex]);
  });

  app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    categories = categories.filter((c) => c.id !== id);
    res.json({ success: true, message: 'Category deleted' });
  });

  // --- PRODUCTS ---
  app.get('/api/products', (req, res) => {
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
        filtered = filtered.filter((p) => p.currentStock === 0);
      } else if (stockStatus === 'low') {
        filtered = filtered.filter((p) => p.currentStock > 0 && p.currentStock <= p.lowStockLimit);
      } else if (stockStatus === 'in') {
        filtered = filtered.filter((p) => p.currentStock > p.lowStockLimit);
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

  app.get('/api/products/:id', (req, res) => {
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
      gstPercent,
      openingStock,
      currentStock,
      lowStockLimit,
      status
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
      name: name.trim(),
      description: description || '',
      itemsPerPack: itemsPerPack || '1 Pcs',
      image: image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      gstPercent: Number(gstPercent) !== undefined ? Number(gstPercent) : 18,
      openingStock: Number(openingStock) || 0,
      currentStock: Number(currentStock) !== undefined ? Number(currentStock) : (Number(openingStock) || 0),
      lowStockLimit: Number(lowStockLimit) || 10,
      status: status || 'active',
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
  });

  // Update Product
  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      sku,
      categoryId,
      name,
      description,
      itemsPerPack,
      image,
      purchasePrice,
      sellingPrice,
      gstPercent,
      currentStock,
      lowStockLimit,
      status
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
    if (categoryId) products[index].categoryId = categoryId;
    if (description !== undefined) products[index].description = description;
    if (itemsPerPack !== undefined) products[index].itemsPerPack = itemsPerPack;
    if (image) products[index].image = image;
    if (purchasePrice !== undefined) products[index].purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) products[index].sellingPrice = Number(sellingPrice);
    if (gstPercent !== undefined) products[index].gstPercent = Number(gstPercent);
    if (currentStock !== undefined) products[index].currentStock = Math.max(0, Number(currentStock));
    if (lowStockLimit !== undefined) products[index].lowStockLimit = Number(lowStockLimit);
    if (status) products[index].status = status;
    products[index].updatedAt = new Date().toISOString();

    res.json(products[index]);
  });

  // Delete Product
  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    products = products.filter((p) => p.id !== id);
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
          image: item.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
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

    res.json({
      success: true,
      addedCount,
      updatedCount,
      skippedCount,
      errors
    });
  });

  // --- ENQUIRIES ---
  app.get('/api/enquiries', (req, res) => {
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

  app.get('/api/enquiries/:id', (req, res) => {
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
      const unitPrice = prod ? prod.sellingPrice : Number(it.unitPrice || 0);
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

    const enqId = `ENQ-2026-${enquiryCounter++}`;

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

    res.status(201).json(newEnquiry);
  });

  // Update Enquiry Status (Pending -> Success or Closed)
  app.put('/api/enquiries/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['Pending', 'Success', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Pending, Success, or Closed' });
    }

    const index = enquiries.findIndex((e) => e.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    enquiries[index].status = status;
    if (notes) enquiries[index].notes = notes;

    res.json(enquiries[index]);
  });

  // --- INVOICES ---
  app.get('/api/invoices', (req, res) => {
    res.json(invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.get('/api/invoices/:id', (req, res) => {
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
        const newStock = Math.max(0, products[pIndex].currentStock - item.qty);
        products[pIndex].currentStock = newStock;
        products[pIndex].updatedAt = new Date().toISOString();
      }

      invoiceItems.push({
        id: `ini-${Date.now()}-${invoiceItems.length}`,
        invoiceId: '',
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        qty: item.qty,
        unitPrice: itemPrice,
        sellingPrice: itemPrice,
        gstPercent,
        gstAmount: Number(itemGst.toFixed(2)),
        amount: lineTotal
      });
    }

    const invId = `INV-2026-${invoiceCounter++}`;

    const newInvoice: Invoice = {
      id: invId,
      enquiryId: enq.id,
      enquiryNo: enq.id,
      customerId: enq.customerId,
      customerDetails: enq.customerDetails,
      date: new Date().toISOString(),
      subtotal: Number(subtotal.toFixed(2)),
      gstAmount: Number(totalGstAmount.toFixed(2)),
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

    res.status(201).json(newInvoice);
  });

  // --- OFFLINE ORDERS / POS BILLING ---
  app.get('/api/offline-orders', (req, res) => {
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
    const { customerName, customerPhone, items, paymentMode, cashAmount, upiAmount, upiRefNo, discountAmount } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'POS order must contain at least 1 item' });
    }

    if (!['Cash', 'UPI', 'Split'].includes(paymentMode)) {
      return res.status(400).json({ message: 'Invalid payment mode. Must be Cash, UPI, or Split' });
    }

    let subtotal = 0;
    let totalGstAmount = 0;
    let grandTotal = 0;

    const orderItems: OfflineOrderItem[] = [];

    // Deduct stock and process line items
    for (const it of items) {
      const pIndex = products.findIndex((p) => p.id === it.productId);
      if (pIndex === -1) {
        return res.status(400).json({ message: `Product with ID ${it.productId} not found` });
      }

      const prod = products[pIndex];
      const qty = Math.max(1, Number(it.qty || 1));

      if (prod.currentStock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${prod.name}. Available: ${prod.currentStock}, Requested: ${qty}`
        });
      }

      const unitPrice = Number(it.unitPrice) || prod.sellingPrice;
      const lineTotal = unitPrice * qty;
      const gstPercent = prod.gstPercent || 18;
      const basePrice = lineTotal / (1 + gstPercent / 100);
      const itemGst = lineTotal - basePrice;

      subtotal += basePrice;
      totalGstAmount += itemGst;
      grandTotal += lineTotal;

      // Update Stock
      products[pIndex].currentStock = products[pIndex].currentStock - qty;
      products[pIndex].updatedAt = new Date().toISOString();

      orderItems.push({
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        qty,
        unitPrice,
        gstPercent,
        gstAmount: Number(itemGst.toFixed(2)),
        amount: lineTotal
      });
    }

    const discount = Number(discountAmount) || 0;
    const finalGrandTotal = Math.max(0, Math.round(grandTotal - discount));

    const billNumber = `POS-2026-${posCounter++}`;
    const newOrder: OfflineOrder = {
      id: billNumber,
      billNumber,
      customerName: customerName ? String(customerName).trim() : 'Walk-in Customer',
      customerPhone: customerPhone ? String(customerPhone).trim() : '',
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      gstAmount: Number(totalGstAmount.toFixed(2)),
      discountAmount: discount,
      grandTotal: finalGrandTotal,
      paymentMode,
      cashAmount: paymentMode === 'Cash' ? finalGrandTotal : paymentMode === 'Split' ? Number(cashAmount) || 0 : 0,
      upiAmount: paymentMode === 'UPI' ? finalGrandTotal : paymentMode === 'Split' ? Number(upiAmount) || 0 : 0,
      upiRefNo: upiRefNo ? String(upiRefNo).trim() : undefined,
      createdAt: new Date().toISOString(),
      cashierName: 'Admin Counter'
    };

    offlineOrders.unshift(newOrder);

    res.status(201).json(newOrder);
  });

  // --- DASHBOARD STATS & ANALYTICS ---
  app.get('/api/stats', (req, res) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const todayInvoices = invoices.filter((inv) => inv.date.startsWith(todayStr));
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalSuccessfulOrders = enquiries.filter((e) => e.status === 'Success').length;
    const pendingOrders = enquiries.filter((e) => e.status === 'Pending').length;
    const closedOrders = enquiries.filter((e) => e.status === 'Closed').length;
    const totalEnquiries = enquiries.length;

    const lowStockProducts = products.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.lowStockLimit
    ).length;

    const outOfStockProducts = products.filter((p) => p.currentStock === 0).length;

    const inventoryValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.sellingPrice,
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
  app.get('/api/reports', (req, res) => {
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
      if (p.currentStock === 0) stockStatus = 'Out of Stock';
      else if (p.currentStock <= p.lowStockLimit) stockStatus = 'Low Stock';

      return {
        sku: p.sku,
        name: p.name,
        category: cat ? cat.name : 'Uncategorized',
        itemsPerPack: p.itemsPerPack,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        currentStock: p.currentStock,
        lowStockLimit: p.lowStockLimit,
        totalValue: p.currentStock * p.sellingPrice,
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
      categoryReportMap[catName].stockValue += p.currentStock * p.sellingPrice;
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

    res.json({
      salesReport,
      inventoryReport,
      orderReport,
      categoryReport,
      offlineReport
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
