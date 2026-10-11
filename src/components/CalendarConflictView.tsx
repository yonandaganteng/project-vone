import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { EventBooking, Equipment, ConflictResult } from '../types/rental';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import {
  getAvailableStockForRange,
  evaluateBookingConflict,
} from '../utils/conflictDetector';

interface CalendarConflictViewProps {
  bookings: EventBooking[];
  equipmentList: Equipment[];
  conflictMap: Map<string, { hasConflict: boolean; details: string[] }>;
  onOpenNewBookingWithItem?: (equipmentId: string, startDate: string, endDate: string) => void;
  onResolveConflictSubstitue?: (
    bookingId: string,
    conflictEquipmentId: string,
    substituteEquipmentId: string
  ) => void;
  onOpenNewBooking: () => void;
}

export const CalendarConflictView: React.FC<CalendarConflictViewProps> = ({
  bookings,
  equipmentList,
  conflictMap,
  onOpenNewBookingWithItem,
  onResolveConflictSubstitue,
  onOpenNewBooking,
}) => {
  // Calendar month state: Defaults to October 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = Oktober

  // Selected date or event modal
  const [selectedEvent, setSelectedEvent] = useState<EventBooking | null>(null);

  // Right Panel: Availability Calculator inputs
  const [calcStartDate, setCalcStartDate] = useState('2026-10-15');
  const [calcEndDate, setCalcEndDate] = useState('2026-10-16');
  const [calcSearchQuery, setCalcSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar Grid computation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  // Days list for the calendar
  const calendarDays = useMemo(() => {
    const days: { dateNumber: number; dateString: string; isCurrentMonth: boolean }[] = [];

    // Fill leading empty days from previous month
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateNumber: d, dateString, isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateNumber: d, dateString, isCurrentMonth: true });
    }

    // Trailing days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
      const y = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
      const dateString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateNumber: d, dateString, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek]);

  // Find bookings active on a specific day
  const getBookingsForDate = (dateString: string) => {
    return bookings.filter(
      (b) => b.status !== 'Dibatalkan' && b.startDate <= dateString && b.endDate >= dateString
    );
  };

  // Right Panel: Filter equipment & compute live availability
  const availabilityResults = useMemo(() => {
    return equipmentList
      .filter((eq) => {
        if (selectedCategory !== 'Semua' && eq.category !== selectedCategory) return false;
        if (
          calcSearchQuery &&
          !eq.name.toLowerCase().includes(calcSearchQuery.toLowerCase()) &&
          !eq.code.toLowerCase().includes(calcSearchQuery.toLowerCase()) &&
          !eq.category.toLowerCase().includes(calcSearchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .map((eq) => {
        const { availableStock, maxAllocated, conflictingEvents } = getAvailableStockForRange(
          eq,
          calcStartDate,
          calcEndDate,
          bookings
        );
        return {
          equipment: eq,
          availableStock,
          maxAllocated,
          conflictingEvents,
          isDepleted: availableStock === 0,
        };
      });
  }, [equipmentList, selectedCategory, calcSearchQuery, calcStartDate, calcEndDate, bookings]);

  // Categories list for filter tabs
  const categories = ['Semua', 'Kamera & Lensa', 'Audio & Sound', 'Lighting & Effect', 'Visual & LED'];

  return (
    <div className="space-y-4">
      {/* Top Banner explaining the Anti Double-Booking System */}
      <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-800 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>Kalender Ketersediaan & Pencegahan Double-Booking</span>
              <span className="text-[10px] font-mono bg-red-500/90 text-white px-2 py-0.5 rounded font-bold">
                CORE SYSTEM
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Event bertanda <strong className="text-red-300">Merah</strong> memicu stok minus (bentrok) karena berebut unit alat di tanggal yang sama.
              Event bertanda <strong className="text-indigo-200">Biru</strong> memiliki alokasi unit yang aman.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenNewBooking}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Event & Booking</span>
        </button>
      </div>

      {/* Main Layout: 70% Left Calendar + 30% Right Calculator (Blueprint Point 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PANEL KIRI: 70% Area Kalender (Lg: col-span-8 atau col-span-8.5) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Calendar Header Controls */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-xs text-slate-500 hidden sm:inline">
                ({bookings.length} Event Terdaftar)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-white rounded text-slate-600 transition-colors"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentYear(2026);
                    setCurrentMonth(9);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-white rounded transition-colors"
                >
                  Bulan Ini (Okt 2026)
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-white rounded text-slate-600 transition-colors"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Legend */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Indikator:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
              <span>Event Aman (Alokasi Valid)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500 inline-block" />
              <span className="font-semibold text-red-700">⚠️ Bentrok Stok / Double-Booking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
              <span>Sedang Diluar Gudang</span>
            </div>
          </div>

          {/* Calendar Grid: Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-center text-xs font-semibold text-slate-600 uppercase py-2">
            <span>Minggu</span>
            <span>Senin</span>
            <span>Selasa</span>
            <span>Rabu</span>
            <span>Kamis</span>
            <span>Jumat</span>
            <span>Sabtu</span>
          </div>

          {/* Calendar Grid: Cells */}
          <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
            {calendarDays.map((day, idx) => {
              const dayBookings = getBookingsForDate(day.dateString);
              const hasConflictToday = dayBookings.some((b) => conflictMap.get(b.id)?.hasConflict);

              return (
                <div
                  key={idx}
                  className={`min-h-[105px] sm:min-h-[115px] p-1.5 flex flex-col justify-between transition-colors ${
                    !day.isCurrentMonth
                      ? 'bg-slate-50 text-slate-400'
                      : hasConflictToday
                      ? 'bg-red-50/70 text-slate-900 ring-1 ring-inset ring-red-300'
                      : 'bg-white text-slate-900'
                  }`}
                >
                  {/* Date Number Header */}
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span
                      className={`font-mono ${
                        hasConflictToday
                          ? 'font-bold text-red-700'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dateNumber}
                    </span>
                    {hasConflictToday && (
                      <span
                        className="text-[10px] text-red-600 font-bold flex items-center"
                        title="Bentrok Stok Terdeteksi pada hari ini!"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Event Bars / Pills inside this Date */}
                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[85px]">
                    {dayBookings.map((b) => {
                      const conflictInfo = conflictMap.get(b.id);
                      const isConflict = conflictInfo?.hasConflict;

                      return (
                        <button
                          key={b.id}
                          onClick={() => setSelectedEvent(b)}
                          className={`w-full text-left p-1 rounded text-[11px] font-medium leading-tight transition-all flex items-center gap-1 shadow-xs truncate ${
                            isConflict
                              ? 'bg-red-600 hover:bg-red-700 text-white font-bold ring-1 ring-red-400'
                              : b.logisticsStatus === 'Keluar Gudang'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                          title={`${b.eventName} (${formatDateIndo(b.startDate)} - ${formatDateIndo(b.endDate)})`}
                        >
                          {isConflict ? (
                            <AlertTriangle className="w-3 h-3 shrink-0 text-amber-200" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                          )}
                          <span className="truncate">{b.eventName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL KANAN: 30% Kalkulator Ketersediaan Alat (Blueprint Point 3) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <span>Cek Ketersediaan Alat</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Real-Time</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hitung sisa stok yang aman pada rentang tanggal sebelum membuat booking
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Tgl Mulai
              </label>
              <input
                type="date"
                value={calcStartDate}
                onChange={(e) => setCalcStartDate(e.target.value)}
                className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Tgl Selesai
              </label>
              <input
                type="date"
                value={calcEndDate}
                onChange={(e) => setCalcEndDate(e.target.value)}
                className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Search Bar & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama alat (cth: Sony, Mic, RCF)..."
                value={calcSearchQuery}
                onChange={(e) => setCalcSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category horizontal scroll tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search Result Cards: Showing Real-Time Stock Availability */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {availabilityResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Tidak ada alat ditemukan dengan kata kunci ini.
              </div>
            ) : (
              availabilityResults.map(({ equipment, availableStock, maxAllocated, conflictingEvents, isDepleted }) => {
                return (
                  <div
                    key={equipment.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isDepleted
                        ? 'border-red-200 bg-red-50/50'
                        : availableStock <= 2
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {equipment.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatRupiah(equipment.dailyRate)} / hari
                        </div>
                      </div>

                      {/* Stock Level Badge */}
                      <div className="text-right shrink-0">
                        {isDepleted ? (
                          <span className="text-[11px] font-bold text-red-600 font-mono block">
                            Stok: 0 Habis
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-800 font-mono block">
                            Sisa: <strong className="text-indigo-600">{availableStock}</strong> / {equipment.totalStock}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          Dipinjam: {maxAllocated} Unit
                        </span>
                      </div>
                    </div>

                    {/* Conflict Explanation or Safe Status (UX PENTING Blueprint) */}
                    <div className="mt-2 text-[11px] pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                      {isDepleted ? (
                        <div className="text-red-700 bg-red-100/60 p-1.5 rounded text-[11px] leading-relaxed flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                          <div>
                            <strong>Bentrok Stok!</strong> Habis terpakai di{' '}
                            {conflictingEvents.map((c) => `"${c.eventName}" (${c.allocatedQty} unit)`).join(', ')}.
                          </div>
                        </div>
                      ) : (
                        <div className="text-emerald-700 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Tersedia untuk disewa pada tanggal ini.</span>
                        </div>
                      )}

                      {/* Booking Action Button */}
                      <button
                        disabled={isDepleted}
                        onClick={() => {
                          if (onOpenNewBookingWithItem) {
                            onOpenNewBookingWithItem(equipment.id, calcStartDate, calcEndDate);
                          } else {
                            onOpenNewBooking();
                          }
                        }}
                        className={`w-full py-1.5 px-3 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 mt-1 ${
                          isDepleted
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        {isDepleted ? (
                          <span>Stok Tidak Tersedia (Disabled)</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Booking Alat Ini</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL: DETAIL EVENT & STATUS STOK */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div
              className={`p-4 border-b flex items-start justify-between ${
                conflictMap.get(selectedEvent.id)?.hasConflict
                  ? 'bg-red-50 border-red-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedEvent.eventName}
                  </h3>
                  {conflictMap.get(selectedEvent.id)?.hasConflict && (
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Bentrok Stok
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>{selectedEvent.clientName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDateIndo(selectedEvent.startDate)} - {formatDateIndo(selectedEvent.endDate)}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* If Conflict: Show breakdown and Solutions */}
              {conflictMap.get(selectedEvent.id)?.hasConflict && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 space-y-2">
                  <div className="font-bold text-xs text-red-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Rincian Masalah Double-Booking:</span>
                  </div>
                  <ul className="text-xs text-red-800 list-disc list-inside space-y-1">
                    {conflictMap.get(selectedEvent.id)?.details.map((det, i) => (
                      <li key={i}>{det}</li>
                    ))}
                  </ul>

                  {/* Pemberitahuan Stok Menipis / Kritis (Terapkan Solusi Ditiadakan) */}
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Pemberitahuan: Stok Menipis / Kuota Unit Habis!</span>
                      </div>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        Ketersediaan fisik unit di gudang tidak mencukupi untuk memenuhi permintaan event ini pada tanggal tersebut. 
                        Silakan hubungi tim logistik/gudang untuk penyesuaian unit atau komunikasi ulang jadwal dengan klien.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Equipment Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Daftar Alat yang Dipesan ({selectedEvent.items.length} Item)
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {selectedEvent.items.map((item, idx) => (
                    <div key={idx} className="p-3 text-xs flex items-center justify-between bg-white">
                      <div>
                        <div className="font-medium text-slate-800">{item.equipmentName}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.quantity} Unit x {item.days} Hari @ {formatRupiah(item.dailyRate)}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial & Logistics Info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Total Tagihan:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(selectedEvent.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Pembayaran:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEvent.paymentStatus} ({formatRupiah(selectedEvent.paidAmount)} diterima)
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
