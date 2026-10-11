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
  Sparkles,
  Boxes,
  PhoneCall,
  MessageSquare,
  FileText,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Warehouse,
  KeyRound,
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
    <div className="space-y-6">
      {/* Bentrok Double-Booking Warning Banner */}
      {hasAnyConflict && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 text-red-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-lg shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-red-900 tracking-tight">
                  PERINGATAN: Terdeteksi {conflictEvents.length} Event Mengalami Bentrok Stok (Double-Booking)!
                </span>
                <span className="text-[11px] font-semibold bg-red-200 text-red-800 px-2 py-0.5 rounded">
                  Perhatian Khusus
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1 max-w-3xl leading-relaxed">
                Terdapat alokasi permintaan unit alat yang melebihi batas ketersediaan fisik gudang pada tanggal yang bersamaan.
                Cek kalender bentrok untuk penyesuaian alokasi jadwal sewa.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToCalendar}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Buka Kalender Bentrok</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PEMBERITAHUAN STOK MENIPIS (Menggantikan Terapkan Solusi Sesuai Permintaan) */}
      {lowStockEquipment.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 sm:p-5 text-amber-950 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-900">
                  Pemberitahuan: Stok {lowStockEquipment.length} Model Alat Menipis / Kritis!
                </h3>
                <p className="text-xs text-amber-800">
                  Unit berikut sedang teralokasi tinggi pada sewa aktif sehingga sisa fisik di gudang tersisa sedikit atau habis.
                </p>
              </div>
            </div>
            {onNavigateToInventory && (
              <button
                onClick={onNavigateToInventory}
                className="self-start md:self-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <span>Cek Master Alat & Gudang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {lowStockEquipment.map((eq) => (
              <div
                key={eq.id}
                className="bg-white p-3 rounded-lg border border-amber-200/80 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">{eq.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Rak: <strong className="text-slate-700">{eq.locationRack || 'Gudang Utama'}</strong> · {eq.category}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {eq.remaining <= 0 ? (
                    <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] rounded">
                      🚨 Habis (0 Unit)
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] rounded">
                      ⚠️ Sisa {eq.remaining} Unit
                    </span>
                  )}
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {eq.lockedUnits}/{eq.totalStock} terpakai
                  </div>
                </div>
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
          {/* Owner Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Total Event Bulan Ini
                </span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CalendarDays className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {totalEventsThisMonth} Event
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Oktober 2026</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 font-medium">Aktif Berjalan</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Total Omset Sewa (Owner)
                </span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono tabular-nums">
                  {formatRupiah(totalRevenue)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Nilai kontrak sewa keseluruhan</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Kas Masuk (Terbayar)
                </span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 font-mono tabular-nums">
                  {formatRupiah(totalPaidRevenue)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Realisasi arus kas operasional</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Sisa Piutang Klien
                </span>
                <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-bold text-rose-600 font-mono tabular-nums">
                  {formatRupiah(unpaidTotal)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>{unpaidInvoices.length} Invoice Belum Lunas</span>
                </div>
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Jadwal Event Mendatang & Realisasi Finansial
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh kegiatan sewa dengan nilai kontrak dan status pembayaran klien
                </p>
              </div>
              <button
                onClick={onNavigateToCalendar}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <span>Buka Kalender Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tgl Event</th>
                    <th className="py-3 px-4">Nama Event & Lokasi</th>
                    <th className="py-3 px-4">Klien & Lembaga</th>
                    <th className="py-3 px-4">Status Alat</th>
                    <th className="py-3 px-4">Status Bayar</th>
                    <th className="py-3 px-4 text-right">Nilai Sewa</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {bookings.map((booking) => {
                    const conflictInfo = conflictMap.get(booking.id);
                    const isConflict = conflictInfo?.hasConflict;

                    return (
                      <tr
                        key={booking.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isConflict ? 'bg-red-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap text-slate-900 font-medium">
                          <div>
                            {formatDateIndo(booking.startDate)} - {formatDateIndo(booking.endDate)}
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal">
                            Kode: {booking.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                            {isConflict && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            )}
                            <span className="truncate">{booking.eventName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {booking.location}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{booking.clientName}</div>
                          <div className="text-[11px] text-slate-500">{booking.clientPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {booking.logisticsStatus === 'Keluar Gudang' && (
                            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                              Sedang Keluar
                            </span>
                          )}
                          {booking.logisticsStatus === 'Persiapan' && (
                            <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium text-[11px]">
                              Persiapan Gudang
                            </span>
                          )}
                          {booking.logisticsStatus === 'Kembali / Selesai' && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                              Kembali / Selesai
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {booking.paymentStatus === 'Lunas' && (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                              Lunas
                            </span>
                          )}
                          {booking.paymentStatus === 'DP 50%' && (
                            <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                              DP 50%
                            </span>
                          )}
                          {booking.paymentStatus === 'Belum Bayar' && (
                            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium">
                              Belum Bayar
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap text-slate-900 font-semibold">
                          {formatRupiah(booking.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              const match = invoices.find(
                                (inv) =>
                                  inv.eventName === booking.eventName ||
                                  inv.clientName === booking.clientName
                              );
                              onNavigateToInvoice(match ? match.id : undefined);
                            }}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      Manajemen Pengguna & Otorisasi Hak Akses (Owner Control)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola akun tim, beri atau ubah role (Admin, Staf Gudang, Owner) dan kontrol akses sistem
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah / Daftarkan Pengguna</span>
              </button>
            </div>

            {userRoleNotification && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
                <span>{userRoleNotification}</span>
                <button
                  onClick={() => setUserRoleNotification(null)}
                  className="font-bold text-emerald-900 ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Pengguna & Email</th>
                    <th className="py-3 px-4">Jabatan / Posisi</th>
                    <th className="py-3 px-4">Role Saat Ini</th>
                    <th className="py-3 px-4">Hak Akses Sistem</th>
                    <th className="py-3 px-4 text-center">Ubah Role Pengguna</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {userAccounts.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: u.avatarBgColor || '#4F46E5' }}
                          >
                            {u.avatarInitials || u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {u.title || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === 'owner' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Owner
                          </span>
                        )}
                        {u.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                            <UserCheck className="w-3.5 h-3.5" />
                            Admin
                          </span>
                        )}
                        {u.role === 'warehouse' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Warehouse className="w-3.5 h-3.5" />
                            Gudang
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                        {u.permissionsDescription}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateUserRole) onUpdateUserRole(u.id, 'admin');
                              setUserRoleNotification(`Role ${u.name} berhasil diubah menjadi Admin.`);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              u.role === 'admin'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              u.role === 'warehouse'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              u.role === 'owner'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Total {userAccounts.length} akun terdaftar dalam sistem VendorOne.</span>
              <span className="font-medium text-slate-700">Perubahan role langsung aktif saat user masuk / login</span>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. ROLE ADMIN: FOKUS PADA INVOICE BELUM LUNAS (TANPA PENDAPATAN) */}
      {/* ========================================================================= */}
      {userRole === 'admin' && (
        <>
          {/* Admin Top 4 Cards (Fokus Invoice Belum Lunas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/30">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Invoice Belum Lunas
                </span>
                <span className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
                  {unpaidInvoices.length} Invoice
                </div>
                <div className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <span>Perlu tindak lanjut penagihan</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Status Belum Bayar (Full)
                </span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
                  {countBelumBayar} Dokumen
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Belum menerima DP klien</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Status DP 50%
                </span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums">
                  {countDP50} Dokumen
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Menunggu pelunasan pasca event</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Total Event Aktif
                </span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CalendarDays className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {totalEventsThisMonth} Event
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Oktober 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Section: MONITORING & PENAGIHAN INVOICE BELUM LUNAS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <Receipt className="w-5 h-5" />
                  </span>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Monitoring & Tindak Lanjut Invoice Belum Lunas (Admin Tagihan)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Daftar tagihan klien aktif yang belum lunas dengan kontak PIC untuk percepatan pelunasan.
                </p>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
                <button
                  onClick={() => setAdminInvoiceFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    adminInvoiceFilter === 'all'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Belum Lunas ({unpaidInvoices.length})
                </button>
                <button
                  onClick={() => setAdminInvoiceFilter('Belum Bayar')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    adminInvoiceFilter === 'Belum Bayar'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum Bayar ({countBelumBayar})
                </button>
                <button
                  onClick={() => setAdminInvoiceFilter('DP 50%')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    adminInvoiceFilter === 'DP 50%'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  DP 50% ({countDP50})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Invoice & Tanggal</th>
                    <th className="py-3 px-4">Klien & Lembaga</th>
                    <th className="py-3 px-4">Event Terkait</th>
                    <th className="py-3 px-4">Status Bayar</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Kontak PIC</th>
                    <th className="py-3 px-4 text-center">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUnpaidInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                        <p className="font-semibold text-slate-700">
                          Semua invoice pada filter ini sudah lunas!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUnpaidInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          <div className="font-bold text-indigo-700">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-400">
                            {formatDateIndo(inv.startDate || '2026-10-10')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{inv.clientName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {inv.clientCompany || 'Instansi Swasta'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-slate-800 truncate">{inv.eventName}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {inv.paymentStatus === 'Belum Bayar' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                              Belum Bayar (0%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                              DP 50% Masuk
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                          {inv.dueDate ? formatDateIndo(inv.dueDate) : 'H+1 Acara'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-800 font-mono text-[11px]">
                            {inv.clientPhone || '0812-9900-8800'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => onNavigateToInvoice(inv.id)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                              title="Buka Invoice di Editor"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Buka & Tagih</span>
                            </button>
                            <button
                              onClick={() => handleOpenWhatsAppReminder(inv)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                              title="Kirim Pesan Pengingat WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
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

          {/* Admin Upcoming Events (Focus on Operational Readiness & Client Follow-up) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Status Jadwal Booking Event (Admin Operasional)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh event mendatang untuk koordinasi logistik dan kelengkapan administrasi
                </p>
              </div>
              <button
                onClick={onNavigateToCalendar}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <span>Lihat di Kalender</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tgl Event</th>
                    <th className="py-3 px-4">Nama Event & Lokasi</th>
                    <th className="py-3 px-4">Klien & Kontak</th>
                    <th className="py-3 px-4">Status Alat</th>
                    <th className="py-3 px-4">Status Bayar</th>
                    <th className="py-3 px-4 text-center">Aksi Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap text-slate-900 font-medium">
                        {formatDateIndo(booking.startDate)} - {formatDateIndo(booking.endDate)}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{booking.eventName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{booking.location}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{booking.clientName}</div>
                        <div className="text-[11px] text-slate-500">{booking.clientPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-slate-100 border border-slate-200 text-slate-700">
                          {booking.logisticsStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {booking.paymentStatus === 'Lunas' ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                            Lunas
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-medium text-[11px]">
                            {booking.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            const match = invoices.find(
                              (inv) =>
                                inv.eventName === booking.eventName ||
                                inv.clientName === booking.clientName
                            );
                            onNavigateToInvoice(match ? match.id : undefined);
                          }}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
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
          {/* Warehouse Top 4 KPI Cards (Stok & Fisik Gudang) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Total Stok Fisik Gudang
                </span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Boxes className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {totalPhysicalUnits} Unit
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>{equipmentList.length} Model Peralatan</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-600 font-medium">Inventaris Utama</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-amber-50/20">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Alat Sedang di Luar (Disewa)
                </span>
                <span className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Truck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
                  {unitsCurrentlyOut} Unit
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Teralokasi pada event aktif</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/20">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Alat Standby di Rak Gudang
                </span>
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <PackageCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
                  {unitsStandby} Unit
                </div>
                <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  <span>Siap sewa & lolos QC</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/20">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Model Alat Stok Menipis
                </span>
                <span className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
                  {lowStockEquipment.length} Model
                </div>
                <div className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <span>Perlu perhatian khusus</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: STOCK UTILIZATION & CAPACITY ANALYTICS (RECHARTS BAR CHART PURE PHYSICAL) */}
          <FinancialSummary
            bookings={bookings}
            equipmentList={equipmentList}
            userRole="warehouse"
            onNavigateToCalendar={onNavigateToCalendar}
            onNavigateToInvoice={() => {}}
          />

          {/* Section: LOGISTICS & PHYSICAL EQUIPMENT SCHEDULE (NO RUPIAH, NO STATUS BAYAR) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Jadwal Pergerakan Logistik Gudang (Loading, Keluar & Kembali)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoring status fisik barang, alokasi unit sewa, dan kesiapan serah-terima lapangan
                </p>
              </div>
              <button
                onClick={onNavigateToCalendar}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <span>Buka Kalender Logistik</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tgl Loading & Event</th>
                    <th className="py-3 px-4">Nama Event & Lokasi</th>
                    <th className="py-3 px-4">Klien / PIC Lapangan</th>
                    <th className="py-3 px-4">Status Fisik Alat</th>
                    <th className="py-3 px-4 text-center">Total Unit Sewa</th>
                    <th className="py-3 px-4 text-center">Aksi Gudang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {bookings.map((booking) => {
                    const totalItemsCount = booking.items.reduce((sum, it) => sum + it.quantity, 0);

                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap text-slate-900 font-medium">
                          <div>
                            {formatDateIndo(booking.startDate)} - {formatDateIndo(booking.endDate)}
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal">
                            Kode: {booking.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 truncate">{booking.eventName}</div>
                          <div className="text-[11px] text-slate-500 truncate">{booking.location}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{booking.clientName}</div>
                          <div className="text-[11px] text-slate-500">{booking.clientPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {booking.logisticsStatus === 'Keluar Gudang' && (
                            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded font-semibold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Sedang di Luar / Loading
                            </span>
                          )}
                          {booking.logisticsStatus === 'Persiapan' && (
                            <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded font-medium text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Tahap Persiapan Rak
                            </span>
                          )}
                          {booking.logisticsStatus === 'Kembali / Selesai' && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-semibold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Kembali ke Gudang
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                          {totalItemsCount} Unit
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {onNavigateToInventory && (
                            <button
                              onClick={onNavigateToInventory}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
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
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Monitoring Ketersediaan Unit Populer
            </h3>
            <span className="text-xs text-slate-500">Stok Gudang VendorOne</span>
          </div>

          <div className="space-y-3">
            {equipmentList.slice(0, 5).map((eq) => {
              const lockedUnits = bookings
                .filter((b) => b.logisticsStatus !== 'Kembali / Selesai' && b.status !== 'Dibatalkan')
                .reduce((sum, b) => {
                  const it = b.items.find((i) => i.equipmentId === eq.id);
                  return sum + (it ? it.quantity : 0);
                }, 0);
              const percentage = Math.min(100, Math.round((lockedUnits / eq.totalStock) * 100));

              return (
                <div key={eq.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800">{eq.name}</span>
                    <span className="font-mono text-slate-500">
                      Terpakai <span className="font-bold text-slate-900">{lockedUnits}</span> dari{' '}
                      {eq.totalStock} Unit ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percentage > 100
                          ? 'bg-rose-500'
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

        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              SOP Alur Sistem VendorOne
            </div>
            <h4 className="font-bold text-base text-white">Siklus Bebas Double-Booking</h4>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">1.</span>
                <span>
                  <strong>Cek Ketersediaan:</strong> Input rentang tanggal sebelum invoice
                  diterbitkan.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">2.</span>
                <span>
                  <strong>Deteksi Bentrok:</strong> Sistem mengunci unit & memberi alert jika stok
                  minus.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">3.</span>
                <span>
                  <strong>Arsip & Snapshot:</strong> Invoice tersimpan permanen per versi revisi.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">4.</span>
                <span>
                  <strong>Kontrol Master Alat:</strong> Kelola tarif sewa, spesifikasi, dan kondisi fisik
                  barang.
                </span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Terintegrasi otomatis dengan modul Gudang dan Finansial VendorOne.
          </div>
        </div>
      </div>

      {/* MODAL: DAFTARKAN PENGGUNA BARU DARI DASHBOARD OWNER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Daftarkan Pengguna Baru
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Otorisasi role langsung oleh Owner untuk akses tim VendorOne
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
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
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Karyawan / Pengguna:
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Contoh: Rian Anggara"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Email (Digunakan untuk Login):
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="rian@vendorone.id"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pilih Role / Hak Akses (Otorisasi):
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="admin">Admin (Fokus Tagihan Belum Lunas)</option>
                    <option value="warehouse">Gudang (Fokus Stok & Logistik)</option>
                    <option value="owner">Owner (Akses Omset & Finansial)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan / Posisi Kerja:
                  </label>
                  <input
                    type="text"
                    value={newUserForm.title}
                    onChange={(e) => setNewUserForm({ ...newUserForm, title: e.target.value })}
                    placeholder="Contoh: Staf Penagihan / Koordinator"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi Sementara (Password):
                </label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Kosongkan untuk default: password123"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Password demo default adalah "password123". Pengguna bisa login langsung via form masuk.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
