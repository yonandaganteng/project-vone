import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Tag,
  MapPin,
  Edit,
  Pencil,
  Wrench,
  DollarSign,
  FileText,
  X,
  Layers,
  Check,
  Trash2,
} from 'lucide-react';
import { Equipment, EventBooking, UserRole } from '../types/rental';
import { formatRupiah } from '../utils/formatters';

interface InventoryViewProps {
  equipmentList: Equipment[];
  bookings: EventBooking[];
  userRole?: UserRole;
  onAddNewEquipment: (newEq: Equipment) => void;
  onUpdateEquipmentStock: (equipmentId: string, newTotalStock: number) => void;
  onUpdateEquipmentCondition?: (
    equipmentId: string,
    newCondition: Equipment['condition'],
    newRack?: string
  ) => void;
  onUpdateEquipment?: (updatedEq: Equipment) => void;
  onDeleteEquipment?: (equipmentId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  equipmentList,
  bookings,
  userRole = 'admin',
  onAddNewEquipment,
  onUpdateEquipmentStock,
  onUpdateEquipmentCondition,
  onUpdateEquipment,
  onDeleteEquipment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  // Edit Condition State (Role Staf Gudang)
  const [editingConditionEq, setEditingConditionEq] = useState<{
    id: string;
    name: string;
    condition: Equipment['condition'];
    locationRack: string;
  } | null>(null);

  // Full Edit Equipment State (Price, Name, Description, Specs)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    code: string;
    category: Equipment['category'];
    totalStock: number;
    dailyRate: number;
    brand: string;
    locationRack: string;
    condition: Equipment['condition'];
    description: string;
  }>({
    name: '',
    code: '',
    category: 'Audio & Sound',
    totalStock: 4,
    dailyRate: 350000,
    brand: '',
    locationRack: '',
    condition: 'Sangat Baik',
    description: '',
  });

