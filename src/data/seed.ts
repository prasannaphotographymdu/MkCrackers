import { Category, Product, Enquiry, Invoice } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Single Sound Crackers', description: 'Traditional Sivakasi single loud bang sound crackers', displayOrder: 1, icon: 'Flame' },
  { id: 'cat-2', name: 'Multi-Sound & Chorsa (Garland)', description: 'Long garland crackers with continuous rapid sound', displayOrder: 2, icon: 'Zap' },
  { id: 'cat-3', name: 'Ground Chakkars & Spinners', description: 'Vibrant spinning wheels and ground spinners', displayOrder: 3, icon: 'RotateCw' },
  { id: 'cat-4', name: 'Flower Pots & Fountains', description: 'Sparkling tall fountains with multicolor stars', displayOrder: 4, icon: 'Sparkles' },
  { id: 'cat-5', name: 'Rockets & Whistling Shots', description: 'High altitude aerial soaring rockets', displayOrder: 5, icon: 'Rocket' },
  { id: 'cat-6', name: 'Fancy Multi-Shot Sky Repeaters', description: 'Night sky multi-color aerial fireworks shows', displayOrder: 6, icon: 'Star' },
  { id: 'cat-7', name: 'Sparklers & Twinkling Stars', description: 'Handheld safe electric & colorful sparklers', displayOrder: 7, icon: 'Sun' },
  { id: 'cat-8', name: 'Novelties & Kids Specials', description: 'Child-safe novelty items, pop-pops & smoke pencils', displayOrder: 8, icon: 'Gift' },
  { id: 'cat-9', name: 'Wholesale B2B Gift Boxes', description: 'Assorted family & corporate festival celebration boxes', displayOrder: 9, icon: 'Package' },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Single Sound
  {
    id: 'prod-101',
    sku: 'SSC-001',
    categoryId: 'cat-1',
    name: '2 3/4" Kuruvi Crackers',
    description: 'Classic loud single sound bird sound cracker',
    itemsPerPack: '1 Packet (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 12,
    sellingPrice: 25,
    gstPercent: 18,
    openingStock: 500,
    currentStock: 320,
    lowStockLimit: 50,
    status: 'active'
  },
  {
    id: 'prod-102',
    sku: 'SSC-002',
    categoryId: 'cat-1',
    name: '3 1/2" Lakshmi Crackers',
    description: 'Traditional medium loud single bang Lakshmi crackers',
    itemsPerPack: '1 Packet (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 20,
    sellingPrice: 42,
    gstPercent: 18,
    openingStock: 600,
    currentStock: 410,
    lowStockLimit: 60,
    status: 'active'
  },
  {
    id: 'prod-103',
    sku: 'SSC-003',
    categoryId: 'cat-1',
    name: '4" Deluxe Lakshmi Sound Cracker',
    description: 'High intensity extra loud single sound cracker',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 38,
    sellingPrice: 75,
    gstPercent: 18,
    openingStock: 300,
    currentStock: 180,
    lowStockLimit: 30,
    status: 'active'
  },
  {
    id: 'prod-104',
    sku: 'SSC-004',
    categoryId: 'cat-1',
    name: '5" Mega Thunder Sound',
    description: 'Maximum permitted single loud boom sound cracker',
    itemsPerPack: '1 Box (5 Pcs)',
    image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 65,
    sellingPrice: 130,
    gstPercent: 18,
    openingStock: 200,
    currentStock: 15, // Low stock demo!
    lowStockLimit: 20,
    status: 'active'
  },

  // Multi-Sound & Chorsa
  {
    id: 'prod-201',
    sku: 'MSC-100',
    categoryId: 'cat-2',
    name: '100 Wala Red Garland (Chorsa)',
    description: '100 continuous rapid red sound crackers garland',
    itemsPerPack: '1 Box',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 45,
    sellingPrice: 95,
    gstPercent: 18,
    openingStock: 250,
    currentStock: 140,
    lowStockLimit: 30,
    status: 'active'
  },
  {
    id: 'prod-202',
    sku: 'MSC-1000',
    categoryId: 'cat-2',
    name: '1,000 Wala Heavy Deluxe Garland',
    description: '1000 continuous booming garland firecrackers for grand celebrations',
    itemsPerPack: '1 Heavy Box',
    image: 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 380,
    sellingPrice: 750,
    gstPercent: 18,
    openingStock: 100,
    currentStock: 45,
    lowStockLimit: 15,
    status: 'active'
  },
  {
    id: 'prod-203',
    sku: 'MSC-5000',
    categoryId: 'cat-2',
    name: '5,000 Wala Mega Festival Garland',
    description: '5000 continuous loud booming garland firecrackers',
    itemsPerPack: '1 Roll Box',
    image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 1800,
    sellingPrice: 3400,
    gstPercent: 18,
    openingStock: 40,
    currentStock: 12,
    lowStockLimit: 10,
    status: 'active'
  },
  {
    id: 'prod-204',
    sku: 'MSC-10000',
    categoryId: 'cat-2',
    name: '10,000 Wala Grand Celebration Roll',
    description: '10000 continuous non-stop thunder garland roll',
    itemsPerPack: '1 Jumbo Box',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 3500,
    sellingPrice: 6500,
    gstPercent: 18,
    openingStock: 20,
    currentStock: 0, // Out of stock demo!
    lowStockLimit: 5,
    status: 'active'
  },

  // Ground Chakkars
  {
    id: 'prod-301',
    sku: 'GND-001',
    categoryId: 'cat-3',
    name: 'Ground Chakkar Special',
    description: 'Smooth high-speed ground rotating spark wheel',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 35,
    sellingPrice: 70,
    gstPercent: 18,
    openingStock: 300,
    currentStock: 210,
    lowStockLimit: 40,
    status: 'active'
  },
  {
    id: 'prod-302',
    sku: 'GND-002',
    categoryId: 'cat-3',
    name: 'Ground Chakkar Deluxe Big',
    description: 'Large diameter bright golden spark ground wheel',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 60,
    sellingPrice: 120,
    gstPercent: 18,
    openingStock: 200,
    currentStock: 145,
    lowStockLimit: 25,
    status: 'active'
  },
  {
    id: 'prod-303',
    sku: 'GND-003',
    categoryId: 'cat-3',
    name: 'Whistling Spinner Chakkar',
    description: 'Ground spinner with sharp whistle sound and multi-color sparks',
    itemsPerPack: '1 Box (5 Pcs)',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 85,
    sellingPrice: 175,
    gstPercent: 18,
    openingStock: 150,
    currentStock: 80,
    lowStockLimit: 20,
    status: 'active'
  },

  // Flower Pots
  {
    id: 'prod-401',
    sku: 'FLP-001',
    categoryId: 'cat-4',
    name: 'Flower Pot Small',
    description: 'Classic high sparkling golden fountain pot',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 50,
    sellingPrice: 99,
    gstPercent: 18,
    openingStock: 400,
    currentStock: 290,
    lowStockLimit: 50,
    status: 'active'
  },
  {
    id: 'prod-402',
    sku: 'FLP-002',
    categoryId: 'cat-4',
    name: 'Flower Pot Deluxe (Big)',
    description: 'Tall golden shower fountain with extra height and brightness',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 90,
    sellingPrice: 180,
    gstPercent: 18,
    openingStock: 300,
    currentStock: 195,
    lowStockLimit: 40,
    status: 'active'
  },
  {
    id: 'prod-403',
    sku: 'FLP-003',
    categoryId: 'cat-4',
    name: 'Tri-Color Kotti Fountain',
    description: '3-stage changing color fountain (Red, Green, Silver)',
    itemsPerPack: '1 Box (5 Pcs)',
    image: 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 140,
    sellingPrice: 280,
    gstPercent: 18,
    openingStock: 180,
    currentStock: 8, // Low stock!
    lowStockLimit: 15,
    status: 'active'
  },

  // Rockets
  {
    id: 'prod-501',
    sku: 'RCK-001',
    categoryId: 'cat-5',
    name: 'Baby Rocket',
    description: 'High flying fast soaring mini rocket with sound bang',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 45,
    sellingPrice: 90,
    gstPercent: 18,
    openingStock: 300,
    currentStock: 170,
    lowStockLimit: 30,
    status: 'active'
  },
  {
    id: 'prod-502',
    sku: 'RCK-002',
    categoryId: 'cat-5',
    name: 'Whistling Sound Rocket',
    description: 'Screaming whistle sound during launch followed by sky burst',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 95,
    sellingPrice: 190,
    gstPercent: 18,
    openingStock: 200,
    currentStock: 110,
    lowStockLimit: 25,
    status: 'active'
  },
  {
    id: 'prod-503',
    sku: 'RCK-003',
    categoryId: 'cat-5',
    name: 'Lunik Parachute Rocket',
    description: 'Launches high into the sky and deploys glowing floating parachute',
    itemsPerPack: '1 Box (5 Pcs)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 160,
    sellingPrice: 320,
    gstPercent: 18,
    openingStock: 100,
    currentStock: 40,
    lowStockLimit: 15,
    status: 'active'
  },

  // Fancy Multi-Shots
  {
    id: 'prod-601',
    sku: 'SHT-012',
    categoryId: 'cat-6',
    name: '12 Shots Sky Show Repeater',
    description: '12 consecutive colorful sky bursts with sparkling palm tree effect',
    itemsPerPack: '1 Box',
    image: 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 180,
    sellingPrice: 380,
    gstPercent: 18,
    openingStock: 150,
    currentStock: 85,
    lowStockLimit: 20,
    status: 'active'
  },
  {
    id: 'prod-602',
    sku: 'SHT-030',
    categoryId: 'cat-6',
    name: '30 Shots Multi-Color Matrix',
    description: '30 rapid aerial shots with crackling willow stars and golden tails',
    itemsPerPack: '1 Box',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 450,
    sellingPrice: 900,
    gstPercent: 18,
    openingStock: 80,
    currentStock: 48,
    lowStockLimit: 10,
    status: 'active'
  },
  {
    id: 'prod-603',
    sku: 'SHT-120',
    categoryId: 'cat-6',
    name: '120 Shots Grand Finale Sky Display',
    description: 'Spectacular 120 aerial shots continuous night sky extravaganza',
    itemsPerPack: '1 Large Cake',
    image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 1700,
    sellingPrice: 3200,
    gstPercent: 18,
    openingStock: 30,
    currentStock: 14,
    lowStockLimit: 5,
    status: 'active'
  },

  // Sparklers
  {
    id: 'prod-701',
    sku: 'SPK-010',
    categoryId: 'cat-7',
    name: '10 cm Electric Sparklers',
    description: 'Child-safe bright silver handheld sparklers',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 12,
    sellingPrice: 28,
    gstPercent: 18,
    openingStock: 800,
    currentStock: 520,
    lowStockLimit: 100,
    status: 'active'
  },
  {
    id: 'prod-702',
    sku: 'SPK-015',
    categoryId: 'cat-7',
    name: '15 cm Color Sparklers (Green & Red)',
    description: 'Vibrant green and deep red flame handheld sparklers',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 22,
    sellingPrice: 48,
    gstPercent: 18,
    openingStock: 600,
    currentStock: 380,
    lowStockLimit: 80,
    status: 'active'
  },
  {
    id: 'prod-703',
    sku: 'SPK-050',
    categoryId: 'cat-7',
    name: '50 cm Mega Long Sparklers',
    description: 'Extra long 50cm golden sparklers with 3-minute long burn time',
    itemsPerPack: '1 Box (5 Pcs)',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 75,
    sellingPrice: 150,
    gstPercent: 18,
    openingStock: 250,
    currentStock: 160,
    lowStockLimit: 30,
    status: 'active'
  },

  // Novelties & Kids
  {
    id: 'prod-801',
    sku: 'NVT-001',
    categoryId: 'cat-8',
    name: 'Pop Pop Snappers',
    description: 'Safe drop-snapping friction pop crackers for kids',
    itemsPerPack: '1 Box (50 Pkt)',
    image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 25,
    sellingPrice: 50,
    gstPercent: 18,
    openingStock: 500,
    currentStock: 340,
    lowStockLimit: 50,
    status: 'active'
  },
  {
    id: 'prod-802',
    sku: 'NVT-002',
    categoryId: 'cat-8',
    name: 'Black Snake Eggs',
    description: 'Fumeless growing ash snake pellet novelty',
    itemsPerPack: '1 Box (10 Pcs)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 15,
    sellingPrice: 35,
    gstPercent: 18,
    openingStock: 400,
    currentStock: 260,
    lowStockLimit: 40,
    status: 'active'
  },

  // Gift Boxes
  {
    id: 'prod-901',
    sku: 'BOX-25',
    categoryId: 'cat-9',
    name: 'Family Celebration Pack (25 Items)',
    description: 'Curated wholesale pack with sound crackers, sparklers, chakkars & flower pots',
    itemsPerPack: '1 Deluxe Box',
    image: 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 600,
    sellingPrice: 1250,
    gstPercent: 18,
    openingStock: 80,
    currentStock: 42,
    lowStockLimit: 15,
    status: 'active'
  },
  {
    id: 'prod-902',
    sku: 'BOX-45',
    categoryId: 'cat-9',
    name: 'Sivakasi B2B Mega Fireworks Combo (45 Items)',
    description: 'Premium bumper wholesale pack containing multi-shots, rockets, heavy chorsa & sparklers',
    itemsPerPack: '1 VIP Master Carton',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
    purchasePrice: 1600,
    sellingPrice: 3200,
    gstPercent: 18,
    openingStock: 50,
    currentStock: 22,
    lowStockLimit: 10,
    status: 'active'
  }
];

