import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, Edit, Trash2, ArrowLeft, Printer, RefreshCw, Trash, FileText 
} from 'lucide-react';
import HeaderLogo from './HeaderLogo';

interface QuotationItem {
  description: string;
  cabinClass: string;
  dateTime: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface QuotationRecord {
  id: string;
  customQuoteId?: string;
  date: string;
  clientName: string;
  subject: string;
  intro: string;
  items: QuotationItem[];
  note: string;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
}

interface QuotationProps {
  userRole: 'admin' | 'cashier' | 'user';
  loggedInEmail: string;
}

export default function Quotation({ userRole, loggedInEmail }: QuotationProps) {
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view-letter'>('list');
  const [selectedQuote, setSelectedQuote] = useState<QuotationRecord | null>(null);

  // Form Fields
  const [customQuoteId, setCustomQuoteId] = useState('');
  const [clientName, setClientName] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [subject, setSubject] = useState('');
  const [intro, setIntro] = useState('We are pleased to submit the following flight itinerary options for your review. Kindly let us know your preferred choice:');
  const [note, setNote] = useState('Prices are subject to flight availability and GDS airline confirmation until tickets are issued.');
  const [items, setItems] = useState<QuotationItem[]>([
    { description: '', cabinClass: 'Economy', dateTime: '', price: 0, quantity: 1, subtotal: 0 }
  ]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchQuotations();
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

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotations');
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedSearchQuery(searchQuery);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setAppliedSearchQuery('');
    setCurrentPage(1);
  };

  // Dynamic Options calculations
  const calculateTotalAmount = (itemList: QuotationItem[]) => {
    return itemList.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  };

  const addItemRow = () => {
    setItems([...items, { description: '', cabinClass: 'Economy', dateTime: '', price: 0, quantity: 1, subtotal: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length === 1) return;
    const next = [...items];
    next.splice(idx, 1);
    setItems(next);
  };

  const updateItemField = (idx: number, field: keyof QuotationItem, val: any) => {
    const next = [...items];
    const item = { ...next[idx], [field]: val };
    if (field === 'price' || field === 'quantity') {
      const p = field === 'price' ? Number(val) : Number(item.price);
      const q = field === 'quantity' ? Number(val) : Number(item.quantity);
      item.subtotal = Math.round(p * q * 100) / 100;
    }
    next[idx] = item;
    setItems(next);
  };

  const enterCreateMode = () => {
    setSelectedQuote(null);
    setClientName('');
    setQuoteDate(new Date().toLocaleDateString('en-CA'));
    setSubject('Flight Quotation');
    setIntro('We are pleased to submit the following flight itinerary options for your review. Kindly let us know your preferred choice:');
    setNote('Prices are subject to flight availability and GDS airline confirmation until tickets are issued.');
    setItems([{ description: '', cabinClass: 'Economy', dateTime: '', price: 0, quantity: 1, subtotal: 0 }]);

    const nextNum = quotations.length > 0 ? Math.max(...quotations.map(q => {
      const match = (q.customQuoteId || q.id || '').match(/\d+$/);
      return match ? Number(match[0]) : 0;
    })) + 1 : 1001;
    setCustomQuoteId('QT-2026-' + nextNum);

    setViewMode('create');
  };

  const enterEditMode = (q: QuotationRecord) => {
    setSelectedQuote(q);
    setCustomQuoteId(q.customQuoteId || q.id);
    setClientName(q.clientName);
    setQuoteDate(new Date().toLocaleDateString('en-CA')); // Always make date today as requested
    setSubject(q.subject);
    setIntro(q.intro);
    setNote(q.note);
    setItems(q.items && q.items.length > 0 ? q.items : [{ description: '', cabinClass: 'Economy', dateTime: '', price: 0, quantity: 1, subtotal: 0 }]);
    setViewMode('edit');
  };

  const enterViewLetterMode = (q: QuotationRecord) => {
    setSelectedQuote(q);
    setViewMode('view-letter');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !subject || items.some(item => !item.description)) {
      alert('Please fill out Client Name, Subject, and Item flight details.');
      return;
    }

    const totalVal = calculateTotalAmount(items);
    const payload = {
      customQuoteId,
      date: quoteDate,
      clientName,
      subject,
      intro,
      items,
      note,
      totalAmount: totalVal,
      createdBy: loggedInEmail
    };

    try {
      let res;
      if (viewMode === 'create') {
        res = await fetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/quotations/${selectedQuote?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: loggedInEmail,
            role: userRole === 'admin' ? 'Super Admin' : 'Finance Cashier',
            action: viewMode === 'create' ? 'Quotation Creation' : 'Quotation Update',
            details: `${viewMode === 'create' ? 'Created' : 'Updated'} travel quotation letter ${customQuoteId} for ${clientName}`
          })
        });

        await fetchQuotations();
        setViewMode('list');
      }
    } catch (err) {
      console.error('Error saving quotation:', err);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: loggedInEmail,
            role: userRole === 'admin' ? 'Super Admin' : 'Agent',
            action: 'Quotation Delete',
            details: `Deleted quotation ${id}`
          })
        });
        await fetchQuotations();
      }
    } catch (err) {
      console.error('Error deleting quotation:', err);
    }
  };

  // Filter
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch = 
      q.id.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
      q.clientName.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(appliedSearchQuery.toLowerCase());

    const effectiveEmail = loggedInEmail.toLowerCase() === 'admin@noble.com'
      ? (userRole === 'cashier' ? 'cashier@noble.com' : 'agent@noble.com')
      : loggedInEmail;
      
    const matchesCreator = userRole === 'user'
      ? (q.createdBy || 'admin@noble.com').toLowerCase() === effectiveEmail.toLowerCase()
      : true;

    return matchesSearch && matchesCreator;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuotes = filteredQuotations.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 font-sans">
      {viewMode === 'list' && (
        <>
          {/* Header Panel */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search client or quote subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 w-52 sm:w-64 font-medium"
                  />
                </div>
                <button
                  onClick={handleApplyFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                >
                  Search
                </button>
                <button
                  onClick={handleResetFilters}
                  className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={enterCreateMode}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> Write New Quotation
              </button>
            </div>
          </div>

          {/* Quotations Registry Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 w-12 text-center">#</th>
                    <th className="py-4 px-4">Quotation ID</th>
                    <th className="py-4 px-4">Client / Company Name</th>
                    <th className="py-4 px-4">Subject Description</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4 text-right">Estimated Total</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400 font-bold">
                        <span className="inline-block animate-spin mr-2">⚙️</span> Loading Quotations registry...
                      </td>
                    </tr>
                  ) : paginatedQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400 font-bold">
                        No Quotation letters stored. Click "Write New Quotation" to create one.
                      </td>
                    </tr>
                  ) : (
                    paginatedQuotes.map((q, index) => {
                      const absoluteIndex = startIndex + index + 1;
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 text-slate-700 dark:text-slate-200 text-xs">
                          <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">{absoluteIndex}</td>
                          <td className="py-4 px-4 font-mono font-bold">
                            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                              {q.customQuoteId || q.id}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">{q.clientName}</td>
                          <td className="py-4 px-4 font-bold text-slate-600 dark:text-slate-350">{q.subject}</td>
                          <td className="py-4 px-4 font-mono font-bold">{q.date.split('-').reverse().join('-')}</td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            ${(q.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => enterViewLetterMode(q)}
                                className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                title="View Quotation Letter"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => enterEditMode(q)}
                                className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-450 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                title="Edit Quotation details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteQuote(q.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                title="Delete Quotation record"
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

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length} records
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

      {/* Write / Edit Quotation Form */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <form onSubmit={handleFormSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              {viewMode === 'create' ? 'Draft Travel Quotation Letter' : 'Modify Stored Travel Quotation'}
            </h2>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel & Return
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Quote Reference ID (Auto)</label>
              <input
                type="text"
                disabled
                value={customQuoteId}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Client / Company Name*</label>
              <input
                type="text"
                required
                placeholder="Enter client name or agency"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Issue Date*</label>
              <input
                type="date"
                required
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-bold font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Subject Title*</label>
            <input
              type="text"
              required
              placeholder="e.g. Flight Quotation for Hajj Group Travel"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Letter Introduction text*</label>
            <textarea
              required
              rows={3}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          {/* Dynamic Flight Itinerary Options Table */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-700 pt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-wider">Flight Option details</h3>
              <button
                type="button"
                onClick={addItemRow}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Flight Option
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3">Flight Option Itinerary / Description*</th>
                    <th className="py-2.5 px-3 w-32">Class</th>
                    <th className="py-2.5 px-3 w-40">Date / Time</th>
                    <th className="py-2.5 px-3 w-28 text-right">Price per Person*</th>
                    <th className="py-2.5 px-3 w-24 text-right">Qty</th>
                    <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/10">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ethiopian Airlines: Hargeisa - Addis Ababa - Dubai"
                          value={item.description}
                          onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-blue-500 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.cabinClass}
                          onChange={(e) => updateItemField(idx, 'cabinClass', e.target.value)}
                          className="w-full bg-transparent focus:outline-none py-1 text-xs font-bold text-slate-700 dark:text-slate-350"
                        >
                          <option value="Economy">Economy</option>
                          <option value="Business">Business</option>
                          <option value="First Class">First Class</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="e.g. 2026-08-10 14:00"
                          value={item.dateTime}
                          onChange={(e) => updateItemField(idx, 'dateTime', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-blue-500 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-bold font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="any"
                          required
                          value={item.price || ''}
                          onChange={(e) => updateItemField(idx, 'price', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-transparent border-b border-transparent focus:border-blue-500 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-bold font-mono text-right"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          required
                          value={item.quantity || ''}
                          onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-blue-500 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-bold font-mono text-right"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                        ${(item.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          disabled={items.length === 1}
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Terms and Conditions note*</label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-6">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Estimated Total: <span className="font-mono text-base font-black text-blue-600 dark:text-blue-450">${calculateTotalAmount(items).toFixed(2)}</span>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md transition-colors"
            >
              {viewMode === 'create' ? 'Save Travel Quotation' : 'Save Modified Quotation'}
            </button>
          </div>
        </form>
      )}

      {/* Printable Quotation Letter View */}
      {viewMode === 'view-letter' && selectedQuote && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500 text-xs">OFFICIAL TENDER / TRAVEL QUOTATION</span>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">#{selectedQuote.customQuoteId || selectedQuote.id}</h2>
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

          {/* Quotation Letter printable structure */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 max-w-4xl mx-auto text-slate-800 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-150 pb-8 mb-8 print:pb-6 print:mb-6">
              <div className="w-full flex justify-between items-center">
                <HeaderLogo />
                <div className="text-right">
                  <h1 className="text-lg font-black text-slate-900 uppercase font-sans tracking-wide">Official Travel Quotation</h1>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Noble Travels & Tour Agency</p>
                </div>
              </div>
            </div>

            {/* Letter Metadata */}
            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-150 mb-8 print:mb-6">
              <div className="text-xs space-y-1">
                <div><span className="font-bold text-slate-500">To Client: </span><span className="font-extrabold text-slate-900">{selectedQuote.clientName}</span></div>
                <div><span className="font-bold text-slate-500">Subject: </span><span className="font-bold text-slate-950">{selectedQuote.subject}</span></div>
              </div>
              <div className="text-right text-xs space-y-1">
                <div><span className="font-bold text-slate-500">Quote ID: </span><span className="font-bold text-slate-900 font-mono">{selectedQuote.customQuoteId || selectedQuote.id}</span></div>
                <div><span className="font-bold text-slate-500">Issue Date: </span><span className="font-bold text-slate-900 font-mono">{selectedQuote.date.split('-').reverse().join('-')}</span></div>
              </div>
            </div>

            {/* Letter Body */}
            <div className="text-xs leading-relaxed text-slate-700 space-y-6 mb-8 print:text-black">
              <p>Dear Sir/Madam,</p>
              <p>{selectedQuote.intro}</p>
            </div>

            {/* Itinerary Details Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Flight Description Itinerary</th>
                    <th className="py-3 px-4 w-28">Cabin Class</th>
                    <th className="py-3 px-4 w-32">Date / Time</th>
                    <th className="py-3 px-4 text-right w-24">Fare</th>
                    <th className="py-3 px-4 text-right w-20">Qty</th>
                    <th className="py-3 px-4 text-right w-28">Sub Total</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {selectedQuote.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{item.description}</td>
                      <td className="py-4 px-4 font-semibold text-slate-500">{item.cabinClass}</td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-600">{item.dateTime || '-'}</td>
                      <td className="py-4 px-4 text-right font-mono">${item.price.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-mono">{item.quantity}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold">${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-8">
              <div className="w-64 border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-xs flex justify-between items-center">
                <span className="font-bold text-slate-600">Estimated Quote Total:</span>
                <span className="font-mono text-base font-black text-slate-900">${selectedQuote.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Note Terms */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-[10px] text-slate-500 leading-relaxed mb-12 print:border-slate-200">
              <span className="font-bold uppercase block mb-1">Terms & Conditions Note:</span>
              <p>{selectedQuote.note}</p>
            </div>

            {/* Signature Line */}
            <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-150 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Prepared By:</p>
                <div className="h-10 mt-2"></div>
                <p className="font-bold text-slate-900 border-t border-slate-200 pt-2 w-48 uppercase">Noble Travel Consultant</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium">Accepted and Approved By:</p>
                <div className="h-10 mt-2"></div>
                <p className="font-bold text-slate-900 border-t border-slate-200 pt-2 w-48 ml-auto uppercase">{selectedQuote.clientName}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-6 mt-12 text-center text-[10px] text-slate-400 font-mono space-y-1">
              <p>Located in Hargeisa, Somaliland, you can find the Deero Mall on Presidential Road in the 26June neighborhood.</p>
              <p>Contact: +252 2 528445, Telephone # +252 63 4855950 | Developed By ENG ABDULKANI MOHAMED</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
