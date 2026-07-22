import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ShieldAlert, Globe, Compass, ArrowRight } from 'lucide-react';
// @ts-ignore
import logoImg from '../assets/images/dual_airline_logo.png';
import loginBg from '../assets/images/login_bg.png';

interface LoginProps {
  onLoginSuccess: (role: 'admin' | 'cashier' | 'user', email: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(true);

  // Hardcoded demo credentials
  const credentials = {
    'admin@noble.com': { password: 'admin123', role: 'admin' as const },
    'cashier@noble.com': { password: 'cashier123', role: 'cashier' as const },
    'agent@noble.com': { password: 'agent123', role: 'user' as const }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          onLoginSuccess(data.user.role, data.user.email);
          return;
        }
      }

      const errData = await res.json().catch(() => ({}));
      setError(errData.error || 'Invalid email address or secure password. Please verify credentials.');
    } catch (err) {
      console.warn('Backend login API unavailable, falling back to local credentials:', err);
      // Fallback to local credentials for offline resilience
      const matched = credentials[email.toLowerCase() as keyof typeof credentials];
      if (matched && matched.password === password) {
        onLoginSuccess(matched.role, email);
      } else {
        setError('Invalid email address or secure password. Please verify credentials.');
      }
    }
  };

  const autoFill = (role: 'admin' | 'cashier' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@noble.com');
      setPassword('admin123');
    } else if (role === 'cashier') {
      setEmail('cashier@noble.com');
      setPassword('cashier123');
    } else {
      setEmail('agent@noble.com');
      setPassword('agent123');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between select-none antialiased relative overflow-hidden font-sans">
      
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* 30% Opacity Window Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${loginBg})`, 
            opacity: 0.30,
            zIndex: 0
          }}
        />

        {/* Soft sky-blue gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#f3f8fc] via-white to-[#e6f4fd] opacity-80"></div>
        
        {/* Vector Grid lines */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:5rem_5rem]"></div>
        
        {/* Subtle cloud motif overlays */}
        <div className="absolute top-12 left-10 w-96 h-40 bg-white/40 blur-3xl rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-[450px] h-52 bg-blue-100/30 blur-3xl rounded-full"></div>

        {/* Faint, large, elegant compass rose motif on the right */}
        <div className="absolute right-[-10%] top-[15%] text-blue-500/[0.04] pointer-events-none">
          <Compass className="w-[600px] h-[600px] animate-spin-slow" strokeWidth={0.5} />
        </div>
      </div>

      {/* Header bar with Live Status Indicators */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center">
        {/* Left branding */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white border border-blue-500 shadow-md">
            <Globe className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800 tracking-tight block">NOBLE TRAVEL AGENCY</span>
            <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-widest block">Accredited BSP Agent</span>
          </div>
        </div>

        {/* Right Live Status indicators */}
        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-[10px] font-bold text-slate-500 tracking-wide">Offline Guest</span>
          </div>

          <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-700 tracking-wide uppercase font-mono">GDS SATELLITE: LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Centered Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[520px]"
        >
          {/* Left Panel: Blue Brand Space with Dual Logo */}
          <div className="md:w-5/12 bg-[#0F172A] p-8 flex flex-col justify-between relative text-slate-300 border-r border-slate-850">
            {/* Background design elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/80 pointer-events-none"></div>
            
            {/* Top Tag */}
            <div className="relative z-10 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono font-bold tracking-widest uppercase rounded-full">
                BSP ALLIANCE PORTAL
              </span>
            </div>

            {/* Central content - exact logo banner */}
            <div className="relative z-10 my-auto py-12 flex flex-col items-center justify-center text-center">
              <div className="bg-white rounded-2xl p-4 shadow-xl border border-white/10 w-full max-w-[280px]">
                <img 
                  src={logoImg} 
                  alt="Noble & Ethiopian Airlines Logo" 
                  className="w-full h-auto object-contain"
                />
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-4 uppercase tracking-widest">
                IATA Registry Connection
              </p>
            </div>

            {/* Bottom Brand Statement */}
            <div className="relative z-10 border-t border-slate-800/80 pt-4 text-[9px] font-mono text-slate-500">
              <p>© 2026 NOBLE ALLIANCE CORP.</p>
              <p className="mt-0.5 uppercase">All terminals monitored securely.</p>
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="md:w-7/12 p-8 md:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Header */}
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">NOBLE TRAVEL AGENT</h1>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-1 font-mono">
                  Management System Portal
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
                    <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-slate-800 text-sm font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Secure Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-slate-800 text-sm font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Options row */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Remember this device</span>
                  </label>
                  <a href="#forgot" className="text-blue-600 hover:underline">Forgot password?</a>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest mt-6"
                >
                  <span>Secure Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* HR Link */}
            <div className="border-t border-slate-100 pt-5 mt-6 text-center">
              <span className="text-slate-400 text-xs font-semibold">
                Need access? <a href="#hr" className="text-slate-600 hover:underline font-bold">Contact HR</a>
              </span>
            </div>

          </div>
        </motion.div>

        {/* Demo Credentials Quick-click Panel */}
        {showCredentialsHelp && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-4xl mt-6 bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">DEMO QUICK SIGN-IN:</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => autoFill('admin')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg hover:text-white transition-all cursor-pointer border border-slate-700"
              >
                🔑 Admin Role
              </button>
              <button 
                onClick={() => autoFill('cashier')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg hover:text-white transition-all cursor-pointer border border-slate-700"
              >
                💵 Cashier Role
              </button>
              <button 
                onClick={() => autoFill('user')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg hover:text-white transition-all cursor-pointer border border-slate-700"
              >
                👤 Agent Role
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 py-6 text-center text-[10px] text-slate-400 font-mono border-t border-slate-200/50 bg-white/20 backdrop-blur-sm">
        <p>© 2026 NOBLE TRAVEL AGENT - Management System Portal. All rights reserved.</p>
      </footer>

    </div>
  );
}
