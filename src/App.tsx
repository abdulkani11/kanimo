import { useState, useEffect } from 'react';
import { 
  Globe, 
  Users, 
  Ticket, 
  FileText, 
  CreditCard, 
  RotateCcw, 
  BarChart2, 
  Settings as SettingsIcon,
  Menu, 
  X,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Modules
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Tickets from './components/Tickets';
import Invoices from './components/Invoices';
import Payments from './components/Payments';
import Refunds from './components/Refunds';
import Reports from './components/Reports';
import Settings from './components/Settings';
import LoadingScreen from './components/LoadingScreen';
import HeaderLogo from './components/HeaderLogo';
import Login from './components/Login';
// @ts-ignore
import ethiopianBg from './assets/images/ethiopian_plane_bg_1784506931193.jpg';

type Tab = 'dashboard' | 'customers' | 'tickets' | 'invoices' | 'payments' | 'refunds' | 'reports' | 'settings';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
    }, 450); // Switch tab mid-way through animation
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('noble_logged_in') === 'true';
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('noble_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('noble_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('noble_dark_mode', 'false');
    }
  }, [darkMode]);

  const [loggedInRole, setLoggedInRole] = useState<'admin' | 'cashier' | 'user'>(() => {
    return (localStorage.getItem('noble_logged_in_role') as any) || (localStorage.getItem('apex_user_role') as any) || 'admin';
  });

  const [userRole, setUserRole] = useState<'admin' | 'cashier' | 'user'>(() => {
    return (localStorage.getItem('apex_user_role') as any) || 'admin';
  });

  const handleRoleChange = (role: 'admin' | 'cashier' | 'user') => {
    setUserRole(role);
    localStorage.setItem('apex_user_role', role);
  };

  const handleLoginSuccess = (role: 'admin' | 'cashier' | 'user') => {
    setLoggedInRole(role);
    localStorage.setItem('noble_logged_in_role', role);
    setUserRole(role);
    localStorage.setItem('apex_user_role', role);
    localStorage.setItem('noble_logged_in', 'true');
    setIsLoggedIn(true);
  };

  // Dynamically compute header info based on active tab
  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'NOBLE TRAVEL AGENT',
          subtitle: 'Management System Portal',
        };
      case 'customers':
        return {
          title: 'Client Database',
          subtitle: 'Manage travel agency profiles, corporate contracts, and credit limits',
        };
      case 'tickets':
        return {
          title: 'Manage Ticket',
          subtitle: 'Search, insert, update, edit, and delete passenger GDS manifests and flight segments',
        };
      case 'invoices':
        return {
          title: 'Invoice Center',
          subtitle: 'Audit ticket documents, print receipts, and dispatch customer reminders',
        };
      case 'payments':
        return {
          title: 'Settlement Office',
          subtitle: 'Log partner deposits, bank wire clearance, and partial payments',
        };
      case 'refunds':
        return {
          title: 'Refund Claims Board',
          subtitle: 'Approve ticket returns, process flight cancellations, and void ledger entries',
        };
      case 'reports':
        return {
          title: 'Reports & Analytics',
          subtitle: 'Access aging accounts, profitability statistics, and cash flow diaries',
        };
      case 'settings':
        return {
          title: 'Agency Configuration',
          subtitle: 'Maintain IATA codes, BSP default currencies, and GDS routing rules',
        };
    }
  };

  const { title, subtitle } = getHeaderDetails();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Globe, category: 'Travel Desk' },
    { id: 'tickets', label: 'Manage Ticket', icon: Ticket, category: 'Travel Desk' },
    { id: 'customers', label: 'Client Accounts', icon: Users, category: 'Travel Desk' },
    
    { id: 'invoices', label: 'Invoices & Receipts', icon: FileText, category: 'Settlement Office' },
    { id: 'payments', label: 'Payments Wire', icon: CreditCard, category: 'Settlement Office' },
    { id: 'refunds', label: 'Refund Claims', icon: RotateCcw, category: 'Settlement Office' },
    { id: 'reports', label: 'Reports Desk', icon: BarChart2, category: 'Settlement Office' },
    { id: 'settings', label: 'Agency Settings', icon: SettingsIcon, category: 'Settlement Office' },
  ];

  if (isAppLoading) {
    return <LoadingScreen onFinished={() => setIsAppLoading(false)} />;
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="apex-app-root" className="min-h-screen bg-[#F8FAFC] flex font-sans select-none antialiased relative overflow-hidden">
      
      {/* Opacity Controlled Aircraft Background Image */}
      <div 
        className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${ethiopianBg})`, 
          opacity: darkMode ? 0.08 : 0.40,
          transition: 'opacity 0.3s ease-in-out',
          zIndex: 0
        }}
      />
      
      {/* 1. Desktop Left Sidebar */}
      <aside id="bento-sidebar" className="hidden lg:flex w-72 bg-[#0F172A] text-slate-300 flex-col shrink-0 border-r border-slate-800 relative z-10">
        <div className="p-8 pb-6">
          <div className="mb-8 cursor-pointer" onClick={() => handleTabChange('dashboard')}>
            <HeaderLogo sidebar={true} />
          </div>

          <div className="h-px bg-slate-800/80 mb-6"></div>

          {/* Navigation Directory sorted by category */}
          <nav className="space-y-6">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Travel Desk</div>
              <ul className="space-y-1.5">
                {navItems.filter(item => item.category === 'Travel Desk').map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        id={`sidebar-tab-${item.id}`}
                        onClick={() => handleTabChange(item.id as Tab)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isActive 
                            ? 'text-white bg-slate-850 border-l-4 border-blue-500 pl-4 bg-slate-800/60' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Settlement Office</div>
              <ul className="space-y-1.5">
                {navItems.filter(item => item.category === 'Settlement Office').map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        id={`sidebar-tab-${item.id}`}
                        onClick={() => handleTabChange(item.id as Tab)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isActive 
                            ? 'text-white bg-slate-850 border-l-4 border-blue-500 pl-4 bg-slate-800/60' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>

        {/* User Account Section at the bottom of Sidebar */}
        <div className="mt-auto p-5 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
          <div className="flex items-center gap-3 text-white text-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase shadow-inner">
              {userRole === 'admin' ? 'JD' : userRole === 'cashier' ? 'HI' : 'AK'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate text-xs leading-none">
                {userRole === 'admin' ? 'Jane Doe' : userRole === 'cashier' ? 'Hamze Ismail Ali' : 'Abdi Kanim'}
              </p>
              <p className="text-[9px] font-mono text-blue-400 mt-1.5 uppercase tracking-wider font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                {userRole === 'admin' ? 'Super Admin' : userRole === 'cashier' ? 'Finance Cashier' : 'Standard User'}
              </p>
            </div>
          </div>
          
          {loggedInRole === 'admin' && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                System Active Role
              </label>
              <select
                value={userRole}
                onChange={(e) => handleRoleChange(e.target.value as any)}
                className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm hover:border-slate-700 transition-colors"
              >
                <option value="admin">🔑 Admin Privilege</option>
                <option value="cashier">💵 Cashier Privilege</option>
                <option value="user">👤 User / Agent</option>
              </select>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Mobile Header bar */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="lg:hidden bg-[#0F172A] text-white px-4 py-3 sticky top-0 z-30 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => handleTabChange('dashboard')}>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-none">NOBLE TRAVEL AGENCY</span>
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider mt-0.5 block">IATA Registry Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile menu drop-down list */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#0F172A] border-b border-slate-800 overflow-hidden z-20 sticky top-12 text-slate-300"
            >
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabChange(item.id as Tab);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        isActive 
                          ? 'text-white bg-slate-800 border-l-4 border-blue-500 pl-4' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Main Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col justify-between">
          
          {/* Header Bar */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-750 text-[11px] font-black tracking-widest uppercase rounded-xl border border-blue-100 shadow-sm">
                    {title}
                  </span>
                </h1>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-2 font-semibold">{subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0 items-center">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600 p-2.5 rounded-xl flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all text-slate-700 dark:text-slate-200"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              </button>

              {/* Top Role Display (Read-Only) */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-450 uppercase tracking-widest font-mono">Role:</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
                  {userRole === 'admin' ? '🔑 Admin' : userRole === 'cashier' ? '💵 Cashier' : '👤 User'}
                </span>
              </div>

              <button
                id="btn-replay-intro"
                onClick={() => setIsAppLoading(true)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all text-left"
                title="Replay Loading Intro Animation"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase font-mono">GDS SATELLITE: LIVE</span>
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('noble_logged_in');
                  localStorage.removeItem('noble_logged_in_role');
                  setIsLoggedIn(false);
                }}
                className="bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                title="Secure Sign Out"
              >
                Sign Out
              </button>
            </div>
          </header>

          {/* Main Content Component Port */}
          <div id="apex-content-slot" className="flex-1 mb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'customers' && <Customers />}
                {activeTab === 'tickets' && <Tickets userRole={userRole} />}
                {activeTab === 'invoices' && <Invoices />}
                {activeTab === 'payments' && <Payments />}
                {activeTab === 'refunds' && <Refunds />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'settings' && <Settings />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Humble, Clean Corporate Footer */}
          <footer id="apex-footer" className="text-slate-400 py-6 border-t border-slate-200/60 text-center font-mono text-[9px] mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>© 2026 NOBLE TRAVEL AGENCY ALLIANCE CORP. ALL BILLING AND TICKETING SERVERS ENCRYPTED SECURELY.</p>
              <div className="flex items-center gap-4 text-slate-500">
                <span>SECURE AMADEUS NODE</span>
                <span className="h-3 w-px bg-slate-300"></span>
                <span>IATA ACCREDITED BSP AGENT</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {isTransitioning && (
        <LoadingScreen 
          isTransition={true} 
          onFinished={() => setIsTransitioning(false)} 
        />
      )}
    </div>
  );
}
