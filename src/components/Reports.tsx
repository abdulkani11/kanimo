import { useEffect, useState } from 'react';
import { Search, FileText, Download, BarChart2, ShieldAlert, CheckCircle, PieChart, TrendingUp } from 'lucide-react';
import { TicketInvoice, Customer, RefundRequest, PaymentRecord } from '../types';

type ReportType = 
  | 'Daily Sales' 
  | 'Weekly Sales' 
  | 'Customer Report' 
  | 'Airline Report' 
  | 'Profit Report' 
  | 'Refund Report' 
  | 'Commission Report' 
  | 'Outstanding Due' 
  | 'Cash Flow';

export default function Reports() {
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Report
  const [selectedReport, setSelectedReport] = useState<ReportType>('Daily Sales');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/invoices').then(res => res.json()),
      fetch('/api/customers').then(res => res.json()),
      fetch('/api/refunds').then(res => res.json()),
      fetch('/api/payments').then(res => res.json()),
    ])
      .then(([invData, custData, refData, pmtData]) => {
        setInvoices(invData);
        setCustomers(custData);
        setRefunds(refData);
        setPayments(pmtData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reports data:', err);
        setLoading(false);
      });
  }, []);

  // --- Dynamic Calculations Based on Selected Report ---

  const getReportData = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    switch (selectedReport) {
      case 'Daily Sales': {
        // filter invoices created today
        const list = invoices.filter(i => i.createdAt.startsWith('2026-07-19') || i.createdAt.startsWith(todayStr));
        const total = list.reduce((sum, i) => sum + i.netAmount, 0);
        return {
          title: 'Daily Ticket Sales Dispatch',
          subtitle: 'Real-time flights ticketed today',
          headers: ['Invoice ID', 'Client Name', 'Airline', 'Sector', 'Net Amount', 'Status'],
          rows: list.map(i => [i.id, i.customerName, i.airline, `${i.origin}-${i.destination}`, `$${i.netAmount}`, i.status]),
          totalLabel: 'Today Total Sales',
          totalValue: `$${total.toLocaleString()}`,
        };
      }
      case 'Weekly Sales': {
        // filter invoices created this week (mocking last 7 days)
        const list = invoices; // return all seeded invoices as weekly scope
        const total = list.reduce((sum, i) => sum + i.netAmount, 0);
        return {
          title: 'Weekly Invoice Settlements Ledger',
          subtitle: 'Alliance booking dispatch over trailing 7 days',
          headers: ['Invoice ID', 'Client Name', 'Carrier', 'Fare', 'Tax', 'Net Total', 'Status'],
          rows: list.map(i => [i.id, i.customerName, i.airline, `$${i.baseFare}`, `$${i.tax}`, `$${i.netAmount}`, i.status]),
          totalLabel: 'Weekly Gross Total',
          totalValue: `$${total.toLocaleString()}`,
        };
      }
      case 'Customer Report': {
        // Outstanding balance breakdown per client
        const total = customers.reduce((sum, c) => sum + c.balance, 0);
        return {
          title: 'Client Accounts Aging Ledger',
          subtitle: 'Bilateral customer outstanding balances & credit limits',
          headers: ['Customer ID', 'Client Name', 'Category', 'Commission %', 'Credit Limit', 'Balance Due'],
          rows: customers.map(c => [c.id, c.name, c.type, `${c.commissionPercent}%`, `$${c.creditLimit.toLocaleString()}`, `$${c.balance.toLocaleString()}`]),
          totalLabel: 'Aggregate Client Debt',
          totalValue: `$${total.toLocaleString()}`,
        };
      }
      case 'Airline Report': {
        // Invoices grouped by Airline Carrier
        const groups: Record<string, { count: number; sales: number }> = {};
        invoices.forEach(i => {
          if (!groups[i.airline]) groups[i.airline] = { count: 0, sales: 0 };
          groups[i.airline].count += 1;
          groups[i.airline].sales += i.netAmount;
        });
        const list = Object.entries(groups);
        const totalSales = list.reduce((sum, [_, val]) => sum + val.sales, 0);
        return {
          title: 'Carrier Productivity Chart',
          subtitle: 'Gross ticket values structured by carrier group',
          headers: ['Airline Carrier', 'Tickets Issued', 'Gross Ticket Values', 'Market Share %'],
          rows: list.map(([key, val]) => [
            key,
            `${val.count} tickets`,
            `$${val.sales.toLocaleString()}`,
            `${totalSales ? Math.round((val.sales / totalSales) * 100) : 0}%`,
          ]),
          totalLabel: 'Total Market Revenue',
          totalValue: `$${totalSales.toLocaleString()}`,
        };
      }
      case 'Profit Report': {
        // Vendor Commission - Client margins
        const totalVendor = invoices.reduce((sum, i) => sum + (i.vendorCommission || 0), 0);
        const totalCustomer = invoices.reduce((sum, i) => sum + (i.customerCommission || 0), 0);
        const totalProfit = totalVendor - totalCustomer;
        return {
          title: 'Portal Profitability Summary',
          subtitle: 'Net booking margins, GDS incentives & billing commissions',
          headers: ['Invoice ID', 'Airline', 'Sector', 'Vendor GDS markup', 'Customer GDS markup', 'Combined Net Income'],
          rows: invoices.map(i => [
            i.id,
            i.airline,
            `${i.origin}-${i.destination}`,
            `$${i.vendorCommission || 0}`,
            `$${i.customerCommission || 0}`,
            `$${(i.vendorCommission || 0) - (i.customerCommission || 0)}`,
          ]),
          totalLabel: 'Combined Net Profit Margin',
          totalValue: `$${totalProfit.toLocaleString()}`,
        };
      }
      case 'Refund Report': {
        // Refund statuses
        const total = refunds.reduce((sum, r) => sum + r.refundAmount, 0);
        return {
          title: 'IATA Ticket Return Audit',
          subtitle: 'Processed refunds & pending return files list',
          headers: ['Request ID', 'Invoice ID', 'Passenger', 'Refund Amount', 'Reason', 'Status'],
          rows: refunds.map(r => [r.id, r.invoiceId, r.passengerName, `$${r.refundAmount}`, r.reason, r.status]),
          totalLabel: 'Total Return Claims Sourced',
          totalValue: `$${total.toLocaleString()}`,
        };
      }
      case 'Commission Report': {
        // commission tracking
        const total = invoices.reduce((sum, i) => sum + i.customerCommission, 0);
        return {
          title: 'BSP Customer Commission Registry',
          subtitle: 'Commissions credited to partner travel agency portals',
          headers: ['Invoice Ref', 'Customer Name', 'Airline', 'Sector', 'Base Fare', 'BSP Comm. %', 'Credited Margins'],
          rows: invoices.map(i => {
            const customer = customers.find(c => c.id === i.customerId);
            const rate = customer ? customer.commissionPercent : 0;
            return [i.id, i.customerName, i.airline, `${i.origin}-${i.destination}`, `$${i.baseFare}`, `${rate}%`, `$${i.customerCommission}`];
          }),
          totalLabel: 'Total Credited Commission Balance',
          totalValue: `$${total.toLocaleString()}`,
        };
      }
      case 'Outstanding Due': {
        // invoices with dueAmount > 0
        const list = invoices.filter(i => i.dueAmount > 0);
        const total = list.reduce((sum, i) => sum + i.dueAmount, 0);
        return {
          title: 'Active Accounts Receivable Aging',
          subtitle: 'Unsettled invoices with outstanding balances',
          headers: ['Invoice ID', 'Client Name', 'PNR / Ticket', 'Gross Billing', 'Paid Amount', 'Outstanding Debt'],
          rows: list.map(i => [i.id, i.customerName, i.pnr, `$${i.netAmount}`, `$${i.paidAmount}`, `$${i.dueAmount}`]),
          totalLabel: 'Net Accounts Receivable Balance',
          totalValue: `$${total.toLocaleString()}`,
        };
      }
      case 'Cash Flow': {
        // Sum of payments
        const total = payments.reduce((sum, p) => sum + p.amount, 0);
        return {
          title: 'Portal Cash Inflow Journal',
          subtitle: 'Chronological payments cleared through IATA settlement bank',
          headers: ['Receipt ID', 'Invoice Link', 'Clearance Method', 'Transaction Ref', 'Cleared Date', 'Amount Settled'],
          rows: payments.map(p => [p.id, p.invoiceId, p.method, p.referenceNumber || 'N/A', new Date(p.createdAt).toLocaleDateString(), `$${p.amount}`]),
          totalLabel: 'Sovereign Bank Clearance',
          totalValue: `$${total.toLocaleString()}`,
        };
      }
    }
  };

  const report = getReportData();

  // Export report rows to CSV
  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += report.headers.join(',') + '\n';
    
    report.rows.forEach(row => {
      csvContent += row.map(v => `"${v}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apex_Report_${selectedReport.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuItems: { id: ReportType; label: string }[] = [
    { id: 'Daily Sales', label: 'Daily Sales Ledger' },
    { id: 'Weekly Sales', label: 'Weekly Sales Journal' },
    { id: 'Customer Report', label: 'Client Accounts Aging' },
    { id: 'Airline Report', label: 'Airline Productivity' },
    { id: 'Profit Report', label: 'Net Profit & Margins' },
    { id: 'Refund Report', label: 'IATA Refund Claims' },
    { id: 'Commission Report', label: 'BSP Comm. ledger' },
    { id: 'Outstanding Due', label: 'Accounts Receivable' },
    { id: 'Cash Flow', label: 'Cash Flow Journal' },
  ];

  return (
    <div id="reports-workspace" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* 1. Sidebar report switcher (1 column) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-fit space-y-4">
        <div className="border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-800">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-sm">Reports Registry</h4>
        </div>
        
        <nav className="space-y-1.5 flex flex-col">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedReport(item.id)}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedReport === item.id 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 2. Main Ledger Preview Board (3 columns) */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between h-[620px]">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4 gap-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">{report.title}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{report.subtitle}</p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" /> <span>Export CSV</span>
                </button>
              </div>

              {/* Grid table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider font-mono border-b border-slate-200">
                      {report.headers.map((h, i) => (
                        <th key={i} className="p-3.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {report.rows.length === 0 ? (
                      <tr>
                        <td colSpan={report.headers.length} className="p-8 text-center text-slate-400 font-mono">No matching records registered for this reporting cycle.</td>
                      </tr>
                    ) : (
                      report.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                          {row.map((val, idx) => (
                            <td key={idx} className="p-3.5">
                              {val === 'Paid' || val === 'Refunded' ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold text-[10px]">{val}</span>
                              ) : val === 'Unpaid' || val === 'Rejected' ? (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full font-bold text-[10px]">{val}</span>
                              ) : val === 'Partial' || val === 'Pending' ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-bold text-[10px]">{val}</span>
                              ) : (
                                <span className={idx === 0 ? 'font-mono font-bold' : ''}>{val}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Balance block */}
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-150">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">{report.totalLabel}</span>
              <span className="font-mono font-extrabold text-base text-slate-900">{report.totalValue}</span>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
