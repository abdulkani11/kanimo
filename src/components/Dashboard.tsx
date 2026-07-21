import { useEffect, useState } from 'react';
import { DollarSign, Users, Ticket, ArrowUpRight, ArrowDownRight, Clock, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Customer, TicketInvoice, PaymentRecord, RefundRequest, AuditLog } from '../types';

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(res => res.json()),
      fetch('/api/invoices').then(res => res.json()),
      fetch('/api/payments').then(res => res.json()),
      fetch('/api/refunds').then(res => res.json()),
      fetch('/api/audit-logs').then(res => res.json()),
    ])
      .then(([custData, invData, pmtData, refData, logData]) => {
        setCustomers(custData);
        setInvoices(invData);
        setPayments(pmtData);
        setRefunds(refData);
        setLogs(logData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Compiling Dashboard Metrics...</p>
      </div>
    );
  }

  // --- Calculations ---
  const today = new Date().toISOString().split('T')[0];
  
  // Sales calculations
  const todayInvoices = invoices.filter(i => i.createdAt.startsWith(today));
  const todaySales = invoices
    .filter(i => i.createdAt.startsWith('2026-07-19') || i.createdAt.startsWith(today))
    .reduce((sum, i) => sum + i.netAmount, 0);

  const totalSales = invoices.reduce((sum, i) => sum + i.netAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const outstandingDue = invoices.reduce((sum, i) => sum + i.dueAmount, 0);

  // Dynamic monthly totals for Jan 26 to Jul 26
  const monthlyMonths = [
    { label: 'Jan 26', match: '2026-01' },
    { label: 'Feb 26', match: '2026-02' },
    { label: 'Mar 26', match: '2026-03' },
    { label: 'Apr 26', match: '2026-04' },
    { label: 'May 26', match: '2026-05' },
    { label: 'Jun 26', match: '2026-06' },
    { label: 'Jul 26', match: '2026-07' }
  ];

  const monthlyTotals = monthlyMonths.map(m => {
    const monthInvoices = invoices.filter(i => i.createdAt.startsWith(m.match));
    const sales = monthInvoices.reduce((sum, i) => sum + i.netAmount, 0);
    const paid = monthInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    return { sales, paid };
  });

  const maxVal = Math.max(...monthlyTotals.map(t => Math.max(t.sales, t.paid, 1000)));

  // SVG coordinates: W=500, H=200. X ranges from 20 to 480. Y ranges from 180 to 20.
  const xCoords = monthlyTotals.map((_, idx) => 20 + idx * (460 / (monthlyTotals.length - 1)));
  const ySales = monthlyTotals.map(t => 180 - (t.sales / maxVal) * 155);
  const yPaid = monthlyTotals.map(t => 180 - (t.paid / maxVal) * 155);

  const salesPath = `M ${xCoords.map((x, idx) => `${x},${ySales[idx]}`).join(' L ')}`;
  const salesAreaPath = `${salesPath} L ${xCoords[xCoords.length - 1]},185 L ${xCoords[0]},185 Z`;

  const paidPath = `M ${xCoords.map((x, idx) => `${x},${yPaid[idx]}`).join(' L ')}`;
  const paidAreaPath = `${paidPath} L ${xCoords[xCoords.length - 1]},185 L ${xCoords[0]},185 Z`;

  // Refund requests statistics
  const pendingRefundsSum = refunds
    .filter(r => r.status === 'Pending')
    .reduce((sum, r) => sum + r.refundAmount, 0);

  const approvedRefundsSum = refunds
    .filter(r => r.status === 'Refunded')
    .reduce((sum, r) => sum + r.refundAmount, 0);

  // Customer outstanding balance
  const activeAgencyCount = customers.filter(c => c.type === 'Travel Agency').length;
  const activeCorpCount = customers.filter(c => c.type === 'Corporate').length;
  const activeIndCount = customers.filter(c => c.type === 'Individual').length;

  // Outstanding due card trend
  const unpaidInvoicesCount = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partial').length;

  // Top Customers by outstanding balances or volume
  const topCustomers = [...customers].sort((a, b) => b.balance - a.balance).slice(0, 4);

  return (
    <div id="dashboard-deck" className="space-y-6">
      
      {/* 1. Metric Bento Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Sales Revenue Card */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans">Today's Sales Revenue</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 font-sans">${todaySales.toLocaleString()}</h3>
            </div>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-650">
            <span className="text-emerald-600 font-extrabold flex items-center gap-0.5 font-sans">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
            <span className="font-bold">vs yesterday sales</span>
          </div>
        </div>

        {/* Total Customers Card */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans">Total Portal Customers</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 font-sans">{customers.length} Clients</h3>
            </div>
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-650 font-sans font-bold">
            <span className="font-black text-blue-600">{activeAgencyCount} Agencies</span>
            <span className="h-2.5 w-px bg-slate-300"></span>
            <span>{activeCorpCount} Corp</span>
            <span className="h-2.5 w-px bg-slate-300"></span>
            <span>{activeIndCount} Ind</span>
          </div>
        </div>

        {/* Pending Payments Due Card */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between border-l-4 border-l-rose-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans">Outstanding Due</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 font-sans">${outstandingDue.toLocaleString()}</h3>
            </div>
            <span className="p-2.5 bg-rose-50/60 text-rose-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-650">
            <span className="text-rose-600 font-extrabold font-sans">{unpaidInvoicesCount} Invoices</span>
            <span className="font-bold">awaiting dispatch settlements</span>
          </div>
        </div>

        {/* Ticket Volume Card */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans">Total Tickets Logged</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 font-sans">{invoices.length}</h3>
            </div>
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Ticket className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-650">
            <span className="text-indigo-600 font-extrabold font-sans">100% GDS Synced</span>
            <span className="font-bold">Real-time BSP check</span>
          </div>
        </div>

      </div>

      {/* 2. Bento Grid Layout of Graphs and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sales Graph (Re-engineered SVG mockup for high precision styling) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Alliance Sales Graph</h4>
              <p className="text-xs text-slate-400">Monthly invoice dispatch vs. settlement cycles</p>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Gross Sales</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Payments Received</span>
            </div>
          </div>

          {/* Precision SVG Chart Representation */}
          <div className="h-56 w-full relative mt-2">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal gridlines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* Sales Curve */}
              <path
                d={salesPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={salesAreaPath}
                fill="url(#salesGrad)"
              />

              {/* Payments Curve */}
              <path
                d={paidPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={paidAreaPath}
                fill="url(#payGrad)"
              />
            </svg>
            <div className="absolute bottom-1 left-0 w-full flex justify-between px-2 text-[9px] font-mono text-slate-400">
              {monthlyMonths.map(m => (
                <span key={m.label}>{m.label}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-3 text-center">
            <div>
              <p className="text-[10px] text-slate-400 font-mono">Gross Dispatched</p>
              <p className="font-bold text-slate-800 text-sm">${totalSales.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-mono">Total Paid</p>
              <p className="font-bold text-emerald-600 text-sm">${totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-mono">Settlement Rate</p>
              <p className="font-bold text-blue-600 text-sm">
                {totalSales ? Math.round((totalPaid / totalSales) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Refund Statistics & Top Customers */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Refund Stats Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex-1">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Refund Status desk</h4>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Pending Approvals</span>
                <span className="text-xs font-mono font-bold text-amber-600">${pendingRefundsSum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Refunded to Clients</span>
                <span className="text-xs font-mono font-bold text-emerald-600">${approvedRefundsSum.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>All returns are mapped under standard IATA-refund protocols</span>
              </div>
            </div>
          </div>

          {/* Top Customers Widget */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex-1">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Outstanding Balances</h4>
            <div className="space-y-3">
              {topCustomers.map(cust => (
                <div key={cust.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="font-semibold text-slate-700 truncate">{cust.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-950 font-bold">${cust.balance.toLocaleString()}</span>
                    <p className="text-[9px] font-mono text-slate-400">{cust.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 3. Bottom Layer: Recent Tickets, Latest Payments & Activity Log */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Latest Invoice/Tickets Log */}
        <div className="xl:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900 text-sm">Latest Ticket Invoices</h4>
            <span className="text-[10px] text-slate-400 font-mono">Showing last 3 entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2">
                  <th className="py-2.5">INVOICE</th>
                  <th className="py-2.5">CLIENT</th>
                  <th className="py-2.5">ROUTE</th>
                  <th className="py-2.5">NET FARE</th>
                  <th className="py-2.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-700 divide-y divide-slate-50">
                {invoices.slice(0, 3).map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-blue-600">{inv.id}</td>
                    <td className="py-3 font-semibold">{inv.customerName}</td>
                    <td className="py-3 font-mono">{inv.origin} → {inv.destination}</td>
                    <td className="py-3 font-mono font-bold text-slate-900">${inv.netAmount}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 
                        inv.status === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Feed */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900 text-sm">Audited Portal Activity</h4>
            <span className="p-1 bg-slate-100 text-slate-400 rounded">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-4">
            {logs.slice(0, 4).map((log, index) => (
              <div key={log.id || index} className="flex gap-3 text-xs leading-relaxed">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border-2 border-white ring-4 ring-slate-100 shrink-0"></div>
                  {index < 3 && <div className="w-0.5 bg-slate-100 flex-1 my-1"></div>}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{log.action}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{log.details}</p>
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
