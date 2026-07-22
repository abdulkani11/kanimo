import { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Calculator, 
  Percent,
  CheckCircle2, 
  X, 
  Download, 
  Eye, 
  Pencil, 
  RotateCcw, 
  Calendar, 
  User, 
  DollarSign, 
  Briefcase, 
  Plane, 
  ArrowLeftRight,
  Sparkles,
  Upload,
  FileJson,
  Check,
  ChevronDown,
  FileText,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { Customer, TicketInvoice, Passenger, TripType, InvoiceStatus } from '../types';
import logoImg from '../assets/images/dual_airline_logo.png';

interface TicketsProps {
  userRole?: 'admin' | 'cashier' | 'user';
  loggedInEmail?: string;
}

export default function Tickets({ userRole = 'admin', loggedInEmail = 'admin@noble.com' }: TicketsProps) {
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Mode state: 'list' | 'create' | 'edit' | 'view'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<TicketInvoice | null>(null);

  // Filters & Search (Mirroring Image 4)
  const [filterSalesDate, setFilterSalesDate] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);

  // Active/Applied Filters for instant local search
  const [appliedSalesDate, setAppliedSalesDate] = useState('');
  const [appliedCustomerId, setAppliedCustomerId] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  // Ticket Form States (Combined for Create & Edit)
  const [pnr, setPnr] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [tripType, setTripType] = useState<TripType>('One Way');
  const [airline, setAirline] = useState('Ethiopian Airlines');
  const [origin, setOrigin] = useState('MGQ');
  const [destination, setDestination] = useState('ADD');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [vendorName, setVendorName] = useState('Direct GDS');
  const [baseFare, setBaseFare] = useState('0');
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Mobile Money' | 'Card'>('Bank');
  const [salesUser, setSalesUser] = useState('HAMZE ISMAIL ALI');

  // Add Payment Modal states
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<TicketInvoice | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [paymentDescription, setPaymentDescription] = useState('');

  // New user-requested form fields
  const [customInvoiceId, setCustomInvoiceId] = useState('');
  const [customerCommissionPercent, setCustomerCommissionPercent] = useState('6');
  const [vendorCommissionPercent, setVendorCommissionPercent] = useState('9');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [commPromptData, setCommPromptData] = useState<{
    isOpen: boolean;
    normalComm: number;
    customerId: string;
    mobile: string;
    email: string;
  } | null>(null);
  const [salesDate, setSalesDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [bookingCompany, setBookingCompany] = useState<'B2B' | 'SABRE' | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; pnr: string } | null>(null);

  // Dynamic passengers state
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      name: '',
      type: 'Adult',
      passportNumber: '',
      nationality: 'Somalia',
      dob: '1995-01-01',
      gender: 'Male',
      seatPreference: '12F',
      mealPreference: 'Standard',
      specialRequest: '',
      custComm: 0,
    },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleBackSignal = (e: Event) => {
      if (viewMode !== 'list') {
        e.preventDefault();
        setViewMode('list');
      }
    };
    window.addEventListener('noble_go_back', handleBackSignal);
    return () => window.removeEventListener('noble_go_back', handleBackSignal);
  }, [viewMode]);

  useEffect(() => {
    if (userRole === 'admin') {
      setSalesUser('JANE DOE (ADMIN)');
    } else if (userRole === 'cashier') {
      setSalesUser('HAMZE ISMAIL (CASHIER)');
    } else {
      setSalesUser('ABDI KANIM (USER)');
    }
  }, [userRole]);

  // Dynamic sync of customer commission and info when formCustomerId changes
  useEffect(() => {
    if (viewMode === 'create' && formCustomerId) {
      const selectedCust = customers.find(c => c.id === formCustomerId);
      if (selectedCust) {
        setMobileNumber(selectedCust.mobile || '');
        setEmail(selectedCust.email || '');
      }
    }
  }, [formCustomerId, viewMode, customers]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/invoices').then(res => res.json()),
      fetch('/api/customers').then(res => res.json()),
    ])
      .then(([invData, custData]) => {
        setInvoices(invData);
        setCustomers(custData);
        if (custData.length > 0 && !formCustomerId) {
          setFormCustomerId(custData[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load tickets data:', err);
        setLoading(false);
      });
  };

  // Passenger management
  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        name: '',
        type: 'Adult',
        passportNumber: '',
        nationality: 'Somalia',
        dob: '1995-01-01',
        gender: 'Male',
        seatPreference: '',
        mealPreference: 'Standard',
        specialRequest: '',
        fare: 0,
        tax: 0,
        net: 0,
        refund: 0,
        discount: 0,
        custComm: 0,
      },
    ]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length === 1) return;
    setPassengers(passengers.filter((_, idx) => idx !== index));
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = passengers.map((p, idx) => {
      if (idx === index) {
        const newPassenger = { ...p, [field]: value };
        // Sync fare to net if user changes net and fare is not yet set
        if (field === 'net' && (Number(p.fare) === 0 || p.fare === undefined)) {
          if (tripType !== 'Date Change') {
            newPassenger.fare = value;
          }
        }
        // Sync net to fare if user changes fare and net is not yet set
        if (field === 'fare' && (Number(p.net) === 0 || p.net === undefined || Number(p.net) === Number(p.fare))) {
          newPassenger.net = value;
        }
        return newPassenger;
      }
      return p;
    });
    setPassengers(updated);
  };

  // Reset filter selections
  const handleResetFilters = () => {
    setFilterSalesDate('');
    setFilterCustomerId('');
    setFilterStatus('');
    setAppliedSalesDate('');
    setAppliedCustomerId('');
    setAppliedStatus('');
    setSearchQuery('');
  };

  // Submit search button
  const handleSearchApply = () => {
    setAppliedSalesDate(filterSalesDate);
    setAppliedCustomerId(filterCustomerId);
    setAppliedStatus(filterStatus);
  };

  const handleStatusClick = (inv: TicketInvoice) => {
    const localToday = new Date().toLocaleDateString('en-CA');
    setPaymentInvoice(inv);
    setPaymentDate(localToday);
    setPaymentAmount(inv.dueAmount !== undefined ? String(inv.dueAmount) : String(inv.netAmount - (inv.paidAmount || 0)));
    setPaymentAccount(inv.paymentMethod || '');
    setPaymentReference('');
    
    const statusUpper = (inv.status || 'Unpaid').toUpperCase();
    if (statusUpper === 'PAID') setPaymentStatus('PAID');
    else if (statusUpper === 'PARTIAL') setPaymentStatus('PARTIAL PAID');
    else if (statusUpper === 'REFUNDED') setPaymentStatus('REFUND');
    else setPaymentStatus('UNPAID');
    
    setPaymentDescription('');
    setIsAddPaymentModalOpen(true);
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    try {
      // 1. Post the payment record
      const paymentRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentInvoice.id,
          amount: Number(paymentAmount) || 0,
          method: paymentAccount || 'Cash',
          referenceNumber: paymentReference || '',
        }),
      });

      if (!paymentRes.ok) {
        throw new Error('Failed to record payment');
      }

      const enteredAmt = Number(paymentAmount) || 0;
      const netAmt = paymentInvoice.netAmount || 0;

      // 2. Map status selection to backend expected values
      let statusMapped = 'Unpaid';
      if (paymentStatus === 'PAID') {
        if (enteredAmt < netAmt) {
          statusMapped = 'Partial'; // Auto-correct to Partial
        } else {
          statusMapped = 'Paid';
        }
      }
      else if (paymentStatus === 'PARTIAL PAID') {
        if (enteredAmt >= netAmt) {
          statusMapped = 'Paid'; // Auto-correct to Paid
        } else {
          statusMapped = 'Partial';
        }
      }
      else if (paymentStatus === 'REFUND') statusMapped = 'Refunded';

      const invoiceUpdateBody: any = { 
        status: statusMapped, 
        paidAmount: enteredAmt,
        paymentMethod: paymentAccount || 'Cash'
      };

      // 3. Update invoice status
      const invoiceRes = await fetch(`/api/invoices/${paymentInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceUpdateBody),
      });

      if (!invoiceRes.ok) {
        throw new Error('Failed to update invoice status');
      }

      // 4. Post audit log
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInEmail,
          role: userRole === 'admin' ? 'Super Admin' : 'Finance Cashier',
          action: 'Add Payment Modal',
          details: `Recorded payment of $${paymentAmount} via ${paymentAccount || 'Cash'} and set status of invoice ${paymentInvoice.id} to ${statusMapped} (Reference: ${paymentReference || 'N/A'})`,
        }),
      });

      fetchData();
      setIsAddPaymentModalOpen(false);
      setPaymentInvoice(null);
    } catch (err) {
      console.error('Error logging add payment details:', err);
    }
  };

  // Financial computations
  const totalPassengerFare = tripType === 'Refund' ? 0 : passengers.reduce((sum, p) => sum + (Number(p.fare) || Number(p.net) || 0), 0);
  const totalPassengerTax = tripType === 'Refund' ? 0 : passengers.reduce((sum, p) => {
    const pFare = Number(p.fare) || Number(p.net) || 0;
    const pNet = Number(p.net) || (pFare + (Number(p.tax) || 0));
    return sum + (pNet - pFare);
  }, 0);
  const totalPassengerDiscount = tripType === 'Refund' ? 0 : Math.round(passengers.reduce((sum, p) => {
    const pFare = Number(p.fare) || Number(p.net) || 0;
    const pDiscount = pFare * (Number(customerCommissionPercent) / 100);
    return sum + pDiscount;
  }, 0) * 100) / 100;

  const parsedFare = totalPassengerFare;
  const parsedTax = totalPassengerTax;
  const parsedDiscount = totalPassengerDiscount;
  const parsedPaid = Number(paidAmount) || 0;

  const currentCustomer = customers.find(c => c.id === formCustomerId);
  const commissionPercent = currentCustomer ? currentCustomer.commissionPercent : 0;

  const calculatedVendorCommission = Math.round(parsedFare * (Number(vendorCommissionPercent) / 100) * 100) / 100;
  const calculatedCustomerCommission = tripType === 'Refund' ? 0 : Math.round(passengers.reduce((sum, p) => {
    const custComm = (p as any).custComm !== undefined ? (p as any).custComm : 0;
    return sum + custComm;
  }, 0) * 100) / 100;
  const totalPassengerRefund = passengers.reduce((sum, p) => sum + (Number(p.refund) || 0), 0);
  const calculatedNetAmount = tripType === 'Refund' ? totalPassengerRefund : Math.round((parsedFare + parsedTax - parsedDiscount + calculatedCustomerCommission) * 100) / 100;
  const calculatedDueAmount = Math.max(0, Math.round((calculatedNetAmount - parsedPaid) * 100) / 100);
  const calculatedProfit = Math.round((calculatedVendorCommission - calculatedCustomerCommission) * 100) / 100;

  const isFormValid = formCustomerId && origin && destination && departureDate && passengers.every(p => p.name);
  const isFormLockedForRole = viewMode === 'edit' && userRole === 'cashier';

  // Switch to Edit Mode & pre-fill all parameters
  const enterEditMode = (invoice: TicketInvoice) => {
    setSelectedInvoice(invoice);
    setPnr(invoice.pnr);
    setTicketNumber(invoice.ticketNumber);
    setFormCustomerId(invoice.customerId);
    setTripType(invoice.tripType);
    setAirline(invoice.airline);
    setOrigin(invoice.origin);
    setDestination(invoice.destination);
    setDepartureDate(invoice.departureDate.split('T')[0]);
    if (invoice.returnDate) {
      setReturnDate(invoice.returnDate.split('T')[0]);
    } else {
      setReturnDate('');
    }
    setVendorName(invoice.vendorName);
    setBaseFare(String(invoice.baseFare));
    setTax(String(invoice.tax));
    setDiscount(String(invoice.discount));
    setPaidAmount(String(invoice.paidAmount));
    setPaymentMethod(invoice.paymentMethod || 'Bank');
    
    // Map passengers to have pricing properties
    const loadedPassengers = invoice.passengers.map((p, idx) => {
      const numP = invoice.passengers.length || 1;
      const defaultFare = Math.round((invoice.baseFare / numP) * 100) / 100;
      const defaultTax = Math.round((invoice.tax / numP) * 100) / 100;
      const defaultDiscount = Math.round((invoice.discount / numP) * 100) / 100;
      
      return {
        ...p,
        ticketNumber: p.ticketNumber || (idx === 0 ? invoice.ticketNumber : ''),
        fare: p.fare !== undefined ? p.fare : defaultFare,
        tax: p.tax !== undefined ? p.tax : defaultTax,
        refund: p.refund !== undefined ? p.refund : 0,
        discount: p.discount !== undefined ? p.discount : defaultDiscount,
        custComm: (p as any).custComm !== undefined ? (p as any).custComm : 0,
      };
    });
    setPassengers(loadedPassengers);
    setSalesUser(invoice.id ? 'HAMZE ISMAIL ALI' : 'Jane Doe');
    
    // Custom user field loads
    setCustomInvoiceId(invoice.id ? invoice.id.replace('INV-2026-', '') : '');
    const commPct = (invoice as any).customerCommissionPercent ?? (invoice.customerCommission && invoice.baseFare ? Math.round((invoice.customerCommission / invoice.baseFare) * 100) : 6);
    setCustomerCommissionPercent(String(commPct));
    const vendorCommPct = (invoice as any).vendorCommissionPercent ?? (invoice.vendorCommission && invoice.baseFare ? Math.round((invoice.vendorCommission / invoice.baseFare) * 100) : 9);
    setVendorCommissionPercent(String(vendorCommPct));
    setBookingCompany(vendorCommPct === 7 ? 'SABRE' : 'B2B');
    setMobileNumber((invoice as any).mobileNumber || '');
    setEmail((invoice as any).email || '');
    setSalesDate(new Date().toLocaleDateString('en-CA'));
    
    setViewMode('edit');
  };

  // Switch to Create Mode & reset variables
  const enterCreateMode = () => {
    setSelectedInvoice(null);
    setPnr('');
    setTicketNumber('');
    setBookingCompany('');
    setVendorCommissionPercent('0');
    setFormCustomerId('');
    setCustomerCommissionPercent('0');
    setMobileNumber('');
    setEmail('');
    setTripType('');
    setAirline('Ethiopian Airlines');
    setOrigin('');
    setDestination('');
    setDepartureDate('');
    setReturnDate('');
    setVendorName('');
    setBaseFare('0');
    setTax('0');
    setDiscount('0');
    setPaidAmount('0');
    setPaymentMethod('Bank');

    // Auto-generate invoice number (unchangeable)
    const nextNum = invoices.length > 0 ? Math.max(...invoices.map(inv => {
      const match = (inv.customInvoiceId || inv.id || '').match(/\d+$/);
      return match ? Number(match[0]) : 0;
    })) + 1 : 1001;
    setCustomInvoiceId('INV-2026-' + nextNum);

    setVendorCommissionPercent('0');
    setSalesDate(new Date().toLocaleDateString('en-CA'));
    setPassengers([
      {
        name: '',
        type: 'Adult',
        passportNumber: '',
        nationality: 'Somalia',
        dob: '1995-01-01',
        gender: 'Male',
        seatPreference: '',
        mealPreference: 'Standard',
        specialRequest: '',
        ticketNumber: '',
        fare: 0,
        tax: 0,
        net: 0,
        refund: 0,
        discount: 0,
      },
    ]);
    setViewMode('create');
  };

  // View Ticket Details overlay
  const enterViewMode = (invoice: TicketInvoice) => {
    setSelectedInvoice(invoice);
    setViewMode('view');
  };

  // Export all invoices to a JSON file
  const exportData = () => {
    const dataStr = JSON.stringify(invoices, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  // Import invoices from a JSON file
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          alert('Invalid file format. Must be a JSON array of invoices.');
          return;
        }
        const res = await fetch('/api/invoices/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoices: json })
        });
        if (res.ok) {
          const resData = await res.json();
          alert(`Import Complete: Successfully added ${resData.count || 0} new invoices! (Skipped ${resData.skipped || 0} duplicate entries)`);
          e.target.value = '';
          const response = await fetch('/api/invoices');
          if (response.ok) {
            const data = await response.json();
            setInvoices(data);
          }
        } else {
          const errData = await res.json();
          alert(`Import failed: ${errData.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        alert(`Error parsing JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Submit invoice CRUD action
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const mappedPassengers = passengers.map(p => {
      const pFare = Number(p.fare) || Number(p.net) || 0;
      const pNet = Number(p.net) || (pFare + (Number(p.tax) || 0));
      const pDiscount = tripType === 'Refund' ? 0 : Math.round(pFare * (Number(customerCommissionPercent) / 100) * 100) / 100;
      const pCustComm = tripType === 'Refund' ? 0 : (p.custComm !== undefined ? p.custComm : 0);
      return {
        ...p,
        tax: pNet - pFare,
        net: pNet,
        discount: pDiscount,
        custComm: pCustComm
      };
    });

    const payload = {
      customInvoiceId,
      pnr,
      ticketNumber,
      customerId: formCustomerId,
      tripType,
      airline,
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'Round Trip' ? returnDate : undefined,
      vendorName: bookingCompany || vendorName || 'B2B',
      baseFare: parsedFare,
      tax: parsedTax,
      discount: parsedDiscount,
      paidAmount: parsedPaid,
      paymentMethod,
      passengers: mappedPassengers,
      customerCommissionPercent,
      vendorCommissionPercent,
      mobileNumber,
      email,
      salesDate,
      createdBy: loggedInEmail,
    };

    try {
      let res;
      if (viewMode === 'create') {
        res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Edit mode
        res = await fetch(`/api/invoices/${selectedInvoice?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const result = await res.json();
        
        // Audit log action
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'HAMZE ISMAIL ALI',
            role: 'Super Admin',
            action: viewMode === 'create' ? 'Issue Ticket' : 'Update Ticket',
            details: `${viewMode === 'create' ? 'Issued' : 'Updated'} ticket PNR ${result.pnr} (Net: $${result.netAmount}) under invoice ${result.id}`,
          }),
        });

        // Reset and reload
        setViewMode('list');
        setSelectedInvoice(null);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save ticket invoice due to duplicate data.');
      }
    } catch (err) {
      console.error('Failed to submit ticket request:', err);
    }
  };

  // Void/Delete ticket invoice popup trigger
  const promptDeleteInvoice = (id: string, invoicePnr: string) => {
    setDeleteTarget({ id, pnr: invoicePnr });
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteTarget) return;
    const { id, pnr } = deleteTarget;

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Log to Audit Trail
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'HAMZE ISMAIL ALI',
            role: 'Super Admin',
            action: 'Void Invoice',
            details: `Voided and deleted ticket invoice ${id} with PNR ${pnr}`,
          }),
        });
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  // Filter application matching screenshot criteria
  const filteredInvoices = invoices.filter(inv => {
    // 1. Search Query
    const passengersString = inv.passengers.map(p => p.name).join(' ').toLowerCase();
    const matchesSearch = 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.pnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passengersString.includes(searchQuery.toLowerCase());

    // 2. Applied Sales Date (checking createdAt date or format comparison)
    const matchesSalesDate = appliedSalesDate 
      ? inv.createdAt.startsWith(appliedSalesDate) || inv.departureDate.startsWith(appliedSalesDate)
      : true;

    // 3. Applied Customer
    const matchesCustomer = appliedCustomerId 
      ? inv.customerId === appliedCustomerId 
      : true;

    // 4. Applied Status
    const matchesStatus = appliedStatus 
      ? inv.status.toLowerCase() === appliedStatus.toLowerCase() 
      : true;

    // 5. Creator User Filter (Lock to own invoices if active role is user)
    const effectiveEmail = loggedInEmail.toLowerCase() === 'admin@noble.com'
      ? (userRole === 'cashier' ? 'cashier@noble.com' : 'agent@noble.com')
      : loggedInEmail;
      
    const matchesCreator = userRole === 'user'
      ? (inv.createdBy || 'admin@noble.com').toLowerCase() === effectiveEmail.toLowerCase()
      : true;

    return matchesSearch && matchesSalesDate && matchesCustomer && matchesStatus && matchesCreator;
  });

  // Limit to selected entries count
  const paginatedInvoices = filteredInvoices.slice(0, entriesPerPage);

  // Helper to format date into readable DD-MM-YYYY
  const formatSalesDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return isoString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="tickets-registry-root" className="space-y-6">
      
      {/* Module Title Breadcrumbs Header (Matches layout in screenshot) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Manage Tickets
          </h2>
          <div className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="hover:text-slate-600 cursor-pointer" onClick={() => setViewMode('list')}>Dashboard</span>
            <span>/</span>
            <span className="text-slate-500">Tickets</span>
          </div>
        </div>

        {viewMode === 'list' && userRole !== 'cashier' && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="import-invoices-file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={() => document.getElementById('import-invoices-file')?.click()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" /> Import JSON
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" /> Export JSON
            </button>
            <button
              id="btn-add-ticket"
              onClick={enterCreateMode}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Issue New Air Ticket
            </button>
          </div>
        )}
      </div>

      {/* ----------------- SCREEN 1: LIST VIEW ----------------- */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          
          {/* Top KPI Summary Bar */}
          {(() => {
            const effectiveEmail = loggedInEmail.toLowerCase() === 'admin@noble.com'
              ? (userRole === 'cashier' ? 'cashier@noble.com' : 'agent@noble.com')
              : loggedInEmail;
            
            const userInvoices = userRole === 'user'
              ? invoices.filter(inv => (inv.createdBy || 'admin@noble.com').toLowerCase() === effectiveEmail.toLowerCase())
              : invoices;

            const totalTicketsIssued = userInvoices.length;
            const totalRevenue = userInvoices.reduce((sum, i) => sum + i.netAmount, 0);
            const totalCollected = userInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
            const totalOutstanding = userInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-l-4 border-l-blue-500">
                  <div>
                    <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider font-sans">Total Tickets Issued</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1.5 font-sans">{totalTicketsIssued}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-2">Active GDS manifests</span>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-l-4 border-l-emerald-500">
                  <div>
                    <p className="text-[10px] font-black text-slate-455 uppercase tracking-wider font-sans">Total Revenue ($ Net)</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1.5 font-sans">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-2">Gross Net Fare + Taxes</span>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-l-4 border-l-teal-500">
                  <div>
                    <p className="text-[10px] font-black text-slate-455 uppercase tracking-wider font-sans">Collected Amount ($ Paid)</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1.5 font-sans">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-2">Cleared payments settled</span>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-l-4 border-l-rose-500">
                  <div>
                    <p className="text-[10px] font-black text-slate-455 uppercase tracking-wider font-sans">Outstanding Balance ($ Due)</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1.5 font-sans">${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-2">Pending agent dues</span>
                </div>
              </div>
            );
          })()}

          {/* Floating Filter Toolbar */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Left side filters inline */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 flex-1">
              
              {/* Sales Date filter */}
              <div className="relative w-full sm:w-44">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={filterSalesDate}
                  onChange={(e) => setFilterSalesDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-2 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* Customer dropdown */}
              <select
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                className="w-full sm:w-56 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-700"
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Status dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-44 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-700"
              >
                <option value="">Select Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Refunded">Refunded</option>
              </select>

              {/* Action buttons */}
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  id="filter-apply-btn"
                  onClick={handleSearchApply}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow cursor-pointer transition-all flex items-center gap-1 text-xs font-bold"
                  title="Search & Apply Filters"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </button>
                <button
                  id="filter-reset-btn"
                  onClick={handleResetFilters}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition-all"
                  title="Reset Filter Criteria"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Right side live search & entries per page */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 shrink-0">
              
              {/* Live search input */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Live search query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* Entries count selection */}
              <div className="flex items-center gap-1.5 text-xs text-slate-550 font-semibold shrink-0">
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>/ page</span>
              </div>

            </div>

          </div>

          {/* C. Tickets Data Table with 2026 high-end specifications */}
          {loading ? (
            <div className="flex justify-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-550 font-black uppercase tracking-wider text-[10px] font-sans">
                      <th className="p-4 w-12 text-center">#</th>
                      <th className="p-4">Invoice</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">PNR</th>
                      <th className="p-4">Ticket #</th>
                      <th className="p-4">Passenger</th>
                      <th className="p-4">Sales Date</th>
                      <th className="p-4 text-right">Net</th>
                      <th className="p-4 text-right">Paid</th>
                      <th className="p-4 text-right">Due</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4">User</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold font-sans">
                    {paginatedInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="p-12 text-center text-slate-400 font-mono text-xs">
                          No matching ticket registry documents found.
                        </td>
                      </tr>
                    ) : (
                      paginatedInvoices.map((inv, index) => {
                        const statusLower = inv.status.toLowerCase();
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/80 transition-all duration-150">
                            
                            {/* Row Index */}
                            <td className="p-4 text-center text-slate-400 font-mono text-[10px] font-bold">
                              {index + 1}
                            </td>
 
                            {/* Invoice Link */}
                            <td className="p-4">
                              <button
                                onClick={() => enterViewMode(inv)}
                                className="font-mono font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200/50 hover:bg-blue-500/15 transition-all cursor-pointer text-[10px] tracking-tight"
                              >
                                #{inv.id.replace('INV-2026-', 'INVO00')}
                              </button>
                            </td>

                            {/* Customer Profile */}
                            <td className="p-4 font-extrabold text-slate-800 text-[12px]">
                              {inv.customerName}
                            </td>

                            {/* PNR Code */}
                            <td className="p-4">
                              <span className="font-mono font-black text-slate-700 tracking-wider bg-slate-100/70 border border-slate-200/60 px-2 py-0.5 rounded-md text-[11px]">
                                {inv.pnr || 'AAAAA'}
                              </span>
                            </td>

                            {/* Ticket Number */}
                            <td className="p-4 font-mono text-slate-500 text-[10px] truncate max-w-[120px]">
                              {inv.ticketNumber || '000-00000000'}
                            </td>

                            {/* Passengers list summary */}
                            <td className="p-4">
                              <span className="font-bold text-slate-800 block">
                                {inv.passengers[0]?.name || 'N/A'}
                              </span>
                              {inv.passengers.length > 1 && (
                                <span className="text-[9px] font-semibold text-slate-400 mt-0.5 block">
                                  {inv.passengers.map(p => p.name).join(', ')}
                                </span>
                              )}
                            </td>

                            {/* Sales Date / Created date formatted */}
                            <td className="p-4 font-mono text-slate-500">
                              {formatSalesDate(inv.createdAt)}
                            </td>

                            {/* Net Amount */}
                            <td className="p-4 text-right font-mono font-bold text-slate-900">
                              $ {inv.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Paid Amount */}
                            <td className="p-4 text-right font-mono text-emerald-600 font-bold">
                              $ {inv.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Due Balance */}
                            <td className={`p-4 text-right font-mono ${inv.dueAmount > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400 font-semibold'}`}>
                              $ {inv.dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Status Badge (Interactive for Cashiers and Admins) */}
                            <td className="p-4 text-center">
                              {userRole === 'user' ? (
                                statusLower === 'refunded' ? (
                                  <span style={{ fontWeight: 900 }} className="bg-indigo-100 text-indigo-850 border border-indigo-300 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg text-center shadow-sm inline-block min-w-[75px]">
                                    Refunded
                                  </span>
                                ) : statusLower === 'paid' ? (
                                  <span style={{ fontWeight: 900 }} className="bg-emerald-600 text-white border border-emerald-700 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg text-center shadow-sm inline-block min-w-[75px]">
                                    Paid
                                  </span>
                                ) : statusLower === 'partial' ? (
                                  <span style={{ fontWeight: 900 }} className="bg-amber-100 text-amber-850 border border-amber-300 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg text-center shadow-sm inline-block min-w-[75px]">
                                    Partial
                                  </span>
                                ) : (
                                  <span style={{ fontWeight: 900 }} className="bg-rose-600 text-white border border-rose-700 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg text-center shadow-sm inline-block min-w-[75px]">
                                    Unpaid
                                  </span>
                                )
                              ) : (
                                <button
                                  onClick={() => handleStatusClick(inv)}
                                  style={{ fontWeight: 900 }}
                                  className={`font-black text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg text-center shadow-sm cursor-pointer border font-sans min-w-[90px] flex items-center justify-between gap-1 focus:outline-none transition-all ${
                                    statusLower === 'refunded' ? 'bg-indigo-100 text-indigo-850 border-indigo-300 hover:bg-indigo-200' :
                                    statusLower === 'paid' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' :
                                    statusLower === 'partial' ? 'bg-amber-100 text-amber-850 border-amber-300 hover:bg-amber-200' :
                                    'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                                  }`}
                                >
                                  <span>{inv.status}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 ${
                                    (statusLower === 'paid' || statusLower === 'unpaid') ? 'text-white/90' : 'text-slate-700'
                                  }`} />
                                </button>
                              )}
                            </td>

                            {/* Ticket Creator User */}
                            <td className="p-4 text-slate-500 font-bold truncate max-w-[120px]">
                              {salesUser}
                            </td>

                            {/* Action columns styled as sleek icon actions */}
                            <td className="p-4 text-center">
                              <div className="flex justify-center items-center gap-1">
                                
                                {/* View button */}
                                <button
                                  id={`btn-view-${inv.id}`}
                                  onClick={() => enterViewMode(inv)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="View Ticket Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Edit button */}
                                <button
                                  id={`btn-edit-${inv.id}`}
                                  onClick={() => enterEditMode(inv)}
                                  className={`p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer ${userRole === 'cashier' || inv.status.toLowerCase() === 'paid' || inv.status.toLowerCase() === 'partial' ? 'hidden' : ''}`}
                                  title="Edit Ticket"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                {/* Delete button */}
                                <button
                                  id={`btn-delete-${inv.id}`}
                                  onClick={() => promptDeleteInvoice(inv.id, inv.pnr)}
                                  className={`p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ${(userRole === 'admin' || userRole === 'user') && inv.status.toLowerCase() !== 'paid' && inv.status.toLowerCase() !== 'partial' ? '' : 'hidden'}`}
                                  title="Void & Delete Ticket"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SCREEN 2: CREATE / EDIT FORM ----------------- */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Breadcrumbs and Page Title */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                <span>Dashboard</span>
                <span>/</span>
                <span>Ticket</span>
                <span>/</span>
                <span className="text-blue-600 font-bold">{viewMode === 'create' ? 'Create New Ticket' : 'Edit Ticket'}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {viewMode === 'create' ? 'Ticket Create' : 'Ticket Edit'}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel & Return
              </button>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* 12-Field Grid Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <fieldset disabled={isFormLockedForRole} className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 disabled:opacity-95">
                
                {/* Row 1 */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Customer Commission %</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={customerCommissionPercent}
                    onChange={(e) => setCustomerCommissionPercent(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Invoice Number (Auto)</label>
                  <input
                    type="text"
                    disabled
                    value={customInvoiceId}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Sales Date*</label>
                  <input
                    type="date"
                    required
                    value={salesDate}
                    onChange={(e) => setSalesDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Row 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Origin*</label>
                  <select
                    value={origin}
                    required
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Origin</option>
                    <option value="MGQ">Mogadishu-MGQ</option>
                    <option value="ADD">Addis Ababa-ADD</option>
                    <option value="NBO">Nairobi-NBO</option>
                    <option value="HGA">Hargeisa-HGA</option>
                    <option value="GGR">Garowe-GGR</option>
                    <option value="DXB">Dubai-DXB</option>
                    <option value="IST">Istanbul-IST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Ticket Trip*</label>
                  <select
                    value={tripType}
                    required
                    onChange={(e) => setTripType(e.target.value as TripType)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Ticket Trip</option>
                    <option value="One Way">One Way</option>
                    <option value="Round Trip">Round Trip</option>
                    <option value="Date Change">Date Change</option>
                    <option value="Cancellation">Cancellation</option>
                    <option value="Refund">Refund</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Departure Date*</label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Row 3 */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Destination*</label>
                  <select
                    value={destination}
                    required
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Destination</option>
                    <option value="ADD">Addis Ababa-ADD</option>
                    <option value="MGQ">Mogadishu-MGQ</option>
                    <option value="NBO">Nairobi-NBO</option>
                    <option value="HGA">Hargeisa-HGA</option>
                    <option value="GGR">Garowe-GGR</option>
                    <option value="DXB">Dubai-DXB</option>
                    <option value="IST">Istanbul-IST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Company*</label>
                  <select
                    value={bookingCompany}
                    required
                    onChange={(e) => {
                      const val = e.target.value as 'B2B' | 'SABRE' | '';
                      setBookingCompany(val);
                      if (val === 'B2B') {
                        setVendorCommissionPercent('9');
                      } else if (val === 'SABRE') {
                        setVendorCommissionPercent('7');
                      } else {
                        setVendorCommissionPercent('0');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Company</option>
                    <option value="B2B">B2B</option>
                    <option value="SABRE">SABRE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Client Account*</label>
                  <select
                    value={formCustomerId}
                    required
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormCustomerId(val);
                      const selectedCust = customers.find(c => c.id === val);
                      if (selectedCust) {
                        setCommPromptData({
                          isOpen: true,
                          normalComm: selectedCust.commissionPercent,
                          customerId: val,
                          mobile: selectedCust.mobile || '',
                          email: selectedCust.email || '',
                        });
                      }
                    }}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Client Account</option>
                    {customers.filter(c => c.name !== 'B2B' && c.name !== 'SABRE').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Vendor Commission %</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={vendorCommissionPercent}
                    onChange={(e) => setVendorCommissionPercent(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Row 4 */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Enter Mobile Number"
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">PNR*</label>
                  <input
                    type="text"
                    required
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value.toUpperCase())}
                    placeholder="Enter PNR"
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono tracking-wider uppercase text-slate-800 placeholder:text-slate-400 placeholder:normal-case focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email"
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

              </fieldset>
            </div>

            {/* List of Passengers Section */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">List of Passengers</h3>
                  <p className="text-xs text-slate-400">Add passenger profiles and configure fare/tax components per person.</p>
                </div>
                <button
                  type="button"
                  onClick={addPassenger}
                  disabled={isFormLockedForRole}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all rounded-lg font-bold text-xs cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Passenger
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                      <th className="py-2 px-1 text-center w-8">#</th>
                      <th className="py-2 px-2 w-28">Type</th>
                      <th className="py-2 px-2 w-40">Ticket Number</th>
                      <th className="py-2 px-2 min-w-[200px]">Passenger Name</th>
                      <th className="py-2 px-2 w-24 text-right">Net</th>
                      <th className="py-2 px-2 w-24 text-right">Fare</th>
                      <th className="py-2 px-2 w-24 text-right">Tax</th>
                      <th className="py-2 px-2 w-24 text-right">Refund</th>
                      <th className="py-2 px-2 w-24 text-right">Commission</th>
                      <th className="py-2 px-2 w-24 text-right">Cust Comm</th>
                      <th className="py-2 px-2 w-24 text-right">Discount</th>
                      <th className="py-2 px-2 w-28 text-right">Total Amount</th>
                      <th className="py-2 px-1 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((passenger, index) => {
                      const fare = tripType === 'Refund' ? 0 : (Number(passenger.fare) || Number(passenger.net) || 0);
                      const net = tripType === 'Refund' ? 0 : (Number(passenger.net) || (fare + (Number(passenger.tax) || 0)));
                      const tax = tripType === 'Refund' ? 0 : (net - fare);
                      const refund = Number(passenger.refund) || 0;

                      const commission = tripType === 'Refund' ? 0 : Math.round(fare * (Number(vendorCommissionPercent) / 100) * 100) / 100;
                      const custComm = tripType === 'Refund' ? 0 : (passenger.custComm !== undefined ? passenger.custComm : 0);
                      const discount = tripType === 'Refund' ? 0 : Math.round(fare * (Number(customerCommissionPercent) / 100) * 100) / 100;
                      const total = tripType === 'Refund' ? refund : Math.round((net - discount + custComm) * 100) / 100;

                      return (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-1 text-center font-mono text-xs text-slate-400 font-bold">
                            {index + 1}
                          </td>
                          <td className="py-3 px-2">
                            <select
                              disabled={isFormLockedForRole}
                              value={passenger.type}
                              onChange={(e) => updatePassenger(index, 'type', e.target.value as any)}
                              className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded text-xs text-slate-800 focus:outline-none"
                            >
                              <option value="Adult">Adult</option>
                              <option value="Child">Child</option>
                              <option value="Infant">Infant</option>
                            </select>
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              disabled={isFormLockedForRole}
                              placeholder="Ticket Number"
                              value={passenger.ticketNumber || ''}
                              onChange={(e) => updatePassenger(index, 'ticketNumber', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              disabled={isFormLockedForRole}
                              placeholder="Passenger Name"
                              required
                              value={passenger.name}
                              onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="number"
                              step="any"
                              disabled={isFormLockedForRole || tripType === 'Refund'}
                              min="0"
                              value={tripType === 'Refund' ? 0 : (passenger.net ?? (Number(passenger.fare) + (Number(passenger.tax) || 0)))}
                              onChange={(e) => updatePassenger(index, 'net', Number(e.target.value) || 0)}
                              className={`w-full border px-2 py-1.5 rounded text-xs font-mono text-right font-bold ${
                                tripType === 'Refund'
                                  ? 'bg-slate-50 border-slate-200 text-slate-450'
                                  : 'bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500'
                              }`}
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="number"
                              step="any"
                              disabled={isFormLockedForRole || tripType === 'Refund'}
                              min="0"
                              value={tripType === 'Refund' ? 0 : (passenger.fare ?? 0)}
                              onChange={(e) => updatePassenger(index, 'fare', Number(e.target.value) || 0)}
                              className={`w-full border px-2 py-1.5 rounded text-xs font-mono text-right font-bold ${
                                tripType === 'Refund'
                                  ? 'bg-slate-50 border-slate-200 text-slate-450'
                                  : 'bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500'
                              }`}
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="text"
                              disabled
                              value={tax.toFixed(2)}
                              className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-xs font-mono text-right text-slate-500 font-bold"
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="number"
                              step="any"
                              disabled={isFormLockedForRole || tripType !== 'Refund'}
                              min="0"
                              value={passenger.refund ?? 0}
                              onChange={(e) => updatePassenger(index, 'refund', Number(e.target.value) || 0)}
                              className={`w-full border px-2 py-1.5 rounded text-xs font-mono text-right font-bold ${
                                tripType !== 'Refund'
                                  ? 'bg-slate-50 border-slate-200 text-slate-450'
                                  : 'bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500'
                              }`}
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="text"
                              disabled
                              value={commission.toFixed(2)}
                              className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-xs font-mono text-right text-slate-500 font-bold"
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="number"
                              step="any"
                              disabled={isFormLockedForRole || tripType === 'Refund'}
                              min="0"
                              value={tripType === 'Refund' ? 0 : custComm}
                              onChange={(e) => updatePassenger(index, 'custComm', Number(e.target.value) || 0)}
                              className={`w-full border px-2 py-1.5 rounded text-xs font-mono text-right font-bold ${
                                tripType === 'Refund'
                                  ? 'bg-slate-50 border-slate-200 text-slate-450'
                                  : 'bg-white border-slate-200 text-slate-855 focus:outline-none font-bold'
                              }`}
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="text"
                              disabled
                              value={discount.toFixed(2)}
                              className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-xs font-mono text-right text-slate-500 font-bold"
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="text"
                              disabled
                              value={total.toFixed(2)}
                              className="w-full bg-slate-100 border border-slate-200 px-2 py-1.5 rounded text-xs font-mono text-right text-slate-800 font-bold"
                            />
                          </td>
                          <td className="py-3 px-1 text-center">
                            {passengers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePassenger(index)}
                                disabled={isFormLockedForRole}
                                className="text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Calculations & Summary block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Payment Settings */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">Payment Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Settled Paid Amount ($)</label>
                    <input
                      type="number"
                      step="any"
                      disabled={isFormLockedForRole || userRole === 'user'}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-slate-50 disabled:opacity-75 border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono font-bold text-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Channel</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="Cash">Cash Channel</option>
                      <option value="Bank">Bank Wire</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Card">Credit Card</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3 w-full lg:max-w-md lg:ml-auto">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Sub Total ($)</span>
                  <span className="font-mono text-slate-900 font-bold">${(parsedFare + parsedTax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Discount ($)</span>
                  <span className="font-mono text-rose-600 font-bold">-${parsedDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2.5 text-xs font-bold text-slate-800">
                  <span>Total Amount After Discount ($)</span>
                  <span className="font-mono text-slate-900 font-extrabold text-sm">${calculatedNetAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono border-t border-slate-100 pt-2">
                  <span>Customer BSP Commission ({(Number(customerCommissionPercent))}%):</span>
                  <span className="text-blue-600 font-bold">+${calculatedCustomerCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                  <span>Consolidator GDS Margin ({(Number(vendorCommissionPercent))}%):</span>
                  <span className="text-indigo-600 font-bold">+${calculatedVendorCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 border-t border-slate-100 pt-2">
                  <span>Net Profit Contribution:</span>
                  <span className="font-mono text-slate-900">${calculatedProfit.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 pt-2.5 text-slate-900">
                  <span className="font-bold text-xs text-slate-500">Outstanding Debt</span>
                  <span className={`font-mono font-extrabold text-sm ${calculatedDueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ${calculatedDueAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={!isFormValid}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
              >
                <Calculator className="w-4 h-4" /> 
                {viewMode === 'create' ? 'ISSUE AIR TICKET LEDGER' : 'SAVE EDITED TICKET ENTRY'}
              </button>
              
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Discard & Return
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ----------------- SCREEN 3: DETAILED VIEW PANEL ----------------- */}
      {viewMode === 'view' && selectedInvoice && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 space-y-6 max-w-4xl mx-auto">
          
          {/* Top Banner Control Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">GDS Verification Ledger</span>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="font-extrabold text-slate-900 text-lg font-mono">
                  #{selectedInvoice.id.replace('INV-2026-', 'INVO00')}
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  selectedInvoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  selectedInvoice.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  selectedInvoice.status === 'Refunded' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                  'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Print Document
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Registry
              </button>
            </div>
          </div>

          {/* Ticket Information Card - Double Paper A4 Split Height */}
          <div id="boarding-pass-display" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-slate-700 print:border-0 print:shadow-none print:p-0 print:bg-white print:text-black">
            
            {/* Copy 1 (Top Half) */}
            <div className="space-y-3 text-[11px] text-slate-700 print:text-black">
              {/* 1. Brand Logo Header */}
              <div className="flex justify-center border-b border-slate-150 pb-2.5 print:border-slate-300">
                <img 
                  src={logoImg} 
                  alt="Noble & Ethiopian Airlines Logo" 
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '155px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>

              {/* 2. Header Grid Section */}
              <div className="grid grid-cols-3 gap-3 items-start border-b border-slate-150 pb-3 print:border-slate-300">
                {/* Left Column: Customer details */}
                <div className="space-y-1 text-xs text-slate-700 print:text-black leading-snug">
                  <div>
                    <span className="font-bold text-slate-500">Customer: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedInvoice.customerName || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Airline: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedInvoice.airline || '-'} Portal</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">PNR: </span>
                    <span className="font-mono font-bold text-blue-600 print:text-blue-700">{selectedInvoice.pnr || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Destination: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedInvoice.origin || '-'} to {selectedInvoice.destination || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">By : </span>
                    <span className="font-bold text-slate-900 print:text-black">{salesUser}</span>
                  </div>
                </div>

                {/* Center: QR Code */}
                <div className="flex justify-center items-center h-full">
                  <div className="border border-slate-100 p-1.5 rounded-xl bg-white shadow-sm print:shadow-none print:border-slate-200">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Invoice:${selectedInvoice.customInvoiceId || selectedInvoice.id}`} 
                      alt="Invoice QR Code" 
                      className="w-20 h-20 object-contain" 
                    />
                  </div>
                </div>

                {/* Right Column: Invoice metadata */}
                <div className="text-right space-y-1 text-xs text-slate-700 print:text-black leading-snug">
                  <div>
                    <span className="font-bold text-slate-500">Invoice Number: </span>
                    <span className="font-bold text-slate-900 print:text-black font-mono">{selectedInvoice.customInvoiceId || `#${selectedInvoice.id}`}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Issue Date: </span>
                    <span className="font-bold text-slate-900 print:text-black font-mono">
                      {((selectedInvoice as any).salesDate || (selectedInvoice.createdAt ? selectedInvoice.createdAt.split('T')[0] : 'N/A')).split('-').reverse().join('-')}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Invoice Status: </span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-0.5 print:border print:bg-white ${
                      selectedInvoice.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 print:text-emerald-800'
                        : selectedInvoice.status === 'Partial'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 print:text-amber-800'
                        : 'bg-rose-50 text-rose-700 border-rose-200 print:text-rose-800'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  {selectedInvoice.paymentMethod && (
                    <div className="mt-0.5">
                      <span className="font-bold text-slate-500">Account Type: </span>
                      <span className="font-bold text-slate-900 print:text-black uppercase font-mono text-xs">
                        {selectedInvoice.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Ticket / Passenger Table */}
              <div className="space-y-1">
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm print:shadow-none print:border-slate-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] print:bg-slate-100">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Ticket Number</th>
                        <th className="py-2 px-3">Passenger Name</th>
                        <th className="py-2 px-3 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.passengers.map((p, idx) => {
                        const isRefund = selectedInvoice.tripType === 'Refund';
                        const numP = selectedInvoice.passengers.length || 1;
                        const defaultFare = (selectedInvoice.baseFare || 0) / numP;
                        const defaultTax = (selectedInvoice.tax || 0) / numP;
                        const pFare = p.fare !== undefined && p.fare !== 0 ? (Number(p.fare) || 0) : defaultFare;
                        const pTax = p.tax !== undefined && p.tax !== 0 ? (Number(p.tax) || 0) : defaultTax;
                        const pNet = p.net !== undefined && p.net !== 0 ? (Number(p.net) || 0) : (pFare + pTax);
                        const passengerTotal = isRefund ? (p.refund ?? 0) : pNet;
                        return (
                          <tr key={idx} className="border-b border-slate-100 print:border-slate-200">
                            <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-700">{p.type}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.ticketNumber || selectedInvoice.ticketNumber || '-'}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 uppercase">{p.name}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              $ {passengerTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Bottom Summary Block and Footer Branding */}
              <div className="flex flex-col space-y-3 pt-1">
                <div className="flex justify-end">
                  <div className="w-full max-w-[260px] bg-slate-50/50 border border-slate-150 p-3 rounded-xl space-y-1 text-right shadow-sm print:bg-white print:border-slate-250 print:shadow-none">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Discount:</span>
                      <span className="font-mono font-bold text-rose-600">$ {selectedInvoice.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-1.5 print:border-slate-300">
                      <span className="font-bold text-slate-900">Total:</span>
                      <span className="font-mono font-black text-slate-900 text-sm">$ {selectedInvoice.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-450 font-sans pt-2 border-t border-slate-150 print:border-slate-200 gap-4">
                  <span className="max-w-[75%] text-left block leading-relaxed">
                    Located in Hargeisa, Somaliland, you can find the Deero Mall on Presidential Road in the 26June neighborhood. Contact information is provided as: Line +252 2 528445, Telephone # +252 63 4855950-51-52-53
                  </span>
                  <span className="font-bold text-slate-500 text-right whitespace-nowrap">Developed By ENG ABDULKANI MOHAMED</span>
                </div>
              </div>
            </div>

            {/* Dashed Cut Line Divider Between Copies */}
            <div className="border-b border-dashed border-slate-300 my-4 print:my-3"></div>

            {/* Copy 2 (Bottom Half) */}
            <div className="space-y-3 text-[11px] text-slate-700 print:text-black">
              {/* 1. Brand Logo Header */}
              <div className="flex justify-center border-b border-slate-150 pb-2.5 print:border-slate-300">
                <img 
                  src={logoImg} 
                  alt="Noble & Ethiopian Airlines Logo" 
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '155px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>

              {/* 2. Header Grid Section */}
              <div className="grid grid-cols-3 gap-3 items-start border-b border-slate-150 pb-3 print:border-slate-300">
                {/* Left Column: Customer details */}
                <div className="space-y-1 text-xs text-slate-700 print:text-black leading-snug">
                  <div>
                    <span className="font-bold text-slate-500">Customer: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedInvoice.customerName || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Airline: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedInvoice.airline || '-'} Portal</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">PNR: </span>
                    <span className="font-mono font-bold text-blue-600 print:text-blue-700">{selectedInvoice.pnr || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Destination: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedInvoice.origin || '-'} to {selectedInvoice.destination || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">By : </span>
                    <span className="font-bold text-slate-900 print:text-black">{salesUser}</span>
                  </div>
                </div>

                {/* Center: QR Code */}
                <div className="flex justify-center items-center h-full">
                  <div className="border border-slate-100 p-1.5 rounded-xl bg-white shadow-sm print:shadow-none print:border-slate-200">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Invoice:${selectedInvoice.customInvoiceId || selectedInvoice.id}`} 
                      alt="Invoice QR Code" 
                      className="w-20 h-20 object-contain" 
                    />
                  </div>
                </div>

                {/* Right Column: Invoice metadata */}
                <div className="text-right space-y-1 text-xs text-slate-700 print:text-black leading-snug">
                  <div>
                    <span className="font-bold text-slate-500">Invoice Number: </span>
                    <span className="font-bold text-slate-900 print:text-black font-mono">{selectedInvoice.customInvoiceId || `#${selectedInvoice.id}`}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Issue Date: </span>
                    <span className="font-bold text-slate-900 print:text-black font-mono">
                      {((selectedInvoice as any).salesDate || (selectedInvoice.createdAt ? selectedInvoice.createdAt.split('T')[0] : 'N/A')).split('-').reverse().join('-')}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Invoice Status: </span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-0.5 print:border print:bg-white ${
                      selectedInvoice.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 print:text-emerald-800'
                        : selectedInvoice.status === 'Partial'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 print:text-amber-800'
                        : 'bg-rose-50 text-rose-700 border-rose-200 print:text-rose-800'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  {selectedInvoice.paymentMethod && (
                    <div className="mt-0.5">
                      <span className="font-bold text-slate-500">Account Type: </span>
                      <span className="font-bold text-slate-900 print:text-black uppercase font-mono text-xs">
                        {selectedInvoice.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Ticket / Passenger Table */}
              <div className="space-y-1">
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm print:shadow-none print:border-slate-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] print:bg-slate-100">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Ticket Number</th>
                        <th className="py-2 px-3">Passenger Name</th>
                        <th className="py-2 px-3 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.passengers.map((p, idx) => {
                        const isRefund = selectedInvoice.tripType === 'Refund';
                        const numP = selectedInvoice.passengers.length || 1;
                        const defaultFare = (selectedInvoice.baseFare || 0) / numP;
                        const defaultTax = (selectedInvoice.tax || 0) / numP;
                        const pFare = p.fare !== undefined && p.fare !== 0 ? (Number(p.fare) || 0) : defaultFare;
                        const pTax = p.tax !== undefined && p.tax !== 0 ? (Number(p.tax) || 0) : defaultTax;
                        const pNet = p.net !== undefined && p.net !== 0 ? (Number(p.net) || 0) : (pFare + pTax);
                        const passengerTotal = isRefund ? (p.refund ?? 0) : pNet;
                        return (
                          <tr key={idx} className="border-b border-slate-100 print:border-slate-200">
                            <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-700">{p.type}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.ticketNumber || selectedInvoice.ticketNumber || '-'}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 uppercase">{p.name}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              $ {passengerTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Bottom Summary Block and Footer Branding */}
              <div className="flex flex-col space-y-3 pt-1">
                <div className="flex justify-end">
                  <div className="w-full max-w-[260px] bg-slate-50/50 border border-slate-150 p-3 rounded-xl space-y-1 text-right shadow-sm print:bg-white print:border-slate-250 print:shadow-none">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Discount:</span>
                      <span className="font-mono font-bold text-rose-600">$ {selectedInvoice.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-1.5 print:border-slate-300">
                      <span className="font-bold text-slate-900">Total:</span>
                      <span className="font-mono font-black text-slate-900 text-sm">$ {selectedInvoice.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-450 font-sans pt-2 border-t border-slate-150 print:border-slate-200 gap-4">
                  <span className="max-w-[75%] text-left block leading-relaxed">
                    Located in Hargeisa, Somaliland, you can find the Deero Mall on Presidential Road in the 26June neighborhood. Contact information is provided as: Line +252 2 528445, Telephone # +252 63 4855950-51-52-53
                  </span>
                  <span className="font-bold text-slate-500 text-right whitespace-nowrap">Developed By ENG ABDULKANI MOHAMED</span>
                </div>
              </div>
            </div>

          </div>

          {userRole !== 'cashier' && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => enterEditMode(selectedInvoice)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Pencil className="w-4 h-4" /> Edit Ticket Settings
              </button>
            </div>
          )}

        </div>
      )}

      {/* Add Payment Modal */}
      {isAddPaymentModalOpen && paymentInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-lg w-full relative animate-in fade-in zoom-in duration-200 text-left">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Add Payment</h3>
              <button 
                onClick={() => setIsAddPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Date<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Amount<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    placeholder="Enter Amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Account<span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={paymentAccount}
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-850 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Enter Account</option>
                    <option value="ZAAD">ZAAD</option>
                    <option value="EDAHAB">EDAHAB</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="WALLET">WALLET</option>
                    <option value="DAHASHIL BANK">DAHASHIL BANK</option>
                    <option value="DARASALAM BANK">DARASALAM BANK</option>
                  </select>
                  <div className="text-[9px] text-slate-400 mt-1 font-medium">
                    Create account here. <span className="text-blue-500 cursor-pointer font-semibold hover:underline">Create account</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-850 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Status<span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIAL PAID">PARTIAL PAID</option>
                  <option value="REFUND">REFUND</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter Description"
                  rows={3}
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-850 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="px-5 py-2 bg-slate-500 hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Red Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all scale-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800/60 shadow-inner">
                <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                Confirm Record Deletion
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to void and permanently delete air ticket invoice{' '}
                <strong className="text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{deleteTarget.id}</strong> (PNR:{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-mono">{deleteTarget.pnr}</strong>)?
                <br /><span className="text-xs text-rose-500 font-bold mt-2.5 inline-block">⚠️ Warning: This action cannot be undone.</span>
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteInvoice()}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-sm shadow-lg shadow-rose-600/30 cursor-pointer transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>YES, DELETE RECORD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modern Commission Choice Modal */}
      {commPromptData && commPromptData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-6">
            
            {/* Icon Header */}
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Percent className="w-6 h-6" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Customer Commission Rate</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                Apply default commission percent for this client account or keep at 0%?
              </p>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Option A: Normal Comm % */}
              <button
                type="button"
                onClick={() => {
                  setCustomerCommissionPercent(String(commPromptData.normalComm));
                  setMobileNumber(commPromptData.mobile);
                  setEmail(commPromptData.email);
                  setCommPromptData(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] text-white p-4 rounded-2xl transition-all shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer border border-blue-700"
              >
                <span className="text-xl font-black font-mono tracking-tight">{commPromptData.normalComm}%</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider">Use Normal %</span>
              </button>

              {/* Option B: Keeping 0% */}
              <button
                type="button"
                onClick={() => {
                  setCustomerCommissionPercent('0');
                  setMobileNumber(commPromptData.mobile);
                  setEmail(commPromptData.email);
                  setCommPromptData(null);
                }}
                className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-750 hover:scale-[1.02] active:scale-[0.98] text-slate-800 dark:text-slate-200 p-4 rounded-2xl transition-all border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-xl font-black font-mono tracking-tight">0%</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Keep 0%</span>
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
