import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, TrendingUp, Tag, Ticket, RotateCcw, Search, Clock, FileText, ChevronDown, Printer 
} from 'lucide-react';
import HeaderLogo from './HeaderLogo';

interface InvoicePassenger {
  name: string;
  type: string;
  passportNumber?: string;
  fare?: number;
  tax?: number;
  net?: number;
  refund?: number;
  discount?: number;
  custComm?: number;
}

interface InvoiceRecord {
  id: string;
  pnr?: string;
  ticketNumber?: string;
  customerId: string;
  customerName: string;
  tripType: string;
  airline?: string;
  baseFare?: number;
  tax?: number;
  discount?: number;
  vendorCommission?: number;
  customerCommission?: number;
  netAmount: number;
  status: string;
  salesDate: string;
  createdAt: string;
  passengers?: InvoicePassenger[];
}

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  mobile: string;
  companyName: string;
  balance: number;
}

interface ClientInvoiceProps {
  onActivityChange?: (activity: string) => void;
}

export default function ClientInvoice({ onActivityChange }: ClientInvoiceProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onActivityChange) {
      onActivityChange('page (client invoice)');
    }
  }, [onActivityChange]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchClientInvoices();
    } else {
      setInvoices([]);
    }
  }, [selectedCustomerId]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        if (data.length > 0) {
          setSelectedCustomerId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const fetchClientInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const allInvoices: InvoiceRecord[] = await res.json();
        // Filter by selected customer
        const clientInvs = allInvoices.filter(inv => inv.customerId === selectedCustomerId);
        setInvoices(clientInvs);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Filter invoices by selected timeframe
  const getFilteredInvoices = () => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time
    const today = new Date(todayStr);

    return invoices.filter(inv => {
      if (!inv.salesDate) return false;
      const invDate = new Date(inv.salesDate);
      const diffTime = today.getTime() - invDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeframe === 'daily') {
        return inv.salesDate === todayStr;
      } else if (timeframe === 'weekly') {
        return diffDays >= 0 && diffDays <= 7;
      } else if (timeframe === 'monthly') {
        return diffDays >= 0 && diffDays <= 30;
      }
      return true;
    });
  };

  const filteredInvoices = getFilteredInvoices();

  // Metrics calculations
  const totalNet = filteredInvoices.reduce((sum, inv) => {
    return sum + (Number(inv.netAmount) || 0);
  }, 0);

  const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.discount) || 0), 0);
  const ticketsCount = filteredInvoices.filter(inv => inv.tripType !== 'Refund').length;
  const refundsCount = filteredInvoices.filter(inv => inv.tripType === 'Refund').length;

  return (
    <div className="space-y-6">
      {/* Top Selector Card */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Client Selection */}
          <div className="flex-1 space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Select Client Account</label>
            <div className="relative">
              <Users className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-10 pr-10 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer appearance-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.companyName || 'Corporate Client'}) - ID: {c.id}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Timeframe Toggle */}
          <div className="space-y-1.5 shrink-0">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Filter Timeframe</label>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-750">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  timeframe === 'daily'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe('weekly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Bento Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Amount card */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Net Amount</h4>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
              ${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Discounts card */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Discounts Given</h4>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
              ${totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Tickets Billed card */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Tickets Billed</h4>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
              {ticketsCount} {ticketsCount === 1 ? 'Ticket' : 'Tickets'}
            </p>
          </div>
        </div>

        {/* Refunds processed card */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 rounded-xl shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Refunds Processed</h4>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
              {refundsCount} {refundsCount === 1 ? 'Claim' : 'Claims'}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction changes log registry table */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Client Activity Manifest</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Transaction entries for selected period</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Print Client Invoice Dispatch Letter"
            >
              <Printer className="w-4 h-4" /> Print Letter
            </button>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search PNR, Ticket, Airline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-750">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-750 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3">Sales Date</th>
                <th className="px-4 py-3">Invoice ID</th>
                <th className="px-4 py-3">PNR</th>
                <th className="px-4 py-3">Trip Type</th>
                <th className="px-4 py-3">Airline / Route</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Net Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-750 font-semibold text-slate-750 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <span className="inline-block animate-spin mr-2">⚙️</span> Syncing transaction records...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions matched for this timeframe.
                  </td>
                </tr>
              ) : (
                filteredInvoices
                  .filter(inv => {
                    const query = searchQuery.toLowerCase();
                    return (
                      inv.id.toLowerCase().includes(query) ||
                      (inv.pnr || '').toLowerCase().includes(query) ||
                      (inv.ticketNumber || '').toLowerCase().includes(query) ||
                      (inv.airline || '').toLowerCase().includes(query)
                    );
                  })
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {inv.salesDate ? inv.salesDate.split('-').reverse().join('-') : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-blue-600 dark:text-blue-400 font-mono">
                        {inv.id}
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        {inv.pnr || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.tripType === 'Refund' 
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455' 
                            : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          {inv.tripType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>{inv.airline || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.origin} ➔ {inv.destination}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-amber-600 dark:text-amber-455">
                        -${(inv.discount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${inv.netAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250/20'
                            : inv.status === 'Partial'
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border border-amber-250/20'
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border border-rose-250/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Report Dispatch Letter (Print Media Only) */}
      <div id="client-invoice-printable-letter" className="hidden print:block font-serif text-black p-8 bg-white max-w-4xl mx-auto">
        {/* Header letterhead logo and details */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-6">
          <HeaderLogo />
          <div className="text-right font-sans">
            <h1 className="text-lg font-black uppercase tracking-wide">Client Invoice Manifest</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Official Account Dispatch</p>
          </div>
        </div>

        {/* Dispatch details metadata */}
        <div className="grid grid-cols-2 gap-8 mb-8 font-sans text-xs">
          <div className="space-y-1.5">
            <div><span className="font-bold text-slate-500 uppercase tracking-wide">Client Account:</span> <span className="font-extrabold text-slate-900">{selectedCustomer?.name || 'Unknown Client'}</span></div>
            <div><span className="font-bold text-slate-500 uppercase tracking-wide">Company Name:</span> <span className="font-bold text-slate-800">{selectedCustomer?.companyName || 'Corporate Client'}</span></div>
            <div><span className="font-bold text-slate-500 uppercase tracking-wide">Email:</span> <span className="font-bold text-slate-800 font-mono">{selectedCustomer?.email || '-'}</span></div>
          </div>
          <div className="text-right space-y-1.5">
            <div><span className="font-bold text-slate-500 uppercase tracking-wide">Selected Timeframe:</span> <span className="font-extrabold uppercase text-slate-900">{timeframe}</span></div>
            <div><span className="font-bold text-slate-500 uppercase tracking-wide">Print Date:</span> <span className="font-bold text-slate-800 font-mono">{new Date().toLocaleDateString('en-CA')}</span></div>
            <div><span className="font-bold text-slate-500 uppercase tracking-wide">Account Status:</span> <span className="font-bold text-slate-800">ACTIVE REGISTRY</span></div>
          </div>
        </div>

        {/* Narrative introduction dispatch summary */}
        <p className="text-xs leading-relaxed mb-6">
          This dispatch letter serves as the official transaction summary list for <strong>{selectedCustomer?.name || 'Selected Client'}</strong>, generated for the <strong>{timeframe}</strong> billing cycle. The financial totals, ticket volumes, discounts applied, and active manifest ledger entries are compiled below for verification and settlement processing.
        </p>

        {/* Financial Summary Bento Box */}
        <div className="grid grid-cols-4 gap-4 mb-8 font-sans text-center">
          <div className="border border-slate-350 rounded-xl p-3 bg-slate-50/50">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Net Amount</span>
            <span className="text-sm font-black text-slate-955 block mt-1">${totalNet.toFixed(2)}</span>
          </div>
          <div className="border border-slate-350 rounded-xl p-3 bg-slate-50/50">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Discounts Given</span>
            <span className="text-sm font-black text-slate-955 block mt-1">${totalDiscount.toFixed(2)}</span>
          </div>
          <div className="border border-slate-350 rounded-xl p-3 bg-slate-50/50">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Tickets Billed</span>
            <span className="text-sm font-black text-slate-955 block mt-1">{ticketsCount} Tickets</span>
          </div>
          <div className="border border-slate-350 rounded-xl p-3 bg-slate-50/50">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Refunds</span>
            <span className="text-sm font-black text-slate-955 block mt-1">{refundsCount} Claims</span>
          </div>
        </div>

        {/* Manifest table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-8 font-sans">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">Sales Date</th>
                <th className="py-2.5 px-3">Invoice ID</th>
                <th className="py-2.5 px-3">PNR</th>
                <th className="py-2.5 px-3">Trip Type</th>
                <th className="py-2.5 px-3">Airline / Route</th>
                <th className="py-2.5 px-3 text-right">Discount</th>
                <th className="py-2.5 px-3 text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2 px-3 font-mono">{inv.salesDate ? inv.salesDate.split('-').reverse().join('-') : '-'}</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{inv.id}</td>
                  <td className="py-2 px-3 font-mono">{inv.pnr || '-'}</td>
                  <td className="py-2 px-3 font-bold text-slate-750">{inv.tripType}</td>
                  <td className="py-2 px-3">{inv.airline} ({inv.origin}➔{inv.destination})</td>
                  <td className="py-2 px-3 text-right font-mono text-amber-600">-${(inv.discount || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">${inv.netAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature lines */}
        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-300 font-sans text-xs">
          <div>
            <p className="text-slate-400 font-medium">Prepared and Dispatched By:</p>
            <div className="h-10 mt-2"></div>
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-2 w-48 uppercase">Noble Travel Consultant</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 font-medium">Verified and Approved By:</p>
            <div className="h-10 mt-2"></div>
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-2 w-48 ml-auto uppercase">{selectedCustomer?.name || 'Client Representative'}</p>
          </div>
        </div>

        {/* Footer address */}
        <div className="border-t border-slate-300 pt-4 mt-8 text-center text-[9px] text-slate-400 font-mono">
          Noble Travels & Tour Agency | Deero Mall, Presidential Road, 26June, Hargeisa, Somaliland
        </div>
      </div>

      <style>{`
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
          #client-invoice-printable-letter, #client-invoice-printable-letter * {
            visibility: visible;
          }
          #client-invoice-printable-letter {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
