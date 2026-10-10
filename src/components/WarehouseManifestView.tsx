import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  PackageCheck,
  QrCode,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Volume2,
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
    <div className="space-y-6">
      {/* Touch-Friendly Warehouse Header (Blueprint Point 5) */}
      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-lg text-white">
              <Truck className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Jadwal Loading & Manifest Gudang: 10 Oktober 2026
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mode Staf Gudang (Tablet & Touch-Ready). Ketuk tombol untuk memperbarui status perpindahan fisik alat.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Scanner Barcode Fisik: Siap Digunakan</span>
        </div>
      </div>

      {/* Accordion List per Event (Blueprint Point 5) */}
      <div className="space-y-4">
        {manifests.map((manifest) => {
          const isExpanded = expandedEventId === manifest.eventId;

          // Calculate counts and progress bar
          const totalItems = manifest.items.reduce((s, it) => s + it.quantity, 0);
          const returnedItems = manifest.items
            .filter((it) => it.status === 'Kembali / Selesai')
            .reduce((s, it) => s + it.quantity, 0);
          const outItems = manifest.items
            .filter((it) => it.status === 'Keluar Gudang')
            .reduce((s, it) => s + it.quantity, 0);

          const returnProgress = totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0;
          const outProgress = totalItems > 0 ? Math.round(((outItems + returnedItems) / totalItems) * 100) : 0;

          return (
            <div
              key={manifest.eventId}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Accordion Header - Big Touch Target */}
              <div
                onClick={() => toggleAccordion(manifest.eventId)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-slate-900">
                      {manifest.eventName}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      #{manifest.eventCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {manifest.location}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {manifest.startDate} s/d {manifest.endDate}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Klien: {manifest.clientName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Progress Pill */}
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800 font-mono">
                      {returnedItems} / {totalItems} Unit Kembali
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ({returnProgress}% Selesai)
                    </div>
                  </div>

                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* PROGRESS BAR DI ATAS LIST (Blueprint Point 5) */}
              <div className="w-full bg-slate-100 h-2">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${returnProgress}%` }}
                />
              </div>

              {/* Accordion Content (Manifest Checklist) */}
              {isExpanded && (
                <div className="p-4 sm:p-6 bg-slate-50/50 space-y-5 border-t border-slate-200">
                  {/* Bulk Quick Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-700">
                      Tindakan Cepat Staf Gudang:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onBulkUpdateStatus(manifest.eventId, 'Keluar Gudang')}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-semibold text-xs transition-colors"
                      >
                        Tandai Semua: Keluar Gudang
                      </button>
                      <button
                        onClick={() => onBulkUpdateStatus(manifest.eventId, 'Kembali / Selesai')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-semibold text-xs transition-colors"
                      >
                        Tandai Semua: Kembali Lengkap
                      </button>
                    </div>
                  </div>

                  {/* List Alat dalam Manifest */}
                  <div className="space-y-3">
                    {manifest.items.map((item) => {
                      return (
                        <div
                          key={item.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                        >
                          {/* Item Info & Barcode */}
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {item.name}
                              </span>
                              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {item.quantity} Unit
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                                <QrCode className="w-3.5 h-3.5" />
                                {item.barcode}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>Kategori: {item.category}</span>
                              {item.checkedOutAt && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>Keluar: {item.checkedOutAt}</span>
                                </>
                              )}
                            </div>

                            {/* Catatan Kondisi Alat yang Dapat Diedit oleh Role Gudang */}
                            <div className="flex items-center gap-2 mt-1 max-w-xl">
                              <div className="text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 flex-1">
                                <span className="font-semibold text-slate-900">Kondisi Fisik:</span>{' '}
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
                                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline shrink-0 flex items-center gap-0.5"
                                title="Role Gudang: Edit catatan fisik barang"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>

                          {/* TOGGLE/SWITCH STATUS 3-TAHAP & KONTROL GUDANG */}
                          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0">
                            {/* Tombol Edit Kondisi Barang (Role Gudang) */}
                            <button
                              onClick={() =>
                                setEditingConditionItem({
                                  eventId: manifest.eventId,
                                  item,
                                  noteText: item.conditionNotes || 'Kondisi fisik prima, siap pakai',
                                })
                              }
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Edit Kondisi Fisik Alat (Role Gudang)"
                            >
                              <Wrench className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Kondisi</span>
                            </button>

                            <button
                              onClick={() => handleSimulateScan(manifest.eventId, item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Simulasi Scan Barcode"
                            >
                              <QrCode className="w-4 h-4 text-slate-500" />
                              <span className="hidden sm:inline">Scan</span>
                            </button>

                            {/* 3 State Toggle Segmented Controls (Large Touch Target) */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1 text-xs">
                              {/* State 1: Persiapan (Abu-abu) */}
                              <button
                                onClick={() =>
                                  onUpdateItemStatus(manifest.eventId, item.id, 'Persiapan')
                                }
                                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition-all ${
                                  item.status === 'Persiapan'
                                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Persiapan
                              </button>

                              {/* State 2: Keluar Gudang (Kuning) */}
                              <button
                                onClick={() =>
                                  onUpdateItemStatus(manifest.eventId, item.id, 'Keluar Gudang')
                                }
                                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition-all ${
                                  item.status === 'Keluar Gudang'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Keluar Gudang
                              </button>

                              {/* State 3: Kembali / Selesai (Hijau) */}
                              <button
                                onClick={() =>
                                  onUpdateItemStatus(manifest.eventId, item.id, 'Kembali / Selesai')
                                }
                                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition-all ${
                                  item.status === 'Kembali / Selesai'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
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

      {/* BARCODE SCANNER SIMULATION MODAL */}
      {activeScannerItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <QrCode className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">
                Simulasi Scan Barcode Alat
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                {activeScannerItem.item.name} ({activeScannerItem.item.barcode})
              </p>
            </div>

            {scannedFeedback ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{scannedFeedback}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => executeBarcodeCheck('Keluar Gudang')}
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Scan: Keluar Gudang
                </button>
                <button
                  onClick={() => executeBarcodeCheck('Kembali / Selesai')}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Scan: Cek Kembali
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveScannerItem(null)}
              className="text-xs text-slate-400 hover:text-slate-600 pt-2 block mx-auto"
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT KONDISI FISIK BARANG (ROLE: STAF GUDANG) */}
      {editingConditionItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Edit Kondisi Fisik Alat (Role Gudang)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {editingConditionItem.item.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingConditionItem(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Pilih Preset Status Fisik:
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
                      className="p-2 text-left bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded text-[11px] font-medium transition-colors"
                    >
                      • {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Catatan Detail Pemeriksaan Fisik Staf Gudang:
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
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Catatan ini akan tersimpan dan dicantumkan pada manifest serah terima barang.
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingConditionItem(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold"
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
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm"
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
