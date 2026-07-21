import { useEffect, useState } from 'react';
import { Shield, Building, Mail, BellRing, Settings as SettingsIcon, Check, Key } from 'lucide-react';
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

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [iataCode, setIataCode] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  // Indicators
  const [success, setSuccess] = useState(false);

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

  return (
    <div id="settings-workbench" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Left column: General Agency Profile Settings */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-sm">Agency Profile</h4>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 font-mono">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Company preferences saved successfully!</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSaveCompany} className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company / Agency Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">IATA Accredited Code</label>
                <input
                  type="text"
                  required
                  value={iataCode}
                  onChange={(e) => setIataCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Headquarters Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Support Mobile</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Administrative Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Billing Currency</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="AED">AED (Dh)</option>
                  <option value="SAR">SAR (SR)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              Update Preferences
            </button>
          </form>
        )}
      </div>

      {/* 2. Right column: Active System Commission Rules */}
      <div className="space-y-6">
        
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">GDS Commission Policy</h4>
          </div>

          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="border border-slate-150 p-3.5 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{rule.airlineCode} Rules</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Applied on GDS Amadeus link</span>
                </div>
                <span className="font-mono font-extrabold text-blue-600 text-sm bg-white border border-slate-150 px-2.5 py-1 rounded-lg shadow-sm">
                  {rule.commissionPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security / System status */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 text-xs font-semibold">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">Integrations & Credentials</h4>
          </div>
          
          <div className="space-y-3 text-slate-600">
            <div className="flex justify-between items-center">
              <span>Amadeus GDS Node</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded">CONNECTED</span>
            </div>
            <div className="flex justify-between items-center">
              <span>SABRE BSP Gateway</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded">ONLINE</span>
            </div>
            <div className="flex justify-between items-center">
              <span>WhatsApp Alerts Relay</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded">ACTIVE</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
