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

  // Today's date string for highlighting
  const todayString = new Date().toISOString().split('T')[0];

  return (
    <div className="animate-page-enter relative">
      {/* Ambient Background: Calendar Timeline */}
      <div className="ambient-calendar-timeline" aria-hidden="true">
        <div className="ambient-calendar-timeline-track">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="ambient-calendar-timeline-marker"
              style={{ left: `${(i / 31) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* All content wrapper above ambient */}
      <div className="relative z-10 space-y-5">

        {/* Page Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#1a1d24', border: '1px solid rgba(79,70,229,0.3)' }}
            >
              <CalendarIcon className="w-4 h-4" style={{ color: '#6366f1' }} />
            </div>
            <div>
              <h1 className="text-[17px] font-bold tracking-tight" style={{ color: '#111318' }}>
                Kalender Ketersediaan
              </h1>
              <p className="text-[12px] mt-0.5" style={{ color: '#6b7280' }}>
                Pencegahan double-booking · Real-time stock check
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNewBooking}
            className="btn-primary btn-magnetic flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Event &amp; Booking</span>
          </button>
        </div>

        {/* Legend strip */}
        <div
          className="flex flex-wrap items-center gap-5 px-4 py-2.5 rounded-lg"
          style={{
            background: '#fefdfb',
            border: '1px solid rgba(17,19,24,0.08)',
          }}
        >
          <span className="section-label">Indikator</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#4f46e5' }} />
            <span className="text-[11px]" style={{ color: '#374151' }}>Event Aman</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#be123c' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#be123c' }}>Bentrok Stok</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#d97706' }} />
            <span className="text-[11px]" style={{ color: '#374151' }}>Sedang Diluar Gudang</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#059669' }} />
            <span className="text-[11px]" style={{ color: '#374151' }}>Selesai</span>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ── LEFT: Calendar (60% → col-span-7) ── */}
          <div
            className="lg:col-span-7 panel overflow-hidden flex flex-col"
          >
            {/* Calendar Header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(17,19,24,0.08)' }}
            >
              <div className="flex items-baseline gap-3">
                <h2
                  className="text-[22px] font-bold tracking-tight"
                  style={{ color: '#111318' }}
                >
                  {monthNames[currentMonth]}
                </h2>
                <span className="font-mono text-[15px]" style={{ color: '#9ca3af' }}>
                  {currentYear}
                </span>
                <span
                  className="text-[11px] hidden sm:inline"
                  style={{ color: '#9ca3af' }}
                >
                  · {bookings.length} event
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="btn-ghost p-1.5"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentYear(2026);
                    setCurrentMonth(9);
                  }}
                  className="btn-ghost px-2.5 py-1 text-[11px]"
                >
                  Okt 2026
                </button>
                <button
                  onClick={nextMonth}
                  className="btn-ghost p-1.5"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div
              className="grid grid-cols-7 text-center py-2"
              style={{ borderBottom: '1px solid rgba(17,19,24,0.06)', background: '#f7f6f4' }}
            >
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <span key={d} className="section-label text-center py-0.5">{d}</span>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div
              className="grid grid-cols-7"
              style={{ background: 'rgba(17,19,24,0.04)', gap: '1px' }}
            >
              {calendarDays.map((day, idx) => {
                const dayBookings = getBookingsForDate(day.dateString);
                const hasConflictToday = dayBookings.some((b) => conflictMap.get(b.id)?.hasConflict);
                const isToday = day.dateString === todayString;

                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] sm:min-h-[90px] p-1.5 flex flex-col transition-colors ${
                      hasConflictToday && day.isCurrentMonth ? 'conflict-marker' : ''
                    }`}
                    style={{
                      background: !day.isCurrentMonth
                        ? '#f7f6f4'
                        : hasConflictToday
                        ? 'rgba(190,18,60,0.04)'
                        : '#fefdfb',
                      borderBottom: isToday ? '2px solid #4f46e5' : undefined,
                    }}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-mono text-[12px] font-medium leading-none ${
                          hasConflictToday && day.isCurrentMonth
                            ? 'font-bold'
                            : ''
                        }`}
                        style={{
                          color: !day.isCurrentMonth
                            ? '#d1d5db'
                            : hasConflictToday
                            ? '#be123c'
                            : isToday
                            ? '#4f46e5'
                            : '#374151',
                        }}
                      >
                        {day.dateNumber}
                      </span>
                      {hasConflictToday && day.isCurrentMonth && (
                        <span title="Bentrok stok terdeteksi" className="inline-flex">
                          <AlertTriangle
                            className="w-3 h-3 shrink-0"
                            style={{ color: '#be123c' }}
                          />
                        </span>
                      )}
                    </div>

                    {/* Event Chips */}
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayBookings.slice(0, 3).map((b) => {
                        const conflictInfo = conflictMap.get(b.id);
                        const isConflict = conflictInfo?.hasConflict;
                        const isCompleted = b.status === 'Selesai';

                        let chipBg = '#4f46e5';
                        let chipText = '#fff';
                        if (isConflict) { chipBg = '#be123c'; chipText = '#fff'; }
                        else if (b.logisticsStatus === 'Keluar Gudang') { chipBg = '#d97706'; chipText = '#fff'; }
                        else if (isCompleted) { chipBg = '#059669'; chipText = '#fff'; }

                        return (
                          <button
                            key={b.id}
                            onClick={() => setSelectedEvent(b)}
                            className="w-full text-left truncate transition-opacity hover:opacity-80 flex items-center gap-1"
                            style={{
                              background: chipBg,
                              color: chipText,
                              fontSize: '11px',
                              lineHeight: '22px',
                              height: '22px',
                              borderRadius: '3px',
                              paddingLeft: '5px',
                              paddingRight: '5px',
                              fontWeight: 500,
                            }}
                            title={`${b.eventName} (${formatDateIndo(b.startDate)} - ${formatDateIndo(b.endDate)})`}
                          >
                            {isConflict && (
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" style={{ color: '#fca5a5' }} />
                            )}
                            <span className="truncate">{b.eventName}</span>
                          </button>
                        );
                      })}
                      {dayBookings.length > 3 && (
                        <span
                          className="text-[10px] font-mono pl-1"
                          style={{ color: '#9ca3af' }}
                        >
                          +{dayBookings.length - 3} lagi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Availability Calculator (40% → col-span-5) ── */}
          <div className="lg:col-span-5 flex flex-col gap-4">

            {/* Availability Calculator Panel */}
            <div className="panel p-4 flex flex-col gap-4">
              {/* Panel Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="text-[13px] font-bold tracking-tight flex items-center gap-2"
                    style={{ color: '#111318' }}
                  >
                    Cek Ketersediaan Alat
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: '#059669' }}
                    />
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>
                    Hitung sisa stok sebelum buat booking
                  </p>
                </div>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{
                    background: 'rgba(5,150,105,0.08)',
                    color: '#059669',
                    border: '1px solid rgba(5,150,105,0.2)',
                  }}
                >
                  REAL-TIME
                </span>
              </div>

              {/* Date Range Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label block mb-1">Tgl Mulai</label>
                  <input
                    type="date"
                    value={calcStartDate}
                    onChange={(e) => setCalcStartDate(e.target.value)}
                    className="field-input w-full font-mono text-[12px]"
                  />
                </div>
                <div>
                  <label className="field-label block mb-1">Tgl Selesai</label>
                  <input
                    type="date"
                    value={calcEndDate}
                    onChange={(e) => setCalcEndDate(e.target.value)}
                    className="field-input w-full font-mono text-[12px]"
                  />
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: '#9ca3af' }}
                />
                <input
                  type="text"
                  placeholder="Cari nama alat..."
                  value={calcSearchQuery}
                  onChange={(e) => setCalcSearchQuery(e.target.value)}
                  className="field-input w-full pl-8 text-[12px]"
                />
              </div>

              {/* Category Tabs */}
              <div
                className="flex gap-0 overflow-x-auto"
                style={{ borderBottom: '1px solid rgba(17,19,24,0.08)' }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors relative"
                    style={{
                      color: selectedCategory === cat ? '#4f46e5' : '#6b7280',
                      background: 'transparent',
                      borderBottom: selectedCategory === cat ? '2px solid #4f46e5' : '2px solid transparent',
                      marginBottom: '-1px',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Availability Table */}
              {availabilityResults.length === 0 ? (
                <div
                  className="text-center py-10"
                  style={{ color: '#9ca3af' }}
                >
                  <Layers className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p className="text-[12px]">Tidak ada alat ditemukan.</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[380px]">
                  <table className="data-table w-full">
                    <thead>
                      <tr>
                        <th className="text-left">Alat</th>
                        <th className="text-right">Stok</th>
                        <th className="text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availabilityResults.map(
                        ({ equipment, availableStock, maxAllocated, conflictingEvents, isDepleted }) => {
                          const isPartial = !isDepleted && availableStock <= 2;
                          return (
                            <tr key={equipment.id} className="table-row-hover">
                              <td>
                                <div
                                  className="text-[12px] font-medium truncate max-w-[140px]"
                                  style={{ color: '#111318' }}
                                >
                                  {equipment.name}
                                </div>
                                <div
                                  className="font-mono text-[11px]"
                                  style={{ color: '#9ca3af' }}
                                >
                                  {formatRupiah(equipment.dailyRate)}/hr
                                </div>
                              </td>
                              <td className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Status dot */}
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0 inline-block"
                                    style={{
                                      background: isDepleted
                                        ? '#be123c'
                                        : isPartial
                                        ? '#d97706'
                                        : '#059669',
                                    }}
                                  />
                                  <span
                                    className="font-mono text-[11px]"
                                    style={{
                                      color: isDepleted
                                        ? '#be123c'
                                        : isPartial
                                        ? '#d97706'
                                        : '#059669',
                                    }}
                                  >
                                    {availableStock}/{equipment.totalStock}
                                  </span>
                                </div>
                              </td>
                              <td className="text-right">
                                <button
                                  disabled={isDepleted}
                                  onClick={() => {
                                    if (onOpenNewBookingWithItem) {
                                      onOpenNewBookingWithItem(equipment.id, calcStartDate, calcEndDate);
                                    } else {
                                      onOpenNewBooking();
                                    }
                                  }}
                                  className="btn-ghost text-[11px] px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  {isDepleted ? 'Habis' : 'Booking'}
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Conflict Events List */}
            {(() => {
              const conflictBookings = bookings.filter((b) => conflictMap.get(b.id)?.hasConflict);
              if (conflictBookings.length === 0) return null;
              return (
                <div className="panel p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="section-label">Bentrok Terdeteksi</span>
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(190,18,60,0.08)',
                        color: '#be123c',
                        border: '1px solid rgba(190,18,60,0.15)',
                      }}
                    >
                      {conflictBookings.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {conflictBookings.map((b) => {
                      const details = conflictMap.get(b.id)?.details ?? [];
                      return (
                        <div
                          key={b.id}
                          className="flex items-start gap-3 py-2.5 px-3 rounded-md transition-colors hover:bg-red-50/40"
                          style={{
                            borderLeft: '2px solid #be123c',
                            background: 'rgba(190,18,60,0.03)',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[12px] font-semibold truncate"
                              style={{ color: '#111318' }}
                            >
                              {b.eventName}
                            </div>
                            <div
                              className="font-mono text-[11px] mt-0.5"
                              style={{ color: '#9ca3af' }}
                            >
                              {formatDateIndo(b.startDate)} – {formatDateIndo(b.endDate)}
                            </div>
                            {details[0] && (
                              <div
                                className="text-[11px] mt-1 leading-snug"
                                style={{ color: '#be123c' }}
                              >
                                {details[0]}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedEvent(b)}
                            className="text-[11px] font-medium shrink-0 transition-colors hover:underline"
                            style={{ color: '#4f46e5' }}
                          >
                            Lihat
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── MODAL: Selected Event Detail ── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-enter"
          style={{ background: 'rgba(17,19,24,0.55)' }}
        >
          <div
            className="panel-elevated max-w-xl w-full overflow-hidden animate-dialog-enter"
            style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div
              className="px-5 py-4 flex items-start justify-between gap-3"
              style={{
                background: conflictMap.get(selectedEvent.id)?.hasConflict
                  ? 'rgba(190,18,60,0.04)'
                  : '#f7f6f4',
                borderBottom: '1px solid rgba(17,19,24,0.08)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className="text-[16px] font-bold truncate"
                    style={{ color: '#111318' }}
                  >
                    {selectedEvent.eventName}
                  </h3>
                  {conflictMap.get(selectedEvent.id)?.hasConflict && (
                    <span className="badge-carmine flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Bentrok Stok
                    </span>
                  )}
                </div>
                <div
                  className="text-[13px] mt-1 flex items-center gap-2"
                  style={{ color: '#6b7280' }}
                >
                  <span>{selectedEvent.clientName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[12px]">
                    {formatDateIndo(selectedEvent.startDate)} – {formatDateIndo(selectedEvent.endDate)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-ghost p-1.5 shrink-0"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Conflict Detail Section */}
              {conflictMap.get(selectedEvent.id)?.hasConflict && (
                <div
                  className="rounded-lg p-4 space-y-3"
                  style={{
                    background: 'rgba(190,18,60,0.05)',
                    border: '1px solid rgba(190,18,60,0.2)',
                  }}
                >
                  <div
                    className="text-[12px] font-bold flex items-center gap-2"
                    style={{ color: '#be123c' }}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Rincian Masalah Double-Booking
                  </div>
                  <ul className="space-y-1">
                    {conflictMap.get(selectedEvent.id)?.details.map((det, i) => (
                      <li
                        key={i}
                        className="text-[12px] leading-snug flex items-start gap-2"
                        style={{ color: '#9f1239' }}
                      >
                        <span className="mt-1 shrink-0">·</span>
                        {det}
                      </li>
                    ))}
                  </ul>

                  {/* Warning note */}
                  <div
                    className="rounded-md p-3"
                    style={{
                      background: 'rgba(217,119,6,0.07)',
                      border: '1px solid rgba(217,119,6,0.2)',
                    }}
                  >
                    <div
                      className="text-[11px] font-bold flex items-center gap-1.5 mb-1"
                      style={{ color: '#92400e' }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Stok Menipis / Kuota Unit Habis
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#92400e' }}>
                      Ketersediaan fisik unit tidak mencukupi pada tanggal tersebut. Hubungi tim
                      logistik untuk penyesuaian atau komunikasi ulang jadwal dengan klien.
                    </p>
                  </div>
                </div>
              )}

              {/* Equipment Items */}
              <div>
                <div className="section-label mb-3">
                  Daftar Alat yang Dipesan ({selectedEvent.items.length} item)
                </div>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(17,19,24,0.08)' }}
                >
                  {selectedEvent.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3"
                      style={{
                        borderBottom:
                          idx < selectedEvent.items.length - 1
                            ? '1px solid rgba(17,19,24,0.06)'
                            : undefined,
                        background: '#fefdfb',
                      }}
                    >
                      <div>
                        <div
                          className="text-[13px] font-medium"
                          style={{ color: '#111318' }}
                        >
                          {item.equipmentName}
                        </div>
                        <div
                          className="font-mono text-[11px] mt-0.5"
                          style={{ color: '#9ca3af' }}
                        >
                          {item.quantity} unit × {item.days} hari @ {formatRupiah(item.dailyRate)}
                        </div>
                      </div>
                      <div
                        className="font-mono text-[13px] font-bold"
                        style={{ color: '#111318' }}
                      >
                        {formatRupiah(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div
                className="grid grid-cols-2 gap-4 p-4 rounded-lg"
                style={{
                  background: '#f7f6f4',
                  border: '1px solid rgba(17,19,24,0.08)',
                }}
              >
                <div>
                  <span
                    className="text-[11px] block mb-1"
                    style={{ color: '#9ca3af' }}
                  >
                    Total Tagihan
                  </span>
                  <span
                    className="font-mono font-bold text-[15px]"
                    style={{ color: '#111318' }}
                  >
                    {formatRupiah(selectedEvent.totalAmount)}
                  </span>
                </div>
                <div>
                  <span
                    className="text-[11px] block mb-1"
                    style={{ color: '#9ca3af' }}
                  >
                    Status Pembayaran
                  </span>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: '#374151' }}
                  >
                    {selectedEvent.paymentStatus}
                  </span>
                  <div
                    className="font-mono text-[11px] mt-0.5"
                    style={{ color: '#9ca3af' }}
                  >
                    {formatRupiah(selectedEvent.paidAmount)} diterima
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="px-5 py-3.5 flex justify-end gap-2"
              style={{ borderTop: '1px solid rgba(17,19,24,0.08)', background: '#f7f6f4' }}
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-ghost text-[12px] px-4 py-1.5"
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
