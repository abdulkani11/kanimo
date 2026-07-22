import { useEffect, useState } from 'react';
import { Search, CreditCard, DollarSign, Wallet, ArrowDownRight, Clock, Plus, CheckCircle, ShieldAlert } from 'lucide-react';
import { TicketInvoice, PaymentRecord } from '../types';

export default function Payments() {
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Payment registration form
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'Bank' | 'Mobile Money' | 'Card'>('Bank');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Success indicator
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/invoices').then(res => res.json()),
      fetch('/api/payments').then(res => res.json()),
    ])
      .then(([invData, pmtData]) => {
        setInvoices(invData);
        setPayments(pmtData);
        
        // Default select invoice with remaining due
        const dueInvoices = invData.filter((i: TicketInvoice) => i.dueAmount > 0);
        if (dueInvoices.length > 0) {
          setInvoiceId(dueInvoices[0].id);
          setAmount(String(dueInvoices[0].dueAmount));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch payments data:', err);
        setLoading(false);
      });
  };

  // Change selected invoice to pay
  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const invoice = invoices.find(i => i.id === id);
    if (invoice) {
      setAmount(String(invoice.dueAmount));
    }
  };

  // Submit payment registration
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount) return;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: Number(amount),
          method,
          referenceNumber,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Successfully registered payment of $${amount} against ${invoiceId}!`);
        setReferenceNumber('');
        
        // Log action in Audit Trail
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Jane Doe',
            role: 'Super Admin',
            action: 'Register Payment',
            details: `Settled payment of $${amount} for invoice ${invoiceId} via ${method}`,
          }),
        });

        setTimeout(() => {
          setSuccessMsg(null);
        }, 4000);

        fetchData();
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
    }
  };

  // Filter lists
  const filteredPayments = payments.filter(p => {
    return p.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.method.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate sum metric
  const totalSettledPaymentsSum = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div id="payments-office" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Register Settlement Receipt (1 column) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 h-fit">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-900 text-sm">Register Settlement</h4>
          <p className="text-slate-400 text-xs">Post manual agency and corporate payments</p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 font-mono">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegisterPayment} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Debited Invoice with Dues</label>
            <select
              value={invoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
            >
              {invoices.filter(i => i.dueAmount > 0).length === 0 ? (
                <option value="">No outstanding invoices active</option>
              ) : (
                invoices.filter(i => i.dueAmount > 0).map(i => (
                  <option key={i.id} value={i.id}>{i.id} - {i.customerName} (due: ${i.dueAmount})</option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Settlement Amount ($)</label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 font-bold"
              >
                <option value="Cash">Cash Channel</option>
                <option value="Bank">Bank Wire</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Card">Credit Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reference / TXN ID</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., Wire ref, check code..."
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={!invoiceId || !amount}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm text-xs mt-2 disabled:opacity-50"
          >
            Post Payments Ledger
          </button>
        </form>
      </div>

      {/* Right Column: Payments Ledger List (2 columns) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 flex flex-col justify-between h-[520px]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Settled Payments Ledger</h4>
              <p className="text-slate-400 text-xs">Outlining BSP audits and checks</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Aggregate Ledger settled</span>
              <span className="font-mono text-base font-extrabold text-slate-900">${totalSettledPaymentsSum.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick filter search */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Invoice ID, GDS reference, payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <p className="text-xs font-mono text-slate-400 text-center py-10">No payments found.</p>
          ) : (
            filteredPayments.map(pmt => (
              <div key={pmt.id} className="border border-slate-150 p-4 rounded-xl flex items-center justify-between text-xs hover:border-slate-200 transition-all bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <span className="p-2.5 bg-white text-slate-700 border border-slate-150 rounded-xl shrink-0 shadow-sm">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-900">{pmt.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">against invoice {pmt.invoiceId}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1 flex items-center gap-2">
                      <span className="font-bold bg-white border border-slate-150 px-2 py-0.5 rounded text-slate-700 text-[10px]">{pmt.method} Wire</span>
                      {pmt.referenceNumber && (
                        <span className="font-mono text-slate-400">Ref: {pmt.referenceNumber}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-emerald-600 text-sm block">+${pmt.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{new Date(pmt.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
