import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Boxes,
  Truck,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Warehouse,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { UserRole, UserAccount } from '../types/rental';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser?: UserAccount;
  onLogout?: () => void;
  conflictCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  currentUser,
  onLogout,
  conflictCount,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'calendar',
      label: 'Kalender & Cek Bentrok',
      icon: CalendarDays,
      badge: conflictCount > 0 ? `${conflictCount} Bentrok` : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'invoice',
      label: 'Invoice & Arsip Dokumen',
      icon: FileText,
      badge: 'Arsip & Edit',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'inventory',
      label: 'Master Alat & Stok',
      icon: Boxes,
      badge: null,
    },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    if (isOpenMobile) setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md border border-indigo-400/30">
            V1
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              VendorOne <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono uppercase">SaaS</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium leading-none">
              Rental & Stock Management
            </span>
          </div>
        </div>

        {/* Role Switcher Selector */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40">
          <label className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block mb-1.5">
            Peran Pengguna (Role Simulation)
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-md border border-slate-800">
            <button
              onClick={() => setUserRole('admin')}
              className={`py-1 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                userRole === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Role Admin: Akses operasional & booking"
            >
              <UserCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => setUserRole('owner')}
              className={`py-1 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                userRole === 'owner'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Role Owner: Akses finansial & omzet"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Owner</span>
            </button>
            <button
              onClick={() => setUserRole('warehouse')}
              className={`py-1 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                userRole === 'warehouse'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Role Staf Gudang: Kelola kondisi alat & stok fisik"
            >
              <Warehouse className="w-3 h-3" />
              <span>Gudang</span>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Modul Utama
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      item.id === 'calendar' && conflictCount > 0
                        ? 'bg-red-500 text-white font-bold animate-pulse'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Account & Logout in Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: currentUser?.avatarBgColor || '#4F46E5' }}
            >
              {currentUser?.avatarInitials || 'RP'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.name || 'Pengguna'}
              </div>
              <div className="text-[10px] text-slate-400 capitalize truncate">
                {currentUser?.title || (userRole === 'owner' ? 'Owner' : userRole === 'warehouse' ? 'Staf Gudang' : 'Admin')}
              </div>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors shrink-0"
              title="Keluar / Logout Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
