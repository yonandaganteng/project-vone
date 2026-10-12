import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  LogOut,
  ShieldCheck,
  UserCheck,
  Warehouse,
  KeyRound,
} from 'lucide-react';
import { UserRole, UserAccount } from '../types/rental';

interface HeaderProps {
  currentTab: string;
  userRole: UserRole;
  currentUser?: UserAccount;
  onLogout?: () => void;
  onSwitchRole?: (role: UserRole) => void;
  onOpenMobileSidebar: () => void;
  conflictCount: number;
  onNavigateToCalendar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNewBooking: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  userRole,
  currentUser,
  onLogout,
  onSwitchRole,
  onOpenMobileSidebar,
  conflictCount,
  onNavigateToCalendar,
  searchQuery,
  setSearchQuery,
  onOpenNewBooking,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabTitles: Record<string, { title: string; subtitle: string; code: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle:
        userRole === 'owner'
          ? 'Ringkasan Omset, Event & Kinerja Alat'
          : 'Ringkasan Event, Status Alat & Logistik',
      code: 'MOD:DASHBOARD',
    },
    calendar: {
      title: 'Kalender & Bentrok',
      subtitle: 'Monitor Jadwal Sewa & Kalkulator Ketersediaan Alat Anti Double-Booking',
      code: 'MOD:CALENDAR',
    },
    invoice: {
      title: 'Invoice & Arsip',
      subtitle: 'Manajemen Penawaran Resmi, Invoice Editable, Ubah Logo/Kop Vendor & Arsip Dokumen',
      code: 'MOD:INVOICE',
    },
    inventory: {
      title: 'Master Inventaris',
      subtitle: 'Katalog Aset Audio Visual, Edit Tarif & Nama, Deskripsi, serta Hapus Alat',
      code: 'MOD:INVENTORY',
    },
  };

  const currentInfo = tabTitles[currentTab] || {
    title: 'VendorOne',
    subtitle: 'Vendor & Rental Management Platform',
    code: 'MOD:SYSTEM',
  };

  const roleProfiles = {
    admin: {
      name: 'Budi Santoso',
      title: 'Admin Operasional',
      badge: 'Admin',
      initials: 'BS',
    },
    owner: {
      name: 'Hendra Gunawan',
      title: 'Direktur / Pemilik Bisnis',
      badge: 'Owner',
      initials: 'HG',
    },
    warehouse: {
      name: 'Rahmat Hidayat',
      title: 'Kepala Gudang & Logistik',
      badge: 'Staf Gudang',
      initials: 'RH',
    },
  };

  const profile = roleProfiles[userRole];

  const rolePillClass =
    userRole === 'owner'
      ? 'role-pill role-pill-owner'
      : userRole === 'warehouse'
      ? 'role-pill role-pill-warehouse'
      : 'role-pill role-pill-admin';

  return (
    <header className="header-surface sticky top-0 z-30 h-14 px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded text-ink-400 hover:text-ink-900 transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-bold tracking-tight text-ink-900 truncate">
              {currentInfo.title}
            </h1>
            {conflictCount > 0 && currentTab === 'calendar' && (
              <span className="badge-carmine hidden sm:inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {conflictCount} Bentrok
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-ink-300 leading-none mt-0.5 hidden md:block">
            {currentInfo.code}
          </p>
        </div>
      </div>

      {/* Center: Live Search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari event, klien, kode alat…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[13px] text-ink-900 placeholder-ink-300 rounded-md transition-all focus:outline-none focus:border-indigo-500 focus:bg-white"
            style={{
              background: 'rgba(17,19,24,0.04)',
              border: '1px solid rgba(17,19,24,0.08)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.border = '1px solid #6366f1';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'rgba(17,19,24,0.04)';
              e.currentTarget.style.border = '1px solid rgba(17,19,24,0.08)';
            }}
          />
        </div>
      </div>

      {/* Right: Quick Action, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {userRole !== 'warehouse' && (
          <button
            onClick={onOpenNewBooking}
            className="btn-primary btn-magnetic px-3 py-1.5 text-xs font-semibold shrink-0"
          >
            + Booking Baru
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-1.5 rounded text-ink-400 hover:text-ink-800 transition-colors"
            title="Pusat Notifikasi & Bentrok"
          >
            <Bell className="w-[18px] h-[18px]" />
            {conflictCount > 0 && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: '#be123c' }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-[22rem] z-50 overflow-hidden animate-slide-in-right"
              style={{
                background: '#1a1d24',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              {/* Notifications Header */}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="section-label" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                  Notifikasi Sistem
                </span>
                <span
                  className="font-mono text-[11px]"
                  style={{ color: conflictCount > 0 ? '#e11d48' : '#10b981' }}
                >
                  {conflictCount > 0 ? `${conflictCount} Perhatian` : 'Semua Normal'}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {conflictCount > 0 && (
                  <div
                    onClick={() => {
                      onNavigateToCalendar();
                      setShowNotifications(false);
                    }}
                    className="px-4 py-3 cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="p-1.5 rounded mt-0.5 shrink-0"
                        style={{ background: 'rgba(190,18,60,0.15)', color: '#e11d48' }}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="font-semibold" style={{ color: '#fca5a5' }}>
                          Peringatan Bentrok Stok (Double-Booking)!
                        </div>
                        <p className="mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          Terdeteksi alokasi unit Sony A7 III melebihi stok fisik pada rentang 15-16 Oktober 2026.
                        </p>
                        <span className="inline-block mt-2 font-semibold text-[11px]" style={{ color: '#e11d48' }}>
                          Lihat Detail Kalender Stok &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className="px-4 py-3 transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-1.5 rounded mt-0.5 shrink-0"
                      style={{ background: 'rgba(5,150,105,0.15)', color: '#10b981' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        Invoice INV-2026-10-0042 Tersimpan
                      </div>
                      <p className="mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Versi snapshot v1.2 telah disetujui klien Telkom.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="px-4 py-3 transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-1.5 rounded mt-0.5 shrink-0"
                      style={{ background: 'rgba(217,119,6,0.15)', color: '#f59e0b' }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        Loading In Malam Ini
                      </div>
                      <p className="mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Seminar Nasional BUMN di Hotel Mulia (Peralatan LED & Mic).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="px-4 py-2.5 text-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[12px] font-semibold transition-colors"
                  style={{ color: '#6366f1' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6366f1')}
                >
                  Tutup Notifikasi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile display & Menu Popover */}
        <div
          className="relative pl-2 sm:pl-2.5"
          style={{ borderLeft: '1px solid rgba(17,19,24,0.08)' }}
        >
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="group flex items-center gap-2 p-1 rounded-md transition-colors hover:bg-black/5 text-left"
            title="Menu Akun & Ganti Peran"
          >
            <div
              className="w-7 h-7 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: currentUser?.avatarBgColor || '#111318' }}
            >
              {currentUser?.avatarInitials || profile.initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold text-ink-900 leading-none">
                  {currentUser?.name || profile.name}
                </span>
                <ChevronDown className="w-3 h-3 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-0.5">
                <span className={rolePillClass} style={{ fontSize: '10px', padding: '1px 6px' }}>
                  {currentUser?.role === 'owner'
                    ? 'Owner'
                    : currentUser?.role === 'warehouse'
                    ? 'Gudang'
                    : 'Admin'}
                </span>
              </div>
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-72 z-50 overflow-hidden animate-dialog-enter"
              style={{
                background: '#1a1d24',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              {/* User Info Header */}
              <div
                className="px-4 py-3 space-y-1.5"
                style={{
                  background: '#111318',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Sesi Aktif
                  </span>
                  <span className={rolePillClass} style={{ fontSize: '10px' }}>
                    {userRole}
                  </span>
                </div>
                <div className="font-bold text-sm text-white">
                  {currentUser?.name || profile.name}
                </div>
                <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {currentUser?.email || `${userRole}@vendorone.id`}
                </div>
                {(currentUser?.permissionsDescription) && (
                  <p
                    className="text-[11px] leading-relaxed pt-2"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      marginTop: '8px',
                    }}
                  >
                    {currentUser.permissionsDescription}
                  </p>
                )}
              </div>

              {/* Quick Switch Role within Session */}
              {onSwitchRole && (
                <div
                  className="px-3 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block mb-2"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    Beralih Peran (Simulasi)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        onSwitchRole('admin');
                        setShowUserMenu(false);
                      }}
                      className="py-1.5 px-2 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                      style={{
                        background: userRole === 'admin' ? '#4f46e5' : 'rgba(255,255,255,0.06)',
                        color: userRole === 'admin' ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: `1px solid ${userRole === 'admin' ? '#4f46e5' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Admin</span>
                    </button>
                    <button
                      onClick={() => {
                        onSwitchRole('owner');
                        setShowUserMenu(false);
                      }}
                      className="py-1.5 px-2 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                      style={{
                        background: userRole === 'owner' ? '#059669' : 'rgba(255,255,255,0.06)',
                        color: userRole === 'owner' ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: `1px solid ${userRole === 'owner' ? '#059669' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Owner</span>
                    </button>
                    <button
                      onClick={() => {
                        onSwitchRole('warehouse');
                        setShowUserMenu(false);
                      }}
                      className="py-1.5 px-2 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                      style={{
                        background: userRole === 'warehouse' ? '#d97706' : 'rgba(255,255,255,0.06)',
                        color: userRole === 'warehouse' ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: `1px solid ${userRole === 'warehouse' ? '#d97706' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <Warehouse className="w-3 h-3" />
                      <span>Gudang</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              {onLogout && (
                <div className="px-3 py-2.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left rounded px-2 py-1.5 text-[12px] font-semibold flex items-center gap-2 transition-colors"
                    style={{ color: '#be123c' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#e11d48';
                      e.currentTarget.style.background = 'rgba(190,18,60,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#be123c';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar / Ganti Akun Login</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
