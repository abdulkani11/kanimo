import { useEffect, useState } from 'react';
import { Search, Printer, Download, Mail, MessageSquare, ShieldAlert, CheckCircle2, Ticket, CreditCard, ChevronRight } from 'lucide-react';
import { TicketInvoice, PaymentRecord } from '../types';

export default function Invoices() {
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<TicketInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Notification logs
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

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
        if (invData.length > 0) {
          setSelectedInvoice(invData[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load invoice data:', err);
        setLoading(false);
      });
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.pnr.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? inv.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Handle Dispatch Alerts (Email, WhatsApp, SMS)
  const triggerNotification = async (medium: 'Email' | 'WhatsApp' | 'SMS', type: string) => {
    if (!selectedInvoice) return;
    setNotificationStatus(`Transmitting outbound ${medium} notification...`);

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          medium,
          recipient: selectedInvoice.passengers[0]?.name || selectedInvoice.customerName,
          referenceId: selectedInvoice.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotificationStatus(`Success: ${medium} reminder successfully transmitted!`);
        
        // Log action in Audit Trail
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Jane Doe',
            role: 'Super Admin',
            action: `Send ${medium} Reminder`,
            details: `Dispatched ${type} invoice alert to recipient via ${medium} channel`,
          }),
        });

        setTimeout(() => setNotificationStatus(null), 4000);
      }
    } catch (err) {
      console.error('Failed to trigger alert:', err);
      setNotificationStatus('Transmitter failure. Please check router configurations.');
    }
  };

  // Simulate local printing/downloading
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!selectedInvoice) return;
    
    // Create simulated file content
    const invoiceText = `
========================================
        NOBLE TRAVEL AGENCY RECEIPT
========================================
Invoice Ref: ${selectedInvoice.id}
Client: ${selectedInvoice.customerName}
PNR: ${selectedInvoice.pnr}
Ticket Ref: ${selectedInvoice.ticketNumber}
Route: ${selectedInvoice.origin} to ${selectedInvoice.destination}
Departure Date: ${selectedInvoice.departureDate}
Airline Carrier: ${selectedInvoice.airline}
----------------------------------------
Fare Summary:
Base Fare: $${selectedInvoice.baseFare}
Taxes: $${selectedInvoice.tax}
Discounts: -$${selectedInvoice.discount}
Total Invoice Net: $${selectedInvoice.netAmount}
Settled: $${selectedInvoice.paidAmount}
Due Balance: $${selectedInvoice.dueAmount}
----------------------------------------
Passenger Listing:
${selectedInvoice.passengers.map((p, i) => `${i + 1}. ${p.name} (${p.type}) [Passport: ${p.passportNumber}]`).join('\n')}
========================================
Thank you for flying with Noble Alliance!
`;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${selectedInvoice.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="invoice-manager" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left List Pane (1 column) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col justify-between h-[680px]">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm">Issued Invoices</h4>
            <p className="text-slate-400 text-xs">Access receipts and client ledgers</p>
          </div>

          <div className="space-y-2">
            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Invoice ID, client, PNR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>

            {/* Quick Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid Only</option>
              <option value="Unpaid">Unpaid Only</option>
              <option value="Partial">Partial Settlements</option>
              <option value="Refunded">Refunded Only</option>
            </select>
          </div>
        </div>

        {/* Scrollable list content */}
        <div className="flex-1 overflow-y-auto my-4 space-y-2.5 pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-[11px] font-mono text-slate-400 text-center py-10">No matching invoices found.</p>
          ) : (
            filteredInvoices.map(inv => (
              <button
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedInvoice?.id === inv.id 
                    ? 'border-blue-500 bg-blue-50/20 shadow-sm' 
                    : 'border-slate-150 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <span className="font-mono font-bold text-blue-600 block text-[11px]">{inv.id}</span>
                  <span className="font-semibold text-slate-800 text-[12px] block truncate mt-0.5">{inv.customerName}</span>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.origin} → {inv.destination} ({inv.pnr})</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-900 block">${inv.netAmount}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 ${
                    inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                    inv.status === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Content Pane (2 columns) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between h-[680px]">
        {selectedInvoice ? (
          <div className="flex flex-col h-full justify-between overflow-y-auto">
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Invoice Ledger Card</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="font-extrabold text-slate-900 font-mono">{selectedInvoice.id}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    selectedInvoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    selectedInvoice.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Action Toolbar buttons */}
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={handleDownloadPdf}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200"
                  title="Download Raw TXT Ledger"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200"
                  title="Print Layout"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <span className="w-px h-6 bg-slate-200 mx-1"></span>
                <button
                  onClick={() => triggerNotification('Email', 'Invoice Reminder')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer"
                >
                  <Mail className="w-4 h-4" /> <span>Email</span>
                </button>
                <button
                  onClick={() => triggerNotification('WhatsApp', 'Payment Reminder')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Notification logs panel */}
            {notificationStatus && (
              <div className="mb-4 bg-blue-50/60 border border-blue-100 text-[11px] text-blue-700 px-3.5 py-2.5 rounded-xl font-semibold font-mono animate-pulse">
                {notificationStatus}
              </div>
            )}

            {/* Invoice Printable Section */}
            <div id="invoice-print-area" className="flex-1 bg-slate-50/50 rounded-2xl p-5 border border-slate-150 space-y-6 text-xs text-slate-700">
              {/* Branding Section */}
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-extrabold text-slate-900 tracking-tight text-base">NOBLE TRAVEL AGENCY ALLIANCE</h5>
                  <p className="text-[10px] text-slate-400 font-mono">IATA Accredited BSP Registry ID 8273-A</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-400 font-bold block uppercase tracking-wider text-[9px]">GDS REFERENCE RECORD</span>
                  <span className="font-mono font-extrabold text-sm text-blue-600 block tracking-wider">{selectedInvoice.pnr}</span>
                </div>
              </div>

              {/* Bilateral accounts */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Billed To Profile</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customerName}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Reference ID: {selectedInvoice.customerId}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Booking Matrix Metadata</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedInvoice.airline}</p>
                  <p className="text-[10px] font-mono text-slate-500">Departure: {selectedInvoice.departureDate}</p>
                </div>
              </div>

              {/* Ticket details */}
              <div className="border-t border-slate-200 pt-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block mb-2">Flight Sector Parameters</span>
                <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">Flight Itinerary</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{selectedInvoice.origin} → {selectedInvoice.destination}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">Schedule Trip Type</span>
                    <span className="font-semibold text-slate-800">{selectedInvoice.tripType}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">Consolidator Vendor</span>
                    <span className="font-semibold text-slate-800">{selectedInvoice.vendorName}</span>
                  </div>
                </div>
              </div>

              {/* Passengers lists */}
              <div className="border-t border-slate-200 pt-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block mb-2">Passenger Roster & Manifest</span>
                <div className="space-y-1.5">
                  {selectedInvoice.passengers.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 p-2.5 rounded-xl font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[9px] font-mono">{idx + 1}</span>
                        <span>{p.name} <span className="text-[10px] text-slate-400 font-mono">({p.type})</span></span>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span>Passport: {p.passportNumber}</span>
                        <span className="text-slate-400 text-[10px] ml-2 font-semibold">| Meal: {p.mealPreference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing ledger */}
              <div className="border-t border-slate-200 pt-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block mb-2">Billing Account Breakdown</span>
                <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-150 font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Ticket Fare</span>
                    <span className="font-mono">${selectedInvoice.baseFare}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>IATA Taxes & Surcharges</span>
                    <span className="font-mono">${selectedInvoice.tax}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Noble Exclusive Discount</span>
                      <span className="font-mono">-${selectedInvoice.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 border-t border-slate-100 pt-2.5">
                    <span className="font-bold">Gross Total Billing</span>
                    <span className="font-mono font-extrabold text-sm">${selectedInvoice.netAmount}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Balance Sheet info */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-55 p-3 rounded-xl border border-slate-150 font-semibold text-xs">
              <div className="flex gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">SETTLED PAID</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-sm">${selectedInvoice.paidAmount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">OUTSTANDING DEBT</span>
                  <span className="font-mono font-extrabold text-rose-600 text-sm">${selectedInvoice.dueAmount}</span>
                </div>
              </div>

              {selectedInvoice.paymentMethod && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">PAYMENT METHOD</span>
                  <span className="font-mono text-slate-900 text-xs font-bold">{selectedInvoice.paymentMethod} Wire</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          <p className="text-xs text-slate-400 font-mono py-10 text-center">No active invoice selected.</p>
        )}
      </div>

    </div>
  );
}
