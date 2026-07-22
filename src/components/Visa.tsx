import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, Edit, Trash2, ArrowLeft, Printer, RefreshCw, X, Download, Upload, Calculator, FileText, DollarSign, AlertTriangle
} from 'lucide-react';
import HeaderLogo from './HeaderLogo';
import logoImg from '../assets/images/dual_airline_logo.png';

interface VisaRecord {
  id: string;
  customInvoiceId?: string;
  customerId: string;
  customerName: string;
  applicantName: string;
  passportNumber: string;
  nationality: string;
  visaType: string;
  salesDate: string;
  baseFare: number;
  tax: number;
  discount: number;
  customerCommission: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  paymentMethod: string;
  createdBy: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  commissionPercent: number;
  balance: number;
}

interface VisaProps {
  userRole: 'admin' | 'cashier' | 'user';
  loggedInEmail: string;
}

export default function Visa({ userRole, loggedInEmail }: VisaProps) {
  const salesUser = userRole === 'admin' ? 'JANE DOE (ADMIN)' : userRole === 'cashier' ? 'HAMZE ISMAIL (CASHIER)' : 'ABDI KANIM (USER)';
  const [visas, setVisas] = useState<VisaRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view-letter'>('list');
  const [selectedVisa, setSelectedVisa] = useState<VisaRecord | null>(null);
  const [deleteVisaTarget, setDeleteVisaTarget] = useState<VisaRecord | null>(null);

  // Form Fields
  const [customInvoiceId, setCustomInvoiceId] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('Somalia');
  const [visaType, setVisaType] = useState('Tourist');
  const [salesDate, setSalesDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [baseFare, setBaseFare] = useState('');
  const [tax, setTax] = useState('');
  const [discount, setDiscount] = useState('');
  const [customerCommission, setCustomerCommission] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Add Payment Modal Fields
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentVisa, setPaymentVisa] = useState<VisaRecord | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [paymentDescription, setPaymentDescription] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [appliedCustomerId, setAppliedCustomerId] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [visasRes, custRes] = await Promise.all([
        fetch('/api/visas'),
        fetch('/api/customers')
      ]);
      if (visasRes.ok && custRes.ok) {
        const vData = await visasRes.json();
        const cData = await custRes.json();
        setVisas(vData);
        setCustomers(cData);
      }
    } catch (err) {
      console.error('Error fetching visa data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedSearchQuery(searchQuery);
    setAppliedDate(filterDate);
    setAppliedCustomerId(filterCustomerId);
    setAppliedStatus(filterStatus);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setFilterCustomerId('');
    setFilterStatus('');
    setAppliedSearchQuery('');
    setAppliedDate('');
    setAppliedCustomerId('');
    setAppliedStatus('');
    setCurrentPage(1);
  };

  // Math variables
  const parsedFare = Number(baseFare) || 0;
  const parsedTax = Number(tax) || 0;
  const parsedDiscount = Number(discount) || 0;
  const parsedCustComm = Number(customerCommission) || 0;
  const subTotal = parsedFare + parsedTax;
  const calculatedNetAmount = Math.round((subTotal - parsedDiscount + parsedCustComm) * 100) / 100;
  const parsedPaidAmount = Number(paidAmount) || 0;
  const calculatedDueAmount = Math.max(0, Math.round((calculatedNetAmount - parsedPaidAmount) * 100) / 100);

  const enterCreateMode = () => {
    setSelectedVisa(null);
    setFormCustomerId('');
    setApplicantName('');
    setPassportNumber('');
    setNationality('Somalia');
    setVisaType('Tourist');
    setSalesDate(new Date().toLocaleDateString('en-CA'));
    setBaseFare('');
    setTax('');
    setDiscount('');
    setCustomerCommission('');
    setPaidAmount('');
    setPaymentMethod('');

    // Generate Auto Custom ID
    const nextNum = visas.length > 0 ? Math.max(...visas.map(v => {
      const match = (v.customInvoiceId || v.id || '').match(/\d+$/);
      return match ? Number(match[0]) : 0;
    })) + 1 : 1001;
    setCustomInvoiceId('VSA-2026-' + nextNum);

    setViewMode('create');
  };

  const enterEditMode = (v: VisaRecord) => {
    setSelectedVisa(v);
    setCustomInvoiceId(v.customInvoiceId || v.id);
    setFormCustomerId(v.customerId);
    setApplicantName(v.applicantName);
    setPassportNumber(v.passportNumber);
    setNationality(v.nationality);
    setVisaType(v.visaType);
    setSalesDate(new Date().toLocaleDateString('en-CA')); // Always make date today as requested
    setBaseFare(String(v.baseFare));
    setTax(String(v.tax));
    setDiscount(String(v.discount));
    setCustomerCommission(String(v.customerCommission));
    setPaidAmount(String(v.paidAmount));
    setPaymentMethod(v.paymentMethod || '');
    setViewMode('edit');
  };

  const enterViewLetterMode = (v: VisaRecord) => {
    setSelectedVisa(v);
    setViewMode('view-letter');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId || !applicantName) return;

    const payload = {
      customInvoiceId,
      customerId: formCustomerId,
      applicantName,
      passportNumber,
      nationality,
      visaType,
      salesDate,
      baseFare: parsedFare,
      tax: parsedTax,
      discount: parsedDiscount,
      customerCommission: parsedCustComm,
      paidAmount: Number(paidAmount) || 0,
      paymentMethod,
      createdBy: loggedInEmail
    };

    try {
      let res;
      if (viewMode === 'create') {
        res = await fetch('/api/visas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/visas/${selectedVisa?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        // Log Audit Trail
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: loggedInEmail,
            role: userRole === 'admin' ? 'Super Admin' : 'Finance Cashier',
            action: viewMode === 'create' ? 'Visa Issuance' : 'Visa Update',
            details: `${viewMode === 'create' ? 'Issued' : 'Updated'} visa record for ${applicantName} under ID ${customInvoiceId}`
          })
        });

        await fetchData();
        setViewMode('list');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save visa record due to duplicate data.');
      }
    } catch (err) {
      console.error('Error submitting visa form:', err);
    }
  };

  const promptDeleteVisa = (v: VisaRecord) => {
    if (v.status === 'Paid') {
      alert('Cannot delete a Paid visa application.');
      return;
    }
    setDeleteVisaTarget(v);
  };

  const confirmDeleteVisa = async () => {
    if (!deleteVisaTarget) return;
    const v = deleteVisaTarget;

    try {
      const res = await fetch(`/api/visas/${v.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: loggedInEmail,
            role: userRole === 'admin' ? 'Super Admin' : 'Agent',
            action: 'Visa Delete',
            details: `Deleted visa record ${v.id} of passenger ${v.applicantName}`
          })
        });
        setDeleteVisaTarget(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Error deleting visa:', err);
    }
  };

  // Add Payment Flow
  const handleStatusClick = (v: VisaRecord) => {
    setPaymentVisa(v);
    setPaymentDate(new Date().toLocaleDateString('en-CA'));
    setPaymentAmount(String(v.dueAmount));
    setPaymentAccount(v.paymentMethod || '');
    setPaymentReference('');
    
    const statusUpper = (v.status || 'Unpaid').toUpperCase();
    if (statusUpper === 'PAID') setPaymentStatus('PAID');
    else if (statusUpper === 'PARTIAL') setPaymentStatus('PARTIAL PAID');
    else if (statusUpper === 'REFUNDED') setPaymentStatus('REFUND');
    else setPaymentStatus('UNPAID');

    setPaymentDescription('');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentVisa) return;

    try {
      const enteredAmt = Number(paymentAmount) || 0;
      const netAmt = paymentVisa.netAmount || 0;

      // Map status selection
      let statusMapped = 'Unpaid';
      if (paymentStatus === 'PAID') {
        if (enteredAmt < netAmt) statusMapped = 'Partial';
        else statusMapped = 'Paid';
      } else if (paymentStatus === 'PARTIAL PAID') {
        if (enteredAmt >= netAmt) statusMapped = 'Paid';
        else statusMapped = 'Partial';
      } else if (paymentStatus === 'REFUND') {
        statusMapped = 'Refunded';
      }

      // Log transaction
      const paymentRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: paymentVisa.customerId,
          invoiceId: paymentVisa.id,
          amount: enteredAmt,
          date: paymentDate,
          channel: paymentAccount,
          referenceNumber: paymentReference || ''
        })
      });

      if (!paymentRes.ok) throw new Error('Failed to record payment');

      // Update Visa record
      const updateRes = await fetch(`/api/visas/${paymentVisa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusMapped,
          paidAmount: enteredAmt,
          paymentMethod: paymentAccount || 'Cash'
        })
      });

      if (updateRes.ok) {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: loggedInEmail,
            role: userRole === 'admin' ? 'Super Admin' : 'Finance Cashier',
            action: 'Add Visa Payment',
            details: `Logged visa payment of $${enteredAmt} for ID ${paymentVisa.id} (Account: ${paymentAccount})`
          })
        });

        setIsPaymentModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Error logging payment:', err);
    }
  };

  // Filter Logic
  const filteredVisas = visas.filter((v) => {
    const matchesSearch = 
      v.id.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
      v.applicantName.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
      v.passportNumber.toLowerCase().includes(appliedSearchQuery.toLowerCase());
    
    const matchesDate = appliedDate ? v.salesDate === appliedDate : true;
    const matchesCust = appliedCustomerId ? v.customerId === appliedCustomerId : true;
    const matchesStatus = appliedStatus ? v.status.toUpperCase() === appliedStatus.toUpperCase() : true;

    const effectiveEmail = loggedInEmail.toLowerCase() === 'admin@noble.com'
      ? (userRole === 'cashier' ? 'cashier@noble.com' : 'agent@noble.com')
      : loggedInEmail;
      
    const matchesCreator = userRole === 'user'
      ? (v.createdBy || 'admin@noble.com').toLowerCase() === effectiveEmail.toLowerCase()
      : true;

    return matchesSearch && matchesDate && matchesCust && matchesStatus && matchesCreator;
  });

  // Math metrics
  const totalVisasCount = filteredVisas.length;
  const totalNetRevenue = filteredVisas.reduce((sum, v) => sum + v.netAmount, 0);
  const totalPaidAmount = filteredVisas.reduce((sum, v) => sum + v.paidAmount, 0);
  const totalOutstanding = filteredVisas.reduce((sum, v) => sum + v.dueAmount, 0);

  // Pagination bounds
  const totalPages = Math.ceil(filteredVisas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVisas = filteredVisas.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {viewMode === 'list' && (
        <>
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total Visas Registered</span>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-mono">{totalVisasCount}</p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full w-3/4"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total Net Revenue ($)</span>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-mono">
                ${totalNetRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-1/2"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Collected Amount ($)</span>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-mono">
                ${totalPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full w-2/3"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Outstanding Balance ($)</span>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 font-mono">
                ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-1/3"></div>
              </div>
            </div>
          </div>

          {/* Filtering Header panel */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative w-64">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <select
                  value={filterCustomerId}
                  onChange={(e) => setFilterCustomerId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select Status</option>
                  <option value="Paid">PAID</option>
                  <option value="Partial">PARTIAL</option>
                  <option value="Unpaid">UNPAID</option>
                </select>
                <button
                  onClick={handleApplyFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                >
                  Apply
                </button>
                <button
                  onClick={handleResetFilters}
                  className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-xl cursor-pointer transition-colors"
                  title="Reset Filter"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search applicant or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 w-52 sm:w-64 font-medium"
                  />
                </div>
                <button
                  onClick={enterCreateMode}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" /> Issue New Visa
                </button>
              </div>
            </div>
          </div>

          {/* Visa Applications Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 w-12 text-center">#</th>
                    <th className="py-4 px-4">Invoice</th>
                    <th className="py-4 px-4">Customer</th>
                    <th className="py-4 px-4">Passport #</th>
                    <th className="py-4 px-4">Passenger / Applicant</th>
                    <th className="py-4 px-4">Visa Type</th>
                    <th className="py-4 px-4">Sales Date</th>
                    <th className="py-4 px-4 text-right">Net</th>
                    <th className="py-4 px-4 text-right">Paid</th>
                    <th className="py-4 px-4 text-right">Due</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-xs text-slate-400 font-bold">
                        <span className="inline-block animate-spin mr-2">⚙️</span> Loading Visa registry...
                      </td>
                    </tr>
                  ) : paginatedVisas.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-xs text-slate-400 font-bold">
                        No Visa records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedVisas.map((v, index) => {
                      const absoluteIndex = startIndex + index + 1;
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 text-slate-700 dark:text-slate-200 text-xs">
                          <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">{absoluteIndex}</td>
                          <td className="py-4 px-4 font-mono font-bold">
                            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                              {v.customInvoiceId || v.id}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">{v.customerName}</td>
                          <td className="py-4 px-4 font-mono font-bold">{v.passportNumber}</td>
                          <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">{v.applicantName}</td>
                          <td className="py-4 px-4 uppercase font-bold text-slate-500 dark:text-slate-400">{v.visaType}</td>
                          <td className="py-4 px-4 font-mono font-bold">
                            {v.salesDate.split('-').reverse().join('-')}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            ${v.netAmount.toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${v.paidAmount.toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            ${v.dueAmount.toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => (userRole === 'admin' || userRole === 'cashier') && handleStatusClick(v)}
                              disabled={userRole === 'user'}
                              className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all border shadow-sm ${
                                v.status === 'Paid'
                                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                  : v.status === 'Partial'
                                  ? 'bg-amber-100 text-amber-850 border-amber-300 hover:bg-amber-200'
                                  : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                              } ${(userRole === 'admin' || userRole === 'cashier') ? 'cursor-pointer' : ''}`}
                            >
                              {v.status === 'Partial' ? 'PARTIAL v' : v.status === 'Paid' ? 'PAID v' : 'UNPAID v'}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => enterViewLetterMode(v)}
                                className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                title="View/Print Invoice Letter"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {v.status !== 'Paid' && v.status !== 'Partial' && (
                                <button
                                  onClick={() => enterEditMode(v)}
                                  className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-450 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                  title="Edit Visa details"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {v.status !== 'Paid' && v.status !== 'Partial' && (
                                <button
                                  onClick={() => promptDeleteVisa(v)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                  title="Delete Visa record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredVisas.length)} of {filteredVisas.length} records
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-350 rounded-xl text-xs font-bold disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-250 font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-350 rounded-xl text-xs font-bold disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create or Edit Visa application Form */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Header Card */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {viewMode === 'create' ? 'Issue New Visa Application' : 'Edit Visa Application Details'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure customer account, applicant passport details, base fare, tax, discounts, and payment settlements.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel & Return
            </button>
          </div>

          {/* Section 1: Visa Document & Applicant Metadata */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wide">
                Visa Document & Applicant Metadata
              </h3>
            </div>
            
            <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {/* Row 1 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Invoice Number (Auto)</label>
                <input
                  type="text"
                  disabled
                  value={customInvoiceId}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Client Account*</label>
                <select
                  required
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Account</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Sales Date*</label>
                <input
                  type="date"
                  required
                  value={salesDate}
                  onChange={(e) => setSalesDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">By Sales User</label>
                <input
                  type="text"
                  disabled
                  value={salesUser}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Applicant Full Name*</label>
                <input
                  type="text"
                  required
                  placeholder="Enter passport applicant name"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Passport Number*</label>
                <input
                  type="text"
                  required
                  placeholder="Enter passport number"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Nationality*</label>
                <input
                  type="text"
                  required
                  placeholder="Enter applicant nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Visa Type*</label>
                <select
                  required
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Tourist">Tourist Visa</option>
                  <option value="Business">Business Visa</option>
                  <option value="Student">Student Visa</option>
                  <option value="Work">Work Visa</option>
                  <option value="Transit">Transit Visa</option>
                </select>
              </div>
            </fieldset>
          </div>

          {/* Section 2: Visa Pricing & Financial Calculations */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wide">
                Visa Fare & Commission Components
              </h3>
            </div>

            <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Base Fare ($)*</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={baseFare}
                  onChange={(e) => setBaseFare(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tax ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Discount ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Customer Comm ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={customerCommission}
                  onChange={(e) => setCustomerCommission(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-mono font-bold text-blue-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </fieldset>
          </div>

          {/* Section 3: Financial Calculations & Summary Block */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Payment Details */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-4">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs border-b border-slate-100 dark:border-slate-700 pb-2 uppercase tracking-wide">
                Payment Details & Settlement
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Settled Paid Amount ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-mono font-bold text-emerald-600 dark:text-emerald-450 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Payment Channel / Account</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose Account</option>
                    <option value="ZAAD">ZAAD</option>
                    <option value="EDAHAB">EDAHAB</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="WALLET">WALLET</option>
                    <option value="DAHASHIL BANK">DAHASHIL BANK</option>
                    <option value="DARASALAM BANK">DARASALAM BANK</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-3 w-full lg:max-w-md lg:ml-auto">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Sub Total ($)</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Discount ($)</span>
                <span className="font-mono text-rose-600 font-bold">-${parsedDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Customer Comm ($)</span>
                <span className="font-mono text-blue-600 font-bold">+${parsedCustComm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-slate-200 dark:border-slate-700 pt-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Total Amount After Discount ($)</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-black text-sm">${calculatedNetAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                <span>Settled Paid Amount ($)</span>
                <span className="font-mono text-emerald-600 font-bold">${parsedPaidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-2.5 text-slate-900 dark:text-slate-100">
                <span className="font-bold text-xs text-slate-500 dark:text-slate-400">Outstanding Debt ($)</span>
                <span className={`font-mono font-extrabold text-sm ${calculatedDueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${calculatedDueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="submit"
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
            >
              <Calculator className="w-4 h-4" /> 
              {viewMode === 'create' ? 'ISSUE VISA RECORD' : 'SAVE EDITED VISA ENTRY'}
            </button>
            
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Discard & Return
            </button>
          </div>

        </form>
      )}

      {/* Printable Visa Receipt view-letter mode */}
      {viewMode === 'view-letter' && selectedVisa && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500 text-xs">GDS VERIFICATION LEDGER</span>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">#{selectedVisa.customInvoiceId || selectedVisa.id}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                selectedVisa.status === 'Paid' ? 'bg-emerald-600 text-white border-emerald-700' :
                selectedVisa.status === 'Partial' ? 'bg-amber-500 text-white border-amber-600' :
                'bg-rose-600 text-white border-rose-700'
              }`}>{selectedVisa.status}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Registry
              </button>
            </div>
          </div>

          {/* Visa Information Card - Double Paper A4 Split Height */}
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
                {/* Left Column: Customer & Applicant details */}
                <div className="space-y-1 text-xs text-slate-700 print:text-black leading-snug">
                  <div>
                    <span className="font-bold text-slate-500">Customer: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedVisa.customerName || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Applicant: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedVisa.applicantName || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Passport #: </span>
                    <span className="font-mono font-bold text-blue-600 print:text-blue-700">{selectedVisa.passportNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Nationality: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedVisa.nationality || '-'}</span>
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VisaInvoice:${selectedVisa.customInvoiceId || selectedVisa.id}`} 
                      alt="Visa Invoice QR Code" 
                      className="w-20 h-20 object-contain" 
                    />
                  </div>
                </div>

                {/* Right Column: Visa Invoice metadata */}
                <div className="text-right space-y-1 text-xs text-slate-700 print:text-black leading-snug">
                  <div>
                    <span className="font-bold text-slate-500">Invoice Number: </span>
                    <span className="font-bold text-slate-900 print:text-black font-mono">{selectedVisa.customInvoiceId || `#${selectedVisa.id}`}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Issue Date: </span>
                    <span className="font-bold text-slate-900 print:text-black font-mono">
                      {selectedVisa.salesDate.split('-').reverse().join('-')}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Visa Status: </span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-0.5 print:border print:bg-white ${
                      selectedVisa.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 print:text-emerald-800'
                        : selectedVisa.status === 'Partial'
                        ? 'bg-amber-100 text-amber-800 border-amber-300 print:text-amber-800'
                        : 'bg-rose-100 text-rose-800 border-rose-300 print:text-rose-800'
                    }`}>
                      {selectedVisa.status}
                    </span>
                  </div>
                  {selectedVisa.paymentMethod && (
                    <div className="mt-0.5">
                      <span className="font-bold text-slate-500">Account Type: </span>
                      <span className="font-bold text-slate-900 print:text-black uppercase font-mono text-xs">
                        {selectedVisa.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Visa Details Table */}
              <div className="space-y-1">
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm print:shadow-none print:border-slate-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] print:bg-slate-100">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Passport Number</th>
                        <th className="py-2 px-3">Applicant Name</th>
                        <th className="py-2 px-3 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100 print:border-slate-200">
                        <td className="py-2 px-3 text-center font-mono text-slate-500">1</td>
                        <td className="py-2 px-3 font-semibold text-slate-700">Visa ({selectedVisa.visaType})</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{selectedVisa.passportNumber || '-'}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 uppercase">{selectedVisa.applicantName}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          $ {selectedVisa.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
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
                      <span className="font-mono font-bold text-rose-600">$ {selectedVisa.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-1.5 print:border-slate-300">
                      <span className="font-bold text-slate-900">Total:</span>
                      <span className="font-mono font-black text-slate-900 text-sm">$ {selectedVisa.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                {/* Left Column: Customer & Applicant details */}
                <div className="space-y-1 text-xs text-slate-700 print:text-black leading-snug">
                  <div>
                    <span className="font-bold text-slate-500">Customer: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedVisa.customerName || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Applicant: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedVisa.applicantName || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Passport #: </span>
                    <span className="font-mono font-bold text-blue-600 print:text-blue-700">{selectedVisa.passportNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Nationality: </span>
                    <span className="font-bold text-slate-900 print:text-black">{selectedVisa.nationality || '-'}</span>
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VisaInvoice:${selectedVisa.customInvoiceId || selectedVisa.id}`} 
                      alt="Visa Invoice QR Code" 
                      className="w-20 h-20 object-contain" 
                    />
                  </div>
                </div>

                {/* Right Column: Visa Invoice metadata */}
                <div className="text-right space-y-1 text-xs text-slate-700 print:text-black leading-snug">
                  <div>
                    <span className="font-bold text-slate-500">Invoice Number: </span>
                    <span className="font-bold text-slate-900 print:text-black font-mono">{selectedVisa.customInvoiceId || `#${selectedVisa.id}`}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Issue Date: </span>
                    <span className="font-bold text-slate-900 print:text-black font-mono">
                      {selectedVisa.salesDate.split('-').reverse().join('-')}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Visa Status: </span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-0.5 print:border print:bg-white ${
                      selectedVisa.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 print:text-emerald-800'
                        : selectedVisa.status === 'Partial'
                        ? 'bg-amber-100 text-amber-800 border-amber-300 print:text-amber-800'
                        : 'bg-rose-100 text-rose-800 border-rose-300 print:text-rose-800'
                    }`}>
                      {selectedVisa.status}
                    </span>
                  </div>
                  {selectedVisa.paymentMethod && (
                    <div className="mt-0.5">
                      <span className="font-bold text-slate-500">Account Type: </span>
                      <span className="font-bold text-slate-900 print:text-black uppercase font-mono text-xs">
                        {selectedVisa.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Visa Details Table */}
              <div className="space-y-1">
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm print:shadow-none print:border-slate-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] print:bg-slate-100">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Passport Number</th>
                        <th className="py-2 px-3">Applicant Name</th>
                        <th className="py-2 px-3 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100 print:border-slate-200">
                        <td className="py-2 px-3 text-center font-mono text-slate-500">1</td>
                        <td className="py-2 px-3 font-semibold text-slate-700">Visa ({selectedVisa.visaType})</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{selectedVisa.passportNumber || '-'}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 uppercase">{selectedVisa.applicantName}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          $ {selectedVisa.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
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
                      <span className="font-mono font-bold text-rose-600">$ {selectedVisa.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-1.5 print:border-slate-300">
                      <span className="font-bold text-slate-900">Total:</span>
                      <span className="font-mono font-black text-slate-900 text-sm">$ {selectedVisa.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
        </div>
      )}

      {/* Add Payment Modal Dialog */}
      {isPaymentModalOpen && paymentVisa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Add Visa Payment Log</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Date*</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Amount ($)*</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Account / Channel*</label>
                <select
                  required
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Account</option>
                  <option value="ZAAD">ZAAD</option>
                  <option value="EDAHAB">EDAHAB</option>
                  <option value="CASH">CASH</option>
                  <option value="CARD">CARD</option>
                  <option value="WALLET">WALLET</option>
                  <option value="DAHASHIL BANK">DAHASHIL BANK</option>
                  <option value="DARASALAM BANK">DARASALAM BANK</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Reference Number</label>
                <input
                  type="text"
                  placeholder="Enter transaction reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Payment Status*</label>
                <select
                  required
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="PAID">PAID</option>
                  <option value="PARTIAL PAID">PARTIAL PAID</option>
                  <option value="REFUND">REFUND</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Red Delete Confirmation Modal for Visa */}
      {deleteVisaTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all scale-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800/60 shadow-inner">
                <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                Confirm Visa Deletion
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to permanently delete visa application record{' '}
                <strong className="text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{deleteVisaTarget.id}</strong> for applicant{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-bold">{deleteVisaTarget.applicantName}</strong>?
                <br /><span className="text-xs text-rose-500 font-bold mt-2.5 inline-block">⚠️ Warning: This will reverse the client ledger balance.</span>
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteVisaTarget(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteVisa()}
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
    </div>
  );
}
