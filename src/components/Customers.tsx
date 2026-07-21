import { useEffect, useState } from 'react';
import { Search, UserPlus, Edit2, Trash2, Download, Upload, FileText, X, Eye, DollarSign } from 'lucide-react';
import { Customer, TicketInvoice } from '../types';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<'Travel Agency' | 'Corporate' | 'Individual'>('Individual');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('0');
  const [creditLimit, setCreditLimit] = useState('5000');
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/customers').then(res => res.json()),
      fetch('/api/invoices').then(res => res.json())
    ])
      .then(([custData, invData]) => {
        setCustomers(custData);
        setInvoices(invData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load customers data:', err);
        setLoading(false);
      });
  };

  // Export all customers to a JSON file
  const exportToJson = () => {
    const dataStr = JSON.stringify(customers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  // Import customers from a JSON file
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          alert('Invalid file format. Must be a JSON array of customers.');
          return;
        }
        const res = await fetch('/api/customers/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customers: json })
        });
        if (res.ok) {
          alert(`Successfully imported ${json.length} customers!`);
          e.target.value = '';
          fetchData(); // Refresh the grid
        } else {
          const errData = await res.json();
          alert(`Import failed: ${errData.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        alert(`Error parsing JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle Add/Edit Open
  const handleOpenAddEdit = (cust: Customer | null = null) => {
    if (cust) {
      setSelectedCustomer(cust);
      setName(cust.name);
      setType(cust.type);
      setEmail(cust.email);
      setMobile(cust.mobile);
      setCommissionPercent(String(cust.commissionPercent));
      setCreditLimit(String(cust.creditLimit));
      setBalance(String(cust.balance));
    } else {
      setSelectedCustomer(null);
      setName('');
      setType('Individual');
      setEmail('');
      setMobile('');
      setCommissionPercent('0');
      setCreditLimit('5000');
      setBalance('0');
    }
    setIsAddEditOpen(true);
  };

  // Submit Add/Edit Customer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload = {
      name,
      type,
      email,
      mobile,
      commissionPercent: Number(commissionPercent) || 0,
      creditLimit: Number(creditLimit) || 0,
      balance: Number(balance) || 0,
    };

    try {
      if (selectedCustomer) {
        // Edit Customer
        await fetch(`/api/customers/${selectedCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        // Log action
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Jane Doe',
            role: 'Super Admin',
            action: 'Edit Customer',
            details: `Updated details for customer ${name} (${selectedCustomer.id})`,
          }),
        });
      } else {
        // Add Customer
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // Log action
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Jane Doe',
            role: 'Super Admin',
            action: 'Add Customer',
            details: `Registered new client ${name} under category ${type}`,
          }),
        });
      }

      setIsAddEditOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  };

  // Delete Customer
  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"? This action is irreversible.`)) return;

    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });

      // Log action
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Jane Doe',
          role: 'Super Admin',
          action: 'Delete Customer',
          details: `Deleted client ${customerName} (${id})`,
        }),
      });

      fetchData();
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  // Export to CSV Functionality
  const exportToCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,Name,Type,Email,Mobile,Commission %,Credit Limit,Balance\n';
    
    customers.forEach(c => {
      csvContent += `"${c.id}","${c.name}","${c.type}","${c.email}","${c.mobile}",${c.commissionPercent},${c.creditLimit},${c.balance}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apex_Customers_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and search
  const filteredCustomers = customers.filter(c => {
    if (c.name === 'B2B' || c.name === 'SABRE') return false;

    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter ? c.type === typeFilter : true;
    
    return matchesSearch && matchesType;
  });

  return (
    <div id="customers-desk" className="space-y-6">
      
      {/* Search and Action Header */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          {/* Search Inputs */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, GDS ID, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="Travel Agency">Travel Agencies</option>
            <option value="Corporate">Corporate Clients</option>
            <option value="Individual">Individuals</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <input
            type="file"
            id="import-customers-file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('import-customers-file')?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import JSON</span>
          </button>
          
          <button
            onClick={exportToJson}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={() => handleOpenAddEdit()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customers Data Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono">
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Contact Coordinates</th>
                  <th className="p-4 text-center">Comm. %</th>
                  <th className="p-4 text-right">Credit Limit</th>
                  <th className="p-4 text-right">Balance Due</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-mono">No matching client files located.</td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-500">{cust.id}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{cust.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Joined {new Date(cust.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          cust.type === 'Travel Agency' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          cust.type === 'Corporate' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                          {cust.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="block font-mono text-[11px]">{cust.email}</span>
                        <span className="text-slate-400 text-[10px] font-mono">{cust.mobile}</span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-600">
                        {cust.commissionPercent}%
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900">
                        ${cust.creditLimit.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono font-bold ${cust.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ${cust.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setHistoryCustomer(cust)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="View Flight History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAddEdit(cust)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust.id, cust.name)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* --- ADD / EDIT CUSTOMER MODAL --- */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-tight">{selectedCustomer ? 'Modify Client File' : 'Register New Client Profile'}</h3>
              <button onClick={() => setIsAddEditOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company / Customer Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Al-Mansoori Travel Agency"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Travel Agency">Travel Agency</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Commission %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Coordinates</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., info@agency.com"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g., +971 50..."
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Credit Limit ($)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Opening Balance ($)</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CUSTOMER DETAIL / HISTORY SLIDE SIDEBAR --- */}
      {historyCustomer && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Client file folder</span>
                  <h3 className="font-bold text-base leading-tight mt-0.5">{historyCustomer.name}</h3>
                </div>
                <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Statistics */}
              <div className="p-5 grid grid-cols-3 gap-3 bg-slate-50 border-b border-slate-100 text-center">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Outstanding</p>
                  <p className="text-base font-extrabold text-rose-600 font-mono mt-0.5">${historyCustomer.balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Credit Limit</p>
                  <p className="text-base font-extrabold text-slate-800 font-mono mt-0.5">${historyCustomer.creditLimit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Commission Rate</p>
                  <p className="text-base font-extrabold text-blue-600 font-mono mt-0.5">{historyCustomer.commissionPercent}%</p>
                </div>
              </div>

              {/* Ledger Items */}
              <div className="p-5 space-y-4">
                <h4 className="font-bold text-xs text-slate-900 tracking-tight uppercase font-mono">Associated Air Tickets & Invoices</h4>
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {invoices.filter(i => i.customerId === historyCustomer.id).length === 0 ? (
                    <p className="text-slate-400 text-xs font-mono py-4">No associated ticket transactions registered.</p>
                  ) : (
                    invoices
                      .filter(i => i.customerId === historyCustomer.id)
                      .map(inv => (
                        <div key={inv.id} className="border border-slate-200/80 p-3 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-all bg-white shadow-sm">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600 font-mono">{inv.id}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{inv.pnr}</span>
                            </div>
                            <p className="font-semibold text-slate-700 mt-1">{inv.origin} → {inv.destination} ({inv.airline})</p>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{new Date(inv.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 text-sm block">${inv.netAmount}</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                              inv.status === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="w-full py-2.5 bg-slate-950 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-900 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
