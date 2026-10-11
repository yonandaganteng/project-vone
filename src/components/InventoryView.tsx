import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  Tag,
  MapPin,
  Sparkles,
  Edit,
  Pencil,
  Wrench,
  DollarSign,
  FileText,
  X,
  Layers,
  Check,
  Info,
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Perubahan Berhasil Disimpan</p>
            <p className="text-emerald-200 text-[11px] mt-0.5">{successToast}</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-300 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Boxes className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Master Katalog Alat & Tarif Sewa
            </h2>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
              {equipmentList.length} Item Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Anda dapat mengubah <strong className="text-slate-800">Nama Alat</strong>,{' '}
            <strong className="text-slate-800">Tarif Sewa/Harga</strong>, dan{' '}
            <strong className="text-slate-800">Deskripsi/Spesifikasi</strong> seluruh peralatan rental. Perubahan langsung terupdate ke pemesanan baru dan invoice.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Alat Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode, nama, deskripsi atau brand alat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[280px]">Nama Alat & Deskripsi</th>
                <th className="py-3 px-4">Kategori & Brand</th>
                <th className="py-3 px-4">Lokasi Rak</th>
                <th className="py-3 px-4 text-center">Total Stok</th>
                <th className="py-3 px-4 text-right min-w-[150px]">Tarif Sewa / Hari</th>
                <th className="py-3 px-4 text-center">Kondisi</th>
                <th className="py-3 px-4 text-center min-w-[150px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEquipment.map((eq) => {
                return (
                  <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Nama & Deskripsi */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{eq.name}</span>
                            <button
                              onClick={() => handleOpenEditModal(eq)}
                              className="text-slate-400 hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                              title="Edit nama, harga & deskripsi alat ini"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                            {eq.code}
                          </div>
                        </div>
                      </div>

                      {/* Deskripsi Barang */}
                      {eq.description ? (
                        <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed bg-slate-50/80 p-1.5 rounded border border-slate-100/80">
                          {eq.description}
                        </p>
                      ) : (
                        <button
                          onClick={() => handleOpenEditModal(eq)}
                          className="text-[10px] text-indigo-500 hover:text-indigo-700 hover:underline mt-1.5 flex items-center gap-1"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>+ Tambah deskripsi & spesifikasi</span>
                        </button>
                      )}
                    </td>

                    {/* Kategori & Brand */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{eq.category}</div>
                      <div className="text-[11px] text-slate-500">{eq.brand}</div>
                    </td>

                    {/* Lokasi Rak */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {eq.locationRack}
                    </td>

                    {/* Total Stok Fisik */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {eq.totalStock} Unit
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {eq.serialNumbers?.length || eq.totalStock} S/N Terdaftar
                      </span>
                    </td>

                    {/* Tarif Sewa / Hari (Harga) */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">
                          {formatRupiah(eq.dailyRate)}
                        </span>
                        <button
                          onClick={() => handleOpenEditModal(eq)}
                          className="text-slate-400 hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                          title="Ubah tarif harga sewa"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        per hari
                      </span>
                    </td>

                    {/* Kondisi Fisik */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            eq.condition === 'Sangat Baik'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : eq.condition === 'Baik'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {eq.condition}
                        </span>
                        <button
                          onClick={() =>
                            setEditingConditionEq({
                              id: eq.id,
                              name: eq.name,
                              condition: eq.condition,
                              locationRack: eq.locationRack,
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                            userRole === 'warehouse'
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'hover:bg-slate-200 text-slate-500 hover:text-indigo-600'
                          }`}
                          title="Ubah status kondisi fisik alat & rak (Role Staf Gudang)"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span className={userRole === 'warehouse' ? 'inline' : 'hidden sm:inline'}>
                            Kondisi
                          </span>
                        </button>
                      </div>
                    </td>

                    {/* Aksi / Edit & Hapus Alat */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(eq)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all shadow-xs"
                          title="Ubah nama, tarif sewa, dan deskripsi alat"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setEquipmentToDelete(eq)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all shadow-xs"
                          title="Hapus alat ini dari database master (terhapus di seluruh role)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
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

      {/* ======================================================== */}
      {/* MODAL: EDIT DETAIL LENGKAP ALAT (HARGA, NAMA, DESKRIPSI) */}
      {/* ======================================================== */}
      {editingEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEditEquipment}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-600 rounded-lg text-white">
                  <Pencil className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Edit Detail Master Alat Rental
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[11px] text-indigo-300">
                      {editingEquipment.code}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                      {editingEquipment.category}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEquipment(null)}
                className="text-slate-400 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* 1. NAMA ALAT */}
              <div>
                <label className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Nama Lengkap Alat Rental:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  placeholder="Contoh: Sony Alpha A7 III Body + Cage"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Nama ini akan dicetak pada penawaran, invoice snapshot, dan surat jalan manifest.
                </p>
              </div>

              {/* 2. TARIF SEWA / HARGA */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tarif Sewa / Hari (Harga Rental):</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="font-mono font-bold text-indigo-700 text-xs">
                    {formatRupiah(editFormData.dailyRate)} / hari
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    required
                    value={editFormData.dailyRate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        dailyRate: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 border border-indigo-200 bg-white rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                </div>

                {/* Quick rate adjustment chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500">Sesuaikan cepat:</span>
                  <button
                    type="button"
                    onClick={() => adjustEditPrice(-50000)}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-mono font-medium text-slate-700"
                  >
                    -50rb
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditPrice(50000)}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-mono font-medium text-indigo-600"
                  >
                    +50rb
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditPrice(100000)}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-mono font-medium text-indigo-600"
                  >
                    +100rb
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditPrice(250000)}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-mono font-medium text-indigo-600"
                  >
                    +250rb
                  </button>
                </div>
              </div>

              {/* 3. DESKRIPSI & SPESIFIKASI ALAT */}
              <div>
                <label className="font-bold text-slate-900 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Deskripsi & Spesifikasi Alat:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {editFormData.description.length} karakter
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  placeholder="Jelaskan spesifikasi teknis, kelengkapan aksesori bawaan (kabel, tas/flight case, baterai cadangan), atau catatan khusus pemakaian..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed shadow-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Deskripsi membantu tim operasional, admin penawaran, dan klien mengetahui detail teknis perlengkapan.
                </p>
              </div>

              {/* 4. KATEGORI & BRAND */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value as Equipment['category'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  >
                    <option value="Kamera & Lensa">Kamera & Lensa</option>
                    <option value="Audio & Sound">Audio & Sound</option>
                    <option value="Lighting & Effect">Lighting & Effect</option>
                    <option value="Visual & LED">Visual & LED</option>
                    <option value="Rigging & Truss">Rigging & Truss</option>
                    <option value="Power & Kabel">Power & Kabel</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand / Merek:</label>
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, brand: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* 5. TOTAL STOK FISIK & LOKASI RAK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Total Stok Fisik:
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editFormData.totalStock}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        totalStock: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Lokasi Rak di Gudang:
                  </label>
                  <input
                    type="text"
                    value={editFormData.locationRack}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, locationRack: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* 6. KONDISI FISIK */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kondisi Fisik:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Sangat Baik', 'Baik', 'Perlu Servis'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, condition: c })}
                      className={`py-1.5 px-2 text-center rounded-lg font-bold border text-xs transition-all ${
                        editFormData.condition === c
                          ? c === 'Sangat Baik'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : c === 'Baik'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setEquipmentToDelete(editingEquipment);
                  setEditingEquipment(null);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Hapus alat rental ini dari database master"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Alat Ini</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEquipment(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Alat</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH ALAT BARU */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  Tambah Master Alat Rental Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Kode Alat (SKU):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: CAM-A7M4"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand / Merek:</label>
                  <input
                    type="text"
                    placeholder="cth: Sony, Shure"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Alat:</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Sony Alpha 7 IV Kit Lensa 24-70mm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              {/* Deskripsi Barang */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Deskripsi & Spesifikasi Alat:
                </label>
                <textarea
                  rows={2}
                  placeholder="Spesifikasi teknis, kelengkapan aksesoris, atau catatan khusus..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as any })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="Kamera & Lensa">Kamera & Lensa</option>
                    <option value="Audio & Sound">Audio & Sound</option>
                    <option value="Lighting & Effect">Lighting & Effect</option>
                    <option value="Visual & LED">Visual & LED</option>
                    <option value="Rigging & Truss">Rigging & Truss</option>
                    <option value="Power & Kabel">Power & Kabel</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kondisi:</label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value as any })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Servis">Perlu Servis</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Total Stok Fisik:
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.totalStock}
                    onChange={(e) =>
                      setFormData({ ...formData, totalStock: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tarif Sewa / Hari (Rp):
                  </label>
                  <input
                    type="number"
                    min={10000}
                    step={10000}
                    required
                    value={formData.dailyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyRate: parseInt(e.target.value, 10) || 10000 })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Lokasi Rak di Gudang:
                </label>
                <input
                  type="text"
                  placeholder="cth: Rak A-04 (Dry Cabinet)"
                  value={formData.locationRack}
                  onChange={(e) => setFormData({ ...formData, locationRack: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm"
              >
                Simpan ke Database Master
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: UBAH KONDISI ALAT (WEWENANG STAF GUDANG) */}
      {/* ======================================================== */}
      {editingConditionEq && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Update Kondisi Fisik Alat
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {editingConditionEq.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingConditionEq(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Status Kondisi Fisik Saat Ini:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Sangat Baik', 'Baik', 'Perlu Servis'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        setEditingConditionEq({
                          ...editingConditionEq,
                          condition: st,
                        })
                      }
                      className={`py-2 px-2 text-center rounded-lg font-bold border transition-all ${
                        editingConditionEq.condition === st
                          ? st === 'Sangat Baik'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : st === 'Baik'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Lokasi Rak Gudang:
                </label>
                <input
                  type="text"
                  value={editingConditionEq.locationRack}
                  onChange={(e) =>
                    setEditingConditionEq({
                      ...editingConditionEq,
                      locationRack: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                  placeholder="cth: Rak A-01 (Kamera)"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500">
                Pembaruan kondisi ini akan langsung tersinkronisasi ke status inventaris gudang dan jadwal sewa.
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingConditionEq(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold"
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
                  showNotification(`Status kondisi alat "${editingConditionEq.name}" berhasil diubah menjadi "${editingConditionEq.condition}".`);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm"
              >
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI HAPUS ALAT (DELETE EQUIPMENT) */}
      {/* ======================================================== */}
      {equipmentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Konfirmasi Hapus Alat Rental
                </h3>
                <p className="text-[11px] text-rose-600 font-medium">
                  Penghapusan berlaku permanen di seluruh role
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus alat rental berikut dari database master inventaris?
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-sm text-slate-900">
                  {equipmentToDelete.name}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>Kode: {equipmentToDelete.code}</span>
                  <span>•</span>
                  <span>Kategori: {equipmentToDelete.category}</span>
                </div>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-700">
                  <span>
                    Tarif: <strong className="text-slate-900">{formatRupiah(equipmentToDelete.dailyRate)}</strong>/hari
                  </span>
                  <span>•</span>
                  <span>
                    Stok Fisik: <strong className="text-slate-900">{equipmentToDelete.totalStock} Unit</strong>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Alat yang dihapus akan otomatis hilang dari katalog master di seluruh role (<strong>Admin</strong>, <strong>Owner</strong>, dan <strong>Staf Gudang</strong>) serta tidak dapat dipilih lagi pada pembuatan jadwal booking baru.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEquipmentToDelete(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
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
                  showNotification(`Alat "${deletedName}" berhasil dihapus dari master inventaris seluruh role.`);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Alat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
