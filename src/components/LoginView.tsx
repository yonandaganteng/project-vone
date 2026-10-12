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
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/rental';
import { mockUserAccounts, initialUsersList } from '../data/mockData';
import { BrandMark } from './BrandMark';

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
    setPassword(newUser.passwordHash || '');
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #0c0d0f 0%, #111318 60%, #0e1015 100%)' }}
    >
      {/* Ambient architectural field */}
      <div className="ambient-login" aria-hidden="true">
        <div className="ambient-login-spotlight" />
        <div className="ambient-login-spotlight-2" />
      </div>

      {/* Main Content — page entrance */}
      <div className="animate-page-enter relative z-10 w-full" style={{ maxWidth: 420 }}>

        {/* ── Brand lockup ── */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <BrandMark />
          <div className="text-center">
            <h1
              className="text-[28px] font-bold tracking-tight text-white leading-none"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              VendorOne
            </h1>
            <p className="font-mono text-[11px] mt-1.5" style={{ color: '#6366f1' }}>
              RENTAL MANAGEMENT · MULTI-ROLE PLATFORM
            </p>
          </div>
        </div>

        {/* ── Auth card ── */}
        <div
          className="w-full"
          style={{
            background: '#1a1d24',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}
        >
          {/* Tab switcher — underline style */}
          <div
            className="flex items-center px-6 pt-5 pb-0 gap-6"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className="pb-3 text-[13px] font-semibold transition-colors relative"
              style={{
                color: authMode === 'login' ? '#fff' : 'rgba(255,255,255,0.38)',
                borderBottom: authMode === 'login' ? '2px solid #4f46e5' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className="pb-3 text-[13px] font-semibold transition-colors relative"
              style={{
                color: authMode === 'signup' ? '#fff' : 'rgba(255,255,255,0.38)',
                borderBottom: authMode === 'signup' ? '2px solid #4f46e5' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6 space-y-5">

            {/* Feedback messages */}
            {errorMessage && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-md text-[12px] leading-snug"
                style={{ background: 'rgba(190,18,60,0.12)', border: '1px solid rgba(190,18,60,0.30)', color: '#fca5a5' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" style={{ color: '#e11d48' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-md text-[12px] leading-snug"
                style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.28)', color: '#6ee7b7' }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" style={{ color: '#059669' }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ════ TAB 1: LOGIN ════ */}
            {authMode === 'login' && (
              <>
                {/* Quick role login — compact table rows */}
                <div>
                  <p className="section-label mb-2">Demo Access · 1-Click Login</p>

                  <div
                    className="rounded-md overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Owner row */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('owner')}
                      className="w-full text-left group"
                      style={{ display: 'block' }}
                    >
                      <div
                        className="flex items-center gap-3 px-3.5 py-2.5 transition-all"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          borderLeft: '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(5,150,105,0.07)';
                          (e.currentTarget as HTMLDivElement).style.borderLeftColor = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                          (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
                        }}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-white">Hendra Gunawan</span>
                            <span className="role-pill role-pill-owner">OWNER</span>
                          </div>
                          <div className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                            owner@vendorone.id
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(16,185,129,0.75)' }}>
                            Akses Penuh: Finansial, Omzet & Otorisasi Role Tim
                          </div>
                        </div>
                        <ArrowRight
                          className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                          style={{ color: 'rgba(255,255,255,0.20)' }}
                        />
                      </div>
                    </button>

                    {/* Admin row */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin')}
                      className="w-full text-left group"
                      style={{ display: 'block' }}
                    >
                      <div
                        className="flex items-center gap-3 px-3.5 py-2.5 transition-all"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          borderLeft: '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(79,70,229,0.09)';
                          (e.currentTarget as HTMLDivElement).style.borderLeftColor = '#4f46e5';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                          (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
                        }}
                      >
                        <UserCheck className="w-4 h-4 shrink-0" style={{ color: '#6366f1' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-white">Budi Santoso</span>
                            <span className="role-pill role-pill-admin">ADMIN</span>
                          </div>
                          <div className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                            admin@vendorone.id
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(99,102,241,0.80)' }}>
                            Akses Operasional: Booking & Invoice Belum Lunas
                          </div>
                        </div>
                        <ArrowRight
                          className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                          style={{ color: 'rgba(255,255,255,0.20)' }}
                        />
                      </div>
                    </button>

                    {/* Warehouse row */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('warehouse')}
                      className="w-full text-left group"
                      style={{ display: 'block' }}
                    >
                      <div
                        className="flex items-center gap-3 px-3.5 py-2.5 transition-all"
                        style={{
                          borderLeft: '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(217,119,6,0.08)';
                          (e.currentTarget as HTMLDivElement).style.borderLeftColor = '#d97706';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                          (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
                        }}
                      >
                        <Warehouse className="w-4 h-4 shrink-0" style={{ color: '#f59e0b' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-white">Rahmat Hidayat</span>
                            <span className="role-pill role-pill-warehouse">GUDANG</span>
                          </div>
                          <div className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                            gudang@vendorone.id
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(245,158,11,0.80)' }}>
                            Akses Lapangan: Master Alat & Kontrol Stok Fisik
                          </div>
                        </div>
                        <ArrowRight
                          className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                          style={{ color: 'rgba(255,255,255,0.20)' }}
                        />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative flex items-center gap-3">
                  <div className="flex-1" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span className="font-mono text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>
                    atau email terdaftar
                  </span>
                  <div className="flex-1" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Manual Login Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="field-label mb-1.5">Alamat Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.28)' }} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@vendorone.id"
                        className="field-input font-mono text-[12px] pl-9"
                        style={{
                          background: '#0c0d0f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="field-label">Kata Sandi</label>
                      <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        default: role123
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.28)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="field-input font-mono text-[12px] pl-9 pr-9"
                        style={{
                          background: '#0c0d0f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.28)')}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded"
                        style={{ accentColor: '#4f46e5' }}
                      />
                      <span>Ingat sesi masuk</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword('admin123');
                        setEmail('admin@vendorone.id');
                      }}
                      className="text-[11px] transition-colors"
                      style={{ color: '#6366f1' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#818cf8')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#6366f1')}
                    >
                      Reset ke Admin
                    </button>
                  </div>

                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                    <KeyRound className="w-4 h-4" />
                    <span>Masuk ke Sistem VendorOne</span>
                  </button>
                </form>
              </>
            )}

            {/* ════ TAB 2: SIGN UP ════ */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <p className="section-label mb-0.5">Formulir Pendaftaran</p>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Role awal dapat diubah oleh Owner melalui Dashboard Owner setelah pendaftaran.
                  </p>
                </div>

                <div>
                  <label className="field-label mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Contoh: Muhammad Farhan"
                    className="field-input text-[12px]"
                    style={{
                      background: '#0c0d0f',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label className="field-label mb-1.5">Alamat Email (Login)</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="farhan@vendorone.id"
                    className="field-input font-mono text-[12px]"
                    style={{
                      background: '#0c0d0f',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label mb-1.5">Role Akses</label>
                    <select
                      value={signupRequestedRole}
                      onChange={(e) => setSignupRequestedRole(e.target.value as UserRole)}
                      className="field-input text-[12px] font-semibold"
                      style={{
                        background: '#0c0d0f',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="warehouse">Staf Gudang</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label mb-1.5">Jabatan</label>
                    <input
                      type="text"
                      value={signupTitle}
                      onChange={(e) => setSignupTitle(e.target.value)}
                      placeholder="cth: Staf Operasional"
                      className="field-input text-[12px]"
                      style={{
                        background: '#0c0d0f',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label mb-1.5">Kata Sandi</label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="field-input font-mono text-[12px]"
                    style={{
                      background: '#0c0d0f',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                  />
                </div>

                {/* Authorization note */}
                <div
                  className="p-3 rounded-md text-[11px] leading-relaxed"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.38)',
                  }}
                >
                  <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Catatan Otorisasi: </span>
                  Setelah akun terdaftar, Owner dapat mengubah role Anda melalui modul{' '}
                  <em style={{ color: 'rgba(255,255,255,0.48)' }}>"Manajemen Pengguna (Owner Control)"</em>.
                </div>

                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Daftar Akun Sekarang</span>
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center font-mono text-[10px] mt-6" style={{ color: 'rgba(255,255,255,0.18)' }}>
          VendorOne © 2026 · Rental Management & Event Logistics Platform
        </p>

      </div>
    </div>
  );
};
