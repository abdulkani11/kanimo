import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = Number(process.env.PORT) || 30034;


// -----------------------------------------------------------------------------
// Core Mock Data & Structures
// -----------------------------------------------------------------------------

const AIRPORTS = [
  { code: 'JFK', city: 'New York', country: 'United States', name: 'John F. Kennedy Intl' },
  { code: 'LHR', city: 'London', country: 'United Kingdom', name: 'Heathrow Airport' },
  { code: 'HND', city: 'Tokyo', country: 'Japan', name: 'Haneda Airport' },
  { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle' },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', name: 'Dubai International' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Changi Airport' },
  { code: 'LAX', city: 'Los Angeles', country: 'United States', name: 'Los Angeles Intl' },
  { code: 'SYD', city: 'Sydney', country: 'Australia', name: 'Kingsford Smith Airport' },
];

const AIRLINES = [
  { name: 'Ethiopian Airlines', code: 'ET', basePriceFactor: 1.0 },
  { name: 'Ethiopian Airlines', code: 'ET', basePriceFactor: 0.95 },
  { name: 'Ethiopian Airlines', code: 'ET', basePriceFactor: 0.82 },
  { name: 'Ethiopian Airlines', code: 'ET', basePriceFactor: 1.45 },
  { name: 'Ethiopian Airlines', code: 'ET', basePriceFactor: 1.18 },
];

const DISTANCES: Record<string, Record<string, { miles: number; hours: number }>> = {
  JFK: {
    LHR: { miles: 3451, hours: 7.5 },
    HND: { miles: 6745, hours: 14.0 },
    CDG: { miles: 3635, hours: 8.0 },
    DXB: { miles: 6849, hours: 12.5 },
    SIN: { miles: 9537, hours: 18.5 },
    LAX: { miles: 2475, hours: 5.5 },
    SYD: { miles: 9943, hours: 19.5 },
  },
  LHR: {
    HND: { miles: 5974, hours: 11.5 },
    CDG: { miles: 216, hours: 1.2 },
    DXB: { miles: 3421, hours: 7.0 },
    SIN: { miles: 6765, hours: 13.0 },
    LAX: { miles: 5456, hours: 11.0 },
    SYD: { miles: 10573, hours: 21.0 },
    JFK: { miles: 3451, hours: 8.0 },
  },
  HND: {
    SIN: { miles: 3288, hours: 7.0 },
    LAX: { miles: 5478, hours: 10.0 },
    SYD: { miles: 4861, hours: 9.5 },
    DXB: { miles: 4941, hours: 10.0 },
    CDG: { miles: 6047, hours: 12.0 },
  },
};

function getDistanceAndHours(from: string, to: string) {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (DISTANCES[f] && DISTANCES[f][t]) return DISTANCES[f][t];
  if (DISTANCES[t] && DISTANCES[t][f]) return DISTANCES[t][f];
  if (f === t) return { miles: 0, hours: 0 };
  return { miles: 4500, hours: 9.0 };
}

// -----------------------------------------------------------------------------
// Firebase Firestore Database Connection & Seeding
// -----------------------------------------------------------------------------

let db: Firestore | null = null;

const hasGcpEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                  process.env.K_SERVICE || 
                  process.env.GAE_INSTANCE ||
                  fs.existsSync(path.join(process.env.APPDATA || '', 'gcloud/application_default_credentials.json')) ||
                  fs.existsSync(path.join(process.env.USERPROFILE || '', '.config/gcloud/application_default_credentials.json'));

if (hasGcpEnv) {
  try {
    const configRaw = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    const config = JSON.parse(configRaw);
    let appInstance = getApps()[0];
    if (!appInstance) {
      appInstance = initializeApp({
        projectId: config.projectId,
      });
    }
    if (config.firestoreDatabaseId) {
      db = getFirestore(appInstance, config.firestoreDatabaseId);
    } else {
      db = getFirestore(appInstance);
    }
    console.log('[Firebase] Initialized Firestore database:', config.firestoreDatabaseId || '(default)');
  } catch (e) {
    console.error('[Firebase] Error initializing Firebase Admin:', e);
  }
} else {
  console.log('[Firebase] Running in offline mock mode (in-memory data) because no Google credentials were found.');
}


// Helper to seed Firestore if empty
async function seedCollection(collectionName: string, defaultData: any[]) {
  if (!db) return;
  try {
    const colRef = db.collection(collectionName);
    const snapshot = await colRef.limit(1).get();
    if (snapshot.empty) {
      console.log(`[Firebase] Collection "${collectionName}" is empty, seeding default data...`);
      for (const item of defaultData) {
        if (item.id) {
          await colRef.doc(item.id).set(item);
        } else {
          await colRef.add(item);
        }
      }
      console.log(`[Firebase] Seeding completed for "${collectionName}".`);
    }
  } catch (err) {
    console.error(`[Firebase] Error seeding collection "${collectionName}":`, err);
  }
}

// -----------------------------------------------------------------------------
// Travel Portal Data Store (In-Memory State Fallbacks for Seeding)
// -----------------------------------------------------------------------------

const DB_DIR = fs.existsSync('/var/data') ? '/var/data' : process.cwd();
const INVOICES_FILE = path.join(DB_DIR, 'data_invoices.json');
const CUSTOMERS_FILE = path.join(DB_DIR, 'data_customers.json');
const USERS_FILE = path.join(DB_DIR, 'data_users.json');
const VISAS_FILE = path.join(DB_DIR, 'data_visas.json');
const QUOTATIONS_FILE = path.join(DB_DIR, 'data_quotations.json');

// Copy initial database files to persistent storage if needed
if (DB_DIR === '/var/data') {
  try {
    const srcInvoices = path.join(process.cwd(), 'data_invoices.json');
    const srcCustomers = path.join(process.cwd(), 'data_customers.json');
    const srcUsers = path.join(process.cwd(), 'data_users.json');
    const srcVisas = path.join(process.cwd(), 'data_visas.json');
    const srcQuotations = path.join(process.cwd(), 'data_quotations.json');
    if (!fs.existsSync(INVOICES_FILE) && fs.existsSync(srcInvoices)) {
      fs.copyFileSync(srcInvoices, INVOICES_FILE);
      console.log('[Noble DB] Copied data_invoices.json to persistent volume /var/data');
    }
    if (!fs.existsSync(CUSTOMERS_FILE) && fs.existsSync(srcCustomers)) {
      fs.copyFileSync(srcCustomers, CUSTOMERS_FILE);
      console.log('[Noble DB] Copied data_customers.json to persistent volume /var/data');
    }
    if (!fs.existsSync(USERS_FILE) && fs.existsSync(srcUsers)) {
      fs.copyFileSync(srcUsers, USERS_FILE);
      console.log('[Noble DB] Copied data_users.json to persistent volume /var/data');
    }
    if (!fs.existsSync(VISAS_FILE) && fs.existsSync(srcVisas)) {
      fs.copyFileSync(srcVisas, VISAS_FILE);
      console.log('[Noble DB] Copied data_visas.json to persistent volume /var/data');
    }
    if (!fs.existsSync(QUOTATIONS_FILE) && fs.existsSync(srcQuotations)) {
      fs.copyFileSync(srcQuotations, QUOTATIONS_FILE);
      console.log('[Noble DB] Copied data_quotations.json to persistent volume /var/data');
    }
  } catch (err) {
    console.error('[Noble DB] Failed to copy database files to persistent volume:', err);
  }
}

// Global arrays
let customers = [];
let invoices = [];
let users = [];
let visas = [];
let quotations = [];

const saveInvoicesToDisk = () => {
  try {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing invoices to disk:', err);
  }
};

const saveCustomersToDisk = () => {
  try {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing customers to disk:', err);
  }
};

const saveUsersToDisk = () => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users to disk:', err);
  }
};

