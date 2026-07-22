import React, { useEffect, useState } from 'react';
import { 
  Building, Check, Save, Sliders, Server, DollarSign, Clock, CreditCard, Mail, 
  Share2, Video, ShieldAlert, Bell, HardDrive, FileText, Clipboard, Award, 
  Briefcase, Cookie, RefreshCw, Cpu, Globe, Fingerprint, Database, UploadCloud, DownloadCloud, Trash2
} from 'lucide-react';
import { CommissionRule } from '../types';

interface CompanySettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  iataCode: string;
  defaultCurrency: string;
}

export default function Settings() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings category state
  const [selectedCategory, setSelectedCategory] = useState<string>('brand');

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [iataCode, setIataCode] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  // Indicator
  const [success, setSuccess] = useState(false);

  // Mock settings values (realistic system properties)
  const [systemName, setSystemName] = useState('Noble Travels & Tour Portal');
  const [themeMode, setThemeMode] = useState('dark');
  const [themeColor, setThemeColor] = useState('blue');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [secCurrency, setSecCurrency] = useState('SOS');
  const [enableZaad, setEnableZaad] = useState(true);
  const [enableEdahab, setEnableEdahab] = useState(true);
  const [enableCash, setEnableCash] = useState(true);
  const [mailHost, setMailHost] = useState('smtp.mailgun.org');
  const [mailPort, setMailPort] = useState('587');
  const [gptModel, setGptModel] = useState('gpt-4o');
  const [ipWhitelist, setIpWhitelist] = useState('192.168.1.1, 10.0.0.12');
  const [bioAuth, setBioAuth] = useState(true);

  // Backup & Restore states
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Delete Data states
  const [deleteTickets, setDeleteTickets] = useState(false);
  const [deleteVisas, setDeleteVisas] = useState(false);
  const [deleteCustomers, setDeleteCustomers] = useState(false);
  const [deleteQuotations, setDeleteQuotations] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/companies').then(res => res.json()),
      fetch('/api/commission-rules').then(res => res.json())
    ])
      .then(([compData, ruleData]) => {
        if (compData.length > 0) {
          const comp = compData[0];
          setCompany(comp);
          setName(comp.name);
          setAddress(comp.address);
          setPhone(comp.phone);
          setEmail(comp.email);
          setIataCode(comp.iataCode);
          setDefaultCurrency(comp.defaultCurrency);
        }
        setRules(ruleData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading settings:', err);
        setLoading(false);
      });
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          phone,
          email,
          iataCode,
          defaultCurrency,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        
        // Log action in Audit Trail
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Jane Doe',
            role: 'Super Admin',
            action: 'Update Settings',
            details: `Modified agency settings for ${name} (IATA: ${iataCode})`,
          }),
        });

        setTimeout(() => setSuccess(false), 3000);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleSaveGeneric = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Categories list matching user upload settings index
  const categories = [
    { id: 'brand', name: 'Brand Settings', icon: Sliders },
    { id: 'system', name: 'System Settings', icon: Server },
    { id: 'company', name: 'Company Settings', icon: Building },
    { id: 'currency', name: 'Currency Settings', icon: DollarSign },
    { id: 'time-tracker', name: 'Time Tracker Settings', icon: Clock },
    { id: 'payment', name: 'Payment Settings', icon: CreditCard },
    { id: 'email', name: 'Email Settings', icon: Mail },
    { id: 'pusher', name: 'Pusher Settings', icon: Share2 },
    { id: 'zoom', name: 'Zoom Settings', icon: Video },
    { id: 'recaptcha', name: 'ReCaptcha Settings', icon: ShieldAlert },
    { id: 'email-notification', name: 'Email Notification Settings', icon: Bell },
    { id: 'storage', name: 'Storage Settings', icon: HardDrive },
    { id: 'offer-letter', name: 'Offer Letter Settings', icon: FileText },
    { id: 'joining-letter', name: 'Joining Letter Settings', icon: Clipboard },
    { id: 'experience-certificate', name: 'Experience Certificate Settings', icon: Award },
    { id: 'noc', name: 'NOC Settings', icon: Briefcase },
    { id: 'cookie', name: 'Cookie Settings', icon: Cookie },
    { id: 'cache', name: 'Cache Settings', icon: RefreshCw },
    { id: 'chat-gpt', name: 'Chat GPT Settings', icon: Cpu },
    { id: 'ip-restriction', name: 'IP Restriction Settings', icon: Globe },
    { id: 'biometric', name: 'Biometric Settings', icon: Fingerprint },
    { id: 'backup-restore', name: 'Backup and Restore', icon: Database },
    { id: 'delete-data', name: 'Delete Data', icon: Trash2 }
  ];

  return (
    <div id="settings-workbench" className="space-y-6">
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 font-mono shadow-sm animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configuration parameters saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start font-sans">
        
        {/* Left Side: Vertical Categories Index (matching upload design) */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/40 text-left transition-all text-xs font-bold cursor-pointer group ${
                  isSelected 
                    ? 'bg-[#0091D5] text-white font-extrabold border-b-[#0091D5]' 
                    : 'text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} />
                  <span>{cat.name}</span>
                </div>
                <span className={`text-[9px] transition-transform ${
                  isSelected ? 'text-white translate-x-0.5' : 'text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                }`}>
                  ▶
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Active Settings Form Configuration Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-8 shadow-sm">
          
          {selectedCategory === 'brand' && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Brand Settings</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Configure company logos, themes, and layouts</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-750 dark:text-slate-250">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">System App Name</label>
                  <input
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-150 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Theme Mode</label>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-150 focus:outline-none focus:border-blue-500"
                  >
                    <option value="dark">Dark Theme (Default)</option>
                    <option value="light">Light Theme</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Brand Details
              </button>
            </form>
          )}

          {selectedCategory === 'system' && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">System Settings</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">GDS manifests and core configurations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-750 dark:text-slate-250">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Session Timeout (Minutes)</label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-150 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    id="maintenance-toggle"
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="maintenance-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Maintenance Mode</label>
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save System Settings
              </button>
            </form>
          )}

          {selectedCategory === 'company' && (
            loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <form onSubmit={handleSaveCompany} className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Company Settings</h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">General agency profiles and operational contacts</p>
                </div>

                <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Company / Agency Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-250 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">IATA Accredited Code</label>
                      <input
                        type="text"
                        required
                        value={iataCode}
                        onChange={(e) => setIataCode(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-250 focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Headquarters Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Support Mobile</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Administrative Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">Billing Currency</label>
                      <select
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="AED">AED (Dh)</option>
                        <option value="SAR">SAR (SR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
                >
                  <Save className="w-4 h-4" /> Save Company Details
                </button>
              </form>
            )
          )}

          {selectedCategory === 'currency' && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Currency Settings</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-currency exchange settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-750 dark:text-slate-250">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Primary Currency</label>
                  <select
                    value={defaultCurrency}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Secondary Currency</label>
                  <select
                    value={secCurrency}
                    onChange={(e) => setSecCurrency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-150 focus:outline-none focus:border-blue-500"
                  >
                    <option value="SOS">SOS (Sh.So.)</option>
                    <option value="KES">KES (Ksh)</option>
                    <option value="ETB">ETB (Br)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Currencies
              </button>
            </form>
          )}

          {selectedCategory === 'payment' && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Payment Settings</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Configure cashier wire and client payment gates</p>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-350">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableZaad}
                    onChange={(e) => setEnableZaad(e.target.checked)}
                    id="zaad-toggle"
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="zaad-toggle">Enable ZAAD Account wire</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableEdahab}
                    onChange={(e) => setEnableEdahab(e.target.checked)}
                    id="edahab-toggle"
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="edahab-toggle">Enable EDAHAB Account wire</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableCash}
                    onChange={(e) => setEnableCash(e.target.checked)}
                    id="cash-toggle"
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="cash-toggle">Enable CASH Account desk</label>
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <Save className="w-4 h-4" /> Save Gateways
              </button>
            </form>
          )}

          {selectedCategory === 'email' && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Email Settings</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Configure SMTP credentials for manifest reminders</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-750 dark:text-slate-250">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">SMTP Host</label>
                  <input
                    type="text"
                    value={mailHost}
                    onChange={(e) => setMailHost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-150 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">SMTP Port</label>
                  <input
                    type="text"
                    value={mailPort}
                    onChange={(e) => setMailPort(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-150 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save SMTP Parameters
              </button>
            </form>
          )}

          {selectedCategory === 'chat-gpt' && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Chat GPT Settings</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">OpenAI engine keys for smart manifests assistance</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-750 dark:text-slate-250">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">GPT Model engine</label>
                  <select
                    value={gptModel}
                    onChange={(e) => setGptModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-150 focus:outline-none focus:border-blue-500"
                  >
                    <option value="gpt-4o">gpt-4o (Accurate)</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo (Fast)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">API Authorization Key</label>
                  <input
                    type="password"
                    placeholder="sk-proj-••••••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-150"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save OpenAI key
              </button>
            </form>
          )}

          {selectedCategory === 'ip-restriction' && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">IP Restriction Settings</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Restrict login entries to company network IPs</p>
              </div>

              <div className="space-y-1.5 text-xs font-semibold text-slate-750 dark:text-slate-250">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Whitelisted IPs (comma separated)</label>
                <textarea
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-150 h-20"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save IP rules
              </button>
            </form>
          )}

          {selectedCategory === 'biometric' && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Biometric Settings</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Configure system fingerprints or facial scanners</p>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-750 dark:text-slate-350">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={bioAuth}
                    onChange={(e) => setBioAuth(e.target.checked)}
                    id="bio-toggle"
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="bio-toggle">Enable Face ID / Windows Hello login</label>
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <Save className="w-4 h-4" /> Save Biometrics
              </button>
            </form>
          )}

          {selectedCategory === 'backup-restore' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Backup and Restore</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Download entire system records or upload backups</p>
              </div>

              {restoreSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 font-mono shadow-sm">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All database collections restored successfully!</span>
                </div>
              )}

              {restoreError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 font-mono shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Area */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-750 flex flex-col justify-between space-y-4">
                  <div>
                    <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Download Database Backup</h5>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Generates a comprehensive snapshot archive containing all **Manage Tickets**, **Manage Visas**, **Client Accounts**, and **Quotations** proposals. Use this to secure offline copies.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={backupLoading}
                    onClick={async () => {
                      setBackupLoading(true);
                      try {
                        const res = await fetch('/api/backup');
                        if (res.ok) {
                          const data = await res.json();
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `noble-agency-backup-${new Date().toLocaleDateString('en-CA')}.json`;
                          a.click();
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setBackupLoading(false);
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <DownloadCloud className="w-4 h-4" /> {backupLoading ? 'Compiling...' : 'Export JSON Backup'}
                  </button>
                </div>

                {/* Restore Area */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-750 flex flex-col justify-between space-y-4">
                  <div>
                    <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Restore from Backup</h5>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Uploads a previously exported JSON backup file to override all collections in this environment. <span className="text-rose-600 dark:text-rose-400 font-bold uppercase">Warning: This will overwrite current entries.</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="file"
                      id="upload-backup-file"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setRestoreLoading(true);
                        setRestoreSuccess(false);
                        setRestoreError('');

                        try {
                          const text = await file.text();
                          const backupData = JSON.parse(text);

                          const res = await fetch('/api/restore', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(backupData)
                          });

                          if (res.ok) {
                            setRestoreSuccess(true);
                            setTimeout(() => setRestoreSuccess(false), 4000);
                          } else {
                            const errData = await res.json();
                            setRestoreError(errData.error || 'Failed to restore database backup.');
                          }
                        } catch (err) {
                          setRestoreError('Invalid backup file formatting.');
                        } finally {
                          setRestoreLoading(false);
                          e.target.value = ''; // clear input
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={restoreLoading}
                      onClick={() => document.getElementById('upload-backup-file')?.click()}
                      className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <UploadCloud className="w-4 h-4" /> {restoreLoading ? 'Restoring...' : 'Import JSON Backup'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedCategory === 'delete-data' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Delete Data</h4>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-widest mt-1">Permanently remove database collections</p>
              </div>

              {deleteSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 font-mono shadow-sm">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Selected database collections cleared successfully!</span>
                </div>
              )}

              {deleteError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 font-mono shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-750 space-y-6">
                <div>
                  <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Selective Deletion Checkbox</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Check the collections you wish to permanently empty. Double check your selections before submitting.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-755 dark:text-slate-350 font-sans">
                  <label className="flex items-center gap-3 bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteTickets}
                      onChange={(e) => setDeleteTickets(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>Delete Manage Tickets (Invoices)</span>
                  </label>

                  <label className="flex items-center gap-3 bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteVisas}
                      onChange={(e) => setDeleteVisas(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>Delete Manage Visas</span>
                  </label>

                  <label className="flex items-center gap-3 bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteCustomers}
                      onChange={(e) => setDeleteCustomers(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>Delete Client Accounts (Customers)</span>
                  </label>

                  <label className="flex items-center gap-3 bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteQuotations}
                      onChange={(e) => setDeleteQuotations(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>Delete Quotation Tenders</span>
                  </label>
                </div>

                <div className="border-t border-slate-200/65 dark:border-slate-750/50 pt-5 space-y-3">
                  <div className="space-y-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      Type <span className="text-rose-600 font-extrabold">"DELETE"</span> to authorize action
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE here"
                      className="w-full sm:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-rose-500 rounded-xl"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={
                      deleteLoading || 
                      deleteConfirmText !== 'DELETE' || 
                      (!deleteTickets && !deleteVisas && !deleteCustomers && !deleteQuotations)
                    }
                    onClick={async () => {
                      if (!confirm('Are you absolutely sure? This action is irreversible.')) return;
                      setDeleteLoading(true);
                      setDeleteSuccess(false);
                      setDeleteError('');

                      try {
                        const res = await fetch('/api/delete-data', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            deleteTickets,
                            deleteVisas,
                            deleteCustomers,
                            deleteQuotations
                          })
                        });

                        if (res.ok) {
                          setDeleteSuccess(true);
                          setDeleteTickets(false);
                          setDeleteVisas(false);
                          setDeleteCustomers(false);
                          setDeleteQuotations(false);
                          setDeleteConfirmText('');
                          setTimeout(() => setDeleteSuccess(false), 4000);
                        } else {
                          const errData = await res.json();
                          setDeleteError(errData.error || 'Failed to clear selected database collections.');
                        }
                      } catch (err) {
                        setDeleteError('Network error connecting to server.');
                      } finally {
                        setDeleteLoading(false);
                      }
                    }}
                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> {deleteLoading ? 'Clearing Data...' : 'Permanently Clear Selected Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder Fallback for remaining menu categories */}
          {!['brand', 'system', 'company', 'currency', 'payment', 'email', 'chat-gpt', 'ip-restriction', 'biometric', 'backup-restore', 'delete-data'].includes(selectedCategory) && (
            <form onSubmit={handleSaveGeneric} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm uppercase">
                  {categories.find(c => c.id === selectedCategory)?.name || 'General Setting'}
                </h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Configure preference modules for this environment</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-xl border border-slate-100 dark:border-slate-750 space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked id="gen-toggle" className="w-4 h-4 rounded text-blue-600" />
                  <label htmlFor="gen-toggle" className="font-bold text-slate-700 dark:text-slate-350">Enable dynamic features for this module</label>
                </div>

                <div className="space-y-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Module configuration details</label>
                  <input
                    type="text"
                    defaultValue="Standard Configuration Value"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