export const INITIAL_ENQUIRIES: Enquiry[] = [
  {
    id: 'ENQ-2026-1001',
    customerId: 'cust-101',
    customerDetails: {
      name: 'Ramesh Wholesale Stores',
      mobile: '9842100011',
      address: '42 Main Bazaar, Madurai, Tamil Nadu'
    },
    totalItems: 3,
    totalAmount: 1450,
    status: 'Pending',
    items: [
      { id: 'eqi-1', enquiryId: 'ENQ-2026-1001', productId: 'prod-102', productName: '3 1/2" Lakshmi Crackers', sku: 'SSC-002', qty: 10, unitPrice: 42, amount: 420, itemsPerPack: '1 Packet (10 Pcs)' },
      { id: 'eqi-2', enquiryId: 'ENQ-2026-1001', productId: 'prod-402', productName: 'Flower Pot Deluxe (Big)', sku: 'FLP-002', qty: 4, unitPrice: 180, amount: 720, itemsPerPack: '1 Box (10 Pcs)' },
      { id: 'eqi-3', enquiryId: 'ENQ-2026-1001', productId: 'prod-701', productName: '10 cm Electric Sparklers', sku: 'SPK-010', qty: 11, unitPrice: 28, amount: 310, itemsPerPack: '1 Box (10 Pcs)' }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'ENQ-2026-1002',
    customerId: 'cust-102',
    customerDetails: {
      name: 'Karthik Traders',
      mobile: '9789012345',
      address: '15 Gandhi Road, Coimbatore, Tamil Nadu'
    },
    totalItems: 2,
    totalAmount: 4100,
    status: 'Success',
    invoiceGenerated: true,
    invoiceId: 'INV-2026-0501',
    items: [
      { id: 'eqi-4', enquiryId: 'ENQ-2026-1002', productId: 'prod-603', productName: '120 Shots Grand Finale Sky Display', sku: 'SHT-120', qty: 1, unitPrice: 3200, amount: 3200, itemsPerPack: '1 Large Cake' },
      { id: 'eqi-5', enquiryId: 'ENQ-2026-1002', productId: 'prod-502', productName: 'Whistling Sound Rocket', sku: 'RCK-002', qty: 4, unitPrice: 190, amount: 760, itemsPerPack: '1 Box (10 Pcs)' }
    ],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'ENQ-2026-1003',
    customerId: 'cust-103',
    customerDetails: {
      name: 'Suresh Kumar',
      mobile: '9123456789',
      address: '8/120 Station Road, Trichy, Tamil Nadu'
    },
    totalItems: 1,
    totalAmount: 750,
    status: 'Closed',
    items: [
      { id: 'eqi-6', enquiryId: 'ENQ-2026-1003', productId: 'prod-202', productName: '1,000 Wala Heavy Deluxe Garland', sku: 'MSC-1000', qty: 1, unitPrice: 750, amount: 750, itemsPerPack: '1 Heavy Box' }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-0501',
    enquiryId: 'ENQ-2026-1002',
    enquiryNo: 'ENQ-2026-1002',
    customerId: 'cust-102',
    customerDetails: {
      name: 'Karthik Traders',
      mobile: '9789012345',
      address: '15 Gandhi Road, Coimbatore, Tamil Nadu'
    },
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    subtotal: 3474.58,
    gstAmount: 625.42,
    grandTotal: 4100,
    status: 'Generated',
    shopDetails: {
      name: 'Sri Laxmi Fireworks Wholesale',
      tagline: 'Direct Sivakasi Factory Rates | Premium B2B Supplies',
      address: '124 Factory Bypass Road, Sivakasi - 626123, Tamil Nadu',
      cityState: 'Sivakasi, Tamil Nadu',
      phone: '+91 98421 99887 / +91 94431 22334',
      whatsapp: '+91 98421 99887',
      email: 'sales@srilaxmifireworks.com',
      gstin: '33AAAAA0000A1Z5',
      minimumOrderAmount: 500
    },
    items: [
      { id: 'ini-1', invoiceId: 'INV-2026-0501', productId: 'prod-603', sku: 'SHT-120', productName: '120 Shots Grand Finale Sky Display', qty: 1, unitPrice: 3200, sellingPrice: 3200, gstPercent: 18, gstAmount: 488.14, amount: 3200 },
      { id: 'ini-2', invoiceId: 'INV-2026-0501', productId: 'prod-502', sku: 'RCK-002', productName: 'Whistling Sound Rocket', qty: 4, unitPrice: 190, sellingPrice: 190, gstPercent: 18, gstAmount: 115.93, amount: 760 }
    ],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export const SHOP_INFO = {
  name: 'Sri Laxmi Fireworks Wholesale',
  tagline: 'Direct Sivakasi Factory Rates | B2B Wholesale Firecracker Supplier',
  address: '124 Factory Bypass Road, Sivakasi - 626123',
  cityState: 'Sivakasi, Tamil Nadu, India',
  phone: '+91 98421 99887',
  secondaryPhone: '+91 94431 22334',
  whatsapp: '+91 98421 99887',
  email: 'sales@srilaxmifireworks.com',
  gstin: '33AAAAA0000A1Z5',
  minimumOrderAmount: 500,
  bankName: 'State Bank of India',
  accountName: 'Sri Laxmi Fireworks Wholesale',
  accountNumber: '38920192831',
  ifscCode: 'SBIN0001234',
  upiId: 'srilaxmifireworks@sbi',
  terms: '1. Goods once sold will not be taken back or exchanged.\n2. Transport & freight charges extra at actuals during dispatch.\n3. Subject to Sivakasi Jurisdiction.'
};
