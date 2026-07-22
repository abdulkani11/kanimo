import { useEffect, useState } from 'react';
import { FileText, Calendar, Users, DollarSign, Search, ShieldAlert, Sparkles, Receipt, Globe, Tag, Scale, Printer } from 'lucide-react';
// @ts-ignore
import logoImg from '../assets/images/dual_airline_logo.png';

interface Passenger {
  name: string;
}

interface TicketInvoice {
  id: string;
  ticketNumber: string;
  passengers: Passenger[];
  baseFare: number;
  netAmount: number;
  vendorCommission: number;
  customerCommission: number;
  discount?: number;
  status: string;
  createdAt: string;
  createdBy?: string;
  salesDate?: string;
  vendorName?: string;
}

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
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  createdAt: string;
  createdBy?: string;
}

interface StaffUser {
  email: string;
  role: string;
  name?: string;
}

interface DailyReportProps {
  userRole?: 'admin' | 'cashier' | 'user';
  loggedInEmail?: string;
}

export default function DailyReport({ userRole = 'admin', loggedInEmail = 'admin@noble.com' }: DailyReportProps) {
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [visas, setVisas] = useState<VisaRecord[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [reportType, setReportType] = useState<'ticket' | 'visa'>('ticket');
  
  // Filters
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayStr);
  const [endDate, setEndDate] = useState(getTodayStr);
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch invoices, visas, and staff users
  const fetchData = async () => {
    setLoading(true);
    try {
      const invoicesRes = await fetch('/api/invoices');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }

      const visasRes = await fetch('/api/visas');
      if (visasRes.ok) {
        const visasData = await visasRes.json();
        setVisas(visasData);
      }

      if (userRole === 'admin' || userRole === 'cashier') {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setStaffUsers(usersData);
        }
      }
    } catch (err) {
      console.error('Error fetching Daily Report details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  // Filtering Logic for Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const invDateStr = inv.salesDate || (inv.createdAt ? inv.createdAt.split('T')[0] : '');
    if (invDateStr < startDate || invDateStr > endDate) {
      return false;
    }

    if (selectedVendor !== 'all') {
      const v = (inv.vendorName || '').toUpperCase();
      if (selectedVendor === 'b2b') {
        const isB2B = v === 'B2B' || v === 'CONSOLIDATED FARES CORP';
        if (!isB2B) return false;
      } else if (selectedVendor === 'sabre') {
        const isSabre = v === 'SABRE' || v === 'DIRECT GDS';
        if (!isSabre) return false;
      }
    }

    const creatorEmail = (inv.createdBy || 'admin@noble.com').toLowerCase();
    if (userRole === 'admin' || userRole === 'cashier') {
      if (selectedUser !== 'all' && creatorEmail !== selectedUser.toLowerCase()) {
        return false;
      }
    } else {
      const effectiveEmail = loggedInEmail.toLowerCase();
      if (creatorEmail !== effectiveEmail.toLowerCase()) {
        return false;
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const ticketMatch = inv.ticketNumber?.toLowerCase().includes(q);
      const passengerMatch = inv.passengers?.some(p => p.name?.toLowerCase().includes(q));
      if (!ticketMatch && !passengerMatch) {
        return false;
      }
    }

    return true;
  });

  // Filtering Logic for Visas
  const filteredVisas = visas.filter((v) => {
    const visaDateStr = v.salesDate || (v.createdAt ? v.createdAt.split('T')[0] : '');
    if (visaDateStr < startDate || visaDateStr > endDate) {
      return false;
    }

    const creatorEmail = (v.createdBy || 'admin@noble.com').toLowerCase();
    if (userRole === 'admin' || userRole === 'cashier') {
      if (selectedUser !== 'all' && creatorEmail !== selectedUser.toLowerCase()) {
        return false;
      }
    } else {
      const effectiveEmail = loggedInEmail.toLowerCase();
      if (creatorEmail !== effectiveEmail.toLowerCase()) {
        return false;
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const passportMatch = v.passportNumber?.toLowerCase().includes(q);
      const applicantMatch = v.applicantName?.toLowerCase().includes(q);
      if (!passportMatch && !applicantMatch) {
        return false;
      }
    }

    return true;
  });

  // Calculate Aggregations for Tickets
  const totalTickets = filteredInvoices.length;
  const totalNet = filteredInvoices.reduce((sum, inv) => sum + (inv.netAmount || 0), 0);
  const totalVendorComm = filteredInvoices.reduce((sum, inv) => sum + (inv.vendorCommission || 0), 0);
  const totalCustComm = filteredInvoices.reduce((sum, inv) => sum + (inv.customerCommission || 0), 0);
  const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
  const totalNetRevenue = totalCustComm + totalVendorComm - totalDiscount;
  const remainBalance = totalNetRevenue - totalNet;

  // Calculate Aggregations for Visas
  const totalVisas = filteredVisas.length;
  const totalVisaNet = filteredVisas.reduce((sum, v) => sum + (v.netAmount || 0), 0);
  const totalVisaBase = filteredVisas.reduce((sum, v) => sum + (v.baseFare || 0), 0);
  const totalVisaTax = filteredVisas.reduce((sum, v) => sum + (v.tax || 0), 0);
  const totalVisaDiscount = filteredVisas.reduce((sum, v) => sum + (v.discount || 0), 0);
  const totalVisaDue = filteredVisas.reduce((sum, v) => sum + (v.dueAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Switch Buttons */}
      <div className="flex gap-3 mb-2 print:hidden">
        <button
          onClick={() => { setReportType('ticket'); setSearchQuery(''); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all border flex items-center gap-1.5 cursor-pointer ${
            reportType === 'ticket'
              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Daily Ticket Report</span>
        </button>
        <button
          onClick={() => { setReportType('visa'); setSearchQuery(''); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all border flex items-center gap-1.5 cursor-pointer ${
            reportType === 'visa'
              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Daily Visa Report</span>
        </button>
      </div>

      {/* Top filter section */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Date & User & Vendor selectors */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
              />
            </div>
          </div>

          {/* Vendor / System selector - Only for Ticket Report */}
          {reportType === 'ticket' && (
            <div className="space-y-1.5 font-sans">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Company / GDS</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer min-w-[160px]"
                >
                  <option value="all">🌐 All Vendors</option>
                  <option value="sabre">✈️ Sabre GDS</option>
                  <option value="b2b">🔗 Consolidated B2B</option>
                </select>
              </div>
            </div>
          )}

          {/* Filter Staff User */}
          {(userRole === 'admin' || userRole === 'cashier') && (
            <div className="space-y-1.5 font-sans">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Filter Staff User</label>
              <div className="relative">
                <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer min-w-[200px]"
                >
                  <option value="all">👥 All Staff Users</option>
                  {staffUsers.map((u) => (
                    <option key={u.email} value={u.email}>
                      👤 {u.name || u.email.split('@')[0].toUpperCase()} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Live Search input */}
        <div className="w-full xl:w-72 shrink-0">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Search Manifest</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={reportType === 'ticket' ? "Search by ticket # or passenger..." : "Search by passport # or applicant..."}
                className="w-full bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats Cards */}
      {reportType === 'ticket' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Tickets */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Tickets Issued</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">{totalTickets}</h4>
            </div>
          </div>

          {/* Total Net Revenue */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Net Revenue</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                $ {totalNetRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Total Vendor Commission */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Vendor Comm.</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                $ {totalVendorComm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Total Customer Commission */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-violet-600 dark:text-violet-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Customer Comm.</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                $ {totalCustComm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Total Discount */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Discount</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                $ {totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Remain */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Remain</p>
              <h4 className="text-base font-extrabold mt-0.5 font-mono text-slate-900 dark:text-white">
                $ {Math.abs(remainBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-in fade-in duration-200">
          {/* Total Visas */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Visas Issued</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">{totalVisas}</h4>
            </div>
          </div>

          {/* Total Net Amount */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Net Amount</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                $ {totalVisaNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Total Base Fare */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Base Fare</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                $ {totalVisaBase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Total Tax */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-violet-600 dark:text-violet-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Tax</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                $ {totalVisaTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Total Discount */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Discount</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                $ {totalVisaDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* Total Due */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Total Due</p>
              <h4 className="text-base font-extrabold mt-0.5 font-mono text-slate-900 dark:text-white">
                $ {totalVisaDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Table */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
              {reportType === 'ticket' ? 'Daily Ticket Manifest' : 'Daily Visa Manifest'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              {startDate === endDate ? `Reporting for ${startDate}` : `Reporting from ${startDate} to ${endDate}`}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-black px-4.5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center gap-2 text-xs font-mono tracking-wide cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print Daily Report Letter</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-750">
          <table className="w-full border-collapse text-left">
            <thead>
              {reportType === 'ticket' ? (
                <tr className="bg-[#F8FAFC] dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-750 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  <th className="px-5 py-3.5 text-center w-12">#</th>
                  <th className="px-5 py-3.5">Ticket Number</th>
                  <th className="px-5 py-3.5">Passenger Name</th>
                  <th className="px-5 py-3.5 text-right">Net Amount</th>
                  <th className="px-5 py-3.5 text-right">Vendor Comm.</th>
                  <th className="px-5 py-3.5 text-right">Customer Comm.</th>
                  <th className="px-5 py-3.5 text-right">Discount</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  {(userRole === 'admin' || userRole === 'cashier') && selectedUser === 'all' && (
                    <th className="px-5 py-3.5">Created By</th>
                  )}
                </tr>
              ) : (
                <tr className="bg-[#F8FAFC] dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-750 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  <th className="px-5 py-3.5 text-center w-12">#</th>
                  <th className="px-5 py-3.5">Passport #</th>
                  <th className="px-5 py-3.5">Applicant Name</th>
                  <th className="px-5 py-3.5">Visa Type</th>
                  <th className="px-5 py-3.5 text-right">Net Amount</th>
                  <th className="px-5 py-3.5 text-right">Base Fare</th>
                  <th className="px-5 py-3.5 text-right">Tax</th>
                  <th className="px-5 py-3.5 text-right">Discount</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  {(userRole === 'admin' || userRole === 'cashier') && selectedUser === 'all' && (
                    <th className="px-5 py-3.5">Created By</th>
                  )}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-750 text-xs font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-slate-400 font-mono text-[11px]">
                    Loading daily report manifest...
                  </td>
                </tr>
              ) : reportType === 'ticket' ? (
                filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-8 text-center text-slate-400 font-mono text-[11px]">
                      No tickets found for this date.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, index) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-3.5 text-center font-mono text-slate-400 text-[10px]">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-800 dark:text-slate-200">
                        {inv.ticketNumber || '000-00000000'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white font-bold">
                        {inv.passengers[0]?.name || 'Unknown Passenger'}
                        {inv.passengers.length > 1 && (
                          <span className="text-[9px] font-semibold text-slate-450 block mt-0.5">
                            + {inv.passengers.length - 1} more passengers
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-950 dark:text-slate-100">
                        $ {inv.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-emerald-600">
                        $ {inv.vendorCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-violet-600">
                        $ {inv.customerCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-rose-600">
                        $ {(inv.discount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {(() => {
                          const statusLower = (inv.status || 'Paid').toLowerCase();
                          if (statusLower === 'refunded') {
                            return (
                              <span className="bg-indigo-500/10 text-indigo-650 border border-indigo-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                                Refunded
                              </span>
                            );
                          } else if (statusLower === 'paid') {
                            return (
                              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                                Paid
                              </span>
                            );
                          } else if (statusLower === 'partial') {
                            return (
                              <span className="bg-amber-500/10 text-amber-650 border border-amber-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                                Partial
                              </span>
                            );
                          } else {
                            return (
                              <span className="bg-rose-500/10 text-rose-600 border border-rose-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                                Unpaid
                              </span>
                            );
                          }
                        })()}
                      </td>
                      {(userRole === 'admin' || userRole === 'cashier') && selectedUser === 'all' && (
                        <td className="px-5 py-3.5 font-mono text-slate-550 dark:text-slate-400">
                          {inv.createdBy || 'admin@noble.com'}
                        </td>
                      )}
                    </tr>
                  ))
                )
              ) : (
                filteredVisas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-8 text-center text-slate-400 font-mono text-[11px]">
                      No visas found for this date.
                    </td>
                  </tr>
                ) : (
                  filteredVisas.map((v, index) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-3.5 text-center font-mono text-slate-400 text-[10px]">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-800 dark:text-slate-200">
                        {v.passportNumber || 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white font-bold">
                        {v.applicantName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 uppercase font-mono">
                        {v.visaType}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-950 dark:text-slate-100">
                        $ {v.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-emerald-600">
                        $ {v.baseFare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-violet-600">
                        $ {v.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-rose-600">
                        $ {(v.discount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {(() => {
                          const statusLower = (v.status || 'Paid').toLowerCase();
                          if (statusLower === 'refunded') {
                            return (
                              <span className="bg-indigo-500/10 text-indigo-650 border border-indigo-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                                Refunded
                              </span>
                            );
                          } else if (statusLower === 'paid') {
                            return (
                              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                                Paid
                              </span>
                            );
                          } else if (statusLower === 'partial') {
                            return (
                              <span className="bg-amber-500/10 text-amber-650 border border-amber-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                                Partial
                              </span>
                            );
                          } else {
                            return (
                              <span className="bg-rose-500/10 text-rose-600 border border-rose-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                                Unpaid
                              </span>
                            );
                          }
                        })()}
                      </td>
                      {(userRole === 'admin' || userRole === 'cashier') && selectedUser === 'all' && (
                        <td className="px-5 py-3.5 font-mono text-slate-550 dark:text-slate-400">
                          {v.createdBy || 'admin@noble.com'}
                        </td>
                      )}
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- PRINTABLE LETTER LAYOUT ----------------- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, button, .print\\:hidden, #btn-replay-intro {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #daily-report-printable-letter, #daily-report-printable-letter * {
            visibility: visible;
          }
          #daily-report-printable-letter {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace;
          }
        }
      `}} />

      <div id="daily-report-printable-letter" className="hidden print:block text-black bg-white p-8 max-w-4xl mx-auto border border-slate-100">
        {/* Letterhead */}
        <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
          <div>
            <img 
              src={logoImg} 
              alt="Noble Travel Agency" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <div className="text-right text-xs font-mono">
            <p className="font-bold">DATE: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            <p className="text-slate-500 text-[10px] mt-0.5">REF: NT-DRP-{startDate.replace(/-/g, '')}</p>
          </div>
        </div>

        {/* Letter Title */}
        <div className="text-center my-6">
          <h2 className="text-base font-black tracking-wider uppercase border-y border-dashed border-slate-900 py-2 inline-block font-mono px-4">
            {reportType === 'ticket' ? 'Daily Ticket Dispatch & Manifest Letter' : 'Daily Visa Dispatch & Manifest Letter'}
          </h2>
        </div>

        {/* Report Scope */}
        <div className="mb-6 text-xs leading-relaxed font-mono">
          <p><strong>TO:</strong> Finance Director / Ticketing Operations</p>
          <p><strong>FROM:</strong> Noble Satellite Dispatch ({loggedInEmail})</p>
          <p className="mt-2">
            This letter serves as the official manifest settlement dispatch for {reportType === 'ticket' ? 'flight tickets' : 'visa applications'} generated during the period from <strong>{startDate}</strong> to <strong>{endDate}</strong>.
          </p>
        </div>

        {/* Financial Summary Table */}
        <div className="mb-8 font-mono">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b pb-1 text-slate-900">I. Dispatch Summary</h3>
          <table className="w-full text-xs text-left border border-slate-300">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Metric Description</th>
                <th className="p-2 text-right">Settled Amount</th>
              </tr>
            </thead>
            {reportType === 'ticket' ? (
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300">Total Tickets Issued</td>
                  <td className="p-2 text-right font-bold">{totalTickets} manifest(s)</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300">Total Vendor Commission (GDS)</td>
                  <td className="p-2 text-right font-bold">$ {totalVendorComm.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300">Total Customer Commission (Markup)</td>
                  <td className="p-2 text-right font-bold">$ {totalCustComm.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300">Total Discount Allowed</td>
                  <td className="p-2 text-right font-bold">$ {totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-b border-slate-200 bg-emerald-50/20 font-bold">
                  <td className="p-2 border-r border-slate-300">Total Net Revenue (Combined Profit)</td>
                  <td className="p-2 text-right text-emerald-700">$ {totalNetRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-indigo-50/20 font-bold">
                  <td className="p-2 border-r border-slate-300">Remain Balance (Variance)</td>
                  <td className="p-2 text-right text-indigo-700">$ {Math.abs(remainBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300">Total Visas Issued</td>
                  <td className="p-2 text-right font-bold">{totalVisas} manifest(s)</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300">Total Base Fare</td>
                  <td className="p-2 text-right font-bold">$ {totalVisaBase.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300">Total Tax</td>
                  <td className="p-2 text-right font-bold">$ {totalVisaTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300">Total Discount Allowed</td>
                  <td className="p-2 text-right font-bold">$ {totalVisaDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-b border-slate-200 bg-emerald-50/20 font-bold">
                  <td className="p-2 border-r border-slate-300">Total Net Amount</td>
                  <td className="p-2 text-right text-emerald-700">$ {totalVisaNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-indigo-50/20 font-bold">
                  <td className="p-2 border-r border-slate-300">Total Due Amount</td>
                  <td className="p-2 text-right text-indigo-700">$ {totalVisaDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {/* Manifest Details Table */}
        <div className="mb-10 font-mono">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b pb-1 text-slate-900">II. Manifest Details</h3>
          {reportType === 'ticket' ? (
            <table className="w-full text-[10px] text-left border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300">
                  <th className="p-1.5 border-r border-slate-300 text-center">#</th>
                  <th className="p-1.5 border-r border-slate-300">Ticket Number</th>
                  <th className="p-1.5 border-r border-slate-300">Passenger</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Net Amount</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Vendor Comm</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Customer Comm</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Discount</th>
                  <th className="p-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-400">No ticket records in selected date range.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, idx) => (
                    <tr key={inv.id} className="border-b border-slate-200">
                      <td className="p-1.5 border-r border-slate-300 text-center">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold">{inv.ticketNumber || '000-00000000'}</td>
                      <td className="p-1.5 border-r border-slate-300">{inv.passengers[0]?.name || 'Unknown'}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">$ {inv.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">$ {inv.vendorCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">$ {inv.customerCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">$ {(inv.discount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 font-bold uppercase">{inv.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[10px] text-left border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300">
                  <th className="p-1.5 border-r border-slate-300 text-center">#</th>
                  <th className="p-1.5 border-r border-slate-300">Passport Number</th>
                  <th className="p-1.5 border-r border-slate-300">Applicant</th>
                  <th className="p-1.5 border-r border-slate-300">Visa Type</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Net Amount</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Base Fare</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Tax</th>
                  <th className="p-1.5 border-r border-slate-300 text-right">Discount</th>
                  <th className="p-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-slate-400">No visa records in selected date range.</td>
                  </tr>
                ) : (
                  filteredVisas.map((v, idx) => (
                    <tr key={v.id} className="border-b border-slate-200">
                      <td className="p-1.5 border-r border-slate-300 text-center">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold">{v.passportNumber || 'N/A'}</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold">{v.applicantName}</td>
                      <td className="p-1.5 border-r border-slate-300">{v.visaType}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">$ {v.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">$ {v.baseFare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">$ {v.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">$ {(v.discount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 font-bold uppercase">{v.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Verification Signatures */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-xs font-mono text-center pt-8">
          <div className="space-y-12">
            <p className="border-b border-slate-900 pb-1 font-bold">{loggedInEmail}</p>
            <p className="text-[10px] text-slate-500 uppercase">Prepared By (Staff)</p>
          </div>
          <div className="space-y-12">
            <p className="border-b border-slate-900 pb-1">&nbsp;</p>
            <p className="text-[10px] text-slate-500 uppercase">Approved By (Finance Officer)</p>
          </div>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 aspect-square max-w-[120px] mx-auto text-slate-400 font-bold">
            <span className="text-[8px] uppercase">Official Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
