import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Warehouse,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/rental';
import { mockUserAccounts } from '../data/mockData';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@rentpro.id');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Quick 1-click login handler
  const handleQuickLogin = (roleKey: 'owner' | 'admin' | 'warehouse') => {
    const account = mockUserAccounts[roleKey];
    if (account) {
      setEmail(account.email);
      setPassword(account.passwordHash);
      setErrorMessage(null);
      onLoginSuccess(account);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Verify against mock accounts
    const matchedKey = Object.keys(mockUserAccounts).find((k) => {
      const acc = mockUserAccounts[k];
      return acc.email.toLowerCase() === email.trim().toLowerCase();
    });

    if (!matchedKey) {
      setErrorMessage('Email tidak terdaftar dalam sistem demo RentPro.');
      return;
    }

    const matchedAccount = mockUserAccounts[matchedKey];
    if (matchedAccount.passwordHash !== password) {
      setErrorMessage('Kata sandi salah. Gunakan password demo: ' + matchedAccount.passwordHash);
      return;
    }

    onLoginSuccess(matchedAccount);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle background ambient elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl shadow-lg shadow-indigo-600/30">
            RP
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            RentPro AV OS
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-semibold">
              v2.4
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Sistem Manajemen Rental Peralatan Event, Deteksi Bentrok Alokasi Unit & Snapshot Invoice
          </p>
        </div>

        {/* Card Box */}
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Pilih Akun Demo per Role (1-Klik Masuk)
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Klik salah satu peran di bawah untuk login langsung sesuai hak akses:
            </p>
          </div>

          {/* 3 Quick Role Login Cards */}
          <div className="space-y-2.5">
            {/* Owner Role Card */}
            <button
              type="button"
              onClick={() => handleQuickLogin('owner')}
              className="w-full text-left p-3 rounded-xl border border-emerald-900/60 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-600 transition-all flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                      Hendra Gunawan
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                      OWNER
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    owner@rentpro.id
                  </div>
                  <p className="text-[10px] text-emerald-400/90 mt-1">
                    • Akses Omset Finansial & Otorisasi Ubah Kop/Logo Invoice
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
            </button>

            {/* Admin Role Card */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="w-full text-left p-3 rounded-xl border border-indigo-900/60 bg-indigo-950/30 hover:bg-indigo-900/40 hover:border-indigo-600 transition-all flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                      Budi Santoso
                    </span>
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    admin@rentpro.id
                  </div>
                  <p className="text-[10px] text-indigo-400/90 mt-1">
                    • Akses Kalender Bentrok Stok, Buat Booking & Penawaran Invoice
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
            </button>

            {/* Warehouse Role Card */}
            <button
              type="button"
              onClick={() => handleQuickLogin('warehouse')}
              className="w-full text-left p-3 rounded-xl border border-amber-900/60 bg-amber-950/30 hover:bg-amber-900/40 hover:border-amber-600 transition-all flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                      Rahmat Hidayat
                    </span>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                      STAF GUDANG
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    gudang@rentpro.id
                  </div>
                  <p className="text-[10px] text-amber-400/90 mt-1">
                    • Akses Loading Manifest, Scan Barcode & Edit Kondisi Fisik Alat
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-semibold text-[10px]">
                Atau Masuk Manual
              </span>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat Email Akun
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@rentpro.id"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Kata Sandi
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Default: role123
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <span>Ingat sesi masuk</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setPassword('admin123');
                  setEmail('admin@rentpro.id');
                }}
                className="text-indigo-400 hover:underline text-[11px]"
              >
                Reset ke Admin
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30 transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk ke Sistem RentPro</span>
            </button>
          </form>
        </div>

        {/* Security & Thesis Disclaimer */}
        <div className="text-center mt-6 text-[11px] text-slate-500 space-y-1">
          <p>
            RentPro AV OS &copy; 2026. Skripsi Sistem Informasi Rental & Logistik Event.
          </p>
          <p className="text-[10px] text-slate-600">
            Multi-Role Authentication: Hak akses tersinkronisasi otomatis dengan wewenang masing-masing peran.
          </p>
        </div>
      </div>
    </div>
  );
};