  // New Equipment Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Audio & Sound' as Equipment['category'],
    totalStock: 4,
    dailyRate: 350000,
    brand: '',
    locationRack: 'Rak B-02',
    condition: 'Sangat Baik' as Equipment['condition'],
    description: '',
  });

  const categories = [
    'Semua',
    'Kamera & Lensa',
    'Audio & Sound',
    'Lighting & Effect',
    'Visual & LED',
    'Rigging & Truss',
    'Power & Kabel',
  ];

  const filteredEquipment = equipmentList.filter((eq) => {
    if (selectedCategory !== 'Semua' && eq.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !eq.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !eq.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !eq.brand.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(eq.description && eq.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  const handleOpenEditModal = (eq: Equipment) => {
    setEditingEquipment(eq);
    setEditFormData({
      name: eq.name,
      code: eq.code,
      category: eq.category,
      totalStock: eq.totalStock,
      dailyRate: eq.dailyRate,
      brand: eq.brand,
      locationRack: eq.locationRack,
      condition: eq.condition,
      description: eq.description || '',
    });
  };

  const handleSaveEditEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;

    const updated: Equipment = {
      ...editingEquipment,
      name: editFormData.name.trim(),
      code: editFormData.code.trim(),
      category: editFormData.category,
      totalStock: Number(editFormData.totalStock) || 1,
      dailyRate: Math.max(0, Number(editFormData.dailyRate) || 0),
      brand: editFormData.brand.trim() || 'VendorOne',
      locationRack: editFormData.locationRack.trim() || 'Gudang Utama',
      condition: editFormData.condition,
      description: editFormData.description.trim(),
    };

    if (onUpdateEquipment) {
      onUpdateEquipment(updated);
    }
    setEditingEquipment(null);
    showNotification(
      `Alat "${updated.name}" berhasil diperbarui: Tarif ${formatRupiah(updated.dailyRate)}/hari & deskripsi tersimpan!`
    );
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEq: Equipment = {
      id: `eq-${Date.now()}`,
      code: formData.code || `EQ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name,
      category: formData.category,
      totalStock: formData.totalStock,
      dailyRate: formData.dailyRate,
      brand: formData.brand || 'VendorOne Pro',
      locationRack: formData.locationRack,
      condition: formData.condition,
      description: formData.description.trim(),
      serialNumbers: Array.from(
        { length: formData.totalStock },
        (_, i) => `SN-${formData.code}-${String(i + 1).padStart(2, '0')}`
      ),
    };

    onAddNewEquipment(newEq);
    setShowAddModal(false);
    showNotification(`Alat baru "${newEq.name}" (${formatRupiah(newEq.dailyRate)}/hari) berhasil ditambahkan ke katalog master.`);
    setFormData({
      name: '',
      code: '',
      category: 'Audio & Sound',
      totalStock: 4,
      dailyRate: 350000,
      brand: '',
      locationRack: 'Rak B-02',
      condition: 'Sangat Baik',
      description: '',
    });
  };

  // Quick price adjustment helper in edit modal
  const adjustEditPrice = (amount: number) => {
    setEditFormData((prev) => ({
      ...prev,
      dailyRate: Math.max(10000, prev.dailyRate + amount),
    }));
  };

  // Utilization calculation: how many units are currently booked
  const getUtilization = (eq: Equipment) => {
    const activeBookings = bookings.filter(
      (b) =>
        b.status !== 'Dibatalkan' &&
        b.items.some((item) => item.equipmentId === eq.id)
    );
    const booked = activeBookings.reduce((acc, b) => {
      const item = b.items.find((i) => i.equipmentId === eq.id);
      return acc + (item?.quantity || 0);
    }, 0);
    const used = Math.min(booked, eq.totalStock);
    const pct = eq.totalStock > 0 ? (used / eq.totalStock) * 100 : 0;
    return { used, total: eq.totalStock, pct };
  };

  const getUtilizationColor = (pct: number) => {
    if (pct >= 90) return '#be123c';   // carmine
    if (pct >= 60) return '#d97706';   // amber
    return '#059669';                   // emerald
  };

  const conditionBadge = (condition: Equipment['condition']) => {
    if (condition === 'Sangat Baik') return 'badge-emerald';
    if (condition === 'Baik') return 'badge-amber';
    return 'badge-carmine';
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="ambient-inventory absolute inset-0 z-0 pointer-events-none" />

      {/* All content above ambient */}
      <div className="relative z-10 space-y-5 animate-page-enter">

        {/* ── Toast Notification ── */}
        {successToast && (
          <div className="fixed top-[72px] right-5 z-[60] toast toast-success animate-toast-enter flex items-start gap-3 max-w-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[12px] text-white">Perubahan Tersimpan</p>
              <p className="text-[11px] text-emerald-200 mt-0.5 leading-relaxed">{successToast}</p>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="ml-auto text-emerald-300 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Page Header (sits directly on page, no card) ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Boxes className="w-4 h-4 text-indigo-500" />
              <h1 className="text-[18px] font-bold tracking-tight text-[#111318]">
                Master Katalog Alat &amp; Tarif Sewa
              </h1>
              <span className="badge-indigo font-mono text-[10px]">
                {equipmentList.length} item
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#6b7280]">
              INVENTORY · {filteredEquipment.length} ditampilkan
              {selectedCategory !== 'Semua' && ` · ${selectedCategory}`}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-magnetic inline-flex items-center gap-2 text-[13px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Alat Baru
          </button>
        </div>

        {/* ── Filter & Search row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Cari kode, nama, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-input pl-9 py-2 text-[12px] w-full"
            />
          </div>

          {/* Category text-link tabs */}
          <div className="flex items-center gap-0 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-all border-b-2 ${
                  selectedCategory === cat
                    ? 'border-[#4f46e5] text-[#4f46e5]'
                    : 'border-transparent text-[#6b7280] hover:text-[#111318] hover:border-[#d1d5db]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Equipment Table ── */}
        <div className="panel overflow-hidden">
          {filteredEquipment.length === 0 ? (
            <div className="py-20 text-center">
              <p className="section-label mb-2">Tidak Ada Alat Ditemukan</p>
              <p className="text-[13px] text-[#9ca3af]">
                {searchQuery
                  ? `Tidak ada hasil untuk "${searchQuery}"`
                  : 'Belum ada alat di kategori ini. Tambahkan alat baru.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left">Kode / Nama Alat</th>
                    <th className="py-3 px-4 text-left">Kategori</th>
                    <th className="py-3 px-4 text-left">Rak &amp; Kondisi</th>
                    <th className="py-3 px-4 text-center">Stok &amp; Utilisasi</th>
                    <th className="py-3 px-4 text-right">Tarif / Hari</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((eq, idx) => {
                    const util = getUtilization(eq);
                    const utilColor = getUtilizationColor(util.pct);

                    return (
                      <tr
                        key={eq.id}
                        className={`table-row-hover group relative stagger-${Math.min(idx + 1, 8) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`}
                      >
                        {/* Code + Name */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-[11px] text-[#9ca3af] mb-0.5 tracking-wide">
                            {eq.code}
                          </div>
                          <div className="text-[13px] font-medium text-[#111318] leading-snug">
                            {eq.name}
                          </div>
                          {eq.description && (
                            <p className="text-[11px] text-[#9ca3af] mt-0.5 line-clamp-1">
                              {eq.description}
                            </p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="badge-ink text-[11px]">{eq.category}</span>
                          <div className="text-[11px] text-[#9ca3af] mt-1">{eq.brand}</div>
                        </td>

                        {/* Rack + Condition */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono text-[11px] text-[#6b7280] font-bold mb-1.5">
                            {eq.locationRack}
                          </div>
                          <span className={`${conditionBadge(eq.condition)} text-[11px]`}>
                            {eq.condition}
                          </span>
                        </td>

                        {/* Stock + utilization */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <span className="font-mono text-[12px] text-[#111318] tabular-nums">
                              {util.used} / {util.total}
                            </span>
                            <span className="text-[11px] text-[#9ca3af]">unit</span>
                          </div>
                          {/* Utilization progress bar */}
                          <div className="progress-bar-track w-24 mx-auto">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${util.pct}%`,
                                backgroundColor: utilColor,
                              }}
                            />
                          </div>
                          <div className="text-center font-mono text-[10px] mt-0.5" style={{ color: utilColor }}>
                            {Math.round(util.pct)}%
                          </div>
                        </td>

                        {/* Daily Rate */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="font-mono tabular-nums text-[12px] text-[#111318] font-semibold">
                            {formatRupiah(eq.dailyRate)}
                          </div>
                          <div className="text-[10px] text-[#9ca3af] mt-0.5">per hari</div>
                        </td>

                        {/* Actions — slide in on hover */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0">
                            <button
                              onClick={() => handleOpenEditModal(eq)}
                              className="btn-ghost inline-flex items-center gap-1 text-[11px] py-1 px-2"
                              title="Edit alat"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setEditingConditionEq({
                                  id: eq.id,
                                  name: eq.name,
                                  condition: eq.condition,
                                  locationRack: eq.locationRack,
                                })
                              }
                              className={`inline-flex items-center gap-1 text-[11px] py-1 px-2 rounded border transition-all ${
                                userRole === 'warehouse'
                                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                  : 'btn-ghost'
                              }`}
                              title="Update kondisi"
                            >
                              <Wrench className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEquipmentToDelete(eq)}
                              className="inline-flex items-center gap-1 text-[11px] py-1 px-2 rounded border border-transparent hover:border-[#be123c]/30 text-[#be123c] hover:bg-[#be123c]/10 transition-all"
                              title="Hapus alat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODAL: EDIT DETAIL LENGKAP ALAT (HARGA, NAMA, DESKRIPSI)         */}
      {/* ================================================================ */}
      {editingEquipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-backdrop-enter"
          style={{ background: 'rgba(10,11,14,0.72)', backdropFilter: 'blur(4px)' }}
        >
          <form
            onSubmit={handleSaveEditEquipment}
            className="animate-dialog-enter max-w-lg w-full my-8 rounded-xl overflow-hidden border border-white/[0.06]"
            style={{ background: '#1a1d24' }}
          >
            {/* Modal Header */}
            <div
              className="px-5 py-4 flex items-center justify-between border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-indigo-600/20 rounded-lg">
                  <Pencil className="w-4 h-4 text-indigo-400" />
                </span>
                <div>
                  <h3 className="text-[13px] font-bold text-white">Edit Master Alat Rental</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[11px] text-indigo-400">{editingEquipment.code}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
                    >
                      {editingEquipment.category}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEquipment(null)}
                className="text-[#6b7280] hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Section: Basic Info */}
              <p className="section-label">Informasi Dasar</p>

              {/* Nama Alat */}
              <div>
                <label className="field-label mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-indigo-400" />
                  Nama Lengkap Alat
                  <span className="text-[#be123c] ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="cth: Sony Alpha A7 III Body + Cage"
                  className="field-input w-full text-[12px]"
                />
                <p className="text-[10px] mt-1" style={{ color: '#6b7280' }}>
                  Akan dicetak di penawaran, invoice, dan surat jalan manifest.
                </p>
              </div>

              {/* Kategori & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label mb-1.5">Kategori</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, category: e.target.value as Equipment['category'] })
                    }
                    className="field-input w-full text-[12px]"
                  >
                    <option value="Kamera & Lensa">Kamera &amp; Lensa</option>
                    <option value="Audio & Sound">Audio &amp; Sound</option>
                    <option value="Lighting & Effect">Lighting &amp; Effect</option>
                    <option value="Visual & LED">Visual &amp; LED</option>
                    <option value="Rigging & Truss">Rigging &amp; Truss</option>
                    <option value="Power & Kabel">Power &amp; Kabel</option>
                  </select>
                </div>
                <div>
                  <label className="field-label mb-1.5">Brand / Merek</label>
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                    className="field-input w-full text-[12px]"
                  />
                </div>
              </div>

              {/* Section: Pricing */}
              <p className="section-label mt-2">Tarif Sewa</p>

              <div
                className="p-3.5 rounded-lg border space-y-2.5"
                style={{ background: 'rgba(79,70,229,0.06)', borderColor: 'rgba(79,70,229,0.2)' }}
              >
                <div className="flex items-center justify-between">
                  <label className="field-label flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3 text-indigo-400" />
                    Tarif / Hari
                    <span className="text-[#be123c]">*</span>
                  </label>
                  <span className="font-mono text-[12px] font-bold text-indigo-400">
                    {formatRupiah(editFormData.dailyRate)} / hari
                  </span>
                </div>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold"
                    style={{ color: '#9ca3af' }}
                  >
                    Rp
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    required
                    value={editFormData.dailyRate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, dailyRate: parseInt(e.target.value, 10) || 0 })
                    }
                    className="field-input w-full pl-9 font-mono text-[12px]"
                  />
                </div>
                {/* Quick adjustment chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px]" style={{ color: '#6b7280' }}>Sesuaikan:</span>
                  {[-50000, 50000, 100000, 250000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => adjustEditPrice(amt)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: amt < 0 ? '#f87171' : '#818cf8',
                      }}
                    >
                      {amt > 0 ? '+' : ''}{amt / 1000}rb
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Location & Condition */}
              <p className="section-label mt-2">Lokasi &amp; Kondisi</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label mb-1.5">Total Stok Fisik</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editFormData.totalStock}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, totalStock: parseInt(e.target.value, 10) || 1 })
                    }
                    className="field-input w-full font-mono text-[12px]"
                  />
                </div>
                <div>
                  <label className="field-label mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-indigo-400" />
                    Lokasi Rak
                  </label>
                  <input
                    type="text"
                    value={editFormData.locationRack}
                    onChange={(e) => setEditFormData({ ...editFormData, locationRack: e.target.value })}
                    className="field-input w-full font-mono text-[12px]"
                  />
                </div>
              </div>

              {/* Condition toggle */}
              <div>
                <label className="field-label mb-2">Kondisi Fisik</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Sangat Baik', 'Baik', 'Perlu Servis'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, condition: c })}
                      className={`py-2 px-2 text-center rounded-lg text-[11px] font-semibold border transition-all ${
                        editFormData.condition === c
                          ? c === 'Sangat Baik'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : c === 'Baik'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-[#be123c] text-white border-[#be123c]'
                          : 'text-[#9ca3af] border-white/10 hover:border-white/20'
                      }`}
                      style={
                        editFormData.condition !== c
                          ? { background: 'rgba(255,255,255,0.04)' }
                          : {}
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Description */}
              <p className="section-label mt-2">Deskripsi &amp; Spesifikasi</p>
              <div>
                <label className="field-label mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    Deskripsi Alat
                  </span>
                  <span className="text-[10px] font-normal" style={{ color: '#6b7280' }}>
                    {editFormData.description.length} karakter
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Spesifikasi teknis, kelengkapan aksesori, catatan khusus pemakaian..."
                  className="field-input w-full text-[12px] leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="px-5 py-3.5 flex items-center justify-between border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setEquipmentToDelete(editingEquipment);
                  setEditingEquipment(null);
                }}
                className="btn-destructive inline-flex items-center gap-1.5 text-[12px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Alat
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEquipment(null)}
                  className="btn-ghost text-[12px]"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary inline-flex items-center gap-1.5 text-[12px]">
                  <Check className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: TAMBAH ALAT BARU                                          */}
      {/* ================================================================ */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-backdrop-enter"
          style={{ background: 'rgba(10,11,14,0.72)', backdropFilter: 'blur(4px)' }}
        >
          <form
            onSubmit={handleAddSubmit}
            className="animate-dialog-enter max-w-lg w-full my-8 rounded-xl overflow-hidden border border-white/[0.06]"
            style={{ background: '#1a1d24' }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-indigo-600/20 rounded-lg">
                  <Plus className="w-4 h-4 text-indigo-400" />
                </span>
                <div>
                  <h3 className="text-[13px] font-bold text-white">Tambah Master Alat Rental Baru</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>
                    Akan langsung tersedia di seluruh role dan pembuatan booking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#6b7280] hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
              <p className="section-label">Identitas Alat</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label mb-1.5">Kode Alat (SKU) *</label>
                  <input
                    type="text"
                    required
                    placeholder="cth: CAM-A7M4"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="field-input w-full font-mono text-[12px]"
                  />
                </div>
                <div>
                  <label className="field-label mb-1.5">Brand / Merek</label>
                  <input
                    type="text"
                    placeholder="cth: Sony, Shure"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="field-input w-full text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="field-label mb-1.5">Nama Lengkap Alat *</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Sony Alpha 7 IV Kit Lensa 24-70mm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="field-input w-full text-[12px]"
                />
              </div>

              <div>
                <label className="field-label mb-1.5">Deskripsi &amp; Spesifikasi</label>
                <textarea
                  rows={2}
                  placeholder="Spesifikasi teknis, kelengkapan aksesoris, atau catatan khusus..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="field-input w-full text-[12px] leading-relaxed"
                />
              </div>

              <p className="section-label mt-2">Kategori &amp; Kondisi</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label mb-1.5">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="field-input w-full text-[12px]"
                  >
                    <option value="Kamera & Lensa">Kamera &amp; Lensa</option>
                    <option value="Audio & Sound">Audio &amp; Sound</option>
                    <option value="Lighting & Effect">Lighting &amp; Effect</option>
                    <option value="Visual & LED">Visual &amp; LED</option>
                    <option value="Rigging & Truss">Rigging &amp; Truss</option>
                    <option value="Power & Kabel">Power &amp; Kabel</option>
                  </select>
                </div>
                <div>
                  <label className="field-label mb-1.5">Kondisi Awal</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                    className="field-input w-full text-[12px]"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Servis">Perlu Servis</option>
                  </select>
                </div>
              </div>

              <p className="section-label mt-2">Stok &amp; Tarif</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label mb-1.5">Total Stok Fisik</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.totalStock}
                    onChange={(e) =>
                      setFormData({ ...formData, totalStock: parseInt(e.target.value, 10) || 1 })
                    }
                    className="field-input w-full font-mono text-[12px]"
                  />
                </div>
                <div>
                  <label className="field-label mb-1.5">Tarif Sewa / Hari (Rp)</label>
                  <input
                    type="number"
                    min={10000}
                    step={10000}
                    required
                    value={formData.dailyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyRate: parseInt(e.target.value, 10) || 10000 })
                    }
                    className="field-input w-full font-mono text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="field-label mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  Lokasi Rak di Gudang
                </label>
                <input
                  type="text"
                  placeholder="cth: Rak A-04 (Dry Cabinet)"
                  value={formData.locationRack}
                  onChange={(e) => setFormData({ ...formData, locationRack: e.target.value })}
                  className="field-input w-full font-mono text-[12px]"
                />
              </div>

              {/* Serial numbers preview */}
              {formData.code && formData.totalStock > 0 && (
                <div
                  className="rounded-lg p-3 border"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <p className="field-label mb-2">
                    <Layers className="w-3 h-3 text-indigo-400 inline mr-1" />
                    Serial Numbers (Auto-generate)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: Math.min(formData.totalStock, 6) }, (_, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: 'rgba(79,70,229,0.15)',
                          color: '#818cf8',
                          border: '1px solid rgba(79,70,229,0.25)',
                        }}
                      >
                        SN-{formData.code}-{String(i + 1).padStart(2, '0')}
                      </span>
                    ))}
                    {formData.totalStock > 6 && (
                      <span className="text-[10px]" style={{ color: '#6b7280' }}>
                        +{formData.totalStock - 6} lagi
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-5 py-3.5 flex justify-end gap-2 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-ghost text-[12px]"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary inline-flex items-center gap-1.5 text-[12px]">
                <Check className="w-3.5 h-3.5" />
                Simpan ke Database Master
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: UBAH KONDISI ALAT (WEWENANG STAF GUDANG)                  */}
      {/* ================================================================ */}
      {editingConditionEq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-enter"
          style={{ background: 'rgba(10,11,14,0.72)', backdropFilter: 'blur(4px)' }}
        >
          <div className="panel-elevated animate-dialog-enter max-w-sm w-full rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[rgba(17,19,24,0.08)]">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-amber-50 rounded-lg">
                  <Wrench className="w-4 h-4 text-amber-600" />
                </span>
                <div>
                  <h3 className="text-[13px] font-bold text-[#111318]">Update Kondisi Fisik</h3>
                  <p className="text-[11px] text-[#6b7280] truncate max-w-[180px]">
                    {editingConditionEq.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingConditionEq(null)}
                className="text-[#9ca3af] hover:text-[#111318] transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="field-label mb-2">Status Kondisi Fisik</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Sangat Baik', 'Baik', 'Perlu Servis'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditingConditionEq({ ...editingConditionEq, condition: st })}
                      className={`py-2 text-center rounded-lg text-[11px] font-semibold border transition-all ${
                        editingConditionEq.condition === st
                          ? st === 'Sangat Baik'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : st === 'Baik'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-[#be123c] text-white border-[#be123c]'
                          : 'bg-[#f7f6f4] text-[#6b7280] border-[rgba(17,19,24,0.1)] hover:border-[rgba(17,19,24,0.2)]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  Lokasi Rak Gudang
                </label>
                <input
                  type="text"
                  value={editingConditionEq.locationRack}
                  onChange={(e) =>
                    setEditingConditionEq({ ...editingConditionEq, locationRack: e.target.value })
                  }
                  placeholder="cth: Rak A-01 (Kamera)"
                  className="field-input w-full font-mono text-[12px]"
                />
              </div>

              <div
                className="p-2.5 rounded-lg text-[11px] leading-relaxed"
                style={{ background: '#f7f6f4', color: '#6b7280', border: '1px solid rgba(17,19,24,0.07)' }}
              >
                Pembaruan kondisi akan tersinkronisasi langsung ke status inventaris dan jadwal sewa.
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 flex justify-end gap-2 border-t border-[rgba(17,19,24,0.07)] bg-[#faf9f7]">
              <button
                type="button"
                onClick={() => setEditingConditionEq(null)}
                className="btn-ghost text-[12px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateEquipmentCondition) {
                    onUpdateEquipmentCondition(
                      editingConditionEq.id,
                      editingConditionEq.condition,
                      editingConditionEq.locationRack
                    );
                  }
                  setEditingConditionEq(null);
                  showNotification(
                    `Status kondisi alat "${editingConditionEq.name}" berhasil diubah menjadi "${editingConditionEq.condition}".`
                  );
                }}
                className="btn-primary text-[12px]"
              >
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: KONFIRMASI HAPUS ALAT                                      */}
      {/* ================================================================ */}
      {equipmentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-enter"
          style={{ background: 'rgba(10,11,14,0.72)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="animate-dialog-enter max-w-md w-full rounded-xl overflow-hidden border border-white/[0.06]"
            style={{ background: '#1a1d24' }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center gap-3 border-b"
              style={{ borderColor: 'rgba(190,18,60,0.25)', background: 'rgba(190,18,60,0.08)' }}
            >
              <div className="p-2 rounded-lg" style={{ background: 'rgba(190,18,60,0.15)' }}>
                <Trash2 className="w-4 h-4 text-[#be123c]" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-white">Konfirmasi Hapus Alat Rental</h3>
                <p className="text-[11px] mt-0.5" style={{ color: '#f87171' }}>
                  Penghapusan berlaku permanen di seluruh role
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3.5">
              <p className="text-[12px] leading-relaxed" style={{ color: '#9ca3af' }}>
                Apakah Anda yakin ingin menghapus alat berikut dari database master inventaris?
              </p>

              <div
                className="p-3.5 rounded-lg space-y-1.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="text-[13px] font-semibold text-white">{equipmentToDelete.name}</div>
                <div className="font-mono text-[11px]" style={{ color: '#6b7280' }}>
                  {equipmentToDelete.code} · {equipmentToDelete.category}
                </div>
                <div className="flex items-center gap-3 pt-1 text-[11px]" style={{ color: '#9ca3af' }}>
                  <span>
                    Tarif:{' '}
                    <strong className="text-white font-mono">
                      {formatRupiah(equipmentToDelete.dailyRate)}
                    </strong>
                    /hari
                  </span>
                  <span>·</span>
                  <span>
                    Stok:{' '}
                    <strong className="text-white font-mono">{equipmentToDelete.totalStock} unit</strong>
                  </span>
                </div>
              </div>

              <div
                className="p-3 rounded-lg text-[11px] leading-relaxed flex items-start gap-2"
                style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.2)', color: '#fbbf24' }}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Alat yang dihapus akan hilang dari katalog di semua role (<strong>Admin</strong>,{' '}
                  <strong>Owner</strong>, <strong>Staf Gudang</strong>) dan tidak dapat dipilih di booking baru.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-5 py-3.5 flex items-center justify-end gap-2 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <button
                type="button"
                onClick={() => setEquipmentToDelete(null)}
                className="btn-ghost text-[12px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteEquipment) {
                    onDeleteEquipment(equipmentToDelete.id);
                  }
                  const deletedName = equipmentToDelete.name;
                  setEquipmentToDelete(null);
                  showNotification(
                    `Alat "${deletedName}" berhasil dihapus dari master inventaris seluruh role.`
                  );
                }}
                className="btn-destructive inline-flex items-center gap-1.5 text-[12px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Alat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
