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

/** SVG grid motif: 5×4 dot grid with a 3×1 indigo accent line */
const GridMotif: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* 5×4 dot grid */}
    {[0, 1, 2, 3].map((row) =>
      [0, 1, 2, 3, 4].map((col) => {
        const isAccent = row === 0 && col <= 2;
        return (
          <circle
            key={`${row}-${col}`}
            cx={3 + col * 5.5}
            cy={3 + row * 7}
            r={1}
            fill={isAccent ? '#6366f1' : 'rgba(255,255,255,0.25)'}
          />
        );
      })
    )}
    {/* 3×1 accent connector line */}
    <line
      x1="3"
      y1="3"
      x2="14"
      y2="3"
      stroke="#4f46e5"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

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
      badge: conflictCount > 0 ? conflictCount : null,
    },
    {
      id: 'invoice',
      label: 'Invoice & Arsip Dokumen',
      icon: FileText,
      badge: null,
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

  const rolePillClass =
    userRole === 'admin'
      ? 'role-pill role-pill-admin'
      : userRole === 'owner'
      ? 'role-pill role-pill-owner'
      : 'role-pill role-pill-warehouse';

  const roleLabel =
    userRole === 'owner'
      ? 'Owner'
      : userRole === 'warehouse'
      ? 'Staf Gudang'
      : 'Admin';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 lg:hidden animate-backdrop-enter"
          style={{ background: 'rgba(17,19,24,0.6)' }}
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`nav-surface fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header — 64px */}
        <div
          className="h-16 flex items-center px-5 shrink-0 gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <GridMotif />
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold tracking-tight text-white leading-none">
              VendorOne
            </span>
            <span
              className="font-mono text-[10px] leading-none"
              style={{ color: '#10b981' }}
            >
              SYS ONLINE
            </span>
          </div>
        </div>

        {/* Role Switcher */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="section-label mb-2 block">Simulasi Peran</span>
          <div className="flex gap-1">
            {/* Admin */}
            <button
              onClick={() => setUserRole('admin')}
              title="Role Admin: Akses operasional & booking"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-colors duration-150"
              style={
                userRole === 'admin'
                  ? {
                      background: 'rgba(79,70,229,0.18)',
                      color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }
                  : {
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.35)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }
              }
            >
              <UserCheck className="w-3 h-3 shrink-0" />
              <span>Admin</span>
            </button>

            {/* Owner */}
            <button
              onClick={() => setUserRole('owner')}
              title="Role Owner: Akses finansial & omzet"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-colors duration-150"
              style={
                userRole === 'owner'
                  ? {
                      background: 'rgba(79,70,229,0.18)',
                      color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }
                  : {
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.35)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }
              }
            >
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>Owner</span>
            </button>

            {/* Gudang */}
            <button
              onClick={() => setUserRole('warehouse')}
              title="Role Staf Gudang: Kelola kondisi alat & stok fisik"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-colors duration-150"
              style={
                userRole === 'warehouse'
                  ? {
                      background: 'rgba(79,70,229,0.18)',
                      color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }
                  : {
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.35)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }
              }
            >
              <Warehouse className="w-3 h-3 shrink-0" />
              <span>Gudang</span>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <div className="px-2 pb-2">
            <span className="section-label">Modul Utama</span>
          </div>

          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const staggerClass = `stagger-${index + 1}`;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded transition-colors duration-150 animate-slide-in-left ${staggerClass} ${
                  isActive
                    ? 'nav-item-active'
                    : 'text-ink-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors duration-150"
                    style={{
                      color: isActive
                        ? '#6366f1'
                        : 'rgba(255,255,255,0.4)',
                    }}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {/* Conflict badge — calendar only, static carmine dot */}
                {item.id === 'calendar' && conflictCount > 0 && (
                  <span
                    className="badge-carmine ml-2 shrink-0 font-mono text-[10px]"
                    title={`${conflictCount} bentrok terdeteksi`}
                  >
                    {conflictCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div
          className="p-3 flex items-center justify-between gap-2 shrink-0"
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
              style={{ backgroundColor: currentUser?.avatarBgColor || '#4f46e5' }}
            >
              {currentUser?.avatarInitials || 'RP'}
            </div>

            {/* Name + role pill */}
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white truncate leading-tight">
                {currentUser?.name || 'Pengguna'}
              </div>
              <div className="mt-0.5">
                <span className={rolePillClass}>
                  {currentUser?.title || roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Logout — icon only, no bg on hover */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar / Logout Akun"
              className="shrink-0 transition-colors duration-150 p-1"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = '#fb7185')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  'rgba(255,255,255,0.35)')
              }
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
