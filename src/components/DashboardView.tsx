import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Truck,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle,
  Clock,
  ShieldAlert,
  Boxes,
  MessageSquare,
  PackageCheck,
  CheckCircle2,
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Warehouse,
  KeyRound,
  AlertCircle,
  FileText,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import { EventBooking, Equipment, UserRole, InvoiceRecord, UserAccount } from '../types/rental';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { FinancialSummary } from './FinancialSummary';

interface DashboardViewProps {
  bookings: EventBooking[];
  equipmentList: Equipment[];
  invoices?: InvoiceRecord[];
  userRole: UserRole;
  conflictMap: Map<string, { hasConflict: boolean; details: string[] }>;
  onSelectEvent: (eventId: string) => void;
  onNavigateToCalendar: () => void;
  onNavigateToInvoice: (invoiceId?: string) => void;
  onNavigateToInventory?: () => void;
  userAccounts?: UserAccount[];
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
  onAddNewUser?: (user: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  equipmentList,
  invoices = [],
  userRole,
  conflictMap,
  onSelectEvent,
  onNavigateToCalendar,
  onNavigateToInvoice,
  onNavigateToInventory,
  userAccounts = [],
  onUpdateUserRole,
  onAddNewUser,
  onDeleteUser,
}) => {
  // State for Owner User Management Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState<{
    name: string;
    email: string;
    role: UserRole;
    title: string;
    password: string;
  }>({
    name: '',
    email: '',
    role: 'admin',
    title: '',
    password: '',
  });
  const [userRoleNotification, setUserRoleNotification] = useState<string | null>(null);

  // 1. Identify low-stock equipment (< 2 units remaining or booked >= totalStock)
  const lowStockEquipment = useMemo(() => {
    return equipmentList
      .map((eq) => {
        const lockedUnits = bookings
          .filter((b) => b.logisticsStatus !== 'Kembali / Selesai' && b.status !== 'Dibatalkan')
          .reduce((sum, b) => {
            const it = b.items.find((i) => i.equipmentId === eq.id);
            return sum + (it ? it.quantity : 0);
          }, 0);
        const remaining = eq.totalStock - lockedUnits;
        const percentage = Math.min(100, Math.round((lockedUnits / eq.totalStock) * 100));
        return {
          ...eq,
          lockedUnits,
          remaining,
          percentage,
          isDepleted: remaining <= 0,
          isLow: remaining <= 2,
        };
      })
      .filter((eq) => eq.isLow || eq.isDepleted);
  }, [equipmentList, bookings]);

  // 2. Unpaid Invoices logic specifically for Admin
  const unpaidInvoices = useMemo(() => {
    if (invoices && invoices.length > 0) {
      return invoices.filter((inv) => !inv.isArchived && inv.paymentStatus !== 'Lunas');
    }
    // Fallback from bookings if invoices not loaded
    return bookings
      .filter((b) => b.paymentStatus !== 'Lunas')
      .map((b) => ({
        id: `INV-${b.code}`,
        invoiceNumber: `INV-${b.code}`,
        clientName: b.clientName,
        clientCompany: b.clientName,
        clientPhone: b.clientPhone,
        eventName: b.eventName,
        startDate: b.startDate,
        endDate: b.endDate,
        totalAmount: b.totalAmount,
        paidAmount: b.paidAmount,
        paymentStatus: b.paymentStatus,
        dueDate: '2026-10-18',
        isArchived: false,
        revisions: [],
        activeRevisionId: '',
        durationDays: 1,
        createdAt: '2026-10-10',
      })) as InvoiceRecord[];
  }, [invoices, bookings]);

  const [adminInvoiceFilter, setAdminInvoiceFilter] = useState<'all' | 'Belum Bayar' | 'DP 50%'>('all');

  const filteredUnpaidInvoices = useMemo(() => {
    if (adminInvoiceFilter === 'all') return unpaidInvoices;
    return unpaidInvoices.filter((inv) => inv.paymentStatus === adminInvoiceFilter);
  }, [unpaidInvoices, adminInvoiceFilter]);

  const unpaidInvoicesTotalSum = useMemo(() => {
    return unpaidInvoices.reduce(
      (sum, inv) => sum + Math.max(0, inv.totalAmount - (inv.paidAmount || 0)),
      0
    );
  }, [unpaidInvoices]);

  const countBelumBayar = unpaidInvoices.filter((inv) => inv.paymentStatus === 'Belum Bayar').length;
  const countDP50 = unpaidInvoices.filter((inv) => inv.paymentStatus === 'DP 50%').length;

  // 3. Warehouse Physical Stock Metrics
  const totalPhysicalUnits = equipmentList.reduce((sum, eq) => sum + eq.totalStock, 0);
  const unitsCurrentlyOut = bookings
    .filter((b) => b.logisticsStatus === 'Keluar Gudang')
    .reduce((sum, b) => sum + b.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const unitsStandby = Math.max(0, totalPhysicalUnits - unitsCurrentlyOut);

  // 4. Owner Financial Metrics
  const totalEventsThisMonth = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaidRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
  const unpaidTotal = bookings.reduce((sum, b) => sum + Math.max(0, b.totalAmount - b.paidAmount), 0);

  // 5. Check conflicts
  const conflictEvents = bookings.filter((b) => conflictMap.get(b.id)?.hasConflict);
  const hasAnyConflict = conflictEvents.length > 0;

  // Quick helper to format WhatsApp reminder message
  const handleOpenWhatsAppReminder = (inv: InvoiceRecord) => {
    const sisa = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
    const phone = (inv.clientPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone || '6281299008800';
    const message = encodeURIComponent(
      `Halo Bapak/Ibu ${inv.clientName},\n\nKami dari VendorOne menginformasikan tagihan sewa alat untuk event "${inv.eventName}" (No. Invoice: ${inv.invoiceNumber}).\nStatus Pembayaran: ${inv.paymentStatus}\nSisa Tagihan: ${formatRupiah(sisa)}\nBatas Waktu Pelunasan: ${inv.dueDate || 'H+1 Acara'}.\n\nMohon konfirmasi jika pembayaran telah dilakukan. Terima kasih!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="animate-page-enter relative">
      {/* Ambient background grid */}
      <div className="ambient-dashboard absolute inset-0 pointer-events-none z-0">
        <div className="ambient-dashboard-grid" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* ── Conflict Warning Banner ── */}
        {hasAnyConflict && (
          <div
            className="conflict-marker animate-slide-in-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4"
            style={{
              borderLeft: '3px solid #be123c',
              background: 'rgba(190,18,60,0.04)',
              border: '1px solid rgba(190,18,60,0.12)',
              borderRadius: '6px',
            }}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-[#be123c] shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: '#7f1d1d' }}>
                  PERINGATAN: Terdeteksi {conflictEvents.length} Event Mengalami Bentrok Stok (Double-Booking)!
                </p>
                <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: '#991b1b' }}>
                  Terdapat alokasi permintaan unit alat yang melebihi batas ketersediaan fisik gudang pada tanggal yang
                  bersamaan. Cek kalender bentrok untuk penyesuaian alokasi jadwal sewa.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToCalendar}
              className="btn-destructive shrink-0 flex items-center gap-1.5 text-xs"
            >
              <span>Buka Kalender Bentrok</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Low Stock Warning ── */}
        {lowStockEquipment.length > 0 && (
          <div
            className="px-5 py-4"
            style={{
              borderLeft: '3px solid #d97706',
              background: 'rgba(217,119,6,0.03)',
              border: '1px solid rgba(217,119,6,0.14)',
              borderRadius: '6px',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[13px] font-semibold text-amber-900">
                  Stok {lowStockEquipment.length} Model Alat Menipis / Kritis
                </span>
              </div>
              {onNavigateToInventory && (
                <button
                  onClick={onNavigateToInventory}
                  className="btn-ghost self-start md:self-auto text-xs flex items-center gap-1"
                >
                  <span>Cek Master Alat &amp; Gudang</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockEquipment.map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center gap-2 px-3 py-1.5"
                  style={{
                    background: '#fefdfb',
                    border: '1px solid rgba(17,19,24,0.08)',
                    borderRadius: '4px',
                  }}
                >
                  <span className="font-medium text-[12px] text-[#111318]">{eq.name}</span>
                  <span className="font-mono text-[11px] text-[#4b5563]">{eq.locationRack || 'Gudang Utama'}</span>
                  {eq.remaining <= 0 ? (
                    <span className="badge-carmine">Habis (0)</span>
                  ) : (
                    <span className="badge-amber">Sisa {eq.remaining}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. ROLE OWNER: FULL FINANCIAL SUMMARY & REVENUE (HANYA OWNER SAJA) */}
        {/* ========================================================================= */}
        {userRole === 'owner' && (
          <>
            {/* Owner KPI — Asymmetric Layout */}
            <div className="flex flex-col lg:flex-row gap-0" style={{ border: '1px solid rgba(17,19,24,0.08)', borderRadius: '8px', background: '#fefdfb', overflow: 'hidden' }}>
              {/* Large left figure block — Total Revenue */}
              <div className="lg:w-[55%] px-7 py-6 flex flex-col justify-between" style={{ borderRight: '1px solid rgba(17,19,24,0.07)' }}>
                <div>
                  <p className="field-label text-[10px] mb-1">Total Omset Sewa (Owner)</p>
                  <div className="metric-figure-mono animate-value-appear stagger-1" style={{ color: '#059669' }}>
                    {formatRupiah(totalRevenue)}
                  </div>
                  <p className="text-[12px] text-[#6b7280] mt-2">Nilai kontrak sewa keseluruhan · Oktober 2026</p>
                </div>
                <div className="mt-5 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid rgba(17,19,24,0.06)' }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-[#6b7280]">{totalEventsThisMonth} event aktif berjalan bulan ini</span>
                </div>
              </div>

              {/* Right column — 3 smaller metrics */}
              <div className="lg:w-[45%] flex flex-col divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                {/* Kas Masuk */}
                <div className="px-6 py-4 flex items-center justify-between animate-value-appear stagger-2">
                  <div>
                    <p className="field-label text-[10px] mb-0.5">Kas Masuk (Terbayar)</p>
                    <div className="font-mono tabular-nums text-[18px] font-bold" style={{ color: '#4f46e5' }}>
                      {formatRupiah(totalPaidRevenue)}
                    </div>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">Realisasi arus kas operasional</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                </div>

                {/* Piutang */}
                <div className="px-6 py-4 flex items-center justify-between animate-value-appear stagger-3">
                  <div>
                    <p className="field-label text-[10px] mb-0.5">Sisa Piutang Klien</p>
                    <div className="font-mono tabular-nums text-[18px] font-bold" style={{ color: '#be123c' }}>
                      {formatRupiah(unpaidTotal)}
                    </div>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">{unpaidInvoices.length} invoice belum lunas</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-carmine-500 shrink-0" style={{ background: '#be123c' }} />
                </div>

                {/* Total Events */}
                <div className="px-6 py-4 flex items-center justify-between animate-value-appear stagger-4">
                  <div>
                    <p className="field-label text-[10px] mb-0.5">Total Event Bulan Ini</p>
                    <div className="font-mono tabular-nums text-[18px] font-bold text-[#111318]">
                      {totalEventsThisMonth} Event
                    </div>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">Oktober 2026 · Aktif berjalan</p>
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#6366f1' }} />
                </div>
              </div>
            </div>

            {/* Full Recharts Financial Summary for Owner */}
            <FinancialSummary
              bookings={bookings}
              equipmentList={equipmentList}
              userRole={userRole}
              onNavigateToCalendar={onNavigateToCalendar}
              onNavigateToInvoice={() => onNavigateToInvoice()}
            />

            {/* Owner Table of Events with Nilai Sewa */}
            <div className="panel overflow-hidden">
              <div
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid rgba(17,19,24,0.07)' }}
              >
                <div>
                  <h2 className="text-[14px] font-bold text-[#111318] tracking-tight">
                    Jadwal Event Mendatang &amp; Realisasi Finansial
                  </h2>
                  <p className="text-[12px] text-[#6b7280] mt-0.5">
                    Daftar seluruh kegiatan sewa dengan nilai kontrak dan status pembayaran klien
                  </p>
                </div>
                <button
                  onClick={onNavigateToCalendar}
                  className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <span>Buka Kalender Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tgl Event</th>
                      <th>Nama Event &amp; Lokasi</th>
                      <th>Klien &amp; Lembaga</th>
                      <th>Status Alat</th>
                      <th>Status Bayar</th>
                      <th className="text-right">Nilai Sewa</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const conflictInfo = conflictMap.get(booking.id);
                      const isConflict = conflictInfo?.hasConflict;

                      return (
                        <tr
                          key={booking.id}
                          className={`table-row-hover ${isConflict ? 'bg-red-50/40' : ''}`}
                        >
                          <td className="whitespace-nowrap">
                            <div className="font-mono text-[12px] text-[#111318] font-medium">
                              {formatDateIndo(booking.startDate)} – {formatDateIndo(booking.endDate)}
                            </div>
                            <span className="font-mono text-[10px] text-[#9ca3af]">Kode: {booking.code}</span>
                          </td>
                          <td className="max-w-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-[#111318]">
                              {isConflict && (
                                <AlertTriangle className="w-3.5 h-3.5 text-[#be123c] shrink-0" />
                              )}
                              <span className="truncate">{booking.eventName}</span>
                            </div>
                            <div className="text-[11px] text-[#9ca3af] truncate mt-0.5">{booking.location}</div>
                          </td>
                          <td className="whitespace-nowrap">
                            <div className="font-medium text-[#111318] text-[12px]">{booking.clientName}</div>
                            <div className="font-mono text-[11px] text-[#9ca3af]">{booking.clientPhone}</div>
                          </td>
                          <td className="whitespace-nowrap">
                            {booking.logisticsStatus === 'Keluar Gudang' && (
                              <span className="flex items-center gap-1.5 text-[12px] text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                Sedang Keluar
                              </span>
                            )}
                            {booking.logisticsStatus === 'Persiapan' && (
                              <span className="flex items-center gap-1.5 text-[12px] text-[#4b5563]">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                Persiapan Gudang
                              </span>
                            )}
                            {booking.logisticsStatus === 'Kembali / Selesai' && (
                              <span className="flex items-center gap-1.5 text-[12px] text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                Kembali / Selesai
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap">
                            {booking.paymentStatus === 'Lunas' && (
                              <span className="badge-emerald">Lunas</span>
                            )}
                            {booking.paymentStatus === 'DP 50%' && (
                              <span className="badge-amber">DP 50%</span>
                            )}
                            {booking.paymentStatus === 'Belum Bayar' && (
                              <span className="badge-carmine">Belum Bayar</span>
                            )}
                          </td>
                          <td className="text-right font-mono tabular-nums whitespace-nowrap text-[#111318] font-semibold">
                            {formatRupiah(booking.totalAmount)}
                          </td>
                          <td className="text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                const match = invoices.find(
                                  (inv) =>
                                    inv.eventName === booking.eventName ||
                                    inv.clientName === booking.clientName
                                );
                                onNavigateToInvoice(match ? match.id : undefined);
                              }}
                              className="btn-ghost text-[11px] px-2.5 py-1"
                            >
                              Detail Invoice
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dedicated Section: MANAJEMEN PENGGUNA & OTORISASI ROLE OLEH OWNER */}
            <div className="panel-elevated overflow-hidden">
              <div
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid rgba(17,19,24,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <h2 className="text-[14px] font-bold text-[#111318] tracking-tight">
                      Manajemen Pengguna &amp; Otorisasi Hak Akses (Owner Control)
                    </h2>
                    <p className="text-[12px] text-[#6b7280] mt-0.5">
                      Kelola akun tim, beri atau ubah role (Admin, Staf Gudang, Owner) dan kontrol akses sistem
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="btn-primary flex items-center gap-1.5 text-xs shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah / Daftarkan Pengguna</span>
                </button>
              </div>

              {userRoleNotification && (
                <div className="mx-5 mt-4 px-4 py-2.5 flex items-center justify-between gap-2"
                  style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: '6px' }}>
                  <span className="text-[12px] text-emerald-800">{userRoleNotification}</span>
                  <button
                    onClick={() => setUserRoleNotification(null)}
                    className="text-emerald-700 font-bold text-sm leading-none"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Pengguna &amp; Email</th>
                      <th>Jabatan / Posisi</th>
                      <th>Role Saat Ini</th>
                      <th>Hak Akses Sistem</th>
                      <th className="text-center">Ubah Role Pengguna</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAccounts.map((u) => (
                      <tr key={u.id} className="table-row-hover">
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-7 h-7 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: u.avatarBgColor || '#4F46E5' }}
                            >
                              {u.avatarInitials || u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[#111318] text-[12px]">{u.name}</div>
                              <div className="font-mono text-[11px] text-[#9ca3af]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-[12px] text-[#4b5563]">{u.title || '-'}</td>
                        <td>
                          {u.role === 'owner' && (
                            <span className="role-pill role-pill-owner">
                              <ShieldCheck className="w-3 h-3" />
                              Owner
                            </span>
                          )}
                          {u.role === 'admin' && (
                            <span className="role-pill role-pill-admin">
                              <UserCheck className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          {u.role === 'warehouse' && (
                            <span className="role-pill role-pill-warehouse">
                              <Warehouse className="w-3 h-3" />
                              Gudang
                            </span>
                          )}
                        </td>
                        <td className="text-[11px] text-[#6b7280] max-w-xs leading-relaxed">
                          {u.permissionsDescription}
                        </td>
                        <td className="text-center">
                          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md"
                            style={{ background: 'rgba(17,19,24,0.05)', border: '1px solid rgba(17,19,24,0.08)' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateUserRole) onUpdateUserRole(u.id, 'admin');
                                setUserRoleNotification(`Role ${u.name} berhasil diubah menjadi Admin.`);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                                u.role === 'admin'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-[#4b5563] hover:text-[#111318] hover:bg-white'
                              }`}
                              title="Beri akses Admin"
                            >
                              Admin
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateUserRole) onUpdateUserRole(u.id, 'warehouse');
                                setUserRoleNotification(`Role ${u.name} berhasil diubah menjadi Staf Gudang.`);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                                u.role === 'warehouse'
                                  ? 'bg-amber-600 text-white'
                                  : 'text-[#4b5563] hover:text-[#111318] hover:bg-white'
                              }`}
                              title="Beri akses Staf Gudang"
                            >
                              Gudang
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateUserRole) onUpdateUserRole(u.id, 'owner');
                                setUserRoleNotification(`Role ${u.name} berhasil diubah menjadi Owner.`);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                                u.role === 'owner'
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-[#4b5563] hover:text-[#111318] hover:bg-white'
                              }`}
                              title="Beri akses Owner"
                            >
                              Owner
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(17,19,24,0.06)', background: 'rgba(17,19,24,0.01)' }}
              >
                <span className="text-[11px] text-[#9ca3af]">Total {userAccounts.length} akun terdaftar dalam sistem VendorOne.</span>
                <span className="text-[11px] font-medium text-[#4b5563]">Perubahan role langsung aktif saat user masuk / login</span>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. ROLE ADMIN: FOKUS PADA INVOICE BELUM LUNAS (TANPA PENDAPATAN) */}
        {/* ========================================================================= */}
        {userRole === 'admin' && (
          <>
            {/* Admin KPI Inline Row */}
            <div
              className="flex flex-wrap items-stretch divide-x"
              style={{
                background: '#fefdfb',
                border: '1px solid rgba(17,19,24,0.08)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {/* Total Belum Lunas — large */}
              <div className="flex-1 min-w-[200px] px-6 py-5">
                <p className="field-label text-[10px] mb-1">Invoice Belum Lunas</p>
                <div className="metric-figure animate-value-appear stagger-1" style={{ color: '#be123c' }}>
                  {unpaidInvoices.length}
                  <span className="text-[18px] font-medium ml-1.5">invoice</span>
                </div>
                <p className="text-[11px] text-[#9ca3af] mt-1">Perlu tindak lanjut penagihan</p>
              </div>

              <div className="w-px" style={{ background: 'rgba(17,19,24,0.07)' }} />

              <div className="flex-1 min-w-[160px] px-6 py-5 animate-value-appear stagger-2">
                <p className="field-label text-[10px] mb-1">Status Belum Bayar</p>
                <div className="font-mono tabular-nums text-[22px] font-bold text-amber-600">{countBelumBayar}</div>
                <p className="text-[11px] text-[#9ca3af] mt-1">Belum menerima DP klien</p>
              </div>

              <div className="w-px" style={{ background: 'rgba(17,19,24,0.07)' }} />

              <div className="flex-1 min-w-[160px] px-6 py-5 animate-value-appear stagger-3">
                <p className="field-label text-[10px] mb-1">Status DP 50%</p>
                <div className="font-mono tabular-nums text-[22px] font-bold text-indigo-600">{countDP50}</div>
                <p className="text-[11px] text-[#9ca3af] mt-1">Menunggu pelunasan pasca event</p>
              </div>

              <div className="w-px" style={{ background: 'rgba(17,19,24,0.07)' }} />

              <div className="flex-1 min-w-[160px] px-6 py-5 animate-value-appear stagger-4">
                <p className="field-label text-[10px] mb-1">Total Event Aktif</p>
                <div className="font-mono tabular-nums text-[22px] font-bold text-[#111318]">{totalEventsThisMonth}</div>
                <p className="text-[11px] text-[#9ca3af] mt-1">Oktober 2026</p>
              </div>
            </div>

            {/* Dedicated Section: MONITORING & PENAGIHAN INVOICE BELUM LUNAS */}
            <div className="panel overflow-hidden">
              <div
                className="px-5 py-4 flex flex-col md:flex-row md:items-start justify-between gap-4"
                style={{ borderBottom: '1px solid rgba(17,19,24,0.07)' }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="w-4 h-4 text-[#be123c]" />
                    <h2 className="text-[14px] font-bold text-[#111318] tracking-tight">
                      Monitoring &amp; Tindak Lanjut Invoice Belum Lunas
                    </h2>
                  </div>
                  <p className="text-[12px] text-[#6b7280]">
                    Daftar tagihan klien aktif yang belum lunas dengan kontak PIC untuk percepatan pelunasan.
                  </p>
                  {/* Total outstanding figure */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="field-label text-[10px]">Total Piutang Belum Lunas:</span>
                    <span className="font-mono tabular-nums text-[15px] font-bold" style={{ color: '#be123c' }}>
                      {formatRupiah(unpaidInvoicesTotalSum)}
                    </span>
                  </div>
                </div>

                {/* Filter tabs — text links with underline indicator */}
                <div className="flex items-center gap-4 shrink-0 self-start md:self-auto mt-1">
                  <button
                    onClick={() => setAdminInvoiceFilter('all')}
                    className={`text-[12px] font-semibold pb-0.5 transition-colors ${
                      adminInvoiceFilter === 'all'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-[#6b7280] hover:text-[#111318] border-b-2 border-transparent'
                    }`}
                  >
                    Semua ({unpaidInvoices.length})
                  </button>
                  <button
                    onClick={() => setAdminInvoiceFilter('Belum Bayar')}
                    className={`text-[12px] font-semibold pb-0.5 transition-colors ${
                      adminInvoiceFilter === 'Belum Bayar'
                        ? 'text-[#be123c] border-b-2 border-[#be123c]'
                        : 'text-[#6b7280] hover:text-[#111318] border-b-2 border-transparent'
                    }`}
                  >
                    Belum Bayar ({countBelumBayar})
                  </button>
                  <button
                    onClick={() => setAdminInvoiceFilter('DP 50%')}
                    className={`text-[12px] font-semibold pb-0.5 transition-colors ${
                      adminInvoiceFilter === 'DP 50%'
                        ? 'text-amber-600 border-b-2 border-amber-600'
                        : 'text-[#6b7280] hover:text-[#111318] border-b-2 border-transparent'
                    }`}
                  >
                    DP 50% ({countDP50})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No. Invoice &amp; Tanggal</th>
                      <th>Klien &amp; Lembaga</th>
                      <th>Event Terkait</th>
                      <th>Status Bayar</th>
                      <th>Jatuh Tempo</th>
                      <th>Kontak PIC</th>
                      <th className="text-center">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnpaidInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#9ca3af]">
                          <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-2" />
                          <p className="font-semibold text-[#4b5563]">Semua invoice pada filter ini sudah lunas!</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUnpaidInvoices.map((inv, idx) => (
                        <tr key={inv.id} className={`table-row-hover stagger-${Math.min(idx + 1, 8)}`}>
                          <td className="whitespace-nowrap">
                            <div className="font-mono text-[12px] font-bold text-indigo-600">{inv.invoiceNumber}</div>
                            <div className="font-mono text-[10px] text-[#9ca3af]">
                              {formatDateIndo(inv.startDate || '2026-10-10')}
                            </div>
                          </td>
                          <td>
                            <div className="font-semibold text-[#111318] text-[12px]">{inv.clientName}</div>
                            <div className="text-[11px] text-[#9ca3af] truncate max-w-[160px]">
                              {inv.clientCompany || 'Instansi Swasta'}
                            </div>
                          </td>
                          <td className="max-w-[180px]">
                            <div className="font-medium text-[#111318] text-[12px] truncate">{inv.eventName}</div>
                          </td>
                          <td className="whitespace-nowrap">
                            {inv.paymentStatus === 'Belum Bayar' ? (
                              <span className="badge-carmine">Belum Bayar (0%)</span>
                            ) : (
                              <span className="badge-amber">DP 50% Masuk</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap">
                            <span className="font-mono text-[12px] text-[#4b5563]">
                              {inv.dueDate ? formatDateIndo(inv.dueDate) : 'H+1 Acara'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap">
                            <span className="font-mono text-[11px] text-[#4b5563]">
                              {inv.clientPhone || '0812-9900-8800'}
                            </span>
                          </td>
                          <td className="text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onNavigateToInvoice(inv.id)}
                                className="btn-primary text-[11px] px-2.5 py-1 flex items-center gap-1"
                                title="Buka Invoice di Editor"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Buka &amp; Tagih</span>
                              </button>
                              <button
                                onClick={() => handleOpenWhatsAppReminder(inv)}
                                className="btn-ghost text-[11px] px-2.5 py-1 flex items-center gap-1"
                                title="Kirim Pesan Pengingat WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WA Klien</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Upcoming Events */}
            <div className="panel overflow-hidden">
              <div
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid rgba(17,19,24,0.07)' }}
              >
                <div>
                  <h2 className="text-[14px] font-bold text-[#111318] tracking-tight">
                    Status Jadwal Booking Event (Admin Operasional)
                  </h2>
                  <p className="text-[12px] text-[#6b7280] mt-0.5">
                    Daftar seluruh event mendatang untuk koordinasi logistik dan kelengkapan administrasi
                  </p>
                </div>
                <button
                  onClick={onNavigateToCalendar}
                  className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <span>Lihat di Kalender</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tgl Event</th>
                      <th>Nama Event &amp; Lokasi</th>
                      <th>Klien &amp; Kontak</th>
                      <th>Status Alat</th>
                      <th>Status Bayar</th>
                      <th className="text-center">Aksi Tagihan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="table-row-hover">
                        <td className="whitespace-nowrap">
                          <span className="font-mono text-[12px] text-[#111318] font-medium">
                            {formatDateIndo(booking.startDate)} – {formatDateIndo(booking.endDate)}
                          </span>
                        </td>
                        <td className="max-w-xs">
                          <div className="font-semibold text-[#111318] text-[12px] truncate">{booking.eventName}</div>
                          <div className="text-[11px] text-[#9ca3af] truncate">{booking.location}</div>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="font-medium text-[#111318] text-[12px]">{booking.clientName}</div>
                          <div className="font-mono text-[11px] text-[#9ca3af]">{booking.clientPhone}</div>
                        </td>
                        <td className="whitespace-nowrap">
                          {booking.logisticsStatus === 'Keluar Gudang' && (
                            <span className="flex items-center gap-1.5 text-[12px] text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              Sedang di Luar
                            </span>
                          )}
                          {booking.logisticsStatus === 'Persiapan' && (
                            <span className="flex items-center gap-1.5 text-[12px] text-[#4b5563]">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                              Persiapan
                            </span>
                          )}
                          {booking.logisticsStatus === 'Kembali / Selesai' && (
                            <span className="flex items-center gap-1.5 text-[12px] text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Kembali / Selesai
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          {booking.paymentStatus === 'Lunas' ? (
                            <span className="badge-emerald">Lunas</span>
                          ) : booking.paymentStatus === 'DP 50%' ? (
                            <span className="badge-amber">{booking.paymentStatus}</span>
                          ) : (
                            <span className="badge-carmine">{booking.paymentStatus}</span>
                          )}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              const match = invoices.find(
                                (inv) =>
                                  inv.eventName === booking.eventName ||
                                  inv.clientName === booking.clientName
                              );
                              onNavigateToInvoice(match ? match.id : undefined);
                            }}
                            className="btn-ghost text-[11px] px-2.5 py-1"
                          >
                            Kelola Tagihan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 3. ROLE WAREHOUSE / GUDANG: FOKUS PADA STOCK (TANPA PENDAPATAN) */}
        {/* ========================================================================= */}
        {userRole === 'warehouse' && (
          <>
            {/* Warehouse KPI — 4 compact inline figures */}
            <div
              className="flex flex-wrap items-stretch divide-x"
              style={{
                background: '#fefdfb',
                border: '1px solid rgba(17,19,24,0.08)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div className="flex-1 min-w-[160px] px-6 py-5 animate-value-appear stagger-1">
                <p className="field-label text-[10px] mb-1">Total Stok Fisik Gudang</p>
                <div className="font-mono tabular-nums text-[22px] font-bold text-[#111318]">{totalPhysicalUnits}</div>
                <p className="text-[11px] text-[#9ca3af] mt-1">{equipmentList.length} Model · Inventaris Utama</p>
              </div>

              <div className="w-px" style={{ background: 'rgba(17,19,24,0.07)' }} />

              <div className="flex-1 min-w-[160px] px-6 py-5 animate-value-appear stagger-2">
                <p className="field-label text-[10px] mb-1">Alat Sedang di Luar</p>
                <div className="font-mono tabular-nums text-[22px] font-bold text-amber-600">{unitsCurrentlyOut}</div>
                <p className="text-[11px] text-[#9ca3af] mt-1">Teralokasi pada event aktif</p>
              </div>

              <div className="w-px" style={{ background: 'rgba(17,19,24,0.07)' }} />

              <div className="flex-1 min-w-[160px] px-6 py-5 animate-value-appear stagger-3">
                <p className="field-label text-[10px] mb-1">Alat Standby di Rak</p>
                <div className="font-mono tabular-nums text-[22px] font-bold text-emerald-600">{unitsStandby}</div>
                <p className="text-[11px] text-[#9ca3af] mt-1">Siap sewa &amp; lolos QC</p>
              </div>

              <div className="w-px" style={{ background: 'rgba(17,19,24,0.07)' }} />

              <div className="flex-1 min-w-[160px] px-6 py-5 animate-value-appear stagger-4">
                <p className="field-label text-[10px] mb-1">Model Alat Stok Menipis</p>
                <div
                  className="font-mono tabular-nums text-[22px] font-bold"
                  style={{ color: lowStockEquipment.length > 0 ? '#be123c' : '#059669' }}
                >
                  {lowStockEquipment.length}
                </div>
                <p className="text-[11px] text-[#9ca3af] mt-1">Perlu perhatian khusus</p>
              </div>
            </div>

            {/* Section: STOCK UTILIZATION & CAPACITY ANALYTICS */}
            <FinancialSummary
              bookings={bookings}
              equipmentList={equipmentList}
              userRole="warehouse"
              onNavigateToCalendar={onNavigateToCalendar}
              onNavigateToInvoice={() => {}}
            />

            {/* Section: LOGISTICS & PHYSICAL EQUIPMENT SCHEDULE */}
            <div className="panel overflow-hidden">
              <div
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid rgba(17,19,24,0.07)' }}
              >
                <div>
                  <h2 className="text-[14px] font-bold text-[#111318] tracking-tight">
                    Jadwal Pergerakan Logistik Gudang (Loading, Keluar &amp; Kembali)
                  </h2>
                  <p className="text-[12px] text-[#6b7280] mt-0.5">
                    Monitoring status fisik barang, alokasi unit sewa, dan kesiapan serah-terima lapangan
                  </p>
                </div>
                <button
                  onClick={onNavigateToCalendar}
                  className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <span>Buka Kalender Logistik</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tgl Loading &amp; Event</th>
                      <th>Nama Event &amp; Lokasi</th>
                      <th>Klien / PIC Lapangan</th>
                      <th>Status Fisik Alat</th>
                      <th className="text-center">Total Unit Sewa</th>
                      <th className="text-center">Aksi Gudang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const totalItemsCount = booking.items.reduce((sum, it) => sum + it.quantity, 0);

                      return (
                        <tr key={booking.id} className="table-row-hover">
                          <td className="whitespace-nowrap">
                            <div className="font-mono text-[12px] text-[#111318] font-medium">
                              {formatDateIndo(booking.startDate)} – {formatDateIndo(booking.endDate)}
                            </div>
                            <span className="font-mono text-[10px] text-[#9ca3af]">Kode: {booking.code}</span>
                          </td>
                          <td className="max-w-xs">
                            <div className="font-semibold text-[#111318] text-[12px] truncate">{booking.eventName}</div>
                            <div className="text-[11px] text-[#9ca3af] truncate">{booking.location}</div>
                          </td>
                          <td className="whitespace-nowrap">
                            <div className="font-medium text-[#111318] text-[12px]">{booking.clientName}</div>
                            <div className="font-mono text-[11px] text-[#9ca3af]">{booking.clientPhone}</div>
                          </td>
                          <td className="whitespace-nowrap">
                            {booking.logisticsStatus === 'Keluar Gudang' && (
                              <span className="badge-amber">Sedang di Luar</span>
                            )}
                            {booking.logisticsStatus === 'Persiapan' && (
                              <span className="badge-ink">Tahap Persiapan</span>
                            )}
                            {booking.logisticsStatus === 'Kembali / Selesai' && (
                              <span className="badge-emerald">Kembali ke Gudang</span>
                            )}
                          </td>
                          <td className="text-center font-mono font-bold text-[#111318] whitespace-nowrap">
                            {totalItemsCount} Unit
                          </td>
                          <td className="text-center whitespace-nowrap">
                            {onNavigateToInventory && (
                              <button
                                onClick={onNavigateToInventory}
                                className="btn-ghost text-[11px] px-2.5 py-1"
                              >
                                Cek Stok di Rak
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Quick Overview Section: Monitoring Ketersediaan Unit Populer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[13px] text-[#111318] tracking-tight">
                Monitoring Ketersediaan Unit Populer
              </h3>
              <span className="text-[11px] text-[#9ca3af]">Stok Gudang VendorOne</span>
            </div>

            <div className="space-y-3.5">
              {equipmentList.slice(0, 5).map((eq) => {
                const lockedUnits = bookings
                  .filter((b) => b.logisticsStatus !== 'Kembali / Selesai' && b.status !== 'Dibatalkan')
                  .reduce((sum, b) => {
                    const it = b.items.find((i) => i.equipmentId === eq.id);
                    return sum + (it ? it.quantity : 0);
                  }, 0);
                const percentage = Math.min(100, Math.round((lockedUnits / eq.totalStock) * 100));

                return (
                  <div key={eq.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-[12px] text-[#111318]">{eq.name}</span>
                      <span className="font-mono text-[11px] text-[#6b7280] tabular-nums">
                        <span className="font-bold text-[#111318]">{lockedUnits}</span>/{eq.totalStock} unit ({percentage}%)
                      </span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill transition-all duration-300 ${
                          percentage > 100
                            ? 'bg-[#be123c]'
                            : percentage >= 80
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SOP Panel — dark ink surface */}
          <div
            className="rounded-lg p-5 flex flex-col justify-between"
            style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
                  SOP Alur Sistem VendorOne
                </span>
              </div>
              <h4 className="font-bold text-[15px] text-white leading-snug">Siklus Bebas Double-Booking</h4>
              <ul className="mt-4 space-y-3">
                {[
                  { n: '1', label: 'Cek Ketersediaan:', desc: 'Input rentang tanggal sebelum invoice diterbitkan.' },
                  { n: '2', label: 'Deteksi Bentrok:', desc: 'Sistem mengunci unit & memberi alert jika stok minus.' },
                  { n: '3', label: 'Arsip & Snapshot:', desc: 'Invoice tersimpan permanen per versi revisi.' },
                  { n: '4', label: 'Kontrol Master Alat:', desc: 'Kelola tarif sewa, spesifikasi, dan kondisi fisik barang.' },
                ].map((item) => (
                  <li key={item.n} className="flex items-start gap-2.5">
                    <span className="font-mono text-[11px] text-indigo-400 font-bold shrink-0 mt-0.5">{item.n}.</span>
                    <span className="text-[12px] text-[#9ca3af] leading-relaxed">
                      <strong className="text-[#d1d5db]">{item.label}</strong> {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="mt-5 pt-4 text-[11px] text-[#6b7280]"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              Terintegrasi otomatis dengan modul Gudang dan Finansial VendorOne.
            </div>
          </div>
        </div>

        {/* MODAL: DAFTARKAN PENGGUNA BARU DARI DASHBOARD OWNER */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-enter"
            style={{ background: 'rgba(17,19,24,0.72)', backdropFilter: 'blur(4px)' }}>
            <div
              className="max-w-lg w-full overflow-hidden animate-dialog-enter"
              style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}
            >
              {/* Modal Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-indigo-600">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-white">Daftarkan Pengguna Baru</h3>
                    <p className="text-[11px] text-[#6b7280]">
                      Otorisasi role langsung oleh Owner untuk akses tim VendorOne
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="text-[#6b7280] hover:text-white transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newUserForm.name.trim() || !newUserForm.email.trim()) return;

                  const initials = newUserForm.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  const roleDesc =
                    newUserForm.role === 'owner'
                      ? 'Akses Penuh: Finansial, Omzet, Ubah Kop/Logo Invoice, Monitoring'
                      : newUserForm.role === 'warehouse'
                      ? 'Akses Lapangan: Master Alat, Kontrol Stok Fisik & Kesiapan Logistik'
                      : 'Akses Operasional: Kalender Bentrok, Booking, Monitoring Invoice Belum Lunas';

                  const roleColor =
                    newUserForm.role === 'owner'
                      ? '#059669'
                      : newUserForm.role === 'warehouse'
                      ? '#D97706'
                      : '#4F46E5';

                  const newUser: UserAccount = {
                    id: `usr-${Date.now()}`,
                    name: newUserForm.name.trim(),
                    email: newUserForm.email.trim().toLowerCase(),
                    role: newUserForm.role,
                    title: newUserForm.title.trim() || (newUserForm.role === 'owner' ? 'Owner / Pimpinan' : newUserForm.role === 'warehouse' ? 'Staf Gudang & Logistik' : 'Admin Operasional'),
                    avatarInitials: initials || 'V1',
                    avatarBgColor: roleColor,
                    permissionsDescription: roleDesc,
                    passwordHash: newUserForm.password || 'password123',
                    status: 'active',
                    createdAt: new Date().toISOString().split('T')[0],
                  };

                  if (onAddNewUser) onAddNewUser(newUser);
                  setUserRoleNotification(`Pengguna ${newUser.name} (${newUser.role.toUpperCase()}) berhasil didaftarkan dan dapat langsung login.`);
                  setShowAddUserModal(false);
                  setNewUserForm({
                    name: '',
                    email: '',
                    role: 'admin',
                    title: '',
                    password: '',
                  });
                }}
                className="p-5 space-y-4"
              >
                <div>
                  <label className="field-label block mb-1.5">Nama Lengkap Karyawan / Pengguna</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="Contoh: Rian Anggara"
                    className="field-input w-full"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  />
                </div>

                <div>
                  <label className="field-label block mb-1.5">Alamat Email (Digunakan untuk Login)</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="rian@vendorone.id"
                    className="field-input w-full font-mono"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="field-label block mb-1.5">Pilih Role / Hak Akses</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                      className="field-input w-full font-semibold"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <option value="admin" style={{ background: '#1a1d24' }}>Admin (Fokus Tagihan Belum Lunas)</option>
                      <option value="warehouse" style={{ background: '#1a1d24' }}>Gudang (Fokus Stok & Logistik)</option>
                      <option value="owner" style={{ background: '#1a1d24' }}>Owner (Akses Omset & Finansial)</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label block mb-1.5">Jabatan / Posisi Kerja</label>
                    <input
                      type="text"
                      value={newUserForm.title}
                      onChange={(e) => setNewUserForm({ ...newUserForm, title: e.target.value })}
                      placeholder="Contoh: Staf Penagihan / Koordinator"
                      className="field-input w-full"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.1)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label block mb-1.5">Kata Sandi Sementara (Password)</label>
                  <input
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="Kosongkan untuk default: password123"
                    className="field-input w-full font-mono"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  />
                  <span className="text-[10px] text-[#6b7280] mt-1 block">
                    Password demo default adalah "password123". Pengguna bisa login langsung via form masuk.
                  </span>
                </div>

                <div
                  className="pt-4 flex items-center justify-end gap-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="btn-ghost text-[12px] px-4 py-2"
                    style={{ color: '#9ca3af', borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-1.5 text-[12px] px-4 py-2"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Daftarkan Akun</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
