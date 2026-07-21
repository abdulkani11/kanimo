import { useEffect, useState } from 'react';
import { Search, RotateCcw, AlertCircle, CheckCircle, ShieldAlert, Check, X, FileText, ChevronRight } from 'lucide-react';
import { RefundRequest, TicketInvoice } from '../types';

export default function Refunds() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Refund request inputs
  const [invoiceId, setInvoiceId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');

  // Success indicator
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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

  // Filter lists
  const filteredRefunds = refunds.filter(r => {
    return r.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.passengerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div id="refunds-module" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: File Return Request (1 column) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 h-fit">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-900 text-sm">Initiate Refund</h4>
          <p className="text-slate-400 text-xs">File ticket return claims under BSP rules</p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 font-mono">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitRefundRequest} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Air Invoice</label>
            <select
              value={invoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
            >
              {invoices.length === 0 ? (
                <option value="">No invoices in ledger</option>
              ) : (
                invoices.map(i => (
                  <option key={i.id} value={i.id}>{i.id} - PNR: {i.pnr} (${i.netAmount})</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Refund Amount ($)</label>
            <input
              type="number"
              required
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Usually defaults to full invoice price unless fine adjustments are required by the airline.</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason for Claim</label>
            <textarea
              value={reason}
              required
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., flight cancellation, schedule mismatch, customer disruption..."
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none font-sans h-20 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm text-xs mt-2"
          >
            File Refund Claim
          </button>
        </form>
      </div>

      {/* Right Column: Active Claims Registry (2 columns) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 flex flex-col justify-between h-[520px]">
        <div>
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="font-bold text-slate-900 text-sm">Refund Claim Board</h4>
            <p className="text-slate-400 text-xs">Verify ticket returns and approve disbursements</p>
          </div>

          {/* Claim Filters */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice number, ticket ID, passenger name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>
        </div>

        {/* Scrollable board lists */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredRefunds.length === 0 ? (
            <p className="text-xs font-mono text-slate-400 text-center py-10">No refund requests logged.</p>
          ) : (
            filteredRefunds.map(claim => (
              <div key={claim.id} className="border border-slate-150 p-4 rounded-xl flex items-center justify-between text-xs hover:border-slate-200 transition-all bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <span className="p-2.5 bg-white text-rose-600 border border-slate-150 rounded-xl shrink-0 shadow-sm">
                    <RotateCcw className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-900">{claim.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Invoice: {claim.invoiceId}</span>
                    </div>
                    <p className="font-bold text-slate-800 mt-1">Passenger: {claim.passengerName}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Ticket: {claim.ticketNumber} • Claim Reason: {claim.reason}</p>
                    
                    {claim.approvedBy && (
                      <span className="text-[9px] font-mono font-bold text-emerald-600 mt-1 block">Approved securely by {claim.approvedBy}</span>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2 shrink-0">
                  <span className="font-mono font-extrabold text-slate-950 text-sm block">${claim.refundAmount.toLocaleString()}</span>
                  
                  {claim.status === 'Pending' ? (
                    /* Control triggers for Admin Approval */
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleProcessRefund(claim.id, 'Refunded')}
                        className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer font-bold flex items-center gap-1 text-[9px]"
                        title="Approve Claim"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleProcessRefund(claim.id, 'Rejected')}
                        className="p-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer font-bold flex items-center gap-1 text-[9px]"
                        title="Reject Claim"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      claim.status === 'Refunded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {claim.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
