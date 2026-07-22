import React, { useEffect, useState } from 'react';
import { 
  Search, RotateCcw, AlertCircle, CheckCircle, Check, X, Printer, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { RefundRequest, TicketInvoice } from '../types';
import HeaderLogo from './HeaderLogo';

export default function Refunds() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'receipt'>('list');

  // Refund request inputs
  const [invoiceId, setInvoiceId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');

  // Success indicator
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/refunds').then(res => res.json()),
      fetch('/api/invoices').then(res => res.json()),
    ])
      .then(([refData, invData]) => {
        setRefunds(refData);
        setInvoices(invData);
        if (invData.length > 0) {
          setInvoiceId(invData[0].id);
          setRefundAmount(String(invData[0].netAmount));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load refunds database:', err);
        setLoading(false);
      });
  };

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const invoice = invoices.find(i => i.id === id);
    if (invoice) {
      setRefundAmount(String(invoice.netAmount));
    }
  };

  // Submit refund request
  const handleSubmitRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !refundAmount) return;

    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          refundAmount: Number(refundAmount),
          reason,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Successfully posted new ticket refund request!');
        setReason('');
        
        // Log action in Audit Trail
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Jane Doe',
            role: 'Super Admin',
            action: 'Request Refund',
            details: `Initiated refund request for invoice ${invoiceId} (Amount: $${refundAmount})`,
          }),
        });

        setTimeout(() => setSuccessMsg(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to submit refund request:', err);
    }
  };

  // Approve / Reject Refund (Super Admin Action)
  const handleProcessRefund = async (id: string, status: 'Refunded' | 'Rejected') => {
    try {
      const res = await fetch(`/api/refunds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approvedBy: 'Jane Doe',
        }),
      });

      if (res.ok) {
        // Log action
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Jane Doe',
            role: 'Super Admin',
            action: `${status === 'Refunded' ? 'Approve' : 'Reject'} Refund`,
            details: `${status === 'Refunded' ? 'Authorized' : 'Disapproved'} refund file ${id}`,
          }),
        });

        fetchData();
      }
    } catch (err) {
      console.error('Failed to process refund decision:', err);
    }
  };

  // Math periods filters for Refunded/Approved status
  const approvedRefunds = refunds.filter(r => r.status === 'Refunded');
  
  const totalAllTime = approvedRefunds.reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  const totalToday = approvedRefunds
    .filter(r => r.createdAt ? new Date(r.createdAt).getTime() >= todayStart : false)
    .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  const totalLastWeek = approvedRefunds
    .filter(r => r.createdAt ? new Date(r.createdAt).getTime() >= weekStart : false)
    .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  const totalLastMonth = approvedRefunds
    .filter(r => r.createdAt ? new Date(r.createdAt).getTime() >= monthStart : false)
    .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  // Filter list
  const filteredRefunds = refunds.filter(r => {
    const matchesSearch = 
      r.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.passengerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'pending' ? r.status === 'Pending' :
      activeTab === 'completed' ? r.status === 'Refunded' :
      r.status === 'Rejected';

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {viewMode === 'list' && (
        <>
          {/* Summary stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Refunds Today</span>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-mono">
                ${totalToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-1/4"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Refunds Last Week</span>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-mono">
                ${totalLastWeek.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-1/2"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Refunds Last Month</span>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-mono">
                ${totalLastMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-2/3"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Refunds All Time</span>
              <p className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 mt-2 font-mono">
                ${totalAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div className="bg-rose-600 h-full rounded-full w-full"></div>
              </div>
            </div>
          </div>

          <div id="refunds-module" className="w-full">
            {/* Redesigned Active Claims Registry (Table Format) */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Refund Claim Board</h4>
                  <p className="text-slate-400 dark:text-slate-450 text-xs">Verify ticket returns and approve disbursements</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                      activeTab === 'all' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-350'
                    }`}
                  >
                    All Claims
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                      activeTab === 'pending' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-350'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                      activeTab === 'completed' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-350'
                    }`}
                  >
                    Refunded
                  </button>
                </div>
              </div>

              {/* Search Claim Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by invoice, claim ID, passenger name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Table Registry */}
              <div className="border border-slate-150 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-3">Claim ID</th>
                      <th className="py-3 px-3">Invoice</th>
                      <th className="py-3 px-3">Passenger</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                      <th className="py-3 px-2 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                          <span className="inline-block animate-spin mr-2">⚙️</span> Loading claims...
                        </td>
                      </tr>
                    ) : filteredRefunds.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                          No claims registered for this tab filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRefunds.map((claim, idx) => (
                        <tr key={claim.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/10 text-slate-700 dark:text-slate-250">
                          <td className="py-4 px-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-4 px-3 font-mono font-bold">{claim.id}</td>
                          <td className="py-4 px-3 font-mono font-bold">
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
                              {claim.invoiceId}
                            </span>
                          </td>
                          <td className="py-4 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {claim.passengerName}
                            <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium font-mono mt-0.5">Ticket: {claim.ticketNumber}</p>
                          </td>
                          <td className="py-4 px-3 font-mono font-bold">
                            {claim.createdAt ? claim.createdAt.split('T')[0].split('-').reverse().join('-') : 'N/A'}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                            ${claim.refundAmount.toFixed(2)}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedRefund(claim);
                                  setViewMode('receipt');
                                }}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
                                title="Print Credit Note Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Credit Note Receipt Mode */}
      {viewMode === 'receipt' && selectedRefund && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500 text-xs">OFFICIAL REFUND CREDIT NOTE</span>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">#{selectedRefund.id}</h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-full text-[10px] font-extrabold uppercase">
                {selectedRefund.status === 'Refunded' ? 'APPROVED' : selectedRefund.status}
              </span>
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

          {/* Credit note printable block */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 max-w-3xl mx-auto text-slate-800 font-sans">
            <div className="flex justify-between items-center border-b border-slate-150 pb-8 mb-8">
              <HeaderLogo />
              <div className="text-right">
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-wide">Refund Credit Note</h1>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Noble Travels Agency</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-150 mb-8 text-xs">
              <div className="space-y-1">
                <div><span className="font-bold text-slate-500">Passenger: </span><span className="font-extrabold text-slate-900">{selectedRefund.passengerName}</span></div>
                <div><span className="font-bold text-slate-500">Ticket Number: </span><span className="font-bold text-slate-900 font-mono">{selectedRefund.ticketNumber}</span></div>
                <div><span className="font-bold text-slate-500">Reference Invoice: </span><span className="font-bold text-slate-900 font-mono">{selectedRefund.invoiceId}</span></div>
              </div>
              <div className="text-right space-y-1">
                <div><span className="font-bold text-slate-500">Claim ID: </span><span className="font-bold text-slate-900 font-mono">{selectedRefund.id}</span></div>
                <div><span className="font-bold text-slate-500">Date Logged: </span><span className="font-bold text-slate-900 font-mono">{selectedRefund.createdAt ? selectedRefund.createdAt.split('T')[0].split('-').reverse().join('-') : 'N/A'}</span></div>
                {selectedRefund.approvedBy && (
                  <div><span className="font-bold text-slate-500">Approved By: </span><span className="font-bold text-slate-900 uppercase font-mono">{selectedRefund.approvedBy}</span></div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Disbursement Item Description</th>
                    <th className="py-3 px-4 text-right w-36">Refunded Amount</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800">Voided Ticket segment returned to GDS</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Reason: {selectedRefund.reason}</p>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-extrabold text-rose-600">-${selectedRefund.refundAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-12">
              <div className="w-64 border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-xs flex justify-between items-center">
                <span className="font-bold text-slate-600">Credit Ledger Value:</span>
                <span className="font-mono text-sm font-black text-rose-600">-${selectedRefund.refundAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 text-center text-[10px] text-slate-400 font-mono space-y-1">
              <p>Located in Hargeisa, Somaliland, you can find the Deero Mall on Presidential Road in the 26June neighborhood.</p>
              <p>Contact: +252 2 528445, Telephone # +252 63 4855950 | Developed By ENG ABDULKANI MOHAMED</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
