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
  Moon,
  UserPlus,
  TrendingUp,
  Fingerprint,
  Key,
  Check,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Modules
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Tickets from './components/Tickets';
import Refunds from './components/Refunds';
import Settings from './components/Settings';
import Staff from './components/Staff';
import DailyReport from './components/DailyReport';
import LoadingScreen from './components/LoadingScreen';
import HeaderLogo from './components/HeaderLogo';
import Login from './components/Login';
import Visa from './components/Visa';
import Quotation from './components/Quotation';
import ClientInvoice from './components/ClientInvoice';
// @ts-ignore
import ethiopianBg from './assets/images/ethiopian_plane_bg_1784506931193.jpg';

type Tab = 'dashboard' | 'customers' | 'client-invoice' | 'tickets' | 'refunds' | 'settings' | 'staff' | 'daily-report' | 'visa' | 'quotation';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // User Password Changer states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState(false);
  const [changePassError, setChangePassError] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);

  const [tabHistory, setTabHistory] = useState<Tab[]>([]);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === activeTab) return;
    setTabHistory(prev => [...prev, activeTab]);
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
    }, 450); // Switch tab mid-way through animation
  };

  const handleGoBack = () => {
    // Dispatch custom event so sub-views (like Edit Ticket, View Letter, etc.) reset to list view first!
    const backEvent = new CustomEvent('noble_go_back', { cancelable: true });
    const wasHandledBySubView = !window.dispatchEvent(backEvent);

    // If sub-view handled the back action (e.g. going from Edit Ticket -> Ticket Manager list), stay on current tab!
    if (wasHandledBySubView) return;

    if (tabHistory.length > 0) {
      const previous = tabHistory[tabHistory.length - 1];
      setTabHistory(prev => prev.slice(0, -1));
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab(previous);
      }, 300);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab('dashboard');
      }, 300);
    }
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

  const [loggedInEmail, setLoggedInEmail] = useState<string>(() => {
    return localStorage.getItem('noble_logged_in_email') || 'admin@noble.com';
  });

  const [loggedInName, setLoggedInName] = useState<string>(() => {
    return localStorage.getItem('noble_logged_in_name') || 'Jane Doe';
  });

  const [userRole, setUserRole] = useState<'admin' | 'cashier' | 'user'>(() => {
    return (localStorage.getItem('apex_user_role') as any) || 'admin';
  });

  const handleRoleChange = (role: 'admin' | 'cashier' | 'user') => {
    setUserRole(role);
    localStorage.setItem('apex_user_role', role);
    // Automatically update the displayed logged-in name if the admin toggles privilege role for simulation/testing
    if (loggedInRole === 'admin') {
      if (role === 'admin') setLoggedInName('Jane Doe');
      if (role === 'cashier') setLoggedInName('Mohamed Ibrahim');
      if (role === 'user') setLoggedInName('Hamdi Ahmed');
    }
  };

  const handleLoginSuccess = (role: 'admin' | 'cashier' | 'user', email: string, name: string) => {
    setLoggedInRole(role);
    localStorage.setItem('noble_logged_in_role', role);
    setUserRole(role);
    localStorage.setItem('apex_user_role', role);
    setLoggedInEmail(email);
    localStorage.setItem('noble_logged_in_email', email);
    
    let resolvedName = name;
    if (!resolvedName) {
      if (email.toLowerCase() === 'admin@noble.com') resolvedName = 'Jane Doe';
      else if (email.toLowerCase() === 'cashier@noble.com') resolvedName = 'Mohamed Ibrahim';
      else if (email.toLowerCase() === 'agent@noble.com') resolvedName = 'Hamdi Ahmed';
      else resolvedName = email.split('@')[0];
    }
    setLoggedInName(resolvedName);
    localStorage.setItem('noble_logged_in_name', resolvedName);
    
    localStorage.setItem('noble_logged_in', 'true');
    setIsLoggedIn(true);
    setActiveTab('dashboard');
    setTabHistory([]);
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
      case 'client-invoice':
        return {
          title: 'Client Invoice Metrics',
          subtitle: 'Detailed report of client net revenues, discounts, passenger ticket volumes, and refunds',
        };
      case 'tickets':
        return {
          title: 'Manage Ticket',
          subtitle: 'Search, insert, update, edit, and delete passenger GDS manifests and flight segments',
        };
      case 'refunds':
        return {
          title: 'Refund Claims Board',
          subtitle: 'Approve ticket returns, process flight cancellations, and void ledger entries',
        };
      case 'settings':
        return {
          title: 'Agency Configuration',
          subtitle: 'Maintain IATA codes, BSP default currencies, and GDS routing rules',
        };
      case 'staff':
        return {
          title: 'Staff Registry',
          subtitle: 'Register new web application staff, manage credentials, and assign system permissions',
        };
      case 'daily-report':
        return {
          title: 'Daily Ticket Report',
          subtitle: "Track today's passenger manifests, base fare, net amount, and GDS commissions",
        };
      case 'visa':
        return {
          title: 'Manage Visa',
          subtitle: 'Register and update customer visa applications, track sponsorships, and process entry permits',
        };
      case 'quotation':
        return {
          title: 'Quotation Center',
          subtitle: 'Write and generate professional travel quotation letters for corporate and individual clients',
        };
    }
  };

  const { title, subtitle } = getHeaderDetails();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Globe, category: 'Travel Desk' },
    { id: 'tickets', label: 'Manage Ticket', icon: Ticket, category: 'Travel Desk' },
    { id: 'visa', label: 'Manage Visa', icon: Fingerprint, category: 'Travel Desk' },
    { id: 'customers', label: 'Client Accounts', icon: Users, category: 'Travel Desk' },
    ...(loggedInRole === 'admin' ? [{ id: 'client-invoice', label: 'Client Invoice', icon: FileText, category: 'Travel Desk' }] : []),
    { id: 'daily-report', label: 'Daily Report', icon: TrendingUp, category: 'Travel Desk' },
    ...(loggedInRole === 'admin' ? [{ id: 'quotation', label: 'Quotation', icon: FileText, category: 'Travel Desk' }] : []),
    
    { id: 'refunds', label: 'Refund Claims', icon: RotateCcw, category: 'Settlement Office' },
    { id: 'settings', label: 'Agency Settings', icon: SettingsIcon, category: 'Settlement Office' },
    ...(loggedInRole === 'admin' ? [{ id: 'staff', label: 'Staff Registry', icon: UserPlus, category: 'Settlement Office' }] : []),
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
              {loggedInName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'JD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate text-xs leading-none">
                {loggedInName}
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
              <div className="flex flex-wrap items-center gap-3">
                {(tabHistory.length > 0 || activeTab !== 'dashboard') && (
                  <button
                    onClick={handleGoBack}
                    className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:border-slate-350"
                    title="Return to previous page or view"
                  >
                    <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Back to Previous Page
                  </button>
                )}
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
                  setOldPassword('');
                  setNewPassword('');
                  setChangePassSuccess(false);
                  setChangePassError('');
                  setIsChangePasswordOpen(true);
                }}
                className="bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                title="Change secure password"
              >
                🔑 Change Password
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('noble_logged_in');
                  localStorage.removeItem('noble_logged_in_role');
                  localStorage.removeItem('noble_logged_in_email');
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
                {activeTab === 'dashboard' && <Dashboard userRole={userRole} loggedInEmail={loggedInEmail} />}
                {activeTab === 'customers' && <Customers />}
                {activeTab === 'client-invoice' && loggedInRole === 'admin' && <ClientInvoice />}
                {activeTab === 'tickets' && <Tickets userRole={userRole} loggedInEmail={loggedInEmail} loggedInName={loggedInName} />}
                {activeTab === 'visa' && <Visa userRole={userRole} loggedInEmail={loggedInEmail} loggedInName={loggedInName} />}
                {activeTab === 'quotation' && loggedInRole === 'admin' && <Quotation userRole={userRole} loggedInEmail={loggedInEmail} />}
                {activeTab === 'refunds' && <Refunds />}
                {activeTab === 'daily-report' && <DailyReport userRole={userRole} loggedInEmail={loggedInEmail} />}
                {activeTab === 'settings' && <Settings />}
                {activeTab === 'staff' && loggedInRole === 'admin' && <Staff />}
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

      {/* Change Password Modal Overlay */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-slate-800 dark:text-slate-100">
            <button 
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">Change Password</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Set new security credential for {loggedInEmail}</p>
              </div>
            </div>

            {changePassSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 font-mono">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            {changePassError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 font-mono">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{changePassError}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!oldPassword || !newPassword) return;
              setChangePassLoading(true);
              setChangePassError('');
              setChangePassSuccess(false);

              try {
                const res = await fetch('/api/users/change-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: loggedInEmail, oldPassword, password: newPassword })
                });
                if (res.ok) {
                  setChangePassSuccess(true);
                  setOldPassword('');
                  setNewPassword('');
                  setTimeout(() => setIsChangePasswordOpen(false), 2000);
                } else {
                  const data = await res.json();
                  setChangePassError(data.error || 'Failed to change password.');
                }
              } catch (err) {
                setChangePassError('Network error connecting to server.');
              } finally {
                setChangePassLoading(false);
              }
            }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Current Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">New Secure Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changePassLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {changePassLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
