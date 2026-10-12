import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  PackageCheck,
  QrCode,
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Pencil,
  Wrench,
} from 'lucide-react';
import { WarehouseManifest, ManifestItem, UserRole } from '../types/rental';

interface WarehouseManifestViewProps {
  manifests: WarehouseManifest[];
  userRole?: UserRole;
  onUpdateItemStatus: (
    eventId: string,
    itemId: string,
    newStatus: 'Persiapan' | 'Keluar Gudang' | 'Kembali / Selesai',
    notes?: string
  ) => void;
  onBulkUpdateStatus: (
    eventId: string,
    newStatus: 'Keluar Gudang' | 'Kembali / Selesai'
  ) => void;
}

/** Maps item status to a step index (0-based) for the 3-step progress dots */
function statusToStep(status: string): number {
  if (status === 'Keluar Gudang') return 1;
  if (status === 'Kembali / Selesai') return 2;
  return 0;
}

export const WarehouseManifestView: React.FC<WarehouseManifestViewProps> = ({
  manifests,
  userRole = 'warehouse',
  onUpdateItemStatus,
  onBulkUpdateStatus,
}) => {
  // Active expanded accordion event
  const [expandedEventId, setExpandedEventId] = useState<string>(
    manifests[0]?.eventId || ''
  );

  // Scanner Simulator Modal
  const [activeScannerItem, setActiveScannerItem] = useState<{
    eventId: string;
    item: ManifestItem;
  } | null>(null);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  // Condition Note editor for Warehouse staff
  const [editingConditionItem, setEditingConditionItem] = useState<{
    eventId: string;
    item: ManifestItem;
    noteText: string;
  } | null>(null);

  const toggleAccordion = (eventId: string) => {
    setExpandedEventId((curr) => (curr === eventId ? '' : eventId));
  };

  const handleSimulateScan = (eventId: string, item: ManifestItem) => {
    setActiveScannerItem({ eventId, item });
    setScannedFeedback(null);
  };

  const executeBarcodeCheck = (targetStatus: 'Keluar Gudang' | 'Kembali / Selesai') => {
    if (!activeScannerItem) return;
    setScannedFeedback(`Barcode ${activeScannerItem.item.barcode} Terverifikasi Cocok!`);

    setTimeout(() => {
      onUpdateItemStatus(
        activeScannerItem.eventId,
        activeScannerItem.item.id,
        targetStatus,
        activeScannerItem.item.conditionNotes
      );
      setActiveScannerItem(null);
      setScannedFeedback(null);
    }, 700);
  };

  return (
    <div className="relative space-y-6 animate-page-enter">
      {/* Ambient warehouse scan background */}
      <div className="ambient-warehouse-scan" aria-hidden="true">
        <div className="ambient-warehouse-scan-line" />
      </div>

      {/* All interactive content sits above the ambient layer */}
      <div className="relative z-10 space-y-6">

        {/* Warehouse Header — dark ink surface */}
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-5 py-4"
          style={{
            background: '#1a1d24',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="p-2 mt-0.5 flex-shrink-0"
              style={{ background: '#4f46e5', borderRadius: '8px' }}
            >
              <Truck className="w-5 h-5 text-white" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                Jadwal Loading &amp; Manifest Gudang
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Mode Staf Gudang — Tablet &amp; Touch-Ready. Ketuk tombol untuk memperbarui status perpindahan fisik alat.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '7px',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Scanner Barcode Fisik: Siap
          </div>
        </div>

        {/* Empty state */}
        {manifests.length === 0 && (
          <div className="panel py-16 text-center">
            <PackageCheck className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(17,19,24,0.2)' }} />
            <p className="text-sm font-semibold" style={{ color: 'rgba(17,19,24,0.5)' }}>
              Belum ada manifest gudang
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(17,19,24,0.35)' }}>
              Buat booking baru untuk menghasilkan manifest otomatis.
            </p>
          </div>
        )}

        {/* Accordion list per event */}
        <div className="space-y-3">
          {manifests.map((manifest, mIdx) => {
            const isExpanded = expandedEventId === manifest.eventId;

            // Progress calculations
            const totalItems = manifest.items.reduce((s, it) => s + it.quantity, 0);
            const returnedItems = manifest.items
              .filter((it) => it.status === 'Kembali / Selesai')
              .reduce((s, it) => s + it.quantity, 0);
            const outItems = manifest.items
              .filter((it) => it.status === 'Keluar Gudang')
              .reduce((s, it) => s + it.quantity, 0);

            const returnProgress = totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0;

            // Overall event status badge
            const allReturned = returnedItems === totalItems && totalItems > 0;
            const someOut = outItems > 0 || returnedItems > 0;

            return (
              <div
                key={manifest.eventId}
                className={`panel overflow-hidden transition-all stagger-${Math.min(mIdx + 1, 8)}`}
                style={{ borderRadius: '10px' }}
              >
                {/* Accordion Header — big touch target, min 56px */}
                <div
                  onClick={() => toggleAccordion(manifest.eventId)}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 cursor-pointer select-none transition-colors"
                  style={{ minHeight: '56px', paddingTop: '14px', paddingBottom: '14px' }}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: '#111318' }}>
                        {manifest.eventName}
                      </span>
                      <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(17,19,24,0.05)', color: 'rgba(17,19,24,0.45)' }}>
                        #{manifest.eventCode}
                      </span>
                      {allReturned ? (
                        <span className="badge-emerald">Selesai</span>
                      ) : someOut ? (
                        <span className="badge-amber">Keluar Gudang</span>
                      ) : (
                        <span className="badge-ink">Persiapan</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'rgba(17,19,24,0.45)' }}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {manifest.location}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {manifest.startDate} s/d {manifest.endDate}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{manifest.clientName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                    {/* Return progress */}
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold tabular-nums" style={{ color: '#111318' }}>
                        {returnedItems}/{totalItems} Kembali
                      </div>
                      <div className="font-mono text-[11px] tabular-nums" style={{ color: 'rgba(17,19,24,0.4)' }}>
                        {returnProgress}% Selesai
                      </div>
                    </div>

                    <div
                      className="p-1.5 transition-colors"
                      style={{
                        background: 'rgba(17,19,24,0.05)',
                        borderRadius: '7px',
                        color: 'rgba(17,19,24,0.5)',
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Overall progress bar */}
                <div className="progress-bar-track" style={{ borderRadius: 0, height: '3px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${returnProgress}%` }}
                  />
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div
                    className="animate-slide-in-right"
                    style={{ borderTop: '1px solid rgba(17,19,24,0.06)' }}
                  >
                    {/* Bulk Action Bar */}
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                      style={{
                        background: 'rgba(17,19,24,0.025)',
                        borderBottom: '1px solid rgba(17,19,24,0.06)',
                      }}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider section-label">
                        Tindakan Cepat
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onBulkUpdateStatus(manifest.eventId, 'Keluar Gudang')}
                          className="btn-ghost text-xs px-3 py-1.5"
                        >
                          Semua Keluar Gudang
                        </button>
                        <button
                          onClick={() => onBulkUpdateStatus(manifest.eventId, 'Kembali / Selesai')}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          Semua Kembali Lengkap
                        </button>
                      </div>
                    </div>

                    {/* Item rows */}
                    <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(17,19,24,0.05)' } as React.CSSProperties}>
                      {manifest.items.map((item) => {
                        const step = statusToStep(item.status);
                        const steps = ['Persiapan', 'Keluar Gudang', 'Kembali'];

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-5 py-4 transition-colors table-row-hover"
                            style={{ minHeight: '48px' }}
                          >
                            {/* Item Info */}
                            <div className="space-y-2 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm" style={{ color: '#111318' }}>
                                  {item.name}
                                </span>
                                <span
                                  className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(79,70,229,0.08)', color: '#4f46e5' }}
                                >
                                  {item.quantity} Unit
                                </span>
                              </div>

                              {/* Barcode & timestamps */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono" style={{ color: 'rgba(17,19,24,0.45)' }}>
                                <span
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded font-bold"
                                  style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}
                                >
                                  <QrCode className="w-3 h-3" />
                                  {item.barcode}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{item.category}</span>
                                {item.checkedOutAt && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>Keluar: {item.checkedOutAt}</span>
                                  </>
                                )}
                                {item.checkedInAt && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>Kembali: {item.checkedInAt}</span>
                                  </>
                                )}
                              </div>

                              {/* Condition note */}
                              <div className="flex items-center gap-2 max-w-lg">
                                <div
                                  className="text-[11px] flex-1 px-2.5 py-1 rounded"
                                  style={{
                                    background: 'rgba(17,19,24,0.035)',
                                    border: '1px solid rgba(17,19,24,0.07)',
                                    color: 'rgba(17,19,24,0.6)',
                                  }}
                                >
                                  <span className="font-semibold" style={{ color: '#111318' }}>Kondisi:</span>{' '}
                                  {item.conditionNotes || 'Kondisi fisik prima, siap pakai'}
                                </div>
                                <button
                                  onClick={() =>
                                    setEditingConditionItem({
                                      eventId: manifest.eventId,
                                      item,
                                      noteText: item.conditionNotes || 'Kondisi fisik prima, siap pakai',
                                    })
                                  }
                                  className="text-[11px] font-semibold flex items-center gap-0.5 shrink-0"
                                  style={{ color: '#4f46e5' }}
                                  title="Edit catatan fisik barang"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Edit
                                </button>
                              </div>

                              {/* 3-step progress dots */}
                              <div className="flex items-center gap-1.5 pt-0.5">
                                {steps.map((s, i) => (
                                  <React.Fragment key={s}>
                                    <div
                                      className="flex items-center gap-1 text-[10px] font-semibold"
                                      style={{
                                        color: i <= step
                                          ? (i === 2 ? '#059669' : i === 1 ? '#d97706' : '#4f46e5')
                                          : 'rgba(17,19,24,0.25)',
                                      }}
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full transition-all"
                                        style={{
                                          background: i <= step
                                            ? (i === 2 ? '#059669' : i === 1 ? '#d97706' : '#4f46e5')
                                            : 'rgba(17,19,24,0.15)',
                                        }}
                                      />
                                      <span className="hidden sm:inline">{s}</span>
                                    </div>
                                    {i < 2 && (
                                      <div
                                        className="h-px flex-1 max-w-[20px] transition-all"
                                        style={{
                                          background: i < step ? '#4f46e5' : 'rgba(17,19,24,0.12)',
                                        }}
                                      />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0">
                              {/* Edit condition button (secondary, icon) */}
                              <button
                                onClick={() =>
                                  setEditingConditionItem({
                                    eventId: manifest.eventId,
                                    item,
                                    noteText: item.conditionNotes || 'Kondisi fisik prima, siap pakai',
                                  })
                                }
                                className="btn-ghost px-2.5 py-2 text-xs flex items-center gap-1"
                                title="Edit Kondisi Fisik Alat (Role Gudang)"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Kondisi</span>
                              </button>

                              {/* Scan button */}
                              <button
                                onClick={() => handleSimulateScan(manifest.eventId, item)}
                                className="btn-ghost px-2.5 py-2 text-xs flex items-center gap-1"
                                title="Simulasi Scan Barcode"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Scan</span>
                              </button>

                              {/* 3-state segmented toggle */}
                              <div
                                className="flex items-center p-1 gap-0.5 text-xs"
                                style={{
                                  background: 'rgba(17,19,24,0.06)',
                                  border: '1px solid rgba(17,19,24,0.08)',
                                  borderRadius: '8px',
                                }}
                              >
                                {/* State 1: Persiapan */}
                                <button
                                  onClick={() =>
                                    onUpdateItemStatus(manifest.eventId, item.id, 'Persiapan')
                                  }
                                  className="px-2.5 py-1.5 rounded font-semibold transition-all"
                                  style={
                                    item.status === 'Persiapan'
                                      ? {
                                          background: '#fff',
                                          color: '#111318',
                                          boxShadow: '0 1px 3px rgba(17,19,24,0.12)',
                                          border: '1px solid rgba(17,19,24,0.08)',
                                        }
                                      : { color: 'rgba(17,19,24,0.4)' }
                                  }
                                >
                                  Persiapan
                                </button>

                                {/* State 2: Keluar Gudang */}
                                <button
                                  onClick={() =>
                                    onUpdateItemStatus(manifest.eventId, item.id, 'Keluar Gudang')
                                  }
                                  className="px-2.5 py-1.5 rounded font-semibold transition-all"
                                  style={
                                    item.status === 'Keluar Gudang'
                                      ? { background: '#d97706', color: '#fff' }
                                      : { color: 'rgba(17,19,24,0.4)' }
                                  }
                                >
                                  Keluar
                                </button>

                                {/* State 3: Kembali / Selesai */}
                                <button
                                  onClick={() =>
                                    onUpdateItemStatus(manifest.eventId, item.id, 'Kembali / Selesai')
                                  }
                                  className="px-2.5 py-1.5 rounded font-semibold transition-all"
                                  style={
                                    item.status === 'Kembali / Selesai'
                                      ? { background: '#059669', color: '#fff' }
                                      : { color: 'rgba(17,19,24,0.4)' }
                                  }
                                >
                                  Kembali
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BARCODE SCANNER SIMULATION MODAL — dark ink surface */}
      {activeScannerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-enter" style={{ background: 'rgba(17,19,24,0.82)' }}>
          <div
            className="max-w-sm w-full text-center space-y-5 animate-dialog-enter"
            style={{
              background: '#1a1d24',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '28px 24px',
            }}
          >
            {/* Icon */}
            <div
              className="w-16 h-16 mx-auto flex items-center justify-center"
              style={{ background: 'rgba(79,70,229,0.15)', borderRadius: '50%' }}
            >
              <QrCode className="w-8 h-8" style={{ color: '#6366f1' }} />
            </div>

            {/* Title */}
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                Simulasi Scan Barcode Alat
              </h3>
              <p className="font-mono text-sm mt-2 px-3 py-2 rounded" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                {activeScannerItem.item.barcode}
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {activeScannerItem.item.name}
              </p>
            </div>

            {/* Scan feedback or action buttons */}
            {scannedFeedback ? (
              <div
                className="px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.25)', color: '#10b981' }}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{scannedFeedback}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => executeBarcodeCheck('Keluar Gudang')}
                  className="py-3 px-4 text-sm font-bold rounded-lg transition-all"
                  style={{ background: '#d97706', color: '#fff' }}
                >
                  Keluar Gudang
                </button>
                <button
                  onClick={() => executeBarcodeCheck('Kembali / Selesai')}
                  className="py-3 px-4 text-sm font-bold rounded-lg transition-all"
                  style={{ background: '#059669', color: '#fff' }}
                >
                  Cek Kembali
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveScannerItem(null)}
              className="text-xs block mx-auto pt-1 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT KONDISI FISIK BARANG (ROLE: STAF GUDANG) */}
      {editingConditionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-enter" style={{ background: 'rgba(17,19,24,0.72)' }}>
          <div
            className="max-w-md w-full overflow-hidden animate-dialog-enter"
            style={{
              background: '#fefdfb',
              border: '1px solid rgba(17,19,24,0.1)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(17,19,24,0.25)',
            }}
          >
            {/* Modal header — dark surface */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ background: '#1a1d24' }}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4" style={{ color: '#6366f1' }} />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Edit Kondisi Fisik Alat
                  </h3>
                  <p className="font-mono text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {editingConditionItem.item.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingConditionItem(null)}
                className="text-sm font-bold transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="field-label mb-2 block">
                  Pilih Preset Status Fisik
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    'Kondisi Mulus / Normal',
                    'Ada Lecet / Baret Fisik',
                    'Kabel / Jack Perlu Cek',
                    'Baut / Clamp Longgar',
                    'Perlu Servis & Kalibrasi',
                    'Aksesoris Kurang / Hilang',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setEditingConditionItem({
                          ...editingConditionItem,
                          noteText: preset,
                        })
                      }
                      className="p-2 text-left rounded text-[11px] font-medium transition-colors"
                      style={{
                        background:
                          editingConditionItem.noteText === preset
                            ? 'rgba(79,70,229,0.08)'
                            : 'rgba(17,19,24,0.03)',
                        border:
                          editingConditionItem.noteText === preset
                            ? '1px solid rgba(79,70,229,0.25)'
                            : '1px solid rgba(17,19,24,0.08)',
                        color:
                          editingConditionItem.noteText === preset
                            ? '#4f46e5'
                            : 'rgba(17,19,24,0.6)',
                      }}
                    >
                      · {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label mb-1.5 block">
                  Catatan Detail Pemeriksaan Fisik
                </label>
                <textarea
                  rows={3}
                  value={editingConditionItem.noteText}
                  onChange={(e) =>
                    setEditingConditionItem({
                      ...editingConditionItem,
                      noteText: e.target.value,
                    })
                  }
                  placeholder="Contoh: Body kamera bersih, sensor bebas debu, baterai cadangan terpasang..."
                  className="field-input w-full text-xs"
                  style={{ resize: 'vertical', minHeight: '72px' }}
                />
                <span className="text-[10px] mt-1 block" style={{ color: 'rgba(17,19,24,0.4)' }}>
                  Catatan ini akan tersimpan dan dicantumkan pada manifest serah terima barang.
                </span>
              </div>
            </div>

            {/* Modal footer */}
            <div
              className="px-5 py-3.5 flex justify-end gap-2"
              style={{ borderTop: '1px solid rgba(17,19,24,0.07)', background: 'rgba(17,19,24,0.02)' }}
            >
              <button
                type="button"
                onClick={() => setEditingConditionItem(null)}
                className="btn-ghost text-xs px-4 py-2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateItemStatus(
                    editingConditionItem.eventId,
                    editingConditionItem.item.id,
                    editingConditionItem.item.status,
                    editingConditionItem.noteText
                  );
                  setEditingConditionItem(null);
                }}
                className="btn-primary text-xs px-4 py-2"
              >
                Simpan Catatan Kondisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
