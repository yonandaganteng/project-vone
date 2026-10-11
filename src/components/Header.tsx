import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  Sparkles,
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

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Operasional',
      subtitle: userRole === 'owner' ? 'Ringkasan Omset, Event & Kinerja Alat' : 'Ringkasan Event, Status Alat & Logistik',
    },
    calendar: {
      title: 'Kalender & Deteksi Bentrok',
      subtitle: 'Monitor Jadwal Sewa & Kalkulator Ketersediaan Alat Anti Double-Booking',
    },
    invoice: {
      title: 'Invoice, Arsip Dokumen & Pratinjau',
      subtitle: 'Manajemen Penawaran Resmi, Invoice Editable, Ubah Logo/Kop Vendor & Arsip Dokumen',
    },
    inventory: {
      title: 'Master Alat & Inventaris',
      subtitle: 'Katalog Aset Audio Visual, Edit Tarif & Nama, Deskripsi, serta Hapus Alat',
    },
  };

  const currentInfo = tabTitles[currentTab] || {
    title: 'VendorOne System',
    subtitle: 'Vendor & Rental Management Platform',
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

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
              {currentInfo.title}
            </h1>
            {conflictCount > 0 && currentTab === 'calendar' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                {conflictCount} Bentrok Terdeteksi
              </span>
            )}
          </div>
          <p className="hidden md:block text-xs text-slate-500 truncate">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Live Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari event, klien, atau kode alat (cth: Sony, Seminar)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Action, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {userRole !== 'warehouse' && (
          <button
            onClick={onOpenNewBooking}
            className="px-3 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>+ Booking Baru</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Pusat Notifikasi & Bentrok"
          >
            <Bell className="w-5 h-5" />
            {conflictCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Notifikasi Sistem VendorOne
                </span>
                <span className="text-[11px] text-slate-500">
                  {conflictCount > 0 ? `${conflictCount} Perhatian` : 'Semua Normal'}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {conflictCount > 0 ? (
                  <div
                    onClick={() => {
                      onNavigateToCalendar();
                      setShowNotifications(false);
                    }}
                    className="p-3.5 hover:bg-red-50/50 cursor-pointer transition-colors bg-red-50/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-red-100 text-red-600 rounded-lg mt-0.5 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="font-semibold text-red-900">
                          Peringatan Bentrok Stok (Double-Booking)!
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          Terdeteksi alokasi unit Sony A7 III melebihi stok fisik pada rentang 15-16 Oktober 2026.
                        </p>
                        <span className="inline-block mt-2 font-semibold text-red-700 hover:underline">
                          Lihat Detail Kalender Stok &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg mt-0.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-medium text-slate-800">
                        Invoice INV-2026-10-0042 Tersimpan
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Versi snapshot v1.2 telah disetujui klien Telkom.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg mt-0.5 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-medium text-slate-800">
                        Loading In Malam Ini
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Seminar Nasional BUMN di Hotel Mulia (Peralatan LED & Mic).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Tutup Notifikasi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile display & Menu Popover */}
        <div className="relative pl-2 sm:pl-3 border-l border-slate-200">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
            title="Menu Akun & Ganti Peran"
          >
            <div
              className="w-8 h-8 rounded-full text-white font-semibold text-xs flex items-center justify-center shadow-xs"
              style={{ backgroundColor: currentUser?.avatarBgColor || '#0F172A' }}
            >
              {currentUser?.avatarInitials || profile.initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none flex items-center gap-1">
                <span>{currentUser?.name || profile.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {currentUser?.role === 'owner'
                  ? 'Owner'
                  : currentUser?.role === 'warehouse'
                  ? 'Staf Gudang'
                  : 'Admin'}
              </div>
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* User Info Header */}
              <div className="p-4 bg-slate-900 text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Sesi Aktif
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      userRole === 'owner'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : userRole === 'warehouse'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {userRole}
                  </span>
                </div>
                <div className="font-bold text-sm text-white">
                  {currentUser?.name || profile.name}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {currentUser?.email || `${userRole}@vendorone.id`}
                </div>
                <p className="text-[11px] text-slate-300 pt-1 leading-relaxed border-t border-slate-800 mt-2">
                  {currentUser?.permissionsDescription || 'Akses pengguna terverifikasi'}
                </p>
              </div>

              {/* Quick Switch Role within Session */}
              {onSwitchRole && (
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Beralih Peran (Simulation):
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        onSwitchRole('admin');
                        setShowUserMenu(false);
                      }}
                      className={`py-1.5 px-2 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                        userRole === 'admin'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Admin</span>
                    </button>
                    <button
                      onClick={() => {
                        onSwitchRole('owner');
                        setShowUserMenu(false);
                      }}
                      className={`py-1.5 px-2 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                        userRole === 'owner'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Owner</span>
                    </button>
                    <button
                      onClick={() => {
                        onSwitchRole('warehouse');
                        setShowUserMenu(false);
                      }}
                      className={`py-1.5 px-2 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                        userRole === 'warehouse'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Warehouse className="w-3 h-3" />
                      <span>Gudang</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              {onLogout && (
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full p-2 text-left rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
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