const saveVisasToDisk = () => {
  try {
    fs.writeFileSync(VISAS_FILE, JSON.stringify(visas, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing visas to disk:', err);
  }
};

const saveQuotationsToDisk = () => {
  try {
    fs.writeFileSync(QUOTATIONS_FILE, JSON.stringify(quotations, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing quotations to disk:', err);
  }
};

const initialUsers = [
  { id: 'admin@noble.com', email: 'admin@noble.com', password: 'admin123', role: 'admin' },
  { id: 'cashier@noble.com', email: 'cashier@noble.com', password: 'cashier123', role: 'cashier' },
  { id: 'agent@noble.com', email: 'agent@noble.com', password: 'agent123', role: 'user' }
];

const initialCustomers = [
  {
    id: 'CUST-B2B',
    name: 'B2B',
    type: 'Travel Agency',
    email: 'b2b@noble.com',
    mobile: '+1 555-0101',
    commissionPercent: 9,
    creditLimit: 100000,
    balance: 0,
    createdAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'CUST-SABRE',
    name: 'SABRE',
    type: 'Travel Agency',
    email: 'sabre@noble.com',
    mobile: '+1 555-0102',
    commissionPercent: 7,
    creditLimit: 100000,
    balance: 0,
    createdAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'CUST-101',
    name: 'Elite Travel Agency',
    type: 'Travel Agency',
    email: 'contact@elitetravel.com',
    mobile: '+1 555-0199',
    commissionPercent: 7,
    creditLimit: 50000,
    balance: 12450,
    createdAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'CUST-102',
    name: 'Apex Corporate Inc',
    type: 'Corporate',
    email: 'travel@apexcorp.com',
    mobile: '+1 555-0144',
    commissionPercent: 5,
    creditLimit: 100000,
    balance: 34200,
    createdAt: '2026-04-12T11:30:00Z',
  },
  {
    id: 'CUST-103',
    name: 'John Smith',
    type: 'Individual',
    email: 'john.smith@gmail.com',
    mobile: '+1 555-0177',
    commissionPercent: 0,
    creditLimit: 5000,
    balance: 0,
    createdAt: '2026-05-18T09:15:00Z',
  },
  {
    id: 'CUST-104',
    name: 'BSB Portal',
    type: 'Corporate',
    email: 'info@bsbportal.so',
    mobile: '+252 61 5550111',
    commissionPercent: 6,
    creditLimit: 75000,
    balance: 0,
    createdAt: '2026-07-20T04:00:00Z',
  }
];

// Load existing data from persistent JSON database files if they exist
try {
  if (fs.existsSync(CUSTOMERS_FILE)) {
    const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    customers = JSON.parse(raw);
    console.log(`[Noble DB] Loaded ${customers.length} customers from persistent file storage.`);
  } else {
    customers = initialCustomers;
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(initialCustomers, null, 2), 'utf8');
  }
} catch (err) {
  console.error('Error reading customers from disk:', err);
  customers = initialCustomers;
}

try {
  if (fs.existsSync(INVOICES_FILE)) {
    const raw = fs.readFileSync(INVOICES_FILE, 'utf8');
    invoices = JSON.parse(raw);
    console.log(`[Noble DB] Loaded ${invoices.length} invoices from persistent file storage.`);
    
    // Ensure there is at least some daily report data for today!
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hasToday = invoices.some(inv => (inv.salesDate === todayStr || (inv.createdAt && inv.createdAt.startsWith(todayStr))));
    if (!hasToday && invoices.length > 0) {
      console.log(`[Noble DB] No invoices found for today (${todayStr}). Updating recent invoices to today for demo purposes.`);
      // Let's set the first 5 invoices to today's date
      const limit = Math.min(invoices.length, 5);
      for (let i = 0; i < limit; i++) {
        invoices[i].salesDate = todayStr;
        const originalTime = invoices[i].createdAt ? invoices[i].createdAt.split('T')[1] || '09:00:00Z' : '09:00:00Z';
        invoices[i].createdAt = `${todayStr}T${originalTime}`;
      }
      fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf8');
    }
  } else {
    invoices = [];
  }
} catch (err) {
  console.error('Error reading invoices from disk:', err);
  invoices = [];
}

try {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(raw);
    console.log(`[Noble DB] Loaded ${users.length} users from persistent file storage.`);
  } else {
    users = initialUsers;
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf8');
    console.log(`[Noble DB] Seeded ${users.length} default users.`);
  }
} catch (err) {
  console.error('Error reading users from disk:', err);
  users = initialUsers;
}

try {
  if (fs.existsSync(VISAS_FILE)) {
    const raw = fs.readFileSync(VISAS_FILE, 'utf8');
    visas = JSON.parse(raw);
    console.log(`[Noble DB] Loaded ${visas.length} visas from persistent file storage.`);
  } else {
    visas = [];
  }
} catch (err) {
  console.error('Error reading visas from disk:', err);
  visas = [];
}

try {
  if (fs.existsSync(QUOTATIONS_FILE)) {
    const raw = fs.readFileSync(QUOTATIONS_FILE, 'utf8');
    quotations = JSON.parse(raw);
    console.log(`[Noble DB] Loaded ${quotations.length} quotations from persistent file storage.`);
  } else {
    quotations = [];
  }
} catch (err) {
  console.error('Error reading quotations from disk:', err);
  quotations = [];
}


let refunds = [
  {
    id: 'RFD-3001',
    invoiceId: 'INV-2026-1001',
    ticketNumber: '071-2837492831',
    passengerName: 'Jane Doe',
    refundAmount: 400,
    reason: 'Schedule disruption by carrier',
    status: 'Pending',
    createdAt: '2026-07-18T16:00:00Z',
  },
  {
    id: 'RFD-3002',
    invoiceId: 'INV-2026-1002',
    ticketNumber: '235-9283711029',
    passengerName: 'Michael Cole',
    refundAmount: 900,
    reason: 'Duplicate billing issue',
    status: 'Refunded',
    createdAt: '2026-07-16T12:00:00Z',
    approvedBy: 'Elena Rodriguez',
  },
];

let payments = [
  {
    id: 'PMT-4001',
    invoiceId: 'INV-2026-1001',
    amount: 1200,
    method: 'Bank',
    referenceNumber: 'TXN-928317',
    createdAt: '2026-07-15T14:45:00Z',
  },
  {
    id: 'PMT-4002',
    invoiceId: 'INV-2026-1002',
    amount: 300,
    method: 'Card',
    referenceNumber: 'TXN-019284',
    createdAt: '2026-07-18T10:30:00Z',
  },
];

let companies = [
  { id: 'COMP-1', name: 'Ethiopian Airlines', type: 'Airline', code: 'ET', contactEmail: 'agency@ethiopian.com' },
  { id: 'COMP-2', name: 'Ethiopian Airlines', type: 'Airline', code: 'ET', contactEmail: 'support@ethiopian.com' },
  { id: 'COMP-3', name: 'Ethiopian Airlines', type: 'Airline', code: 'ET', contactEmail: 'sales@ethiopian.com' },
  { id: 'COMP-4', name: 'Consolidated Fares Corp', type: 'Vendor', contactEmail: 'info@consolidated.com' },
  { id: 'COMP-5', name: 'Elite GDS Supplier', type: 'Supplier', contactEmail: 'gds@elitesupplier.com' },
];

let commissionRules = [
  { id: 'RULE-1', airlineCode: 'ET', customerType: 'Travel Agency', commissionPercent: 7, vendorCommissionPercent: 6 },
  { id: 'RULE-2', airlineCode: 'ET', customerType: 'Corporate', commissionPercent: 5, vendorCommissionPercent: 5 },
  { id: 'RULE-3', airlineCode: 'ET', customerType: 'Individual', commissionPercent: 0, vendorCommissionPercent: 4 },
];

let auditLogs = [
  { id: 'LOG-001', username: 'Elena Rodriguez', role: 'Super Admin', action: 'Login', details: 'Authorized securely from administrative console', timestamp: '2026-07-19T08:00:00Z' },
  { id: 'LOG-002', username: 'Elena Rodriguez', role: 'Super Admin', action: 'Create Invoice', details: 'Generated invoice INV-2026-1003 for John Smith', timestamp: '2026-07-19T11:00:00Z' },
];

// Special Destination Offers for frontpage/explore
const DESTINATIONS = [
  {
    id: 'dest-tokyo',
    name: 'Shibuya Crossing & Mt. Fuji',
    city: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    basePrice: 620,
    description: 'Immerse yourself in neon skylines, delicious ramen, historic temples, and the magnificent majesty of Mount Fuji.',
    rating: 4.9,
    activities: ['Tour Senso-ji Temple', 'Ramen tasting in Shinjuku', 'Bullet train trip to Hakone', 'Shibuya Sky Observatory'],
    weatherTemp: '24°C',
    weatherCondition: 'Sunny',
  },
  {
    id: 'dest-paris',
    name: 'Eiffel Tower & Louvre',
    city: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    basePrice: 540,
    description: 'Walk down the Seine, visit world-class museums, and indulge in fresh croissants in the City of Light.',
    rating: 4.8,
    activities: ['Seine River Cruise', 'Louvre Museum VIP Entry', 'Montmartre Artists Walk', 'Palace of Versailles Tour'],
    weatherTemp: '19°C',
    weatherCondition: 'Mild',
  },
  {
    id: 'dest-london',
    name: 'Big Ben & West End Theatre',
    city: 'London',
    country: 'United Kingdom',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    basePrice: 480,
    description: 'Discover rich historic royal palaces, enjoy a high tea, and catch award-winning plays in the West End.',
    rating: 4.7,
    activities: ['Tower of London Guided Visit', 'London Eye Experience', 'Afternoon Tea at The Ritz', 'British Museum'],
    weatherTemp: '16°C',
    weatherCondition: 'Light Rain',
  },
];

// -----------------------------------------------------------------------------
// Helper to generate mock flight searches
// -----------------------------------------------------------------------------
function generateFlights(from: string, to: string, dateStr: string, cabinClass: string) {
  const fromAirport = AIRPORTS.find((a) => a.code === from.toUpperCase());
  const toAirport = AIRPORTS.find((a) => a.code === to.toUpperCase());
  if (!fromAirport || !toAirport) return [];

  const { miles, hours } = getDistanceAndHours(from, to);
  const results = [];

  const times = [
    { dep: '07:15', arrOffset: 0 },
    { dep: '11:45', arrOffset: 0 },
    { dep: '14:30', arrOffset: 0 },
    { dep: '18:00', arrOffset: 1 },
    { dep: '22:15', arrOffset: 1 },
  ];

  const aircrafts = ['Boeing 787-9 Dreamliner', 'Airbus A350-1000', 'Boeing 777-300ER', 'Airbus A380-800'];

  for (let i = 0; i < times.length; i++) {
    const airline = AIRLINES[i % AIRLINES.length];
    const timeInfo = times[i];
    const flightNum = `${airline.code}-${100 + i * 47}`;

    const totalMinutes = Math.round(hours * 60 + (i * 15 - 30));
    const finalHours = Math.floor(totalMinutes / 60);
    const finalMins = totalMinutes % 60;
    const durationString = `${finalHours}h ${finalMins}m`;

    const [depH, depM] = timeInfo.dep.split(':').map(Number);
    const arrH = (depH + finalHours) % 24;
    const arrM = (depM + finalMins) % 60;
    const arrivalTimeString = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}${
      timeInfo.arrOffset > 0 ? ' (+1)' : ''
    }`;

    let basePrice = Math.round(200 + miles * 0.08 * airline.basePriceFactor);
    if (i % 3 === 1) basePrice = Math.round(basePrice * 0.9);
    if (i % 3 === 2) basePrice = Math.round(basePrice * 0.85);

    let classMultiplier = 1.0;
    if (cabinClass === 'Premium Economy') classMultiplier = 1.45;
    else if (cabinClass === 'Business') classMultiplier = 3.2;
    else if (cabinClass === 'First') classMultiplier = 5.5;

    const finalPrice = Math.round(basePrice * classMultiplier);

    results.push({
      id: `FL-${flightNum}-${dateStr}`,
      airline: airline.name,
      airlineCode: airline.code,
      flightNumber: flightNum,
      from: fromAirport.code,
      fromCity: fromAirport.city,
      to: toAirport.code,
      toCity: toAirport.city,
      departureTime: timeInfo.dep,
      arrivalTime: arrivalTimeString,
      duration: durationString,
      price: finalPrice,
      stops: i % 3 === 2 ? 1 : 0,
      class: cabinClass,
      date: dateStr,
      aircraft: aircrafts[i % aircrafts.length],
      gate: `G${12 + i * 3}`,
      terminal: `T${1 + (i % 3)}`,
    });
  }

  return results;
}

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// Airport directory
app.get('/api/airports', (req, res) => {
  res.json(AIRPORTS);
});

// Featured destinations
app.get('/api/destinations', (req, res) => {
  res.json(DESTINATIONS);
});

// Flight search
app.post('/api/flights/search', (req, res) => {
  const { from, to, date, class: cabinClass } = req.body;
  if (!from || !to || !date) {
    return res.status(400).json({ error: 'Departure airport, arrival airport, and date are required.' });
  }
  const list = generateFlights(from, to, date, cabinClass || 'Economy');
  res.json(list);
});

// Live flight status tracker board
app.get('/api/flights/tracker', (req, res) => {
  const statuses = [
    {
      flightNumber: 'ET-308',
      airline: 'Ethiopian Airlines',
      from: 'JFK',
      fromCity: 'New York',
      to: 'LHR',
      toCity: 'London',
      status: 'Boarding' as const,
      departureTime: '18:15',
      arrivalTime: '06:15',
      gate: 'B22',
      terminal: 'T4',
      delayMinutes: 0,
      progressPercent: 5,
    },
    {
      flightNumber: 'ET-102',
      airline: 'Ethiopian Airlines',
      from: 'DXB',
      fromCity: 'Dubai',
      to: 'HND',
      toCity: 'Tokyo',
      status: 'Departed' as const,
      departureTime: '11:30',
      arrivalTime: '23:30',
      gate: 'A15',
      terminal: 'T3',
      delayMinutes: 15,
      progressPercent: 65,
      altitudeFeet: 36000,
      speedKnots: 495,
    },
  ];
  res.json(statuses);
});

// Customers Bulk Import
app.post('/api/customers/import', async (req, res) => {
  try {
    const { customers: importedList } = req.body;
    if (!Array.isArray(importedList)) {
      return res.status(400).json({ error: 'Imported data must be an array of customers.' });
    }
    if (db) {
      const batch = db.batch();
      for (const cust of importedList) {
        if (!cust.id) continue;
        const docRef = db.collection('customers').doc(cust.id);
        batch.set(docRef, cust);
      }
      await batch.commit();
    } else {
      for (const cust of importedList) {
        if (!cust.id) continue;
        const idx = customers.findIndex(c => c.id === cust.id);
        if (idx > -1) {
          customers[idx] = cust;
        } else {
          customers.push(cust);
        }
      }
    }
    if (!db) saveCustomersToDisk();
    res.json({ success: true, count: importedList.length });
  } catch (err: any) {
    console.error('Error importing customers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Customers CRUD
app.get('/api/customers', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('customers').get();
      const list = snapshot.docs.map(doc => doc.data());
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching customers from Firestore:', err);
  }
  res.json(customers);
});

app.post('/api/customers', async (req, res) => {
  const { name, type, email, mobile, commissionPercent, creditLimit, balance } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and Customer Type are required.' });
  
  try {
    if (db) {
      const snapshot = await db.collection('customers').get();
      const currentCount = snapshot.size;
      const newId = `CUST-${100 + currentCount + 1}`;
      
      const newCustomer = {
        id: newId,
        name,
        type,
        email: email || '',
        mobile: mobile || '',
        commissionPercent: Number(commissionPercent) || 0,
        creditLimit: Number(creditLimit) || 0,
        balance: Number(balance) || 0,
        createdAt: new Date().toISOString(),
      };

      await db.collection('customers').doc(newId).set(newCustomer);
      return res.status(201).json(newCustomer);
    }
  } catch (err: any) {
    console.error('Error creating customer in Firestore:', err);
  }

  const newCustomer = {
    id: `CUST-${100 + customers.length + 1}`,
    name,
    type,
    email: email || '',
    mobile: mobile || '',
    commissionPercent: Number(commissionPercent) || 0,
    creditLimit: Number(creditLimit) || 0,
    balance: Number(balance) || 0,
    createdAt: new Date().toISOString(),
  };
  customers.unshift(newCustomer);
  if (!db) saveCustomersToDisk();
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db) {
      const docRef = db.collection('customers').doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return res.status(404).json({ error: 'Customer not found.' });
      
      const updated = { ...docSnap.data(), ...req.body, id };
      await docRef.set(updated);
      return res.json(updated);
    }
  } catch (err: any) {
    console.error('Error updating customer in Firestore:', err);
  }

  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found.' });

  const updated = { ...customers[idx], ...req.body };
  customers[idx] = updated;
  if (!db) saveCustomersToDisk();
  res.json(updated);
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db) {
      await db.collection('customers').doc(id).delete();
      return res.json({ success: true, message: 'Customer deleted successfully.' });
    }
  } catch (err: any) {
    console.error('Error deleting customer from Firestore:', err);
  }

  customers = customers.filter(c => c.id !== id);
  if (!db) saveCustomersToDisk();
  res.json({ success: true, message: 'Customer deleted successfully.' });
});

// Invoices CRUD
app.get('/api/invoices', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('invoices').get();
      const list = snapshot.docs.map(doc => doc.data());
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching invoices from Firestore:', err);
  }
  res.json(invoices);
});

app.post('/api/invoices/import', async (req, res) => {
  try {
    const { invoices: importedList } = req.body;
    if (!Array.isArray(importedList)) {
      return res.status(400).json({ error: 'Imported data must be an array of invoices.' });
    }
    if (db) {
      const batch = db.batch();
      for (const inv of importedList) {
        if (!inv.id) continue;
        const docRef = db.collection('invoices').doc(inv.id);
        batch.set(docRef, inv);
      }
      await batch.commit();
    } else {
      for (const inv of importedList) {
        if (!inv.id) continue;
        const idx = invoices.findIndex(i => i.id === inv.id);
        if (idx > -1) {
          invoices[idx] = inv;
        } else {
          invoices.push(inv);
        }
      }
      invoices.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    if (!db) saveInvoicesToDisk();
    res.json({ success: true, count: importedList.length });
  } catch (err: any) {
    console.error('Error importing invoices:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  const {
    customInvoiceId,
    pnr,
    ticketNumber,
    customerId,
    tripType,
    airline,
    origin,
    destination,
    departureDate,
    returnDate,
    vendorName,
    baseFare,
    tax,
    discount,
    passengers,
    paymentMethod,
    paidAmount,
    customerCommissionPercent,
    vendorCommissionPercent,
    mobileNumber,
    email,
    salesDate,
    createdBy,
  } = req.body;

  try {
    if (db) {
      const customerDoc = await db.collection('customers').doc(customerId).get();
      const customer = customerDoc.exists ? customerDoc.data() : null;
      const customerName = customer ? customer.name : 'Unknown Customer';
      
      const commissionPercent = customerCommissionPercent !== undefined ? (Number(customerCommissionPercent) || 0) : (customer ? customer.commissionPercent : 0);
      const vendorCommissionPct = vendorCommissionPercent !== undefined ? (Number(vendorCommissionPercent) || 9) : 9;

      const parsedFare = Number(baseFare) || 0;
      const parsedTax = Number(tax) || 0;
      const parsedDiscount = Number(discount) || 0;
      const parsedPaid = Number(paidAmount) || 0;

      const vendorCommission = Math.round(parsedFare * (vendorCommissionPct / 100) * 100) / 100;
      const customerCommission = passengers && passengers.length > 0
        ? passengers.reduce((sum: number, p: any) => sum + (Number(p.custComm) || 0), 0)
        : Math.round(parsedFare * (commissionPercent / 100) * 100) / 100;
      const totalPassengerRefund = (passengers || []).reduce((sum: number, p: any) => sum + (Number(p.refund) || 0), 0);
      const netAmount = tripType === 'Refund' ? totalPassengerRefund : (parsedFare + parsedTax - parsedDiscount + customerCommission);
      const dueAmount = Math.max(0, netAmount - parsedPaid);
      const status = dueAmount === 0 ? 'Paid' : (parsedPaid > 0 ? 'Partial' : 'Unpaid');

      const randomTicketNum = ticketNumber || `001-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const randomPnr = pnr || Math.random().toString(36).substring(3, 9).toUpperCase();

      const invoiceSnapshot = await db.collection('invoices').get();
      const invoicesCount = invoiceSnapshot.size;

      const invoiceId = customInvoiceId && customInvoiceId.trim() !== "" 
        ? (customInvoiceId.startsWith('INV-') ? customInvoiceId : `INV-2026-${customInvoiceId}`)
        : `INV-2026-${1000 + invoicesCount + 1}`;

      const newInvoice = {
        id: invoiceId,
        pnr: randomPnr,
        ticketNumber: randomTicketNum,
        customerId,
        customerName,
        tripType: tripType || 'One Way',
        airline: airline || 'Ethiopian Airlines',
        origin: origin || 'JFK',
        destination: destination || 'LHR',
        departureDate: departureDate || '2026-08-15',
        returnDate: returnDate || null,
        vendorName: vendorName || 'Direct GDS',
        baseFare: parsedFare,
        tax: parsedTax,
        discount: parsedDiscount,
        vendorCommission,
        customerCommission,
        netAmount,
        paidAmount: parsedPaid,
        dueAmount,
        status,
        createdAt: salesDate ? new Date(salesDate).toISOString() : new Date().toISOString(),
        paymentMethod,
        passengers: passengers || [
          { name: 'Unknown Passenger', type: 'Adult', passportNumber: 'N000000' }
        ],
        customerCommissionPercent: commissionPercent,
        vendorCommissionPercent: vendorCommissionPct,
        mobileNumber: mobileNumber || '',
        email: email || '',
        salesDate: salesDate || new Date().toISOString().split('T')[0],
        createdBy: createdBy || 'admin@noble.com',
      };

      if (customer && status !== 'Paid') {
        const updatedBalance = (customer.balance || 0) + dueAmount;
        await db.collection('customers').doc(customerId).update({ balance: updatedBalance });
      }

      await db.collection('invoices').doc(invoiceId).set(newInvoice);
      return res.status(201).json(newInvoice);
    }
  } catch (err: any) {
    console.error('Error creating invoice in Firestore:', err);
  }

  const customer = customers.find(c => c.id === customerId);
  const customerName = customer ? customer.name : 'Unknown Customer';
  
  const commissionPercent = customerCommissionPercent !== undefined ? (Number(customerCommissionPercent) || 0) : (customer ? customer.commissionPercent : 0);
  const vendorCommissionPct = vendorCommissionPercent !== undefined ? (Number(vendorCommissionPercent) || 9) : 9;

  const parsedFare = Number(baseFare) || 0;
  const parsedTax = Number(tax) || 0;
  const parsedDiscount = Number(discount) || 0;
  const parsedPaid = Number(paidAmount) || 0;

  const vendorCommission = Math.round(parsedFare * (vendorCommissionPct / 100) * 100) / 100;
  const customerCommission = passengers && passengers.length > 0
    ? passengers.reduce((sum: number, p: any) => sum + (Number(p.custComm) || 0), 0)
    : Math.round(parsedFare * (commissionPercent / 100) * 100) / 100;
  const totalPassengerRefund = (passengers || []).reduce((sum: number, p: any) => sum + (Number(p.refund) || 0), 0);
  const netAmount = tripType === 'Refund' ? totalPassengerRefund : (parsedFare + parsedTax - parsedDiscount + customerCommission);
  const dueAmount = Math.max(0, netAmount - parsedPaid);
  const status = dueAmount === 0 ? 'Paid' : (parsedPaid > 0 ? 'Partial' : 'Unpaid');

  const randomTicketNum = ticketNumber || `001-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const randomPnr = pnr || Math.random().toString(36).substring(3, 9).toUpperCase();

  const invoiceId = customInvoiceId && customInvoiceId.trim() !== "" 
    ? (customInvoiceId.startsWith('INV-') ? customInvoiceId : `INV-2026-${customInvoiceId}`)
    : `INV-2026-${1000 + invoices.length + 1}`;

  const newInvoice = {
    id: invoiceId,
    pnr: randomPnr,
    ticketNumber: randomTicketNum,
    customerId,
    customerName,
    tripType: tripType || 'One Way',
    airline: airline || 'Ethiopian Airlines',
    origin: origin || 'JFK',
    destination: destination || 'LHR',
    departureDate: departureDate || '2026-08-15',
    returnDate,
    vendorName: vendorName || 'Direct GDS',
    baseFare: parsedFare,
    tax: parsedTax,
    discount: parsedDiscount,
    vendorCommission,
    customerCommission,
    netAmount,
    paidAmount: parsedPaid,
    dueAmount,
    status,
    createdAt: salesDate ? new Date(salesDate).toISOString() : new Date().toISOString(),
    paymentMethod,
    passengers: passengers || [
      { name: 'Unknown Passenger', type: 'Adult', passportNumber: 'N000000' }
    ],
    customerCommissionPercent: commissionPercent,
    vendorCommissionPercent: vendorCommissionPct,
    mobileNumber: mobileNumber || '',
    email: email || '',
    salesDate: salesDate || new Date().toISOString().split('T')[0],
    createdBy: createdBy || 'admin@noble.com',
  };

  if (customer && status !== 'Paid') {
    customer.balance += dueAmount;
  }

  invoices.unshift(newInvoice);
  if (!db) {
    saveInvoicesToDisk();
    saveCustomersToDisk();
  }
  res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db) {
      const docRef = db.collection('invoices').doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return res.status(404).json({ error: 'Invoice not found.' });

      const existingData = docSnap.data();
      const updated = { ...existingData, ...req.body, id };
      
      const parsedFare = Number(updated.baseFare) || 0;
      const parsedTax = Number(updated.tax) || 0;
      const parsedDiscount = Number(updated.discount) || 0;

      const commPercent = updated.customerCommissionPercent !== undefined ? Number(updated.customerCommissionPercent) : 0;
      const vendCommPct = updated.vendorCommissionPercent !== undefined ? Number(updated.vendorCommissionPercent) : 9;
      updated.vendorCommission = Math.round(parsedFare * (vendCommPct / 100) * 100) / 100;
      updated.customerCommission = updated.passengers && updated.passengers.length > 0
        ? updated.passengers.reduce((sum: number, p: any) => sum + (Number(p.custComm) || 0), 0)
        : Math.round(parsedFare * (commPercent / 100) * 100) / 100;

      const totalPassengerRefund = (updated.passengers || []).reduce((sum: number, p: any) => sum + (Number(p.refund) || 0), 0);
      updated.netAmount = updated.tripType === 'Refund' ? totalPassengerRefund : (parsedFare + parsedTax - parsedDiscount + updated.customerCommission);

      if (req.body.status !== undefined) {
        updated.status = req.body.status;
        if (updated.status === 'Paid') {
          updated.paidAmount = updated.netAmount;
          updated.dueAmount = 0;
        } else if (updated.status === 'Unpaid') {
          updated.paidAmount = 0;
          updated.dueAmount = updated.netAmount;
        } else if (updated.status === 'Partial') {
          const pAmt = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : updated.paidAmount;
          if (pAmt > 0 && pAmt < updated.netAmount) {
            updated.paidAmount = pAmt;
          } else if (pAmt >= updated.netAmount) {
            updated.paidAmount = updated.netAmount;
            updated.status = 'Paid';
          } else if (updated.paidAmount === 0) {
            updated.paidAmount = Math.round(updated.netAmount / 2);
          }
          updated.dueAmount = Math.max(0, updated.netAmount - updated.paidAmount);
        } else if (updated.status === 'Refunded') {
          updated.dueAmount = 0;
        }
      } else {
        const parsedPaid = Number(updated.paidAmount) || 0;
        updated.dueAmount = Math.max(0, updated.netAmount - parsedPaid);
        updated.status = updated.dueAmount === 0 ? 'Paid' : (parsedPaid > 0 ? 'Partial' : 'Unpaid');
      }

      await docRef.set(updated);
      return res.json(updated);
    }
  } catch (err: any) {
    console.error('Error updating invoice in Firestore:', err);
  }

  const idx = invoices.findIndex(inv => inv.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found.' });

  const updated = { ...invoices[idx], ...req.body };
  
  const parsedFare = Number(updated.baseFare) || 0;
  const parsedTax = Number(updated.tax) || 0;
  const parsedDiscount = Number(updated.discount) || 0;

  const commPercent = updated.customerCommissionPercent !== undefined ? Number(updated.customerCommissionPercent) : 0;
  const vendCommPct = updated.vendorCommissionPercent !== undefined ? Number(updated.vendorCommissionPercent) : 9;
  updated.vendorCommission = Math.round(parsedFare * (vendCommPct / 100) * 100) / 100;
  updated.customerCommission = updated.passengers && updated.passengers.length > 0
    ? updated.passengers.reduce((sum: number, p: any) => sum + (Number(p.custComm) || 0), 0)
    : Math.round(parsedFare * (commPercent / 100) * 100) / 100;

  const totalPassengerRefund = (updated.passengers || []).reduce((sum: number, p: any) => sum + (Number(p.refund) || 0), 0);
  updated.netAmount = updated.tripType === 'Refund' ? totalPassengerRefund : (parsedFare + parsedTax - parsedDiscount + updated.customerCommission);

  if (req.body.status !== undefined) {
    updated.status = req.body.status;
    if (updated.status === 'Paid') {
      updated.paidAmount = updated.netAmount;
      updated.dueAmount = 0;
    } else if (updated.status === 'Unpaid') {
      updated.paidAmount = 0;
      updated.dueAmount = updated.netAmount;
    } else if (updated.status === 'Partial') {
      const pAmt = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : updated.paidAmount;
      if (pAmt > 0 && pAmt < updated.netAmount) {
        updated.paidAmount = pAmt;
      } else if (pAmt >= updated.netAmount) {
        updated.paidAmount = updated.netAmount;
        updated.status = 'Paid';
      } else if (updated.paidAmount === 0) {
        updated.paidAmount = Math.round(updated.netAmount / 2);
      }
      updated.dueAmount = Math.max(0, updated.netAmount - updated.paidAmount);
    } else if (updated.status === 'Refunded') {
      updated.dueAmount = 0;
    }
  } else {
    const parsedPaid = Number(updated.paidAmount) || 0;
    updated.dueAmount = Math.max(0, updated.netAmount - parsedPaid);
    updated.status = updated.dueAmount === 0 ? 'Paid' : (parsedPaid > 0 ? 'Partial' : 'Unpaid');
  }

  invoices[idx] = updated;
  if (!db) {
    saveInvoicesToDisk();
    saveCustomersToDisk();
  }
  res.json(updated);
});

app.delete('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db) {
      await db.collection('invoices').doc(id).delete();
      return res.json({ success: true, message: 'Invoice deleted.' });
    }
  } catch (err: any) {
    console.error('Error deleting invoice from Firestore:', err);
  }

  invoices = invoices.filter(inv => inv.id !== id);
  if (!db) saveInvoicesToDisk();
  res.json({ success: true, message: 'Invoice deleted.' });
});

// Refunds API
app.get('/api/refunds', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('refunds').get();
      const list = snapshot.docs.map(doc => doc.data());
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching refunds from Firestore:', err);
  }
  res.json(refunds);
});

app.post('/api/refunds', async (req, res) => {
  const { invoiceId, refundAmount, reason } = req.body;
  try {
    if (db) {
      const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
      if (!invoiceDoc.exists) return res.status(404).json({ error: 'Invoice not found' });
      const invoice = invoiceDoc.data();

      const snapshot = await db.collection('refunds').get();
      const count = snapshot.size;

      const newRefund = {
        id: `RFD-${3000 + count + 1}`,
        invoiceId,
        ticketNumber: invoice.ticketNumber,
        passengerName: invoice.passengers[0]?.name || 'N/A',
        refundAmount: Number(refundAmount) || invoice.netAmount,
        reason: reason || 'Requested by customer',
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      await db.collection('refunds').doc(newRefund.id).set(newRefund);
      return res.status(201).json(newRefund);
    }
  } catch (err: any) {
    console.error('Error creating refund in Firestore:', err);
  }

  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const newRefund = {
    id: `RFD-${3000 + refunds.length + 1}`,
    invoiceId,
    ticketNumber: invoice.ticketNumber,
    passengerName: invoice.passengers[0]?.name || 'N/A',
    refundAmount: Number(refundAmount) || invoice.netAmount,
    reason: reason || 'Requested by customer',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  refunds.unshift(newRefund);
  res.status(201).json(newRefund);
});

app.put('/api/refunds/:id', async (req, res) => {
  const { id } = req.params;
  const { status, approvedBy } = req.body;
  try {
    if (db) {
      const docRef = db.collection('refunds').doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return res.status(404).json({ error: 'Refund not found' });

      const refund = docSnap.data();
      refund.status = status;
      if (approvedBy) refund.approvedBy = approvedBy;

      if (status === 'Refunded') {
        const invRef = db.collection('invoices').doc(refund.invoiceId);
        const invSnap = await invRef.get();
        if (invSnap.exists) {
          await invRef.update({ status: 'Refunded' });
          const invoice = invSnap.data();
          
          const custRef = db.collection('customers').doc(invoice.customerId);
          const custSnap = await custRef.get();
          if (custSnap.exists) {
            const customer = custSnap.data();
            const newBal = Math.max(0, (customer.balance || 0) - refund.refundAmount);
            await custRef.update({ balance: newBal });
          }
        }
      }

      await docRef.set(refund);
      return res.json(refund);
    }
  } catch (err: any) {
    console.error('Error updating refund in Firestore:', err);
  }

  const idx = refunds.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Refund not found' });

  refunds[idx].status = status;
  if (approvedBy) refunds[idx].approvedBy = approvedBy;

  if (status === 'Refunded') {
    const invIdx = invoices.findIndex(i => i.id === refunds[idx].invoiceId);
    if (invIdx !== -1) {
      invoices[invIdx].status = 'Refunded';
      
      const customer = customers.find(c => c.id === invoices[invIdx].customerId);
      if (customer) {
        customer.balance = Math.max(0, customer.balance - refunds[idx].refundAmount);
      }
    }
  }

  if (!db) {
    saveInvoicesToDisk();
    saveCustomersToDisk();
  }
  res.json(refunds[idx]);
});

// Payments Log API
app.get('/api/payments', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('payments').get();
      const list = snapshot.docs.map(doc => doc.data());
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching payments from Firestore:', err);
  }
  res.json(payments);
});

app.post('/api/payments', async (req, res) => {
  const { invoiceId, amount, method, referenceNumber } = req.body;
  try {
    if (db) {
      const invRef = db.collection('invoices').doc(invoiceId);
      const invSnap = await invRef.get();
      if (!invSnap.exists) return res.status(404).json({ error: 'Invoice not found' });
      const invoice = invSnap.data();

      const parsedAmount = Number(amount) || 0;

      const pSnapshot = await db.collection('payments').get();
      const count = pSnapshot.size;

      const newPayment = {
        id: `PMT-${4000 + count + 1}`,
        invoiceId,
        amount: parsedAmount,
        method: method || 'Cash',
        referenceNumber: referenceNumber || '',
        createdAt: new Date().toISOString(),
      };

      await db.collection('payments').doc(newPayment.id).set(newPayment);

      const updatedPaidAmount = (invoice.paidAmount || 0) + parsedAmount;
      const updatedDueAmount = Math.max(0, (invoice.netAmount || 0) - updatedPaidAmount);
      const updatedStatus = updatedDueAmount === 0 ? 'Paid' : (updatedPaidAmount > 0 ? 'Partial' : 'Unpaid');

      await invRef.update({
        paidAmount: updatedPaidAmount,
        dueAmount: updatedDueAmount,
        status: updatedStatus
      });

      const custRef = db.collection('customers').doc(invoice.customerId);
      const custSnap = await custRef.get();
      if (custSnap.exists) {
        const customer = custSnap.data();
        const updatedBal = Math.max(0, (customer.balance || 0) - parsedAmount);
        await custRef.update({ balance: updatedBal });
      }

      return res.status(201).json(newPayment);
    }
  } catch (err: any) {
    console.error('Error logging payment in Firestore:', err);
  }

  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const parsedAmount = Number(amount) || 0;

  const newPayment = {
    id: `PMT-${4000 + payments.length + 1}`,
    invoiceId,
    amount: parsedAmount,
    method: method || 'Cash',
    referenceNumber: referenceNumber || '',
    createdAt: new Date().toISOString(),
  };

  payments.unshift(newPayment);

  invoice.paidAmount += parsedAmount;
  invoice.dueAmount = Math.max(0, invoice.netAmount - invoice.paidAmount);
  invoice.status = invoice.dueAmount === 0 ? 'Paid' : (invoice.paidAmount > 0 ? 'Partial' : 'Unpaid');

  const customer = customers.find(c => c.id === invoice.customerId);
  if (customer) {
    customer.balance = Math.max(0, customer.balance - parsedAmount);
  }

  res.status(201).json(newPayment);
});

// Companies & Suppliers
app.get('/api/companies', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('companies').get();
      const list = snapshot.docs.map(doc => doc.data());
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching companies from Firestore:', err);
  }
  res.json(companies);
});

app.post('/api/companies', async (req, res) => {
  const { name, type, code, contactEmail } = req.body;
  try {
    if (db) {
      const snapshot = await db.collection('companies').get();
      const count = snapshot.size;
      const newId = `COMP-${count + 1}`;
      const newComp = {
        id: newId,
        name,
        type,
        code,
        contactEmail: contactEmail || '',
      };
      await db.collection('companies').doc(newId).set(newComp);
      return res.status(201).json(newComp);
    }
  } catch (err: any) {
    console.error('Error creating company in Firestore:', err);
  }

  const newComp = {
    id: `COMP-${companies.length + 1}`,
    name,
    type,
    code,
    contactEmail: contactEmail || '',
  };
  companies.push(newComp);
  res.status(201).json(newComp);
});

app.delete('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db) {
      await db.collection('companies').doc(id).delete();
      return res.json({ success: true });
    }
  } catch (err: any) {
    console.error('Error deleting company from Firestore:', err);
  }

  companies = companies.filter(c => c.id !== id);
  res.json({ success: true });
});

// Commission Rules API
app.get('/api/commission-rules', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('commissionRules').get();
      const list = snapshot.docs.map(doc => doc.data());
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching commission rules from Firestore:', err);
  }
  res.json(commissionRules);
});

app.post('/api/commission-rules', async (req, res) => {
  const { airlineCode, customerType, commissionPercent, vendorCommissionPercent } = req.body;
  try {
    if (db) {
      const snapshot = await db.collection('commissionRules').get();
      const count = snapshot.size;
      const newId = `RULE-${count + 1}`;
      const newRule = {
        id: newId,
        airlineCode,
        customerType,
        commissionPercent: Number(commissionPercent) || 0,
        vendorCommissionPercent: Number(vendorCommissionPercent) || 0,
      };
      await db.collection('commissionRules').doc(newId).set(newRule);
      return res.status(201).json(newRule);
    }
  } catch (err: any) {
    console.error('Error creating commission rule in Firestore:', err);
  }

  const newRule = {
    id: `RULE-${commissionRules.length + 1}`,
    airlineCode,
    customerType,
    commissionPercent: Number(commissionPercent) || 0,
    vendorCommissionPercent: Number(vendorCommissionPercent) || 0,
  };
  commissionRules.push(newRule);
  res.status(201).json(newRule);
});

// Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('auditLogs').get();
      const list = snapshot.docs.map(doc => doc.data());
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching audit logs from Firestore:', err);
  }
  res.json(auditLogs);
});

app.post('/api/audit-logs', async (req, res) => {
  const { username, role, action, details } = req.body;
  try {
    if (db) {
      const snapshot = await db.collection('auditLogs').get();
      const count = snapshot.size;
      const newId = `LOG-00${count + 1}`;
      const newLog = {
        id: newId,
        username: username || 'Unknown User',
        role: role || 'Sales',
        action: action || 'Perform Action',
        details: details || '',
        timestamp: new Date().toISOString(),
      };
      await db.collection('auditLogs').doc(newId).set(newLog);
      return res.status(201).json(newLog);
    }
  } catch (err: any) {
    console.error('Error creating audit log in Firestore:', err);
  }

  const newLog = {
    id: `LOG-00${auditLogs.length + 1}`,
    username: username || 'Unknown User',
    role: role || 'Sales',
    action: action || 'Perform Action',
    details: details || '',
    timestamp: new Date().toISOString(),
  };
  auditLogs.unshift(newLog);
  res.status(201).json(newLog);
});

// Notification Trigger Mocking
app.post('/api/notify', (req, res) => {
  const { type, medium, recipient, referenceId } = req.body;
  // Simulates outbound SMS, WhatsApp, or Email reminders
  res.json({
    success: true,
    message: `Outbound ${medium} Dispatch successfully transmitted to ${recipient} containing ${type} parameters for ID ${referenceId}`,
    sentAt: new Date().toISOString(),
  });
});

// Visas API
app.get('/api/visas', async (req, res) => {
  res.json(visas);
});

app.post('/api/visas', async (req, res) => {
  const {
    customInvoiceId,
    customerId,
    applicantName,
    passportNumber,
    nationality,
    visaType,
    salesDate,
    baseFare,
    tax,
    discount,
    customerCommission,
    paidAmount,
    paymentMethod,
    createdBy
  } = req.body;

  const customer = customers.find(c => c.id === customerId);
  const customerName = customer ? customer.name : 'Unknown Customer';

  const parsedFare = Number(baseFare) || 0;
  const parsedTax = Number(tax) || 0;
  const parsedDiscount = Number(discount) || 0;
  const parsedPaid = Number(paidAmount) || 0;
  const parsedCustComm = Number(customerCommission) || 0;

  const netAmount = Math.round((parsedFare + parsedTax - parsedDiscount + parsedCustComm) * 100) / 100;
  const dueAmount = Math.max(0, Math.round((netAmount - parsedPaid) * 100) / 100);
  const status = dueAmount === 0 ? 'Paid' : (parsedPaid > 0 ? 'Partial' : 'Unpaid');

  const visaId = customInvoiceId && customInvoiceId.trim() !== ""
    ? (customInvoiceId.startsWith('VSA-') ? customInvoiceId : `VSA-2026-${customInvoiceId}`)
    : `VSA-2026-${1000 + visas.length + 1}`;

  const newVisa = {
    id: visaId,
    customInvoiceId: visaId,
    customerId,
    customerName,
    applicantName: applicantName || 'Unknown Applicant',
    passportNumber: passportNumber || 'N000000',
    nationality: nationality || 'Somalia',
    visaType: visaType || 'Tourist',
    salesDate: salesDate || new Date().toLocaleDateString('en-CA'),
    baseFare: parsedFare,
    tax: parsedTax,
    discount: parsedDiscount,
    customerCommission: parsedCustComm,
    netAmount,
    paidAmount: parsedPaid,
    dueAmount,
    status,
    paymentMethod: paymentMethod || 'Cash',
    createdBy: createdBy || 'admin@noble.com',
    createdAt: new Date().toISOString()
  };

  visas.push(newVisa);
  saveVisasToDisk();

  if (customer && status !== 'Paid') {
    customer.balance = Math.round(((customer.balance || 0) + dueAmount) * 100) / 100;
    saveCustomersToDisk();
  }

  res.status(201).json(newVisa);
});

app.put('/api/visas/:id', async (req, res) => {
  const { id } = req.params;
  const idx = visas.findIndex(v => v.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Visa record not found.' });

  const oldVisa = visas[idx];
  const updated = { ...oldVisa, ...req.body };

  const parsedFare = Number(updated.baseFare) || 0;
  const parsedTax = Number(updated.tax) || 0;
  const parsedDiscount = Number(updated.discount) || 0;
  const parsedPaid = Number(updated.paidAmount) || 0;
  const parsedCustComm = Number(updated.customerCommission) || 0;

  updated.netAmount = Math.round((parsedFare + parsedTax - parsedDiscount + parsedCustComm) * 100) / 100;

  if (req.body.status !== undefined) {
    updated.status = req.body.status;
    if (updated.status === 'Paid') {
      updated.paidAmount = updated.netAmount;
      updated.dueAmount = 0;
    } else if (updated.status === 'Unpaid') {
      updated.paidAmount = 0;
      updated.dueAmount = updated.netAmount;
    } else if (updated.status === 'Partial') {
      const pAmt = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : updated.paidAmount;
      if (pAmt > 0 && pAmt < updated.netAmount) {
        updated.paidAmount = pAmt;
      } else if (pAmt >= updated.netAmount) {
        updated.paidAmount = updated.netAmount;
        updated.status = 'Paid';
      }
      updated.dueAmount = Math.max(0, Math.round((updated.netAmount - updated.paidAmount) * 100) / 100);
    }
  } else {
    updated.dueAmount = Math.max(0, Math.round((updated.netAmount - parsedPaid) * 100) / 100);
    updated.status = updated.dueAmount === 0 ? 'Paid' : (parsedPaid > 0 ? 'Partial' : 'Unpaid');
  }

  // Adjust customer credit balance
  const diff = updated.dueAmount - (oldVisa.dueAmount || 0);
  if (diff !== 0) {
    const customer = customers.find(c => c.id === updated.customerId);
    if (customer) {
      customer.balance = Math.round(((customer.balance || 0) + diff) * 100) / 100;
      saveCustomersToDisk();
    }
  }

  visas[idx] = updated;
  saveVisasToDisk();
  res.json(updated);
});

app.delete('/api/visas/:id', async (req, res) => {
  const { id } = req.params;
  const idx = visas.findIndex(v => v.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Visa record not found.' });

  const visa = visas[idx];
  if (visa.dueAmount > 0) {
    const customer = customers.find(c => c.id === visa.customerId);
    if (customer) {
      customer.balance = Math.max(0, Math.round(((customer.balance || 0) - visa.dueAmount) * 100) / 100);
      saveCustomersToDisk();
    }
  }

  visas.splice(idx, 1);
  saveVisasToDisk();
  res.json({ success: true });
});

// Quotations API
app.get('/api/quotations', async (req, res) => {
  res.json(quotations);
});

app.post('/api/quotations', async (req, res) => {
  const newQuote = {
    id: req.body.customQuoteId || `QT-2026-${1000 + quotations.length + 1}`,
    customQuoteId: req.body.customQuoteId || `QT-2026-${1000 + quotations.length + 1}`,
    date: req.body.date || new Date().toLocaleDateString('en-CA'),
    clientName: req.body.clientName || 'Unknown Client',
    subject: req.body.subject || 'Travel Quotation',
    intro: req.body.intro || 'We are pleased to submit the following itinerary options for your review...',
    items: req.body.items || [],
    note: req.body.note || 'Prices are subject to availability and change until ticketed.',
    totalAmount: Number(req.body.totalAmount) || 0,
    createdBy: req.body.createdBy || 'admin@noble.com',
    createdAt: new Date().toISOString()
  };

  quotations.push(newQuote);
  saveQuotationsToDisk();
  res.status(201).json(newQuote);
});

app.put('/api/quotations/:id', async (req, res) => {
  const { id } = req.params;
  const idx = quotations.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Quotation not found.' });

  quotations[idx] = { ...quotations[idx], ...req.body };
  saveQuotationsToDisk();
  res.json(quotations[idx]);
});

app.delete('/api/quotations/:id', async (req, res) => {
  const { id } = req.params;
  const idx = quotations.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Quotation not found.' });

  quotations.splice(idx, 1);
  saveQuotationsToDisk();
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// Authentication and Staff Registration Routes
// -----------------------------------------------------------------------------

// login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (db) {
      const doc = await db.collection('users').doc(email.toLowerCase()).get();
      if (doc.exists) {
        const u = doc.data();
        if (u && u.password === password) {
          return res.json({ success: true, user: { email: u.email, role: u.role } });
        }
      }
    } else {
      const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (u && u.password === password) {
        return res.json({ success: true, user: { email: u.email, role: u.role } });
      }
    }
  } catch (err: any) {
    console.error('Error logging in:', err);
  }

  res.status(401).json({ error: 'Invalid email address or secure password.' });
});

// get all users staff (masking password)
app.get('/api/users', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('users').get();
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return { email: data.email, role: data.role };
      });
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching users from Firestore:', err);
  }

  const list = users.map(u => ({ email: u.email, role: u.role }));
  res.json(list);
});

// register a new staff user
app.post('/api/users', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    if (db) {
      const doc = await db.collection('users').doc(normalizedEmail).get();
      if (doc.exists) {
        return res.status(400).json({ error: 'User email is already registered.' });
      }

      const newUser = { id: normalizedEmail, email: normalizedEmail, password, role };
      await db.collection('users').doc(normalizedEmail).set(newUser);
      return res.status(201).json({ email: normalizedEmail, role });
    }
  } catch (err: any) {
    console.error('Error creating user in Firestore:', err);
  }

  const exists = users.some(u => u.email.toLowerCase() === normalizedEmail);
  if (exists) {
    return res.status(400).json({ error: 'User email is already registered.' });
  }

  const newUser = { id: normalizedEmail, email: normalizedEmail, password, role };
  users.push(newUser);
  saveUsersToDisk();

  res.status(201).json({ email: normalizedEmail, role });
});

// delete a user staff
app.delete('/api/users/:email', async (req, res) => {
  const targetEmail = req.params.email.toLowerCase();

  // Prevent deleting the initial/default admin if it's the last admin
  let adminCount = 0;
  if (db) {
    const snapshot = await db.collection('users').where('role', '==', 'admin').get();
    adminCount = snapshot.size;
  } else {
    adminCount = users.filter(u => u.role === 'admin').length;
  }

  let isTargetAdmin = false;
  if (db) {
    const doc = await db.collection('users').doc(targetEmail).get();
    if (doc.exists && doc.data()?.role === 'admin') {
      isTargetAdmin = true;
    }
  } else {
    const u = users.find(x => x.email.toLowerCase() === targetEmail);
    if (u && u.role === 'admin') {
      isTargetAdmin = true;
    }
  }

  if (isTargetAdmin && adminCount <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only admin user in the system.' });
  }

  try {
    if (db) {
      await db.collection('users').doc(targetEmail).delete();
      return res.json({ success: true });
    }
  } catch (err: any) {
    console.error('Error deleting user from Firestore:', err);
  }

  const idx = users.findIndex(u => u.email.toLowerCase() === targetEmail);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(idx, 1);
  saveUsersToDisk();

  res.json({ success: true });
});


// update a user staff role and optionally password
app.put('/api/users/:email', async (req, res) => {
  const targetEmail = req.params.email.toLowerCase();
  const { role, password } = req.body;
  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  try {
    if (db) {
      const docRef = db.collection('users').doc(targetEmail);
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      const updateData: any = { role };
      if (password) updateData.password = password;
      await docRef.update(updateData);
      return res.json({ email: targetEmail, role });
    }
  } catch (err: any) {
    console.error('Error updating user in Firestore:', err);
  }

  const user = users.find(u => u.email.toLowerCase() === targetEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.role = role;
  if (password) user.password = password;
  saveUsersToDisk();

  res.json({ email: targetEmail, role });
});


// change logged in user password with old password verification
app.post('/api/users/change-password', async (req, res) => {
  const { email, oldPassword, password } = req.body;
  if (!email || !oldPassword || !password) {
    return res.status(400).json({ error: 'Email, old password, and new password are required' });
  }

  const targetEmail = email.toLowerCase();

  try {
    if (db) {
      const docRef = db.collection('users').doc(targetEmail);
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      const data = doc.data();
      if (data?.password !== oldPassword) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }
      await docRef.update({ password });
      return res.json({ success: true });
    }
  } catch (err: any) {
    console.error('Error changing password in Firestore:', err);
  }

  const user = users.find(u => u.email.toLowerCase() === targetEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.password !== oldPassword) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }

  user.password = password;
  saveUsersToDisk();

  res.json({ success: true });
});


// Backup entire database collections
app.get('/api/backup', async (req, res) => {
  try {
    let currentInvoices = invoices;
    let currentVisas = visas;
    let currentCustomers = customers;
    let currentQuotations = quotations;

    if (db) {
      const [invSnap, visaSnap, custSnap, quoteSnap] = await Promise.all([
        db.collection('invoices').get(),
        db.collection('visas').get(),
        db.collection('customers').get(),
        db.collection('quotations').get()
      ]);
      currentInvoices = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      currentVisas = visaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      currentCustomers = custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      currentQuotations = quoteSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    res.json({
      invoices: currentInvoices,
      visas: currentVisas,
      customers: currentCustomers,
      quotations: currentQuotations,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Backup failed:', err);
    res.status(500).json({ error: 'Failed to compile backup: ' + err.message });
  }
});


// Restore database collections from backup payload
app.post('/api/restore', async (req, res) => {
  const { invoices: newInvoices, visas: newVisas, customers: newCustomers, quotations: newQuotations } = req.body;
  
  if (!Array.isArray(newInvoices) || !Array.isArray(newVisas) || !Array.isArray(newCustomers) || !Array.isArray(newQuotations)) {
    return res.status(400).json({ error: 'Invalid backup format' });
  }

  try {
    invoices = newInvoices;
    visas = newVisas;
    customers = newCustomers;
    quotations = newQuotations;

    saveInvoicesToDisk();
    saveVisasToDisk();
    saveCustomersToDisk();
    saveQuotationsToDisk();

    if (db) {
      const restoreCollection = async (colName: string, items: any[]) => {
        const colRef = db!.collection(colName);
        const snapshot = await colRef.get();
        
        const batchDelete = db!.batch();
        snapshot.docs.forEach(doc => batchDelete.delete(doc.ref));
        await batchDelete.commit();

        const batchWrite = db!.batch();
        items.forEach(item => {
          const docId = String(item.id || item.email || Math.random());
          const docRef = colRef.doc(docId);
          batchWrite.set(docRef, item);
        });
        await batchWrite.commit();
      };

      await Promise.all([
        restoreCollection('invoices', newInvoices),
        restoreCollection('visas', newVisas),
        restoreCollection('customers', newCustomers),
        restoreCollection('quotations', newQuotations)
      ]);
    }

    res.json({ success: true, message: 'All collections restored successfully' });
  } catch (err: any) {
    console.error('Restore failed:', err);
    res.status(500).json({ error: 'Failed to restore backup: ' + err.message });
  }
});


// Delete selective database collections
app.post('/api/delete-data', async (req, res) => {
  const { deleteTickets, deleteVisas, deleteCustomers, deleteQuotations } = req.body;

  try {
    const clearCollection = async (colName: string) => {
      if (db) {
        const colRef = db.collection(colName);
        const snapshot = await colRef.get();
        const batchDelete = db.batch();
        snapshot.docs.forEach(doc => batchDelete.delete(doc.ref));
        await batchDelete.commit();
      }
    };

    if (deleteTickets) {
      invoices = [];
      saveInvoicesToDisk();
      await clearCollection('invoices');
    }

    if (deleteVisas) {
      visas = [];
      saveVisasToDisk();
      await clearCollection('visas');
    }

    if (deleteCustomers) {
      customers = [];
      saveCustomersToDisk();
      await clearCollection('customers');
    }

    if (deleteQuotations) {
      quotations = [];
      saveQuotationsToDisk();
      await clearCollection('quotations');
    }

    res.json({ success: true, message: 'Selected collections deleted successfully.' });
  } catch (err: any) {
    console.error('Delete data failed:', err);
    res.status(500).json({ error: 'Failed to delete selected data: ' + err.message });
  }
});


// -----------------------------------------------------------------------------
// Vite Middleware / Asset Serving
// -----------------------------------------------------------------------------
async function startServer() {
  // Seed the Firestore database with default data if empty
  try {
    if (db) {
      await seedCollection('users', users.length > 0 ? users : initialUsers);
      await seedCollection('customers', customers);
      await seedCollection('invoices', invoices);
      await seedCollection('refunds', refunds);
      await seedCollection('payments', payments);
      await seedCollection('companies', companies);
      await seedCollection('commissionRules', commissionRules);
      await seedCollection('auditLogs', auditLogs);
      console.log('[Firebase] Seeding check complete.');

      // Ensure Firestore has today's invoices for the demo daily report
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const todaySnapshot = await db.collection('invoices').where('salesDate', '==', todayStr).limit(1).get();
      if (todaySnapshot.empty) {
        console.log(`[Firebase] No invoices found for today (${todayStr}) in Firestore. Shifting 5 recent ones for demo.`);
        const recentSnapshot = await db.collection('invoices').limit(5).get();
        for (const doc of recentSnapshot.docs) {
          const originalTime = doc.data().createdAt ? doc.data().createdAt.split('T')[1] || '09:00:00Z' : '09:00:00Z';
          await doc.ref.update({
            salesDate: todayStr,
            createdAt: `${todayStr}T${originalTime}`
          });
        }
      }
    }
  } catch (err) {
    console.error('[Firebase] Database seeding failed:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
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
    console.log(`[Noble Travel Agency] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error('[Noble Travel Agency] Start Failed:', e);
});
