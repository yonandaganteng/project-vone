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
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  equipmentList,
  bookings,
  userRole = 'admin',
  onAddNewEquipment,
  onUpdateEquipmentStock,
  onUpdateEquipmentCondition,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConditionEq, setEditingConditionEq] = useState<{
    id: string;
    name: string;
    condition: Equipment['condition'];
    locationRack: string;
  } | null>(null);

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
      !eq.brand.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEq: Equipment = {
      id: `eq-${Date.now()}`,
      code: formData.code || `EQ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name,
      category: formData.category,
      totalStock: formData.totalStock,
      dailyRate: formData.dailyRate,
      brand: formData.brand || 'RentPro Brand',
      locationRack: formData.locationRack,
      condition: formData.condition,
      serialNumbers: Array.from(
        { length: formData.totalStock },
        (_, i) => `SN-${formData.code}-${String(i + 1).padStart(2, '0')}`
      ),
    };

    onAddNewEquipment(newEq);
    setShowAddModal(false);
    setFormData({
      name: '',
      code: '',
      category: 'Audio & Sound',
      totalStock: 4,
      dailyRate: 350000,
      brand: '',
      locationRack: 'Rak B-02',
      condition: 'Sangat Baik',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Boxes className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Master Katalog Alat & Kontrol Stok Fisik
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data referensi master yang digunakan oleh sistem pencegahan double-booking dan invoice snapshot.
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
            placeholder="Cari kode atau nama alat..."
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
                <th className="py-3 px-4">Kode & Nama Alat</th>
                <th className="py-3 px-4">Kategori & Brand</th>
                <th className="py-3 px-4">Lokasi Rak</th>
                <th className="py-3 px-4 text-center">Total Stok Fisik</th>
                <th className="py-3 px-4 text-right">Tarif Sewa / Hari</th>
                <th className="py-3 px-4 text-center">Kondisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEquipment.map((eq) => {
                return (
                  <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{eq.name}</div>
                      <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                        {eq.code}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{eq.category}</div>
                      <div className="text-[11px] text-slate-500">{eq.brand}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {eq.locationRack}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {eq.totalStock} Unit
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {eq.serialNumbers?.length || eq.totalStock} S/N Terdaftar
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatRupiah(eq.dailyRate)}
                    </td>

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
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Role Gudang: Ubah status kondisi fisik alat"
                        >
                          <Pencil className="w-3 h-3" />
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

      {/* MODAL: TAMBAH ALAT BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                Tambah Master Alat Rental Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
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

      {/* MODAL: UBAH KONDISI ALAT (WEWENANG STAF GUDANG) */}
      {editingConditionEq && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
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
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm"
              >
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
