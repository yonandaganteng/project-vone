import React from 'react';
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
} from 'lucide-react';
import { EventBooking, Equipment, UserRole } from '../types/rental';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface DashboardViewProps {
  bookings: EventBooking[];
  equipmentList: Equipment[];
  userRole: UserRole;
  conflictMap: Map<string, { hasConflict: boolean; details: string[] }>;
  onSelectEvent: (eventId: string) => void;
  onNavigateToCalendar: () => void;
  onNavigateToInvoice: () => void;
  onNavigateToManifest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  equipmentList,
  userRole,
  conflictMap,
  onSelectEvent,
  onNavigateToCalendar,
  onNavigateToInvoice,
  onNavigateToManifest,
}) => {
  // Calculate summary metrics
  const totalEventsThisMonth = bookings.length;
  
  // Calculate units currently checked out or deployed
  const activeBookings = bookings.filter((b) => b.logisticsStatus === 'Keluar Gudang');
  const unitsCurrentlyOut = activeBookings.reduce((sum, b) => {
    return sum + b.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  // Financial statistics
  const unpaidTotal = bookings.reduce((sum, b) => {
    return sum + Math.max(0, b.totalAmount - b.paidAmount);
  }, 0);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaidRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);

  // Check conflicts
  const conflictEvents = bookings.filter((b) => conflictMap.get(b.id)?.hasConflict);
  const hasAnyConflict = conflictEvents.length > 0;

  return (
    <div className="space-y-6">
      {/* Bentrok Warning Banner (Solusi Masalah Utama Skripsi / Double Booking) */}
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
                  Action Required
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1 max-w-3xl leading-relaxed">
                Terdapat alokasi permintaan unit alat yang melebihi batas ketersediaan fisik gudang pada tanggal yang bersamaan.
                Cek kalender bentrok untuk merealokasi unit atau menawarkan alternatif sebelum konfirmasi ke klien.
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

      {/* Baris Atas: 4 Kartu Ringkasan (Blueprint Point 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Event Bulan Ini */}
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
              <span className="text-emerald-600 font-medium">3 Terkonfirmasi</span>
            </div>
          </div>
        </div>

        {/* Card 2: Alat Sedang Diluar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">
              Alat Sedang Diluar
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
              {unitsCurrentlyOut} Unit
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>1 Event aktif loading</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={onNavigateToManifest}
                className="text-indigo-600 hover:underline font-medium"
              >
                Cek Manifest &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Invoice Belum Lunas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">
              Invoice Belum Lunas
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatRupiah(unpaidTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Sisa piutang klien</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-600 font-medium">3 Invoice</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Pendapatan (Owner) vs Kesiapan Gudang (Admin/Gudang) */}
        {userRole === 'owner' ? (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Pendapatan (Owner)
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
                <span>Terbayar: </span>
                <span className="font-semibold text-slate-700 font-mono tabular-nums">
                  {formatRupiah(totalPaidRevenue)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">
                Status Kesiapan Gudang
              </span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                85% Siap
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>Semua kabel & modul lulus QC</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Baris Bawah: Tabel Event Mendatang (Blueprint Point 2) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Tabel Jadwal Event & Status Logistik
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar kegiatan mendatang dengan indikator ketersediaan alat dan status pembayaran
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToCalendar}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              <span>Buka Tampilan Kalender Bulanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tgl Event</th>
                <th className="py-3 px-4">Nama Event & Lokasi</th>
                <th className="py-3 px-4">Nama Klien</th>
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
                    {/* Tgl Event */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap text-slate-900 font-medium">
                      <div>
                        {formatDateIndo(booking.startDate)} - {formatDateIndo(booking.endDate)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Kode: {booking.code}
                      </span>
                    </td>

                    {/* Nama Event */}
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
                      {isConflict && (
                        <div className="text-[11px] text-red-600 font-medium mt-1">
                          ⚠️ Bentrok stok alat dengan event lain!
                        </div>
                      )}
                    </td>

                    {/* Nama Klien */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{booking.clientName}</div>
                      <div className="text-[11px] text-slate-500">{booking.clientPhone}</div>
                    </td>

                    {/* Status Alat (Badge: Persiapan / Keluar / Kembali) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {booking.logisticsStatus === 'Keluar Gudang' && (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Sedang Keluar
                        </span>
                      )}
                      {booking.logisticsStatus === 'Persiapan' && (
                        <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md font-medium text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Persiapan Gudang
                        </span>
                      )}
                      {booking.logisticsStatus === 'Kembali / Selesai' && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Kembali / Selesai
                        </span>
                      )}
                    </td>

                    {/* Status Bayar */}
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

                    {/* Nilai Sewa */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap text-slate-900 font-semibold">
                      {formatRupiah(booking.totalAmount)}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            if (isConflict) {
                              onNavigateToCalendar();
                            } else {
                              onNavigateToInvoice();
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            isConflict
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isConflict ? 'Selesaikan Bentrok' : 'Invoice'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Overview Section: Stok Kritis & SOP Anti-Double Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Monitoring Ketersediaan Unit Populer
            </h3>
            <span className="text-xs text-slate-500">Stok Gudang Utama</span>
          </div>

          <div className="space-y-3">
            {equipmentList.slice(0, 5).map((eq) => {
              // Calculate how many are currently locked in active bookings
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
                      Terpakai <span className="font-bold text-slate-900">{lockedUnits}</span> dari {eq.totalStock} Unit ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percentage > 100
                          ? 'bg-red-500'
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
              SOP Alur Skripsi / Sistem
            </div>
            <h4 className="font-bold text-base text-white">
              Siklus Bebas Double-Booking
            </h4>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">1.</span>
                <span><strong>Cek Ketersediaan:</strong> Input rentang tanggal sebelum invoice diterbitkan.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">2.</span>
                <span><strong>Deteksi Bentrok:</strong> Sistem mengunci unit & memberi alert jika stok minus.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">3.</span>
                <span><strong>Snapshot JSON:</strong> Invoice tersimpan permanen per versi revisi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">4.</span>
                <span><strong>Manifest Gudang:</strong> Checklist loading-in & loading-out via barcode.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Terintegrasi otomatis dengan modul Gudang dan Finansial.
          </div>
        </div>
      </div>
    </div>
  );
};
