import React, { useState } from 'react';
import {
  Printer,
  History,
  FileCode,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  ChevronDown,
  Layers,
  Sparkles,
  Save,
  Trash2,
  Settings,
  Pencil,
  Building,
  Palette,
} from 'lucide-react';
import {
  InvoiceRevision,
  InvoiceSnapshot,
  Equipment,
  InvoiceCompanyProfile,
  UserRole,
} from '../types/rental';
import { formatRupiah } from '../utils/formatters';
import { generateInvoicePdf } from '../utils/generateInvoicePdf';

interface InvoiceDetailViewProps {
  revisions: InvoiceRevision[];
  equipmentList: Equipment[];
  companyProfile?: InvoiceCompanyProfile;
  userRole?: UserRole;
  onAddNewRevision: (newRevision: InvoiceRevision) => void;
  onUpdateCompanyProfile?: (newProfile: InvoiceCompanyProfile) => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  revisions,
  equipmentList,
  companyProfile,
  userRole = 'admin',
  onAddNewRevision,
  onUpdateCompanyProfile,
}) => {
  // Current active revision ID (defaults to the latest one, e.g. v1.2)
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>(
    revisions[0]?.id || ''
  );

  const defaultProfile: InvoiceCompanyProfile = {
    companyName: 'RENTPRO AUDIO VISUAL',
    legalName: 'PT RentPro Teknologi Kreatif Nusantara',
    address: 'Kawasan Industri Audio Visual No. 88, TB Simatupang, Jakarta Selatan',
    phone: '(021) 7890-1234',
    whatsapp: '0812-9900-8800',
    email: 'invoice@rentpro.id',
    bankName: 'Bank Mandiri (Cabang Senayan Jakarta)',
    bankAccount: '122-00-9876543-2',
    bankAccountHolder: 'PT RentPro Teknologi Kreatif',
    logoText: 'RP',
    logoBgColor: '#0F172A',
    logoTagline: 'Professional Audio Visual & Event Gear Rental',
  };

  const activeCompany = companyProfile || defaultProfile;
  const [showOwnerProfileModal, setShowOwnerProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState<InvoiceCompanyProfile>(activeCompany);

  // Modals state
  const [showRawJsonModal, setShowRawJsonModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showNewRevisionModal, setShowNewRevisionModal] = useState(false);

  // Form state for creating a new revision v1.3
  const [newRevisionSummary, setNewRevisionSummary] = useState('');
  const [newSelectedEquipmentId, setNewSelectedEquipmentId] = useState(equipmentList[0]?.id || '');
  const [newEquipmentQty, setNewEquipmentQty] = useState(1);

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Active snapshot currently loaded
  const currentRevision =
    revisions.find((r) => r.id === selectedRevisionId) || revisions[0];
  const activeSnapshot = currentRevision.snapshot;

  // Determine if viewing an older version
  const latestRevision = revisions[0];
  const isOlderVersion = currentRevision.version !== latestRevision.version;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      generateInvoicePdf(activeSnapshot, activeCompany);
      setPdfSuccessMessage(`Invoice ${activeSnapshot.invoiceNumber} (${activeSnapshot.version}) berhasil diunduh sebagai PDF!`);
      setTimeout(() => {
        setPdfSuccessMessage(null);
      }, 4000);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCreateRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEq = equipmentList.find((eq) => eq.id === newSelectedEquipmentId);
    if (!targetEq) return;

    // Next version numbering
    const nextVerNumber = (revisions.length * 0.1 + 1.0).toFixed(1);
    const newVer = `v${nextVerNumber}`;

    // Deep clone active snapshot
    const clonedSnapshot: InvoiceSnapshot = JSON.parse(JSON.stringify(activeSnapshot));
    clonedSnapshot.version = newVer;
    clonedSnapshot.versionLabel = `${newVer} (${newRevisionSummary || 'Revisi Khusus Klien'})`;
    clonedSnapshot.createdAt = 'Hari Ini (Baru)';
    clonedSnapshot.createdBy = 'Admin (Sesi Saat Ini)';
    clonedSnapshot.reason = newRevisionSummary || 'Perubahan kebutuhan item rental';

    // Add or increment item
    const existingIndex = clonedSnapshot.items.findIndex(
      (it) => it.equipmentId === targetEq.id
    );

    if (existingIndex >= 0) {
      clonedSnapshot.items[existingIndex].qty += newEquipmentQty;
      clonedSnapshot.items[existingIndex].subtotal =
        clonedSnapshot.items[existingIndex].qty *
        clonedSnapshot.items[existingIndex].dailyRate *
        clonedSnapshot.items[existingIndex].days;
    } else {
      clonedSnapshot.items.push({
        equipmentId: targetEq.id,
        name: targetEq.name,
        category: targetEq.category,
        qty: newEquipmentQty,
        dailyRate: targetEq.dailyRate,
        days: clonedSnapshot.event.durationDays,
        subtotal: targetEq.dailyRate * newEquipmentQty * clonedSnapshot.event.durationDays,
      });
    }

    // Recalculate financials
    const newSubtotal = clonedSnapshot.items.reduce((sum, it) => sum + it.subtotal, 0);
    const discountAmt = Math.round((newSubtotal * clonedSnapshot.financials.discountPercent) / 100);
    const taxAmt = Math.round(((newSubtotal - discountAmt + clonedSnapshot.financials.crewFee + clonedSnapshot.financials.deliveryFee) * 11) / 100);
    const grandTotal = newSubtotal - discountAmt + clonedSnapshot.financials.crewFee + clonedSnapshot.financials.deliveryFee + taxAmt;

    clonedSnapshot.financials.subtotal = newSubtotal;
    clonedSnapshot.financials.discountAmount = discountAmt;
    clonedSnapshot.financials.taxAmount = taxAmt;
    clonedSnapshot.financials.grandTotal = grandTotal;
    clonedSnapshot.financials.remainingAmount = grandTotal - clonedSnapshot.financials.paidAmount;

    const newRevObj: InvoiceRevision = {
      id: `rev-${Date.now()}`,
      version: newVer,
      label: `${newVer} (Revisi Baru)`,
      createdAt: new Date().toLocaleString('id-ID'),
      createdBy: 'Admin Operasional',
      summary: newRevisionSummary || `Penambahan ${targetEq.name} (${newEquipmentQty} unit)`,
      snapshot: clonedSnapshot,
    };

    onAddNewRevision(newRevObj);
    setSelectedRevisionId(newRevObj.id);
    setShowNewRevisionModal(false);
    setNewRevisionSummary('');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Invoice #{activeSnapshot.invoiceNumber}
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
              {activeSnapshot.version}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Event: {activeSnapshot.event.name} ({activeSnapshot.client.name})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDiffModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Bandingkan Versi (Diff)</span>
          </button>

          <button
            onClick={() => setShowRawJsonModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 font-mono"
            title="Lihat Snapshot JSON Mentah"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Payload JSON</span>
          </button>

          <button
            onClick={() => setShowNewRevisionModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>+ Revisi Baru</span>
          </button>

          {userRole === 'owner' && (
            <button
              onClick={() => {
                setProfileFormData(activeCompany);
                setShowOwnerProfileModal(true);
              }}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              title="Khusus Role Owner: Sesuaikan Nama Perusahaan, Alamat, dan Logo Invoice"
            >
              <Building className="w-4 h-4 text-amber-600" />
              <span>Kop & Logo (Owner)</span>
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            title="Unduh PDF Resmi Langsung Dari Snapshot JSON Aktif"
          >
            <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 no-print"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Invoice</span>
          </button>
        </div>
      </div>

      {/* PDF Success Toast Feedback */}
      {pdfSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Split Layout: Kiri (Kertas Invoice) + Kanan (Panel Riwayat Revisi JSON) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* AREA KIRI: KERTAS INVOICE (75% atau 8 col) */}
        <div className="lg:col-span-8 space-y-3">
          {/* BANNER PERINGATAN JIKA MELIHAT VERSI LAMA (UX PENTING BLUEPRINT POINT 4) */}
          {isOlderVersion && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-amber-950 block">
                  ⚠️ Anda sedang melihat arsip versi lama ({currentRevision.version})
                </span>
                Tampilan di bawah adalah data snapshot JSON historis saat versi ini dibuat ({currentRevision.createdAt}).
                Data ini terkunci permanen untuk mencegah sengketa revisi penawaran sewa alat.
                <button
                  onClick={() => setSelectedRevisionId(latestRevision.id)}
                  className="font-bold underline text-amber-900 ml-1 hover:text-black"
                >
                  Kembali ke versi terbaru ({latestRevision.version}) &rarr;
                </button>
              </div>
            </div>
          )}

          {/* DOKUMEN KERTAS INVOICE A4 REALISTIS */}
          <div
            id="printable-invoice"
            className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-10 text-slate-800 space-y-6 relative"
          >
            {/* Watermark Draft / Versi Lama */}
            {isOlderVersion && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-25deg] select-none">
                <span className="text-8xl font-black text-slate-900 uppercase">
                  ARSIP {currentRevision.version}
                </span>
              </div>
            )}

            {/* KOP SURAT RENTAL (Dapat diubah oleh Owner) */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: activeCompany.logoBgColor || '#0F172A' }}
                  >
                    {activeCompany.logoText || 'RP'}
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    {activeCompany.companyName}
                  </h1>
                  {userRole === 'owner' && (
                    <button
                      onClick={() => {
                        setProfileFormData(activeCompany);
                        setShowOwnerProfileModal(true);
                      }}
                      className="ml-2 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors no-print"
                      title="Role Owner: Ubah Nama, Alamat, dan Logo Invoice"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Ubah Kop (Owner)</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {activeCompany.legalName}
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                  {activeCompany.address}<br />
                  Telp: {activeCompany.phone} | WA: {activeCompany.whatsapp} | {activeCompany.email}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-2xl font-black tracking-tight text-slate-900 block uppercase">
                  INVOICE
                </span>
                <div className="text-xs font-mono font-bold text-slate-800">
                  {activeSnapshot.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500">
                  Tgl Terbit: <span className="font-semibold text-slate-800">{activeSnapshot.createdAt}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Status: <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{activeSnapshot.financials.paymentStatus}</span>
                </div>
              </div>
            </div>

            {/* DETAIL KLIEN & EVENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs py-2">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Ditujukan Kepada (Penyewa):
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {activeSnapshot.client.name}
                </div>
                {activeSnapshot.client.company && (
                  <div className="text-slate-600 font-medium">
                    {activeSnapshot.client.company}
                  </div>
                )}
                <div className="text-slate-500">
                  Telp: {activeSnapshot.client.phone} | Email: {activeSnapshot.client.email}
                </div>
                <div className="text-slate-500 text-[11px] leading-relaxed">
                  {activeSnapshot.client.address}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Rincian Penyelenggaraan Event:
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {activeSnapshot.event.name}
                </div>
                <div className="text-slate-600">
                  Lokasi: <span className="font-medium text-slate-800">{activeSnapshot.event.location}</span>
                </div>
                <div className="text-slate-600 font-mono">
                  Periode: {activeSnapshot.event.startDate} - {activeSnapshot.event.endDate} ({activeSnapshot.event.durationDays} Hari Sewa)
                </div>
                <div className="text-xs text-slate-500">
                  Penanggung Jawab: {activeSnapshot.createdBy}
                </div>
              </div>
            </div>

            {/* TABEL ITEM ALAT YANG DISEWA */}
            <div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Deskripsi Alat & Spesifikasi</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-center">Hari</th>
                    <th className="py-2.5 px-3 text-right">Tarif / Hari</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeSnapshot.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500">Kategori: {item.category}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                        {item.qty} Unit
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {item.days}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatRupiah(item.dailyRate)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* KALKULASI FINANSIAL & TOTAL */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Ketentuan Pembayaran & Rekening:
                </span>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] space-y-1">
                  <div className="font-bold text-slate-800">{activeCompany.bankName}</div>
                  <div>No. Rek: <strong className="font-mono text-slate-900">{activeCompany.bankAccount}</strong></div>
                  <div>Atas Nama: <strong className="text-slate-900">{activeCompany.bankAccountHolder}</strong></div>
                </div>

                <div className="text-[10px] text-slate-500 space-y-1">
                  <div className="font-bold text-slate-700">Syarat Sewa:</div>
                  {activeSnapshot.terms.map((term, i) => (
                    <p key={i}>• {term}</p>
                  ))}
                </div>
              </div>

              {/* Rincian Angka */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                  <span>Subtotal Sewa Alat:</span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(activeSnapshot.financials.subtotal)}
                  </span>
                </div>

                {activeSnapshot.financials.discountAmount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-700 border-b border-slate-100">
                    <span>Diskon Khusus ({activeSnapshot.financials.discountPercent}%):</span>
                    <span>- {formatRupiah(activeSnapshot.financials.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                  <span>Biaya Kru & Teknisi Sound:</span>
                  <span>{formatRupiah(activeSnapshot.financials.crewFee)}</span>
                </div>

                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                  <span>Ongkos Kirim & Loading/Unloading:</span>
                  <span>{formatRupiah(activeSnapshot.financials.deliveryFee)}</span>
                </div>

                {activeSnapshot.financials.taxAmount > 0 && (
                  <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                    <span>PPN 11%:</span>
                    <span>{formatRupiah(activeSnapshot.financials.taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 text-sm font-bold text-slate-900 bg-slate-100 px-3 rounded">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="text-indigo-700">
                    {formatRupiah(activeSnapshot.financials.grandTotal)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-slate-600">
                  <span>Sudah Dibayar (DP):</span>
                  <span className="text-emerald-700 font-semibold">
                    {formatRupiah(activeSnapshot.financials.paidAmount)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-slate-900 font-bold border-t border-slate-200">
                  <span>Sisa Pembayaran:</span>
                  <span className="text-rose-600">
                    {formatRupiah(activeSnapshot.financials.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* TANDA TANGAN */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
              <div>
                <p className="text-slate-500">Penyewa / PIC Klien</p>
                <div className="h-14" />
                <p className="font-bold text-slate-800">({activeSnapshot.client.name})</p>
              </div>
              <div>
                <p className="text-slate-500">Hormat Kami, RentPro Audio Visual</p>
                <div className="h-14" />
                <p className="font-bold text-slate-800">(Budi Santoso - Project Head)</p>
              </div>
            </div>
          </div>
        </div>

        {/* AREA KANAN: PANEL RIWAYAT REVISI & AUDIT TRAIL JSON (Blueprint Point 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Riwayat Revisi (Snapshot)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {revisions.length} Versi
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tiap revisi menyimpan <strong>JSON Snapshot</strong> independen. Klik salah satu versi di bawah untuk merekonstruksi tampilan invoice di samping secara instan.
            </p>

            {/* Dropdown / Version List (UX PENTING Blueprint) */}
            <div className="space-y-2">
              {revisions.map((rev) => {
                const isSelected = rev.id === selectedRevisionId;
                const isFinal = rev.version === revisions[0].version;

                return (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevisionId(rev.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isFinal ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {rev.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rev.createdAt}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {rev.summary}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/80 font-mono">
                      <span>Total: {formatRupiah(rev.snapshot.financials.grandTotal)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateInvoicePdf(rev.snapshot, activeCompany);
                          }}
                          className="p-1 hover:bg-slate-200/80 rounded text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-0.5"
                          title={`Unduh PDF langsung untuk versi ${rev.version}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="text-[10px]">PDF</span>
                        </button>
                        <span className="text-indigo-600 font-medium">
                          {isSelected ? '✓ Aktif' : 'Pilih &rarr;'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation box on why JSON Snapshots are used for Skripsi */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                Mengapa Fitur Snapshot JSON Ini Krusial?
              </span>
              <p className="text-[11px] leading-relaxed">
                Jika harga sewa master alat diubah bulan depan, invoice masa lalu <strong>tidak akan rusak</strong> atau berubah totalnya karena mengunci salinan objek data JSON utuh pada saat revisi disetujui.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: RAW JSON VIEWER (Skripsi / Tech Inspection) */}
      {showRawJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-slate-950 text-slate-200 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-indigo-400">
                <FileCode className="w-4 h-4" />
                <span>INVOICE_SNAPSHOT_SCHEMA ({activeSnapshot.version})</span>
              </div>
              <button
                onClick={() => setShowRawJsonModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Tutup
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <pre className="text-xs font-mono text-emerald-400 bg-slate-900 p-4 rounded-lg overflow-x-auto leading-relaxed">
                {JSON.stringify(activeSnapshot, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BANDINGKAN DIFF VERSI (v1.0 vs v1.2) */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Perbandingan Revisi: v1.0 (Draft) vs v1.2 (Final)
                </h3>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-2 font-mono">
                    v1.0 (Draft Awal)
                  </span>
                  <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                    <div>• 2 Unit Shure Mic Wireless</div>
                    <div>• 2 Unit Speaker RCF ART 715</div>
                    <div>• 6 Modul Videotron LED P3.9</div>
                    <div className="pt-2 font-bold text-slate-900 border-t border-slate-200">
                      Total: Rp 12.000.000
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
                  <span className="font-bold text-indigo-900 block mb-2 font-mono">
                    v1.2 (Final Terkini)
                  </span>
                  <div className="space-y-1 text-indigo-950 font-mono text-[11px]">
                    <div className="text-emerald-700 font-semibold">+ 4 Unit Shure Mic (+2 Unit)</div>
                    <div className="text-emerald-700 font-semibold">+ 4 Unit Speaker RCF (+2 Unit)</div>
                    <div className="text-emerald-700 font-semibold">+ 12 Modul Videotron (+6 Modul)</div>
                    <div className="text-emerald-700 font-semibold">+ Teknisi Sound Crew (Rp 1.500.000)</div>
                    <div className="pt-2 font-bold text-indigo-900 border-t border-indigo-200">
                      Total: Rp 23.798.400 (Net setelah Diskon 10% & PPN)
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded text-slate-700 text-xs">
                <strong>Analisis Perubahan:</strong> Klien menaikkan skala acara dari seminar kelas kecil menjadi konferensi ballroom utama dengan penambahan layar videotron dan sistem audio 4 titik monitor.
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold"
              >
                Tutup Perbandingan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT REVISI BARU (v1.3) */}
      {showNewRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRevisionSubmit}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-indigo-50">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-indigo-950">
                  Buat Revisi Invoice Baru (Snapshot Baru)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewRevisionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan Ringkasan Alasan Revisi:
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Klien meminta tambahan 2 unit lighting moving head dan stand..."
                  value={newRevisionSummary}
                  onChange={(e) => setNewRevisionSummary(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Alat Tambahan:
                </label>
                <select
                  value={newSelectedEquipmentId}
                  onChange={(e) => setNewSelectedEquipmentId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} - {formatRupiah(eq.dailyRate)}/hari (Stok: {eq.totalStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Jumlah Tambahan Unit:
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newEquipmentQty}
                  onChange={(e) => setNewEquipmentQty(parseInt(e.target.value, 10) || 1)}
                  className="w-24 p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewRevisionModal(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm"
              >
                Simpan & Kunci Snapshot Baru
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PENGATURAN IDENTITAS INVOICE (ROLE: OWNER) */}
      {showOwnerProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateCompanyProfile) {
                onUpdateCompanyProfile(profileFormData);
              }
              setShowOwnerProfileModal(false);
              setPdfSuccessMessage('Identitas invoice, lokasi, dan logo berhasil diperbarui oleh Owner!');
              setTimeout(() => setPdfSuccessMessage(null), 4000);
            }}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-amber-500 text-slate-950 flex items-center justify-between border-b border-amber-600">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-slate-950" />
                <div>
                  <h3 className="font-bold text-sm text-slate-950">
                    Pengaturan Kop & Identitas Invoice (Role: Owner)
                  </h3>
                  <p className="text-[11px] text-slate-900 font-medium">
                    Ubah nama bisnis, alamat, kontak, logo inisial & warna
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOwnerProfileModal(false)}
                className="text-slate-900 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Live Preview Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Live Preview Kop Surat:
                </span>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0"
                    style={{ backgroundColor: profileFormData.logoBgColor || '#0F172A' }}
                  >
                    {profileFormData.logoText || 'RP'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {profileFormData.companyName || 'NAMA PERUSAHAAN'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {profileFormData.address || 'Alamat / Lokasi Operasional'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Settings */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Teks Inisial / Logo (1-3 Huruf):
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={profileFormData.logoText}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        logoText: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold tracking-wider uppercase text-center"
                    placeholder="RP"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Pilihan Warna Latar Logo:
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { name: 'Slate', color: '#0F172A' },
                      { name: 'Indigo', color: '#4F46E5' },
                      { name: 'Emerald', color: '#059669' },
                      { name: 'Crimson', color: '#DC2626' },
                      { name: 'Amber', color: '#D97706' },
                      { name: 'Violet', color: '#7C3AED' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() =>
                          setProfileFormData({
                            ...profileFormData,
                            logoBgColor: c.color,
                          })
                        }
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          profileFormData.logoBgColor === c.color
                            ? 'scale-110 border-slate-900 ring-2 ring-indigo-400'
                            : 'border-white'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Company Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Brand Rental:
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.companyName}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="cth: RENTPRO AUDIO VISUAL"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Badan Hukum (PT/CV):
                  </label>
                  <input
                    type="text"
                    value={profileFormData.legalName}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        legalName: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="cth: PT RentPro Teknologi Kreatif"
                  />
                </div>
              </div>

              {/* Address / Location */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Lokasi / Alamat Kantor & Gudang:
                </label>
                <textarea
                  rows={2}
                  required
                  value={profileFormData.address}
                  onChange={(e) =>
                    setProfileFormData({
                      ...profileFormData,
                      address: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                  placeholder="Alamat lengkap usaha..."
                />
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Telepon Kantor:
                  </label>
                  <input
                    type="text"
                    value={profileFormData.phone}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp Resmi:
                  </label>
                  <input
                    type="text"
                    value={profileFormData.whatsapp}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        whatsapp: e.target.value,
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Email Invoice:
                  </label>
                  <input
                    type="email"
                    value={profileFormData.email}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Rekening Penerimaan Pembayaran:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-600 block text-[10px]">Nama Bank:</label>
                    <input
                      type="text"
                      value={profileFormData.bankName}
                      onChange={(e) =>
                        setProfileFormData({
                          ...profileFormData,
                          bankName: e.target.value,
                        })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[10px]">No. Rekening:</label>
                    <input
                      type="text"
                      value={profileFormData.bankAccount}
                      onChange={(e) =>
                        setProfileFormData({
                          ...profileFormData,
                          bankAccount: e.target.value,
                        })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[10px]">Atas Nama:</label>
                    <input
                      type="text"
                      value={profileFormData.bankAccountHolder}
                      onChange={(e) =>
                        setProfileFormData({
                          ...profileFormData,
                          bankAccountHolder: e.target.value,
                        })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowOwnerProfileModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Simpan & Terapkan ke Seluruh Invoice
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
