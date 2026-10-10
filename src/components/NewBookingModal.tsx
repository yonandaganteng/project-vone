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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Buat Event & Booking Alat Baru
            </h3>
            <p className="text-xs text-slate-500">
              Validasi alokasi unit secara otomatis mencegah double booking
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Live Conflict Warning Box if any */}
          {conflictWarnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Peringatan Deteksi Bentrok Stok (Double Booking)!</span>
              </div>
              <ul className="space-y-1 text-red-800 list-disc list-inside">
                {conflictWarnings.map((w, i) => (
                  <li key={i}>
                    <strong>{w.equipmentName}</strong>: Diminta {w.requestedQty} unit, sisa stok aman hanya {w.availableStock} unit.
                    Kurang {w.deficit} unit (Berebut dengan: {w.conflictsWith.join(', ') || 'Event lain'}).
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-red-700 font-medium">
                Saran: Kurangi kuota atau tawarkan substitusi alat alternatif sebelum finalisasi.
              </p>
            </div>
          )}

          {/* Event & Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Event *</label>
              <input
                type="text"
                required
                placeholder="cth: Festival Musik Mahasiswa 2026"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Klien / EO *</label>
              <input
                type="text"
                required
                placeholder="cth: PT Kreasi Bangsa (Bpk. Andre)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">No. WhatsApp</label>
              <input
                type="text"
                placeholder="0812-xxxx-xxxx"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Klien</label>
              <input
                type="email"
                placeholder="pic@event.co.id"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lokasi Venue</label>
              <input
                type="text"
                placeholder="cth: Balai Kartini, Jakarta"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          {/* Rental Dates */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tgl Mulai Sewa</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tgl Selesai Sewa</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div className="col-span-2 text-slate-500 font-mono text-[11px]">
              Durasi Sewa: <strong>{durationDays} Hari</strong>
            </div>
          </div>

          {/* Items Selector Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 block">
                Daftar Alat yang Disewa:
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Baris Alat</span>
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              {items.map((item, index) => {
                const targetEq = equipmentList.find((e) => e.id === item.equipmentId);
                const itemDailyRate = targetEq?.dailyRate || 0;
                const lineTotal = itemDailyRate * item.quantity * durationDays;

                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.equipmentId}
                        onChange={(e) => handleEquipmentChange(index, e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        {equipmentList.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.name} (Stok: {eq.totalStock} Unit) - {formatRupiah(eq.dailyRate)}/hr
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-500">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-16 p-1.5 border border-slate-300 rounded text-xs font-mono text-center"
                        />
                      </div>

                      <div className="w-28 text-right font-mono font-bold text-slate-900 text-xs">
                        {formatRupiah(lineTotal)}
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Tagihan Box */}
          <div className="bg-slate-900 text-white p-3.5 rounded-lg flex items-center justify-between font-mono">
            <div>
              <span className="text-xs text-slate-400 block">Estimasi Nilai Sewa:</span>
              <span className="text-lg font-bold text-indigo-400">
                {formatRupiah(totalAmount)}
              </span>
            </div>
            <div className="text-right text-xs text-slate-300">
              {items.length} Item · {durationDays} Hari Sewa
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Simpan & Daftarkan Jadwal
          </button>
        </div>
      </form>
    </div>
  );
};
