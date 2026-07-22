import { useEffect, useState } from 'react';
import { FileText, Calendar, Users, DollarSign, Search, ShieldAlert, Sparkles, Receipt, Globe } from 'lucide-react';

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
  status: string;
  createdAt: string;
  createdBy?: string;
  salesDate?: string;
}

interface StaffUser {
  email: string;
  role: string;
}

interface DailyReportProps {
  userRole?: 'admin' | 'cashier' | 'user';
  loggedInEmail?: string;
}

export default function DailyReport({ userRole = 'admin', loggedInEmail = 'admin@noble.com' }: DailyReportProps) {
  const [invoices, setInvoices] = useState<TicketInvoice[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  
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

  // Fetch invoices and staff users
  const fetchData = async () => {
    setLoading(true);
    try {
      const invoicesRes = await fetch('/api/invoices');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
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

  // Filtering Logic
  const filteredInvoices = invoices.filter((inv) => {
    // 1. Date Range Filter
    const invDateStr = inv.salesDate || (inv.createdAt ? inv.createdAt.split('T')[0] : '');
    if (invDateStr < startDate || invDateStr > endDate) {
      return false;
    }

    // 2. Vendor / GDS System Filter
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

    // 3. User Filter (Admin can filter by user, Cashiers/Agents can only see their own)
    const creatorEmail = (inv.createdBy || 'admin@noble.com').toLowerCase();
    
    if (userRole === 'admin' || userRole === 'cashier') {
      if (selectedUser !== 'all' && creatorEmail !== selectedUser.toLowerCase()) {
        return false;
      }
    } else {
      // Non-admin users are locked to their own invoices (handling simulation fallback for admin)
      const effectiveEmail = loggedInEmail.toLowerCase() === 'admin@noble.com'
        ? (userRole === 'cashier' ? 'cashier@noble.com' : 'agent@noble.com')
        : loggedInEmail;
      
      if (creatorEmail !== effectiveEmail.toLowerCase()) {
        return false;
      }
    }

    // 4. Text Search (Search by Ticket Number or Passenger Name)
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

  // Calculate Aggregations
  const totalTickets = filteredInvoices.length;
  const totalBaseFare = filteredInvoices.reduce((sum, inv) => sum + (inv.baseFare || 0), 0);
  const totalNet = filteredInvoices.reduce((sum, inv) => sum + (inv.netAmount || 0), 0);
  const totalVendorComm = filteredInvoices.reduce((sum, inv) => sum + (inv.vendorCommission || 0), 0);
  const totalCustComm = filteredInvoices.reduce((sum, inv) => sum + (inv.customerCommission || 0), 0);

  return (
    <div className="space-y-6">
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
                className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
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
                className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
              />
            </div>
          </div>

          {/* Vendor / System selector */}
          <div className="space-y-1.5 font-sans">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Company / GDS</label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-bold cursor-pointer min-w-[170px]"
              >
                <option value="all">🌐 All Vendors</option>
                <option value="b2b">💼 B2B Consolidator</option>
                <option value="sabre">✈️ SABRE GDS</option>
              </select>
            </div>
          </div>

          {/* User selector (Admin & Cashier) */}
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
                  {staffUsers.map((user) => (
                    <option key={user.email} value={user.email}>
                      {user.email} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Text Search Input */}
        <div className="space-y-1.5 md:w-80">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Search Manifest</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket # or passenger..."
              className="w-full bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Bento Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Tickets */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tickets Issued</p>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{totalTickets}</h4>
          </div>
        </div>

        {/* Total Net Volume */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Net Revenue</p>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              $ {totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
              Base Fare: $ {totalBaseFare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Vendor Commission */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Commission</p>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              $ {totalVendorComm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        </div>

        {/* Total Customer Commission */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-violet-600 dark:text-violet-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer Comm.</p>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              $ {totalCustComm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        </div>
      </div>

      {/* Tickets Report Table */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">Daily Ticket Manifest</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              {startDate === endDate ? `Reporting for ${startDate}` : `Reporting from ${startDate} to ${endDate}`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-750">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-750 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                <th className="px-5 py-3.5 text-center w-12">#</th>
                <th className="px-5 py-3.5">Ticket Number</th>
                <th className="px-5 py-3.5">Passenger Name</th>
                <th className="px-5 py-3.5 text-right">Base Fare</th>
                <th className="px-5 py-3.5 text-right">Net Amount</th>
                <th className="px-5 py-3.5 text-right">Vendor Comm.</th>
                <th className="px-5 py-3.5 text-right">Customer Comm.</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                {(userRole === 'admin' || userRole === 'cashier') && selectedUser === 'all' && (
                  <th className="px-5 py-3.5">Created By</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-750 text-xs font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={(userRole === 'admin' || userRole === 'cashier') && selectedUser === 'all' ? 9 : 8} className="px-5 py-8 text-center text-slate-400 font-mono text-[11px]">
                    Loading daily report manifest...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={(userRole === 'admin' || userRole === 'cashier') && selectedUser === 'all' ? 9 : 8} className="px-5 py-8 text-center text-slate-400 font-mono text-[11px]">
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
                    <td className="px-5 py-3.5 text-slate-900 dark:text-white">
                      {inv.passengers[0]?.name || 'Unknown Passenger'}
                      {inv.passengers.length > 1 && (
                        <span className="text-[9px] font-semibold text-slate-450 block mt-0.5">
                          + {inv.passengers.length - 1} more passengers
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-900 dark:text-slate-100">
                      $ {(inv.baseFare || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <td className="px-5 py-3.5 text-center">
                      {(() => {
                        const statusLower = (inv.status || 'Paid').toLowerCase();
                        if (statusLower === 'refunded') {
                          return (
                            <span style={{ fontWeight: 900 }} className="bg-indigo-500/10 text-indigo-650 border border-indigo-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                              Refunded
                            </span>
                          );
                        } else if (statusLower === 'paid') {
                          return (
                            <span style={{ fontWeight: 900 }} className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                              Paid
                            </span>
                          );
                        } else if (statusLower === 'partial') {
                          return (
                            <span style={{ fontWeight: 900 }} className="bg-amber-500/10 text-amber-650 border border-amber-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
                              Partial
                            </span>
                          );
                        } else {
                          return (
                            <span style={{ fontWeight: 900 }} className="bg-rose-500/10 text-rose-600 border border-rose-500/15 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg text-center shadow-sm inline-block min-w-[70px]">
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
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
