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
import { mockUserAccounts, initialUsersList } from '../data/mockData';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  registeredUsers?: UserAccount[];
  onRegisterUser?: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  registeredUsers = initialUsersList,
  onRegisterUser,
}) => {
  // Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Sign In State
  const [email, setEmail] = useState('admin@vendorone.id');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupTitle, setSignupTitle] = useState('');
  const [signupRequestedRole, setSignupRequestedRole] = useState<UserRole>('admin');

  // Quick 1-click login handler
  const handleQuickLogin = (roleKey: 'owner' | 'admin' | 'warehouse') => {
    // Find active account matching roleKey
    const matched = registeredUsers.find((u) => u.role === roleKey) || mockUserAccounts[roleKey];
    if (matched) {
      setEmail(matched.email);
      setPassword(matched.passwordHash || `${roleKey}123`);
      setErrorMessage(null);
      setSuccessMessage(null);
      onLoginSuccess(matched);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Verify against all registered users
    const matchedAccount = registeredUsers.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!matchedAccount) {
      // Check legacy mockUserAccounts
      const matchedKey = Object.keys(mockUserAccounts).find((k) => {
        const acc = mockUserAccounts[k];
        return acc.email.toLowerCase() === email.trim().toLowerCase();
      });
      if (matchedKey) {
        const legacyAcc = mockUserAccounts[matchedKey];
        if (legacyAcc.passwordHash !== password) {
          setErrorMessage('Kata sandi salah. Gunakan password demo: ' + legacyAcc.passwordHash);
          return;
        }
        onLoginSuccess(legacyAcc);
        return;
      }

      setErrorMessage('Email tidak terdaftar dalam sistem VendorOne. Silakan daftar akun baru melalui tab Daftar.');
      return;
    }

    const expectedPassword = matchedAccount.passwordHash || `${matchedAccount.role}123`;
    if (expectedPassword !== password && password !== 'admin123' && password !== 'owner123' && password !== 'gudang123') {
      setErrorMessage('Kata sandi salah. Gunakan kata sandi yang telah didaftarkan.');
      return;
    }

    onLoginSuccess(matchedAccount);
  };

  // Sign Up Form Submit
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMessage('Mohon lengkapi semua kolom pendaftaran.');
      return;
    }

    // Check duplicate email
    const exists = registeredUsers.some(
      (u) => u.email.toLowerCase() === signupEmail.trim().toLowerCase()
    );
    if (exists) {
      setErrorMessage('Email ini sudah terdaftar. Silakan langsung masuk menggunakan form login.');
      return;
    }

    const initials = signupName
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const roleColor =
      signupRequestedRole === 'owner'
        ? '#059669'
        : signupRequestedRole === 'warehouse'
        ? '#D97706'
        : '#4F46E5';

    const roleDesc =
      signupRequestedRole === 'owner'
        ? 'Akses Penuh: Finansial, Omzet, Ubah Kop/Logo Invoice, Monitoring'
        : signupRequestedRole === 'warehouse'
        ? 'Akses Lapangan: Master Alat, Kontrol Stok Fisik & Kesiapan Logistik'
        : 'Akses Operasional: Kalender Bentrok, Booking, Monitoring Invoice Belum Lunas';

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      role: signupRequestedRole,
      title: signupTitle.trim() || (signupRequestedRole === 'owner' ? 'Owner / Pimpinan' : signupRequestedRole === 'warehouse' ? 'Staf Gudang & Logistik' : 'Admin Operasional'),
      avatarInitials: initials || 'V1',
      avatarBgColor: roleColor,
      permissionsDescription: roleDesc,
      passwordHash: signupPassword.trim(),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (onRegisterUser) {
      onRegisterUser(newUser);
    }

    setSuccessMessage(`Pendaftaran akun ${newUser.name} berhasil! Silakan masuk dengan role ${newUser.role.toUpperCase()}.`);
    setAuthMode('login');
    setEmail(newUser.email);
    setPassword(newUser.passwordHash);
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white font-bold text-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
            V1
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            VendorOne
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
              SaaS
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Sistem Manajemen Rental Peralatan Event, Deteksi Bentrok Alokasi Unit & Snapshot Invoice
          </p>
        </div>

        {/* Card Box */}
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Top Auth Mode Tabs: Masuk vs Daftar Akun Baru */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Masuk (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Daftar (Sign Up)</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN (SIGN IN) */}
          {authMode === 'login' && (
            <>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
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
                        owner@vendorone.id
                      </div>
                      <p className="text-[10px] text-emerald-400/90 mt-1">
                        • Akses Penuh: Omset, Finansial & Otorisasi Ubah Role Tim
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
                        admin@vendorone.id
                      </div>
                      <p className="text-[10px] text-indigo-400/90 mt-1">
                        • Akses Operasional: Tagihan Belum Lunas & Booking Acara
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
                        gudang@vendorone.id
                      </div>
                      <p className="text-[10px] text-amber-400/90 mt-1">
                        • Akses Gudang: Master Alat, Kontrol Stok Fisik & Monitoring Stok Menipis
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
                    Atau Masuk dengan Email Terdaftar
                  </span>
                </div>
              </div>

              {/* Manual Login Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
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
                      placeholder="nama@vendorone.id"
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
                      Default: role123 / password123
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
                      setEmail('admin@vendorone.id');
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
                  <span>Masuk ke Sistem VendorOne</span>
                </button>
              </form>
            </>
          )}

          {/* TAB 2: SIGN UP / DAFTAR AKUN BARU */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Formulir Pendaftaran Akun VendorOne
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Daftarkan diri Anda. Role awal dapat dipilih dan nantinya dapat disesuaikan atau diubah oleh Owner melalui Dashboard Owner.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Email (Untuk Login)
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="farhan@vendorone.id"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pilih Role Akses
                  </label>
                  <select
                    value={signupRequestedRole}
                    onChange={(e) => setSignupRequestedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="admin">Admin (Invoice Belum Lunas & Booking)</option>
                    <option value="warehouse">Staf Gudang (Stok Fisik & Logistik)</option>
                    <option value="owner">Owner (Finansial & Otorisasi Role)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={signupTitle}
                    onChange={(e) => setSignupTitle(e.target.value)}
                    placeholder="cth: Staf Operasional"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Catatan Otorisasi:</div>
                <p>
                  Setelah akun terdaftar, Owner dapat sewaktu-waktu memperbarui atau mengubah role Anda secara langsung dari modul <em>"Manajemen Pengguna (Owner Control)"</em> di Dashboard Owner.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/30 transition-colors flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Daftar Akun Sekarang</span>
              </button>
            </form>
          )}
        </div>

        {/* Security & System Disclaimer */}
        <div className="text-center mt-6 text-[11px] text-slate-500 space-y-1">
          <p>
            VendorOne SaaS &copy; 2026. Platform Manajemen Rental Peralatan & Logistik Event.
          </p>
          <p className="text-[10px] text-slate-600">
            Multi-Role Authentication: Hak akses tersinkronisasi otomatis dengan wewenang masing-masing peran.
          </p>
        </div>
      </div>
    </div>
  );
};
