import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Building,
  User,
  MapPin,
  Phone,
  Mail,
  X,
} from 'lucide-react';
import { EventBooking, Equipment, BookingEquipmentItem } from '../types/rental';
import { formatRupiah, calculateDaysBetween } from '../utils/formatters';
import { getAvailableStockForRange } from '../utils/conflictDetector';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: Equipment[];
  allBookings: EventBooking[];
  onCreateBooking: (newBooking: EventBooking) => void;
  initialEquipmentId?: string;
  initialStartDate?: string;
  initialEndDate?: string;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  equipmentList,
  allBookings,
  onCreateBooking,
  initialEquipmentId,
  initialStartDate,
  initialEndDate,
}) => {
  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(initialStartDate || '2026-10-22');
  const [endDate, setEndDate] = useState(initialEndDate || '2026-10-23');

  // Selected equipment items in booking
  const [items, setItems] = useState<
    { equipmentId: string; quantity: number }[]
  >(() => {
    if (initialEquipmentId) {
      return [{ equipmentId: initialEquipmentId, quantity: 1 }];
    }
    return [{ equipmentId: equipmentList[0]?.id || '', quantity: 2 }];
  });

  const durationDays = useMemo(() => {
    return calculateDaysBetween(startDate, endDate);
  }, [startDate, endDate]);

  // Check live conflicts for the proposed items
  const conflictWarnings = useMemo(() => {
    const warnings: {
      equipmentName: string;
      requestedQty: number;
      availableStock: number;
      deficit: number;
      conflictsWith: string[];
      equipmentId: string;
    }[] = [];

    for (const item of items) {
      const eq = equipmentList.find((e) => e.id === item.equipmentId);
      if (!eq) continue;

      const { availableStock, conflictingEvents } = getAvailableStockForRange(
        eq,
        startDate,
        endDate,
        allBookings
      );

      if (item.quantity > availableStock) {
        const deficit = item.quantity - availableStock;
        warnings.push({
          equipmentName: eq.name,
          requestedQty: item.quantity,
          availableStock,
          deficit,
          conflictsWith: conflictingEvents.map((c) => c.eventName),
          equipmentId: item.equipmentId,
        });
      }
    }

    return warnings;
  }, [items, startDate, endDate, equipmentList, allBookings]);

  // Subtotal calculations
  const calculatedItems: BookingEquipmentItem[] = useMemo(() => {
    return items.map((it) => {
      const eq = equipmentList.find((e) => e.id === it.equipmentId);
      const dailyRate = eq ? eq.dailyRate : 0;
      const subtotal = dailyRate * it.quantity * durationDays;
      return {
        equipmentId: it.equipmentId,
        equipmentName: eq ? eq.name : 'Unknown',
        category: eq ? eq.category : 'General',
        quantity: it.quantity,
        dailyRate,
        days: durationDays,
        subtotal,
      };
    });
  }, [items, durationDays, equipmentList]);

  const totalAmount = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + it.subtotal, 0);
  }, [calculatedItems]);

  const handleAddItem = () => {
    const unselected = equipmentList.find(
      (eq) => !items.some((it) => it.equipmentId === eq.id)
    );
    if (unselected) {
      setItems([...items, { equipmentId: unselected.id, quantity: 1 }]);
    } else {
      setItems([...items, { equipmentId: equipmentList[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const handleEquipmentChange = (index: number, eqId: string) => {
    const updated = [...items];
    updated[index].equipmentId = eqId;
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !clientName) return;

    const newBooking: EventBooking = {
      id: `evt-${Date.now()}`,
      code: `EVT-2026-10-${String(allBookings.length + 1).padStart(2, '0')}`,
      eventName,
      clientName,
      clientPhone: clientPhone || '0812-0000-1111',
      clientEmail: clientEmail || 'klien@event.com',
      location: location || 'Jakarta Area',
      startDate,
      endDate,
      status: 'Dikonfirmasi',
      logisticsStatus: 'Persiapan',
      paymentStatus: 'Belum Bayar',
      totalAmount,
      paidAmount: 0,
      items: calculatedItems,
      notes: conflictWarnings.length > 0 ? 'Catatan: Ada potensi bentrok stok saat dibuat.' : undefined,
    };

    onCreateBooking(newBooking);
    onClose();
  };

  if (!isOpen) return null;

  // Draft booking code preview
  const draftCode = `EVT-DRAFT-${String(allBookings.length + 1).padStart(3, '0')}`;
  const isFormValid = eventName.trim() !== '' && clientName.trim() !== '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-enter"
      style={{ background: 'rgba(10,11,14,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="panel-elevated flex flex-col w-full animate-dialog-enter overflow-hidden"
        style={{
          maxWidth: 640,
          borderRadius: 8,
          border: '1px solid rgba(17,19,24,0.1)',
          maxHeight: '90vh',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3
              className="text-[16px] font-bold tracking-tight"
              style={{ color: '#111318' }}
            >
              Buat Booking Baru
            </h3>
            <p
              className="text-[12px] font-mono mt-0.5"
              style={{ color: '#9ca3af' }}
            >
              {draftCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 transition-colors duration-100"
            style={{ color: '#d1d5db' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111318')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="divider" />

        {/* ── Scrollable Body ─────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── Section 1: Event Info ──────────────────────────────────── */}
          <div className="space-y-3">
            <div className="section-label">Informasi Event</div>

            {/* Event name — full width */}
            <div>
              <label className="field-label flex items-center gap-1.5 mb-1.5">
                <Building className="w-3 h-3" />
                Nama Event *
              </label>
              <input
                type="text"
                required
                placeholder="cth: Festival Musik Mahasiswa 2026"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="field-input w-full"
              />
            </div>

            {/* Client + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label flex items-center gap-1.5 mb-1.5">
                  <User className="w-3 h-3" />
                  Nama Klien / EO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth: PT Kreasi Bangsa"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="field-input w-full"
                />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-3 h-3" />
                  No. WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="field-input w-full"
                />
              </div>
            </div>

            {/* Email + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3 h-3" />
                  Email Klien
                </label>
                <input
                  type="email"
                  placeholder="pic@event.co.id"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="field-input w-full"
                />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3 h-3" />
                  Lokasi Venue
                </label>
                <input
                  type="text"
                  placeholder="cth: Balai Kartini, Jakarta"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="field-input w-full"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Dates ───────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="section-label">Periode Sewa</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3 h-3" />
                  Tgl Mulai
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="field-input w-full font-mono"
                />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3 h-3" />
                  Tgl Selesai
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="field-input w-full font-mono"
                />
              </div>
            </div>

            {/* Timeline visual + duration */}
            <div className="flex items-center gap-3 pt-1">
              {/* Start marker */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#4f46e5' }}
                />
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: '#6b7280' }}
                >
                  {startDate}
                </span>
              </div>

              {/* Track */}
              <div className="flex-1 relative h-px" style={{ background: 'rgba(17,19,24,0.1)' }}>
                <div
                  className="absolute inset-y-0 left-0 right-0 transition-all duration-200"
                  style={{ background: '#4f46e5', opacity: 0.35 }}
                />
                {/* Duration badge */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded font-mono text-[11px] font-semibold tabular-nums"
                  style={{
                    background: '#f7f6f4',
                    border: '1px solid rgba(17,19,24,0.1)',
                    color: '#4f46e5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {durationDays} hari
                </div>
              </div>

              {/* End marker */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#6366f1' }}
                />
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: '#6b7280' }}
                >
                  {endDate}
                </span>
              </div>
            </div>
          </div>

          {/* ── Section 3: Equipment Items ────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="section-label" style={{ marginBottom: 0 }}>Daftar Alat</div>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-ghost text-[12px] flex items-center gap-1.5 h-7 px-3"
              >
                <Plus className="w-3 h-3" />
                Tambah Alat
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {items.map((item, index) => {
                const targetEq = equipmentList.find((e) => e.id === item.equipmentId);
                const itemDailyRate = targetEq?.dailyRate || 0;
                const lineTotal = itemDailyRate * item.quantity * durationDays;

                // Availability for this item
                const availData = targetEq
                  ? getAvailableStockForRange(targetEq, startDate, endDate, allBookings)
                  : null;
                const availableStock = availData?.availableStock ?? (targetEq?.totalStock ?? 0);
                const hasConflict = item.quantity > availableStock;
                const conflict = conflictWarnings.find((w) => w.equipmentId === item.equipmentId);

                let availDotColor = '#059669'; // emerald
                let availLabel = `${availableStock} tersedia`;
                if (hasConflict) {
                  availDotColor = '#be123c'; // carmine
                  availLabel = `Kurang ${conflict?.deficit ?? 0} unit`;
                } else if (availableStock <= (targetEq?.totalStock ?? 0) * 0.3) {
                  availDotColor = '#d97706'; // amber
                  availLabel = `${availableStock} tersisa`;
                }

                return (
                  <React.Fragment key={index}>
                    {/* Equipment row */}
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md"
                      style={{
                        background: '#fefdfb',
                        border: hasConflict
                          ? '1px solid rgba(190,18,60,0.25)'
                          : '1px solid rgba(17,19,24,0.08)',
                        transition: 'border-color 200ms ease',
                      }}
                    >
                      {/* Equipment selector */}
                      <select
                        value={item.equipmentId}
                        onChange={(e) => handleEquipmentChange(index, e.target.value)}
                        className="field-input flex-1 min-w-0 text-[13px] h-8 py-0"
                        style={{ height: 32 }}
                      >
                        {equipmentList.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.name} — {formatRupiah(eq.dailyRate)}/hr
                          </option>
                        ))}
                      </select>

                      {/* Availability indicator */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background: availDotColor,
                            transition: 'background 200ms ease',
                          }}
                        />
                        <span
                          className="font-mono text-[11px] tabular-nums"
                          style={{
                            color: availDotColor,
                            transition: 'color 200ms ease',
                            minWidth: 72,
                          }}
                        >
                          {availLabel}
                        </span>
                      </div>

                      {/* Qty input */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          className="field-label"
                          style={{ margin: 0, fontSize: 10 }}
                        >
                          Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseInt(e.target.value, 10) || 1)
                          }
                          className="field-input font-mono tabular-nums text-center"
                          style={{ width: 52, height: 32, padding: '0 8px' }}
                        />
                      </div>

                      {/* Subtotal */}
                      <div
                        className="font-mono tabular-nums text-right text-[12px] shrink-0"
                        style={{ width: 100, color: '#111318' }}
                      >
                        {formatRupiah(lineTotal)}
                      </div>

                      {/* Remove */}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="shrink-0 transition-colors duration-100"
                          style={{ color: '#d1d5db' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#be123c')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
                          aria-label="Hapus baris"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Inline conflict warning — transitions on opacity */}
                    <div
                      style={{
                        overflow: 'hidden',
                        maxHeight: hasConflict ? 40 : 0,
                        opacity: hasConflict ? 1 : 0,
                        transition: 'max-height 200ms ease, opacity 200ms ease',
                      }}
                    >
                      {conflict && (
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono"
                          style={{ color: '#be123c' }}
                        >
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>
                            Diminta {conflict.requestedQty}, tersedia {conflict.availableStock} unit — kurang {conflict.deficit} (berebut:{' '}
                            {conflict.conflictsWith.join(', ') || 'event lain'})
                          </span>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── Section 4: Summary ────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="section-label">Ringkasan</div>

            <div
              className="flex items-end justify-between px-4 py-3 rounded-md"
              style={{
                background: '#fefdfb',
                border: '1px solid rgba(17,19,24,0.08)',
              }}
            >
              <div className="space-y-0.5">
                <p
                  className="text-[11px] uppercase tracking-widest font-medium"
                  style={{ color: '#9ca3af', letterSpacing: '0.08em' }}
                >
                  Total Estimasi
                </p>
                <p className="metric-figure-mono animate-value-appear" style={{ lineHeight: 1 }}>
                  {formatRupiah(totalAmount)}
                </p>
              </div>
              <div
                className="text-right font-mono text-[12px] tabular-nums"
                style={{ color: '#6b7280' }}
              >
                <div>{items.length} item</div>
                <div>{durationDays} hari sewa</div>
              </div>
            </div>

            {/* Conflicts summary strip */}
            <div
              style={{
                overflow: 'hidden',
                maxHeight: conflictWarnings.length > 0 ? 120 : 0,
                opacity: conflictWarnings.length > 0 ? 1 : 0,
                transition: 'max-height 240ms ease, opacity 200ms ease',
              }}
            >
              <div
                className="px-4 py-3 text-[12px] space-y-1"
                style={{
                  borderLeft: '3px solid #be123c',
                  background: 'rgba(190,18,60,0.04)',
                  borderRadius: '0 4px 4px 0',
                }}
              >
                <div
                  className="flex items-center gap-2 font-semibold"
                  style={{ color: '#be123c' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {conflictWarnings.length} potensi bentrok stok terdeteksi
                </div>
                <p style={{ color: '#9ca3af' }} className="text-[11px]">
                  Kurangi kuantitas atau pilih alat alternatif sebelum finalisasi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="divider" />
        <div className="px-6 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className="btn-primary btn-magnetic"
            style={!isFormValid ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
          >
            Simpan &amp; Daftarkan
          </button>
        </div>
      </form>
    </div>
  );
};
