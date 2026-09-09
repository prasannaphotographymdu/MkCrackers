export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  sku: string;
  hsnCode?: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  itemsPerPack: string; // e.g., "10 Pcs", "1 Box"
  image: string;
  purchasePrice: number;
  sellingPrice: number;
  discountPercent?: number;
  gstPercent: number; // e.g. 18
  openingStock: number;
  currentStock: number;
  lowStockLimit: number;
  status: 'active' | 'inactive';
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface CustomerDetails {
  name: string;
  mobile: string;
  address: string;
}

export type EnquiryStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Success' | 'Cancelled';

export interface EnquiryItem {
  id: string;
  enquiryId: string;
  productId: string;
  productName: string;
  sku: string;
  hsnCode?: string;
  qty: number;
  unitPrice: number;
  amount: number;
  itemsPerPack: string;
}

export interface Enquiry {
  id: string; // e.g. "ENQ-1001"
  customerId: string;
  customerDetails: CustomerDetails;
  totalItems: number;
  totalAmount: number;
  status: EnquiryStatus;
  items: EnquiryItem[];
  createdAt: string;
  notes?: string;
  invoiceGenerated?: boolean;
  invoiceId?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  sku: string;
  hsnCode?: string;
  productName: string;
  qty: number;
  unitPrice: number;
  sellingPrice: number;
  gstPercent: number;
  gstAmount: number;
  amount: number;
}

export interface ShopDetails {
  name: string;
  tagline: string;
  address: string;
  cityState: string;
  phone: string;
  secondaryPhone?: string;
  whatsapp: string;
  email: string;
  gstin: string;
  minimumOrderAmount: number;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  terms?: string;
  gstEnabled?: boolean;
}

export interface SequenceSettings {
  posPrefix: string;
  posNextNumber: number;
  posUseYear: boolean;
  posPadding: number;
  enquiryPrefix: string;
  enquiryNextNumber: number;
  enquiryUseYear: boolean;
  enquiryPadding: number;
  gstPrefix: string;
  gstNextNumber: number;
  gstUseYear: boolean;
  gstPadding: number;
  invoicePrefix?: string;
  invoiceNextNumber?: number;
  invoiceUseYear?: boolean;
  invoicePadding?: number;
}

export interface Invoice {
  id: string; // e.g. "INV-5001"
  enquiryId: string;
  enquiryNo: string;
  customerId: string;
  customerDetails: CustomerDetails;
  date: string;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  status: 'Generated' | 'Paid';
  items: InvoiceItem[];
  shopDetails: ShopDetails;
  createdAt: string;
  isGstBill?: boolean;
}

export interface DashboardStats {
  todaySales: number;
  totalSales: number;
  totalSuccessfulOrders: number;
  pendingOrders: number;
  closedOrders: number;
  totalEnquiries: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryValue: number;
}

export interface DailySalesData {
  date: string; // "YYYY-MM-DD" or "Aug 05"
  sales: number;
  orders: number;
}

export interface MonthlySalesData {
  month: string; // "Jan", "Feb", etc.
  sales: number;
  enquiries: number;
}

export interface CategorySalesData {
  category: string;
  sales: number;
  itemsCount: number;
}

export interface CSVProductImportRow {
  sku: string;
  category: string;
  name: string;
  description?: string;
  itemsPerPack?: string;
  purchasePrice?: number | string;
  sellingPrice?: number | string;
  gstPercent?: number | string;
  currentStock?: number | string;
  lowStockLimit?: number | string;
  status?: string;
  image?: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Split';

export interface OfflineOrderItem {
  productId: string;
  sku: string;
  hsnCode?: string;
  productName: string;
  qty: number;
  unitPrice: number;
  gstPercent: number;
  gstAmount: number;
  amount: number;
}

export interface OfflineOrder {
  id: string; // e.g. "POS-9001"
  billNumber: string; // e.g. "POS-2026-001"
  customerName?: string;
  customerPhone?: string;
  items: OfflineOrderItem[];
  subtotal: number;
  gstAmount: number;
  discountAmount?: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  cashAmount?: number;
  upiAmount?: number;
  upiRefNo?: string;
  createdAt: string;
  cashierName?: string;
  isGstBill?: boolean;
}

export type AdminTab = 
  | 'dashboard'
  | 'pos'
  | 'offline-orders'
  | 'products'
  | 'categories'
  | 'enquiries'
  | 'inventory'
  | 'reports'
  | 'settings';
