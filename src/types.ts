export interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  stops: number;
  class: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  date: string;
  aircraft: string;
  gate: string;
  terminal: string;
}

export interface Destination {
  id: string;
  name: string;
  city: string;
  country: string;
  image: string;
  basePrice: number;
  description: string;
  rating: number;
  activities: string[];
  weatherTemp: string;
  weatherCondition: string;
}

export interface FlightStatus {
  flightNumber: string;
  airline: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  status: 'On Time' | 'Delayed' | 'Departed' | 'Arrived' | 'Boarding' | 'Cancelled';
  departureTime: string;
  arrivalTime: string;
  gate: string;
  terminal: string;
  delayMinutes: number;
  progressPercent: number;
  altitudeFeet?: number;
  speedKnots?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

// --- Travel Agency Portal Types ---

export type CustomerType = 'Travel Agency' | 'Corporate' | 'Individual';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  email: string;
  mobile: string;
  commissionPercent: number;
  creditLimit: number;
  balance: number;
  createdAt: string;
}

export type TripType = 'One Way' | 'Round Trip' | 'Date Change' | 'Cancellation' | 'Refund';
export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partial' | 'Refunded';

export interface Passenger {
  name: string;
  type: 'Adult' | 'Child' | 'Infant';
  passportNumber: string;
  nationality: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  seatPreference: string;
  mealPreference: 'Standard' | 'Vegetarian' | 'Vegan' | 'Kosher' | 'Halal' | 'Gluten-Free';
  specialRequest?: string;
  ticketNumber?: string;
  fare?: number;
  tax?: number;
  refund?: number;
  commission?: number;
  custComm?: number;
  discount?: number;
  net?: number;
  total?: number;
}

export interface TicketInvoice {
  id: string; // Auto Invoice Number e.g., INV-2026-1001
  pnr: string;
  ticketNumber: string;
  customerName: string; // Refers to Customer.name
  customerId: string;
  passengers: Passenger[];
  tripType: TripType;
  airline: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  vendorName: string;
  
  // Calculations
  baseFare: number;
  tax: number;
  discount: number;
  vendorCommission: number; // calculated from fare
  customerCommission: number; // calculated from fare
  netAmount: number; // Fare + Tax - Discount
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  
  createdAt: string;
  paymentMethod?: 'Cash' | 'Bank' | 'Mobile Money' | 'Card';
}

export interface RefundRequest {
  id: string;
  invoiceId: string;
  ticketNumber: string;
  passengerName: string;
  refundAmount: number;
  reason: string;
  status: 'Pending' | 'Refunded' | 'Rejected';
  createdAt: string;
  approvedBy?: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'Cash' | 'Bank' | 'Mobile Money' | 'Card';
  referenceNumber?: string;
  createdAt: string;
}

export interface CompanySupplier {
  id: string;
  name: string;
  type: 'Airline' | 'Supplier' | 'Vendor' | 'Travel Agency';
  code?: string;
  contactEmail: string;
}

export interface CommissionRule {
  id: string;
  airlineCode: string;
  customerType: CustomerType;
  commissionPercent: number;
  vendorCommissionPercent: number;
}

export type UserRole = 'Super Admin' | 'Manager' | 'Finance' | 'Sales' | 'Ticket Officer';

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  username: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}
