import React, { useState, useMemo, useRef } from 'react';
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
  Eye,
  Archive,
  RotateCcw,
  FileText,
  Search,
  Check,
  X,
  Calendar,
  DollarSign,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Filter,
} from 'lucide-react';
import {
  InvoiceRevision,
  InvoiceSnapshot,
  Equipment,
  InvoiceCompanyProfile,
  UserRole,
  InvoiceRecord,
  EventBooking,
  PaymentStatus,
} from '../types/rental';
import { formatRupiah } from '../utils/formatters';
import { generateInvoicePdf } from '../utils/generateInvoicePdf';
import { initialInvoiceRecords } from '../data/mockData';

interface InvoiceDetailViewProps {
  invoices?: InvoiceRecord[];
  activeInvoiceId?: string;
  onChangeActiveInvoiceId?: (id: string) => void;
  onUpdateInvoiceRecord?: (inv: InvoiceRecord) => void;
  onAddNewInvoiceRecord?: (inv: InvoiceRecord) => void;
  onToggleArchiveInvoice?: (id: string) => void;
  onDeleteInvoiceRecord?: (id: string) => void;
  revisions?: InvoiceRevision[];
  equipmentList: Equipment[];
  bookings?: EventBooking[];
  companyProfile?: InvoiceCompanyProfile;
  userRole?: UserRole;
  onAddNewRevision?: (newRevision: InvoiceRevision) => void;
  onUpdateCompanyProfile?: (newProfile: InvoiceCompanyProfile) => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoices: propInvoices,
  activeInvoiceId: propActiveInvoiceId,
  onChangeActiveInvoiceId,
  onUpdateInvoiceRecord,
  onAddNewInvoiceRecord,
  onToggleArchiveInvoice,
  onDeleteInvoiceRecord,
  revisions: propRevisions,
  equipmentList,
  bookings = [],
  companyProfile,
  userRole = 'admin',
  onAddNewRevision,
  onUpdateCompanyProfile,
}) => {
  // Local state fallback for invoices if not controlled from parent
  const [localInvoices, setLocalInvoices] = useState<InvoiceRecord[]>(
    propInvoices || initialInvoiceRecords
  );
  const invoiceList = propInvoices || localInvoices;

  // Active invoice selection
  const [internalActiveInvoiceId, setInternalActiveInvoiceId] = useState<string>(
    propActiveInvoiceId || invoiceList[0]?.id || 'INV-2026-10-0042'
  );
  const currentInvoiceId = propActiveInvoiceId || internalActiveInvoiceId;

  // Find active invoice object
  const activeInvoice = useMemo(() => {
    return (
      invoiceList.find((inv) => inv.id === currentInvoiceId) ||
      invoiceList[0] ||
      initialInvoiceRecords[0]
    );
  }, [invoiceList, currentInvoiceId]);

  // Main Sub-Tab: 'archive' (Arsip & Daftar Invoice) vs 'editor' (Edit Data Invoice)
  const [activeSubTab, setActiveSubTab] = useState<'archive' | 'editor'>('archive');

  // Preview Modal State ("previewnya ketika di klik saja")
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewInvoiceRecord, setPreviewInvoiceRecord] = useState<InvoiceRecord | null>(null);

  // Active revision inside active invoice
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>(
    activeInvoice.activeRevisionId || activeInvoice.revisions[0]?.id || ''
  );

  // Default vendor company profile
  const defaultProfile: InvoiceCompanyProfile = {
    companyName: 'VENDORONE AUDIO VISUAL',
    legalName: 'PT VendorOne Teknologi Kreatif Nusantara',
    address: 'Kawasan Industri Audio Visual No. 88, TB Simatupang, Jakarta Selatan',
    phone: '(021) 7890-1234',
    whatsapp: '0812-9900-8800',
    email: 'invoice@vendorone.id',
    bankName: 'Bank Mandiri (Cabang Senayan Jakarta)',
    bankAccount: '122-00-9876543-2',
    bankAccountHolder: 'PT VendorOne Teknologi Kreatif',
    logoText: 'V1',
    logoBgColor: '#0F172A',
    logoTagline: 'Professional Audio Visual & Event Gear Rental Platform',
  };

  const activeCompany = companyProfile || activeInvoice.companyProfile || defaultProfile;

  // Editable Form State for Vendor Info (Kop Surat)
  const [vendorForm, setVendorForm] = useState<InvoiceCompanyProfile>(activeCompany);

  // Active revision snapshot currently loaded
  const currentRevision = useMemo(() => {
    const found = activeInvoice.revisions.find((r) => r.id === selectedRevisionId);
    return found || activeInvoice.revisions[0];
  }, [activeInvoice, selectedRevisionId]);

  const activeSnapshot = currentRevision ? currentRevision.snapshot : activeInvoice.revisions[0].snapshot;

  // Editable Form State for Invoice Data (Client, Event, Items, Financials)
  const [editableSnapshot, setEditableSnapshot] = useState<InvoiceSnapshot>(
    JSON.parse(JSON.stringify(activeSnapshot))
  );

  // Synchronize editableSnapshot whenever selected revision or invoice changes
  React.useEffect(() => {
    if (activeSnapshot) {
      setEditableSnapshot(JSON.parse(JSON.stringify(activeSnapshot)));
      setSelectedRevisionId(activeInvoice.activeRevisionId || activeInvoice.revisions[0]?.id || '');
    }
  }, [activeInvoice.id, selectedRevisionId]);

  React.useEffect(() => {
    if (companyProfile) {
      setVendorForm(companyProfile);
    }
  }, [companyProfile]);

  // Archive Search & Filter State
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<
    'all' | 'active' | 'archived' | 'Lunas' | 'DP 50%' | 'Belum Bayar'
  >('all');

  // Modals state
  const [showRawJsonModal, setShowRawJsonModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showNewRevisionModal, setShowNewRevisionModal] = useState(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceRecord | null>(null);

  // Form state for creating a new revision v1.x
  const [newRevisionSummary, setNewRevisionSummary] = useState('');
  const [newSelectedEquipmentId, setNewSelectedEquipmentId] = useState(equipmentList[0]?.id || '');
  const [newEquipmentQty, setNewEquipmentQty] = useState(1);

  // New Invoice Modal state
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceNumber: `INV-2026-10-00${invoiceList.length + 42}`,
    clientName: '',
    clientCompany: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    eventName: '',
    eventLocation: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    selectedBookingId: '',
  });

  // Add Item to active invoice state
  const [addItemEquipmentId, setAddItemEquipmentId] = useState(equipmentList[0]?.id || '');
  const [addItemQty, setAddItemQty] = useState(1);
  const [addItemDays, setAddItemDays] = useState(editableSnapshot.event?.durationDays || 2);

  // PDF Generation State & Toast
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Logo file upload input ref
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Determine if viewing an older version
  const latestRevision = activeInvoice.revisions[0];
  const isOlderVersion = currentRevision && latestRevision && currentRevision.version !== latestRevision.version;

  // Filtered Archive List
  const filteredInvoices = useMemo(() => {
    return invoiceList.filter((inv) => {
      // Search filter
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
        (inv.clientCompany && inv.clientCompany.toLowerCase().includes(archiveSearchQuery.toLowerCase())) ||
        inv.eventName.toLowerCase().includes(archiveSearchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (archiveStatusFilter === 'all') return true;
      if (archiveStatusFilter === 'active') return !inv.isArchived;
      if (archiveStatusFilter === 'archived') return inv.isArchived;
      if (archiveStatusFilter === 'Lunas') return inv.paymentStatus === 'Lunas';
      if (archiveStatusFilter === 'DP 50%') return inv.paymentStatus === 'DP 50%';
      if (archiveStatusFilter === 'Belum Bayar') return inv.paymentStatus === 'Belum Bayar';

      return true;
    });
  }, [invoiceList, archiveSearchQuery, archiveStatusFilter]);

  // Statistics for Archive
  const archiveStats = useMemo(() => {
    const totalCount = invoiceList.length;
    const archivedCount = invoiceList.filter((i) => i.isArchived).length;
    const totalAmount = invoiceList.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalPaid = invoiceList.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    const totalUnpaid = totalAmount - totalPaid;
    return { totalCount, archivedCount, totalAmount, totalPaid, totalUnpaid };
  }, [invoiceList]);

  // Open Preview for specific invoice
  const handleOpenPreview = (inv: InvoiceRecord) => {
    setPreviewInvoiceRecord(inv);
    setIsPreviewModalOpen(true);
  };

  // Open Editor for specific invoice
  const handleOpenEditor = (inv: InvoiceRecord) => {
    if (onChangeActiveInvoiceId) {
      onChangeActiveInvoiceId(inv.id);
    } else {
      setInternalActiveInvoiceId(inv.id);
    }
    setActiveSubTab('editor');
    // Load snapshot
    const rev = inv.revisions.find((r) => r.id === inv.activeRevisionId) || inv.revisions[0];
    if (rev) {
      setSelectedRevisionId(rev.id);
      setEditableSnapshot(JSON.parse(JSON.stringify(rev.snapshot)));
    }
  };

  // Toggle Archive
  const handleToggleArchive = (invId: string) => {
    if (onToggleArchiveInvoice) {
      onToggleArchiveInvoice(invId);
    } else {
      setLocalInvoices((prev) =>
        prev.map((i) => (i.id === invId ? { ...i, isArchived: !i.isArchived } : i))
      );
    }
    const target = invoiceList.find((i) => i.id === invId);
    const willArchive = target ? !target.isArchived : false;
    showToast(
      willArchive
        ? `Invoice #${target?.invoiceNumber} berhasil dipindahkan ke arsip!`
        : `Invoice #${target?.invoiceNumber} berhasil dipulihkan dari arsip!`
    );
  };

  // Delete Invoice from Archive (In-App Modal confirmation, avoids window.confirm)
  const handlePromptDeleteInvoice = (invId: string) => {
    const target = invoiceList.find((i) => i.id === invId);
    if (!target) return;
    setInvoiceToDelete(target);
  };

  const handleConfirmDeleteInvoice = () => {
    if (!invoiceToDelete) return;
    const invId = invoiceToDelete.id;
    const num = invoiceToDelete.invoiceNumber;
    if (onDeleteInvoiceRecord) {
      onDeleteInvoiceRecord(invId);
    } else {
      setLocalInvoices((prev) => prev.filter((i) => i.id !== invId));
    }
    // If deleted active invoice, reset active to next available
    if (currentInvoiceId === invId) {
      const remaining = invoiceList.filter((i) => i.id !== invId);
      if (remaining.length > 0) {
        if (onChangeActiveInvoiceId) onChangeActiveInvoiceId(remaining[0].id);
        setInternalActiveInvoiceId(remaining[0].id);
      }
    }
    setInvoiceToDelete(null);
    showToast(`Invoice #${num} berhasil dihapus permanen dari sistem.`);
  };

  // Recalculate financial snapshot
  const recalculateSnapshotFinancials = (snapshot: InvoiceSnapshot) => {
    const subtotal = snapshot.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    const discountAmt = Math.round((subtotal * (snapshot.financials.discountPercent || 0)) / 100);
    const crewFee = snapshot.financials.crewFee || 0;
    const deliveryFee = snapshot.financials.deliveryFee || 0;
    const taxableBase = subtotal - discountAmt + crewFee + deliveryFee;
    const taxAmt = snapshot.financials.taxPercent > 0 ? Math.round((taxableBase * snapshot.financials.taxPercent) / 100) : 0;
    const grandTotal = taxableBase + taxAmt;
    const paidAmount = snapshot.financials.paidAmount || 0;
    const remainingAmount = Math.max(0, grandTotal - paidAmount);

    let paymentStatus: PaymentStatus = 'Belum Bayar';
    if (paidAmount >= grandTotal && grandTotal > 0) {
      paymentStatus = 'Lunas';
    } else if (paidAmount > 0) {
      paymentStatus = 'DP 50%';
    }

    snapshot.financials = {
      ...snapshot.financials,
      subtotal,
      discountAmount: discountAmt,
      taxAmount: taxAmt,
      grandTotal,
      paidAmount,
      remainingAmount,
      paymentStatus,
    };
  };

  // Update item in editableSnapshot
  const handleUpdateItem = (
    index: number,
    field: 'name' | 'category' | 'qty' | 'days' | 'dailyRate',
    val: string | number
  ) => {
    const clone = JSON.parse(JSON.stringify(editableSnapshot)) as InvoiceSnapshot;
    const target = clone.items[index];
    if (!target) return;

    if (field === 'qty' || field === 'days' || field === 'dailyRate') {
      const numVal = Math.max(0, Number(val) || 0);
      (target as any)[field] = numVal;
      target.subtotal = target.qty * target.days * target.dailyRate;
    } else {
      (target as any)[field] = val;
    }

    recalculateSnapshotFinancials(clone);
    setEditableSnapshot(clone);
  };

  // Remove item from editableSnapshot
  const handleRemoveItem = (index: number) => {
    const clone = JSON.parse(JSON.stringify(editableSnapshot)) as InvoiceSnapshot;
    clone.items.splice(index, 1);
    recalculateSnapshotFinancials(clone);
    setEditableSnapshot(clone);
    showToast('Item berhasil dihapus dari daftar sewa.');
  };

  // Add Item to editableSnapshot
  const handleAddItemToInvoice = () => {
    const targetEq = equipmentList.find((eq) => eq.id === addItemEquipmentId);
    if (!targetEq) return;

    const clone = JSON.parse(JSON.stringify(editableSnapshot)) as InvoiceSnapshot;
    const days = Math.max(1, addItemDays || clone.event.durationDays || 1);
    const subtotal = targetEq.dailyRate * addItemQty * days;

    const existingIndex = clone.items.findIndex((it) => it.equipmentId === targetEq.id);
    if (existingIndex >= 0) {
      clone.items[existingIndex].qty += addItemQty;
      clone.items[existingIndex].days = days;
      clone.items[existingIndex].subtotal =
        clone.items[existingIndex].qty * clone.items[existingIndex].days * clone.items[existingIndex].dailyRate;
    } else {
      clone.items.push({
        equipmentId: targetEq.id,
        name: targetEq.name,
        category: targetEq.category,
        qty: addItemQty,
        dailyRate: targetEq.dailyRate,
        days: days,
        subtotal: subtotal,
      });
    }

    recalculateSnapshotFinancials(clone);
    setEditableSnapshot(clone);
    showToast(`Berhasil menambahkan ${targetEq.name} (${addItemQty} unit)`);
  };

  // Save changes to current invoice & active revision
  const handleSaveInvoiceChanges = () => {
    const updatedClone = JSON.parse(JSON.stringify(editableSnapshot)) as InvoiceSnapshot;
    recalculateSnapshotFinancials(updatedClone);

    // Update revision
    const updatedRevisions = activeInvoice.revisions.map((rev) => {
      if (rev.id === selectedRevisionId) {
        return {
          ...rev,
          snapshot: updatedClone,
        };
      }
      return rev;
    });

    const updatedRecord: InvoiceRecord = {
      ...activeInvoice,
      clientName: updatedClone.client.name,
      clientCompany: updatedClone.client.company,
      clientPhone: updatedClone.client.phone,
      clientEmail: updatedClone.client.email,
      clientAddress: updatedClone.client.address,
      eventName: updatedClone.event.name,
      eventLocation: updatedClone.event.location,
      startDate: updatedClone.event.startDate,
      endDate: updatedClone.event.endDate,
      durationDays: updatedClone.event.durationDays,
      totalAmount: updatedClone.financials.grandTotal,
      paidAmount: updatedClone.financials.paidAmount,
      paymentStatus: updatedClone.financials.paymentStatus,
      revisions: updatedRevisions,
      companyProfile: vendorForm,
    };

    if (onUpdateInvoiceRecord) {
      onUpdateInvoiceRecord(updatedRecord);
    } else {
      setLocalInvoices((prev) =>
        prev.map((i) => (i.id === updatedRecord.id ? updatedRecord : i))
      );
    }

    if (onUpdateCompanyProfile) {
      onUpdateCompanyProfile(vendorForm);
    }

    showToast(`Perubahan invoice #${updatedClone.invoiceNumber} & kop vendor berhasil disimpan!`);
  };

  // Save as new Revision snapshot
  const handleCreateNewRevision = (e: React.FormEvent) => {
    e.preventDefault();
    const clone = JSON.parse(JSON.stringify(editableSnapshot)) as InvoiceSnapshot;
    recalculateSnapshotFinancials(clone);

    const nextVerNumber = (activeInvoice.revisions.length * 0.1 + 1.0).toFixed(1);
    const newVer = `v${nextVerNumber}`;

    clone.version = newVer;
    clone.versionLabel = `${newVer} (${newRevisionSummary || 'Penyesuaian Klien'})`;
    clone.createdAt = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    clone.createdBy = `${userRole.toUpperCase()} (Sesi Aktif)`;
    clone.reason = newRevisionSummary || 'Perubahan data penawaran sewa alat';

    const newRevObj: InvoiceRevision = {
      id: `rev-${Date.now()}`,
      version: newVer,
      label: `${newVer} (${newRevisionSummary || 'Revisi Baru'})`,
      createdAt: new Date().toLocaleString('id-ID'),
      createdBy: 'Admin Operasional',
      summary: newRevisionSummary || `Revisi versi ${newVer}`,
      snapshot: clone,
    };

    const updatedRecord: InvoiceRecord = {
      ...activeInvoice,
      revisions: [newRevObj, ...activeInvoice.revisions],
      activeRevisionId: newRevObj.id,
      totalAmount: clone.financials.grandTotal,
      paidAmount: clone.financials.paidAmount,
      paymentStatus: clone.financials.paymentStatus,
    };

    if (onUpdateInvoiceRecord) {
      onUpdateInvoiceRecord(updatedRecord);
    } else {
      setLocalInvoices((prev) =>
        prev.map((i) => (i.id === updatedRecord.id ? updatedRecord : i))
      );
    }

    if (onAddNewRevision) {
      onAddNewRevision(newRevObj);
    }

    setSelectedRevisionId(newRevObj.id);
    setEditableSnapshot(clone);
    setShowNewRevisionModal(false);
    setNewRevisionSummary('');
    showToast(`Snapshot revisi baru ${newVer} berhasil dikunci dan disimpan!`);
  };

  // Handle Logo Upload
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setVendorForm((prev) => ({
        ...prev,
        logoUrl: result,
      }));
      showToast('Logo vendor berhasil diunggah!');
    };
    reader.readAsDataURL(file);
  };

  // Download PDF
  const handleDownloadPdf = (targetSnapshot?: InvoiceSnapshot) => {
    try {
      setIsGeneratingPdf(true);
      const snap = targetSnapshot || editableSnapshot;
      generateInvoicePdf(snap, vendorForm);
      showToast(`Invoice #${snap.invoiceNumber} (${snap.version}) berhasil diunduh sebagai PDF!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
  };

  // Handle Create New Invoice Submit
  const handleCreateNewInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let initialItems: {
      equipmentId: string;
      name: string;
      category: string;
      qty: number;
      dailyRate: number;
      days: number;
      subtotal: number;
    }[] = [
      {
        equipmentId: equipmentList[0]?.id || 'eq-1',
        name: equipmentList[0]?.name || 'Kamera Sony A7 III',
        category: equipmentList[0]?.category || 'Kamera & Lensa',
        qty: 2,
        dailyRate: equipmentList[0]?.dailyRate || 450000,
        days: 2,
        subtotal: (equipmentList[0]?.dailyRate || 450000) * 2 * 2,
      },
    ];

    // If prefilling from existing booking
    if (newInvoiceForm.selectedBookingId) {
      const booking = bookings.find((b) => b.id === newInvoiceForm.selectedBookingId);
      if (booking && booking.items.length > 0) {
        initialItems = booking.items.map((it) => ({
          equipmentId: it.equipmentId,
          name: it.equipmentName,
          category: it.category,
          qty: it.quantity,
          dailyRate: it.dailyRate,
          days: it.days,
          subtotal: it.subtotal,
        }));
      }
    }

    const subtotal = initialItems.reduce((acc, it) => acc + it.subtotal, 0);
    const taxAmt = Math.round((subtotal * 11) / 100);
    const grandTotal = subtotal + taxAmt;

    const newSnapshot: InvoiceSnapshot = {
      invoiceNumber: newInvoiceForm.invoiceNumber,
      version: 'v1.0',
      versionLabel: 'v1.0 (Penawaran Awal)',
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      createdBy: 'Admin Operasional',
      reason: 'Penerbitan invoice baru',
      client: {
        name: newInvoiceForm.clientName || 'Klien Baru',
        company: newInvoiceForm.clientCompany || '',
        phone: newInvoiceForm.clientPhone || '0812-0000-0000',
        email: newInvoiceForm.clientEmail || 'client@email.com',
        address: newInvoiceForm.clientAddress || 'Alamat Klien',
      },
      event: {
        name: newInvoiceForm.eventName || 'Acara Baru',
        location: newInvoiceForm.eventLocation || 'Lokasi Acara',
        startDate: newInvoiceForm.startDate,
        endDate: newInvoiceForm.endDate,
        durationDays: 2,
      },
      items: initialItems,
      financials: {
        subtotal,
        discountPercent: 0,
        discountAmount: 0,
        crewFee: 0,
        deliveryFee: 0,
        taxPercent: 11,
        taxAmount: taxAmt,
        grandTotal,
        paidAmount: 0,
        remainingAmount: grandTotal,
        paymentStatus: 'Belum Bayar',
      },
      terms: [
        'Booking unit dianggap valid setelah konfirmasi DP minimal 50%.',
        'Pelunasan sisa tagihan wajib dilakukan maksimal H+1 setelah event.',
      ],
    };

    const newRevision: InvoiceRevision = {
      id: `rev-${Date.now()}`,
      version: 'v1.0',
      label: 'v1.0 (Penawaran Awal)',
      createdAt: new Date().toLocaleString('id-ID'),
      createdBy: 'Admin Operasional',
      summary: 'Penerbitan invoice penawaran resmi baru',
      snapshot: newSnapshot,
    };

    const newRecord: InvoiceRecord = {
      id: newInvoiceForm.invoiceNumber,
      invoiceNumber: newInvoiceForm.invoiceNumber,
      clientName: newInvoiceForm.clientName,
      clientCompany: newInvoiceForm.clientCompany,
      clientPhone: newInvoiceForm.clientPhone,
      clientEmail: newInvoiceForm.clientEmail,
      clientAddress: newInvoiceForm.clientAddress,
      eventName: newInvoiceForm.eventName,
      eventLocation: newInvoiceForm.eventLocation,
      startDate: newInvoiceForm.startDate,
      endDate: newInvoiceForm.endDate,
      durationDays: 2,
      createdAt: newSnapshot.createdAt,
      totalAmount: grandTotal,
      paidAmount: 0,
      paymentStatus: 'Belum Bayar',
      isArchived: false,
      activeRevisionId: newRevision.id,
      revisions: [newRevision],
      companyProfile: vendorForm,
    };

    if (onAddNewInvoiceRecord) {
      onAddNewInvoiceRecord(newRecord);
    } else {
      setLocalInvoices((prev) => [newRecord, ...prev]);
    }

    setShowNewInvoiceModal(false);
    handleOpenEditor(newRecord);
    showToast(`Invoice baru #${newRecord.invoiceNumber} berhasil dibuat!`);
  };

  // Preview snapshot object to display inside modal
  const modalPreviewSnapshot = useMemo(() => {
    if (previewInvoiceRecord) {
      const rev =
        previewInvoiceRecord.revisions.find(
          (r) => r.id === previewInvoiceRecord.activeRevisionId
        ) || previewInvoiceRecord.revisions[0];
      return rev ? rev.snapshot : editableSnapshot;
    }
    return editableSnapshot;
  }, [previewInvoiceRecord, editableSnapshot]);

  const modalPreviewCompany = previewInvoiceRecord?.companyProfile || vendorForm;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Sub-Tabs Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Sub-tab Pill Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveSubTab('archive')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSubTab === 'archive'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-4 h-4 text-indigo-600" />
              <span>Arsip & Daftar Invoice</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                {invoiceList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('editor')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSubTab === 'editor'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pencil className="w-4 h-4 text-indigo-600" />
              <span>Edit Data Invoice</span>
              <span className="font-mono text-[11px] text-slate-500">
                #{activeInvoice.invoiceNumber}
              </span>
            </button>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Requested Feature: Buka Preview ketika di-klik saja */}
          <button
            onClick={() => {
              setPreviewInvoiceRecord(activeInvoice);
              setIsPreviewModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Buka Pratinjau Kertas Invoice A4 Siap Cetak"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>👁️ Lihat Pratinjau Invoice</span>
          </button>

          <button
            onClick={() => setShowNewInvoiceModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Invoice Baru</span>
          </button>

          {activeSubTab === 'editor' && (
            <>
              <button
                onClick={() => setShowDiffModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>Bandingkan Versi</span>
              </button>

              <button
                onClick={() => setShowRawJsonModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 font-mono"
                title="Lihat Snapshot JSON Mentah"
              >
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>JSON</span>
              </button>
            </>
          )}

          <button
            onClick={() => handleDownloadPdf()}
            disabled={isGeneratingPdf}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            title="Unduh PDF Resmi"
          >
            <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
            <span>{isGeneratingPdf ? 'Membuat...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-VIEW 1: ARSIP & DAFTAR INVOICE                             */}
      {/* ============================================================== */}
      {activeSubTab === 'archive' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Arsip Invoice
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {archiveStats.totalCount} Dokumen
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {archiveStats.archivedCount} telah diarsipkan
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Nilai Penawaran
              </span>
              <div className="text-xl font-black text-indigo-700 mt-1 font-mono">
                {formatRupiah(archiveStats.totalAmount)}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                Omzet tercatat sistem
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Sudah Terbayar / DP
              </span>
              <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
                {formatRupiah(archiveStats.totalPaid)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Dana masuk</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Sisa Piutang Sewa
              </span>
              <div className="text-xl font-black text-rose-600 mt-1 font-mono">
                {formatRupiah(archiveStats.totalUnpaid)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Menunggu pelunasan</div>
            </div>
          </div>

          {/* Search, Filter & Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor invoice, nama klien, instansi, atau event..."
                value={archiveSearchQuery}
                onChange={(e) => setArchiveSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'active', label: 'Aktif' },
                { id: 'archived', label: 'Terarsip' },
                { id: 'Lunas', label: 'Lunas' },
                { id: 'DP 50%', label: 'DP 50%' },
                { id: 'Belum Bayar', label: 'Belum Bayar' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setArchiveStatusFilter(f.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    archiveStatusFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table of Invoices in Archive */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Invoice & Versi</th>
                    <th className="py-3 px-4">Tgl Terbit</th>
                    <th className="py-3 px-4">Klien & Penyelenggara</th>
                    <th className="py-3 px-4">Nama Event & Lokasi</th>
                    <th className="py-3 px-4 text-right">Nilai Total</th>
                    <th className="py-3 px-4 text-center">Status Bayar</th>
                    <th className="py-3 px-4 text-center">Status Arsip</th>
                    <th className="py-3 px-4 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Archive className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">Tidak ada invoice ditemukan.</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Coba ganti filter atau cari kata kunci lainnya.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const latestRev = inv.revisions[0];
                      const isArchived = inv.isArchived;

                      return (
                        <tr
                          key={inv.id}
                          className={`hover:bg-indigo-50/40 transition-colors ${
                            isArchived ? 'bg-slate-50/70 text-slate-500' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 font-mono">
                                #{inv.invoiceNumber}
                              </span>
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold">
                                {latestRev?.version || 'v1.0'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {inv.revisions.length} Versi Snapshot
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {inv.createdAt}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{inv.clientName}</div>
                            {inv.clientCompany && (
                              <div className="text-[11px] text-slate-500">{inv.clientCompany}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800 line-clamp-1">{inv.eventName}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">{inv.eventLocation}</div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(inv.totalAmount)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.paymentStatus === 'Lunas'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : inv.paymentStatus === 'DP 50%'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isArchived ? (
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                                Terarsip
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                Aktif
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1-Click Preview Button */}
                              <button
                                onClick={() => handleOpenPreview(inv)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-indigo-200"
                                title="Lihat Pratinjau Kertas Invoice"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Pratinjau</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditor(inv)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                title="Buka Workspace Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {/* Archive Toggle Button */}
                              <button
                                onClick={() => handleToggleArchive(inv.id)}
                                className={`p-1 rounded transition-colors ${
                                  isArchived
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`}
                                title={isArchived ? 'Buka dari Arsip' : 'Pindahkan ke Arsip'}
                              >
                                <Archive className="w-4 h-4" />
                              </button>

                              {/* PDF Download Button */}
                              <button
                                onClick={() => {
                                  const snap = inv.revisions[0]?.snapshot;
                                  if (snap) handleDownloadPdf(snap);
                                }}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                title="Unduh Dokumen PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePromptDeleteInvoice(inv.id);
                                }}
                                className="p-1 text-rose-500 hover:bg-rose-100 rounded transition-colors"
                                title="Hapus Invoice Permanen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-VIEW 2: EDIT DATA INVOICE (LENGKAP & EDITABLE)             */}
      {/* ============================================================== */}
      {activeSubTab === 'editor' && (
        <div className="space-y-6">
          {/* Active Invoice Info & Quick Switcher */}
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold tracking-tight">
                  Mengedit Invoice #{activeInvoice.invoiceNumber}
                </h3>
                <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-mono text-xs font-bold">
                  {editableSnapshot.version}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    editableSnapshot.financials.paymentStatus === 'Lunas'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {editableSnapshot.financials.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Event: {editableSnapshot.event.name} | Klien: {editableSnapshot.client.name}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Button Buka Pratinjau Kertas */}
              <button
                type="button"
                onClick={() => {
                  setPreviewInvoiceRecord(activeInvoice);
                  setIsPreviewModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>👁️ Buka Pratinjau A4</span>
              </button>

              <button
                type="button"
                onClick={handleSaveInvoiceChanges}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewRevisionModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Kunci Revisi Baru</span>
              </button>
            </div>
          </div>

          {/* Warning banner when editing an older snapshot */}
          {isOlderVersion && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-amber-950 block">
                  ⚠️ Anda sedang mengedit snapshot versi lama ({currentRevision?.version})
                </span>
                Versi terbaru saat ini adalah <strong>{latestRevision.version}</strong>. Perubahan yang Anda simpan akan memperbarui snapshot versi ini.
              </div>
            </div>
          )}

          {/* GRID FORMULIR EDIT: 2 KOLOM BESAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ============================================================== */}
            {/* CARD 1: INFORMASI VENDOR & KOP SURAT (DAPAT DIUBAH LENGKAP)    */}
            {/* ============================================================== */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Informasi Vendor & Kop Surat
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Logo, nama usaha, alamat, dan info rekening yang tercetak di invoice
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                  Vendor
                </span>
              </div>

              {/* Live Preview Kop & Logo */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                {vendorForm.logoUrl ? (
                  <img
                    src={vendorForm.logoUrl}
                    alt="Logo Vendor"
                    className="w-12 h-12 object-contain rounded border border-slate-300 bg-white p-1 shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0"
                    style={{ backgroundColor: vendorForm.logoBgColor || '#0F172A' }}
                  >
                    {vendorForm.logoText || 'RP'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {vendorForm.companyName || 'Nama Bisnis Vendor'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {vendorForm.legalName || 'PT/CV Legal'}
                  </div>
                  <div className="text-[10px] text-indigo-600 truncate italic">
                    {vendorForm.logoTagline || 'Tagline Slogan Rental'}
                  </div>
                </div>
              </div>

              {/* Logo Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    Inisial Monogram Logo (1-4 Karakter):
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={vendorForm.logoText}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        logoText: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold tracking-wider uppercase text-center"
                    placeholder="RP"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    Warna Latar Logo:
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { name: 'Slate', color: '#0F172A' },
                      { name: 'Indigo', color: '#4F46E5' },
                      { name: 'Emerald', color: '#059669' },
                      { name: 'Amber', color: '#D97706' },
                      { name: 'Crimson', color: '#DC2626' },
                      { name: 'Cyan', color: '#0891B2' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() =>
                          setVendorForm({
                            ...vendorForm,
                            logoBgColor: c.color,
                          })
                        }
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          vendorForm.logoBgColor === c.color
                            ? 'scale-110 border-slate-900 ring-2 ring-indigo-400'
                            : 'border-white'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1 text-slate-700 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Unggah Gambar Logo</span>
                    </button>

                    {vendorForm.logoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setVendorForm({
                            ...vendorForm,
                            logoUrl: undefined,
                          })
                        }
                        className="text-[11px] text-rose-600 hover:underline"
                      >
                        Hapus Gambar Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor Company Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Usaha / Brand Rental:
                  </label>
                  <input
                    type="text"
                    value={vendorForm.companyName}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="cth: VENDORONE AUDIO VISUAL"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Badan Hukum (PT/CV):
                  </label>
                  <input
                    type="text"
                    value={vendorForm.legalName}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        legalName: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="cth: PT VendorOne Teknologi Kreatif"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Slogan / Tagline Kop Surat:
                  </label>
                  <input
                    type="text"
                    value={vendorForm.logoTagline || ''}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        logoTagline: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="cth: Professional Audio Visual & Event Gear Rental"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Alamat Lengkap Kantor & Gudang Vendor:
                  </label>
                  <textarea
                    rows={2}
                    value={vendorForm.address}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="Alamat kantor..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Telepon Kantor:
                  </label>
                  <input
                    type="text"
                    value={vendorForm.phone}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp Admin:
                  </label>
                  <input
                    type="text"
                    value={vendorForm.whatsapp}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        whatsapp: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Email Resmi Invoice:
                  </label>
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Vendor Bank Account Information */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                  Informasi Rekening Bank Pembayaran:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-600 block text-[10px]">Nama Bank:</label>
                    <input
                      type="text"
                      value={vendorForm.bankName}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
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
                      value={vendorForm.bankAccount}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
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
                      value={vendorForm.bankAccountHolder}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          bankAccountHolder: e.target.value,
                        })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* CARD 2: INFORMASI KLIEN & EVENT (DAPAT DIUBAH LENGKAP)         */}
            {/* ============================================================== */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Informasi Klien & Detail Event
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pihak penyewa, PIC, venue, tanggal sewa, dan penanggung jawab
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                  Klien / Acara
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ditujukan Kepada (Nama Klien / PIC):
                  </label>
                  <input
                    type="text"
                    value={editableSnapshot.client.name}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        client: {
                          ...editableSnapshot.client,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="cth: Bapak Budi Santoso"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Perusahaan / Instansi:
                  </label>
                  <input
                    type="text"
                    value={editableSnapshot.client.company || ''}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        client: {
                          ...editableSnapshot.client,
                          company: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="cth: PT Telkom Indonesia"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp / Telp Klien:
                  </label>
                  <input
                    type="text"
                    value={editableSnapshot.client.phone}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        client: {
                          ...editableSnapshot.client,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="0812-xxxx-xxxx"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Email Klien:
                  </label>
                  <input
                    type="email"
                    value={editableSnapshot.client.email}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        client: {
                          ...editableSnapshot.client,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="email@klien.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Alamat Lengkap Klien:
                  </label>
                  <textarea
                    rows={2}
                    value={editableSnapshot.client.address}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        client: {
                          ...editableSnapshot.client,
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="Alamat kantor penyewa..."
                  />
                </div>

                {/* Event Details */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Acara / Event:
                  </label>
                  <input
                    type="text"
                    value={editableSnapshot.event.name}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        event: {
                          ...editableSnapshot.event,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs font-semibold text-slate-900"
                    placeholder="cth: Seminar Nasional Digital 2026"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Lokasi / Venue Penyelenggaraan:
                  </label>
                  <input
                    type="text"
                    value={editableSnapshot.event.location}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        event: {
                          ...editableSnapshot.event,
                          location: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="cth: Ballroom Hotel Mulia Senayan"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tanggal Mulai Sewa:
                  </label>
                  <input
                    type="text"
                    value={editableSnapshot.event.startDate}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        event: {
                          ...editableSnapshot.event,
                          startDate: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                    placeholder="cth: 10 Okt 2026"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tanggal Selesai Sewa:
                  </label>
                  <input
                    type="text"
                    value={editableSnapshot.event.endDate}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        event: {
                          ...editableSnapshot.event,
                          endDate: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                    placeholder="cth: 12 Okt 2026"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Durasi Hari Sewa:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editableSnapshot.event.durationDays}
                    onChange={(e) => {
                      const dur = Math.max(1, Number(e.target.value) || 1);
                      const clone = JSON.parse(JSON.stringify(editableSnapshot));
                      clone.event.durationDays = dur;
                      // Update days in items if desirable
                      clone.items.forEach((it: any) => {
                        it.days = dur;
                        it.subtotal = it.qty * it.days * it.dailyRate;
                      });
                      recalculateSnapshotFinancials(clone);
                      setEditableSnapshot(clone);
                    }}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Penanggung Jawab PIC Internal:
                  </label>
                  <input
                    type="text"
                    value={editableSnapshot.createdBy}
                    onChange={(e) =>
                      setEditableSnapshot({
                        ...editableSnapshot,
                        createdBy: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    placeholder="Admin Project"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CARD 3: TABEL ITEM ALAT YANG DISEWA (TAMBAH, EDIT, HAPUS)       */}
          {/* ============================================================== */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Rincian Item Alat Rental & Tarif
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Seluruh tarif per hari, jumlah unit, dan durasi hari sewa dapat diedit langsung
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                Total Item: {editableSnapshot.items.length} Macam Alat
              </div>
            </div>

            {/* Table of items */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Deskripsi & Spesifikasi Alat</th>
                    <th className="py-2.5 px-3 w-32">Kategori</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty Unit</th>
                    <th className="py-2.5 px-3 w-20 text-center">Hari</th>
                    <th className="py-2.5 px-3 w-36 text-right">Tarif / Hari</th>
                    <th className="py-2.5 px-3 w-36 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {editableSnapshot.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-semibold">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-900"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(idx, 'category', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-[11px]"
                        >
                          <option value="Kamera & Lensa">Kamera & Lensa</option>
                          <option value="Audio & Sound">Audio & Sound</option>
                          <option value="Lighting & Effect">Lighting & Effect</option>
                          <option value="Visual & LED">Visual & LED</option>
                          <option value="Rigging & Truss">Rigging & Truss</option>
                          <option value="Power & Kabel">Power & Kabel</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                          className="w-16 p-1.5 border border-slate-200 rounded text-center text-xs font-mono font-bold"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.days}
                          onChange={(e) => handleUpdateItem(idx, 'days', e.target.value)}
                          className="w-16 p-1.5 border border-slate-200 rounded text-center text-xs font-mono"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step={50000}
                          min={0}
                          value={item.dailyRate}
                          onChange={(e) => handleUpdateItem(idx, 'dailyRate', e.target.value)}
                          className="w-28 p-1.5 border border-slate-200 rounded text-right text-xs font-mono"
                        />
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatRupiah(item.dailyRate)}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus baris item ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Form Tambah Item Baru dari Katalog Master Alat */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row items-stretch md:items-end gap-3 text-xs">
              <div className="flex-1">
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Alat dari Katalog Master:
                </label>
                <select
                  value={addItemEquipmentId}
                  onChange={(e) => setAddItemEquipmentId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} — {eq.category} ({formatRupiah(eq.dailyRate)}/hari)
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label className="font-bold text-slate-700 block mb-1">Qty:</label>
                <input
                  type="number"
                  min={1}
                  value={addItemQty}
                  onChange={(e) => setAddItemQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-mono text-center bg-white"
                />
              </div>

              <div className="w-24">
                <label className="font-bold text-slate-700 block mb-1">Hari:</label>
                <input
                  type="number"
                  min={1}
                  value={addItemDays}
                  onChange={(e) => setAddItemDays(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-mono text-center bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItemToInvoice}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah ke Invoice</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CARD 4: KALKULASI FINANSIAL & STATUS PEMBAYARAN               */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Syarat Sewa / Ketentuan */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h4 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                Syarat & Ketentuan Sewa (Terms)
              </h4>
              <p className="text-xs text-slate-500">
                Teks ketentuan ini tercetak di lembar invoice resmi bagi klien:
              </p>

              <div className="space-y-2">
                {editableSnapshot.terms.map((term, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-bold">{i + 1}.</span>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => {
                        const clone = JSON.parse(JSON.stringify(editableSnapshot));
                        clone.terms[i] = e.target.value;
                        setEditableSnapshot(clone);
                      }}
                      className="flex-1 p-2 border border-slate-200 rounded text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clone = JSON.parse(JSON.stringify(editableSnapshot));
                        clone.terms.splice(i, 1);
                        setEditableSnapshot(clone);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const clone = JSON.parse(JSON.stringify(editableSnapshot));
                    clone.terms.push('Ketentuan sewa tambahan baru...');
                    setEditableSnapshot(clone);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Ketentuan</span>
                </button>
              </div>
            </div>

            {/* Kalkulasi Finansial */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs font-mono">
              <h4 className="font-bold text-sm text-slate-900 font-sans border-b border-slate-200 pb-2">
                Kalkulasi Finansial & Pembayaran
              </h4>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-1 text-slate-600 border-b border-slate-100">
                  <span>Subtotal Sewa Alat:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatRupiah(editableSnapshot.financials.subtotal)}
                  </span>
                </div>

                {/* Diskon */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span>Diskon Khusus:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editableSnapshot.financials.discountPercent}
                        onChange={(e) => {
                          const clone = JSON.parse(JSON.stringify(editableSnapshot));
                          clone.financials.discountPercent = Number(e.target.value) || 0;
                          recalculateSnapshotFinancials(clone);
                          setEditableSnapshot(clone);
                        }}
                        className="w-14 p-1 border border-slate-300 rounded text-center text-xs font-mono"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <span className="text-emerald-700 font-bold">
                    - {formatRupiah(editableSnapshot.financials.discountAmount)}
                  </span>
                </div>

                {/* Biaya Kru */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Biaya Kru & Teknisi:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Rp</span>
                    <input
                      type="number"
                      step={100000}
                      min={0}
                      value={editableSnapshot.financials.crewFee}
                      onChange={(e) => {
                        const clone = JSON.parse(JSON.stringify(editableSnapshot));
                        clone.financials.crewFee = Number(e.target.value) || 0;
                        recalculateSnapshotFinancials(clone);
                        setEditableSnapshot(clone);
                      }}
                      className="w-32 p-1 border border-slate-300 rounded text-right text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Biaya Pengiriman */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Ongkos Kirim & Loading:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Rp</span>
                    <input
                      type="number"
                      step={100000}
                      min={0}
                      value={editableSnapshot.financials.deliveryFee}
                      onChange={(e) => {
                        const clone = JSON.parse(JSON.stringify(editableSnapshot));
                        clone.financials.deliveryFee = Number(e.target.value) || 0;
                        recalculateSnapshotFinancials(clone);
                        setEditableSnapshot(clone);
                      }}
                      className="w-32 p-1 border border-slate-300 rounded text-right text-xs font-mono"
                    />
                  </div>
                </div>

                {/* PPN 11% Toggle */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer font-sans text-xs">
                    <input
                      type="checkbox"
                      checked={editableSnapshot.financials.taxPercent > 0}
                      onChange={(e) => {
                        const clone = JSON.parse(JSON.stringify(editableSnapshot));
                        clone.financials.taxPercent = e.target.checked ? 11 : 0;
                        recalculateSnapshotFinancials(clone);
                        setEditableSnapshot(clone);
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Aktifkan PPN 11%</span>
                  </label>
                  <span className="text-slate-700">
                    {formatRupiah(editableSnapshot.financials.taxAmount)}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center py-2 text-sm font-bold text-slate-900 bg-slate-100 px-3 rounded">
                  <span className="font-sans">TOTAL TAGIHAN:</span>
                  <span className="text-indigo-700 text-base">
                    {formatRupiah(editableSnapshot.financials.grandTotal)}
                  </span>
                </div>

                {/* Status Pembayaran & DP */}
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-600">Status Pembayaran:</span>
                    <select
                      value={editableSnapshot.financials.paymentStatus}
                      onChange={(e) => {
                        const clone = JSON.parse(JSON.stringify(editableSnapshot));
                        clone.financials.paymentStatus = e.target.value as PaymentStatus;
                        setEditableSnapshot(clone);
                      }}
                      className="p-1.5 border border-slate-300 rounded text-xs font-bold font-sans"
                    >
                      <option value="Belum Bayar">Belum Bayar</option>
                      <option value="DP 50%">DP 50%</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-600">Sudah Dibayar (DP):</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Rp</span>
                      <input
                        type="number"
                        step={500000}
                        min={0}
                        value={editableSnapshot.financials.paidAmount}
                        onChange={(e) => {
                          const clone = JSON.parse(JSON.stringify(editableSnapshot));
                          clone.financials.paidAmount = Number(e.target.value) || 0;
                          recalculateSnapshotFinancials(clone);
                          setEditableSnapshot(clone);
                        }}
                        className="w-32 p-1 border border-slate-300 rounded text-right text-xs font-mono text-emerald-700 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 font-bold text-slate-900 border-t border-slate-200">
                    <span className="font-sans">Sisa Tagihan:</span>
                    <span className="text-rose-600 text-sm">
                      {formatRupiah(editableSnapshot.financials.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button Action */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={handleSaveInvoiceChanges}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Invoice & Kop</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PRATINJAU KERTAS INVOICE A4 ("ketika di-klik saja")      */}
      {/* ============================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start animate-in fade-in duration-200">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full border border-slate-300 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
            {/* Modal Top Control Bar */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  Pratinjau Kertas Invoice #{modalPreviewSnapshot.invoiceNumber}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500 font-mono font-bold">
                  {modalPreviewSnapshot.version}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Print)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(modalPreviewSnapshot)}
                  disabled={isGeneratingPdf}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    if (previewInvoiceRecord) {
                      handleOpenEditor(previewInvoiceRecord);
                    } else {
                      setActiveSubTab('editor');
                    }
                  }}
                  className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Data Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 font-bold text-sm ml-1"
                  title="Tutup (ESC)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: KERTAS A4 REALISTIS */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-200/80">
              <div
                id="printable-invoice"
                className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-10 text-slate-800 space-y-6 max-w-3xl mx-auto relative"
              >
                {/* Watermark Draft / Versi Lama */}
                {isOlderVersion && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-25deg] select-none">
                    <span className="text-8xl font-black text-slate-900 uppercase">
                      ARSIP {modalPreviewSnapshot.version}
                    </span>
                  </div>
                )}

                {/* KOP SURAT VENDOR */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      {modalPreviewCompany.logoUrl ? (
                        <img
                          src={modalPreviewCompany.logoUrl}
                          alt="Logo"
                          className="w-10 h-10 object-contain rounded border border-slate-200 bg-white p-0.5 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs"
                          style={{
                            backgroundColor: modalPreviewCompany.logoBgColor || '#0F172A',
                          }}
                        >
                          {modalPreviewCompany.logoText || 'RP'}
                        </div>
                      )}
                      <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                          {modalPreviewCompany.companyName}
                        </h1>
                        <p className="text-xs text-slate-600 font-medium">
                          {modalPreviewCompany.legalName}
                        </p>
                      </div>
                    </div>
                    {modalPreviewCompany.logoTagline && (
                      <p className="text-[11px] text-indigo-600 font-medium italic pt-0.5">
                        {modalPreviewCompany.logoTagline}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed pt-1">
                      {modalPreviewCompany.address}
                      <br />
                      Telp: {modalPreviewCompany.phone} | WA: {modalPreviewCompany.whatsapp} |{' '}
                      {modalPreviewCompany.email}
                    </p>
                  </div>

                  <div className="text-left sm:text-right space-y-1 shrink-0">
                    <span className="text-2xl font-black tracking-tight text-slate-900 block uppercase">
                      INVOICE
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-800">
                      #{modalPreviewSnapshot.invoiceNumber}
                    </div>
                    <div className="text-xs text-slate-500">
                      Tgl Terbit:{' '}
                      <span className="font-semibold text-slate-800 font-mono">
                        {modalPreviewSnapshot.createdAt}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Status:{' '}
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {modalPreviewSnapshot.financials.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DETAIL KLIEN & EVENT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs py-1">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Ditujukan Kepada (Penyewa):
                    </span>
                    <div className="font-bold text-slate-900 text-sm">
                      {modalPreviewSnapshot.client.name}
                    </div>
                    {modalPreviewSnapshot.client.company && (
                      <div className="text-slate-600 font-medium">
                        {modalPreviewSnapshot.client.company}
                      </div>
                    )}
                    <div className="text-slate-500">
                      Telp: {modalPreviewSnapshot.client.phone} | Email:{' '}
                      {modalPreviewSnapshot.client.email}
                    </div>
                    <div className="text-slate-500 text-[11px] leading-relaxed">
                      {modalPreviewSnapshot.client.address}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Rincian Penyelenggaraan Event:
                    </span>
                    <div className="font-bold text-slate-900 text-sm">
                      {modalPreviewSnapshot.event.name}
                    </div>
                    <div className="text-slate-600">
                      Lokasi:{' '}
                      <span className="font-medium text-slate-800">
                        {modalPreviewSnapshot.event.location}
                      </span>
                    </div>
                    <div className="text-slate-600 font-mono">
                      Periode: {modalPreviewSnapshot.event.startDate} -{' '}
                      {modalPreviewSnapshot.event.endDate} ({modalPreviewSnapshot.event.durationDays}{' '}
                      Hari Sewa)
                    </div>
                    <div className="text-xs text-slate-500">
                      PIC Proyek: {modalPreviewSnapshot.createdBy}
                    </div>
                  </div>
                </div>

                {/* TABEL ITEM ALAT */}
                <div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">Deskripsi Alat & Spesifikasi</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-center">Hari</th>
                        <th className="py-2 px-3 text-right">Tarif / Hari</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {modalPreviewSnapshot.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-500">
                              Kategori: {item.category}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                            {item.qty} Unit
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {item.days}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatRupiah(item.dailyRate)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* KALKULASI FINANSIAL & BANK */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Ketentuan Pembayaran & Rekening:
                    </span>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] space-y-1">
                      <div className="font-bold text-slate-800">
                        {modalPreviewCompany.bankName}
                      </div>
                      <div>
                        No. Rek:{' '}
                        <strong className="font-mono text-slate-900">
                          {modalPreviewCompany.bankAccount}
                        </strong>
                      </div>
                      <div>
                        Atas Nama:{' '}
                        <strong className="text-slate-900">
                          {modalPreviewCompany.bankAccountHolder}
                        </strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-1">
                      <div className="font-bold text-slate-700">Syarat Sewa:</div>
                      {modalPreviewSnapshot.terms.map((term, i) => (
                        <p key={i}>• {term}</p>
                      ))}
                    </div>
                  </div>

                  {/* Rincian Angka */}
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                      <span>Subtotal Sewa Alat:</span>
                      <span className="font-semibold text-slate-900">
                        {formatRupiah(modalPreviewSnapshot.financials.subtotal)}
                      </span>
                    </div>

                    {modalPreviewSnapshot.financials.discountAmount > 0 && (
                      <div className="flex justify-between py-1 text-emerald-700 border-b border-slate-100">
                        <span>
                          Diskon Khusus ({modalPreviewSnapshot.financials.discountPercent}%):
                        </span>
                        <span>- {formatRupiah(modalPreviewSnapshot.financials.discountAmount)}</span>
                      </div>
                    )}

                    {modalPreviewSnapshot.financials.crewFee > 0 && (
                      <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                        <span>Biaya Kru & Teknisi:</span>
                        <span>{formatRupiah(modalPreviewSnapshot.financials.crewFee)}</span>
                      </div>
                    )}

                    {modalPreviewSnapshot.financials.deliveryFee > 0 && (
                      <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                        <span>Ongkos Kirim & Loading:</span>
                        <span>{formatRupiah(modalPreviewSnapshot.financials.deliveryFee)}</span>
                      </div>
                    )}

                    {modalPreviewSnapshot.financials.taxAmount > 0 && (
                      <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                        <span>PPN 11%:</span>
                        <span>{formatRupiah(modalPreviewSnapshot.financials.taxAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-2 text-sm font-bold text-slate-900 bg-slate-100 px-3 rounded">
                      <span>TOTAL TAGIHAN:</span>
                      <span className="text-indigo-700">
                        {formatRupiah(modalPreviewSnapshot.financials.grandTotal)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Sudah Dibayar (DP):</span>
                      <span className="text-emerald-700 font-semibold">
                        {formatRupiah(modalPreviewSnapshot.financials.paidAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 text-slate-900 font-bold border-t border-slate-200">
                      <span>Sisa Pembayaran:</span>
                      <span className="text-rose-600">
                        {formatRupiah(modalPreviewSnapshot.financials.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TANDA TANGAN */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
                  <div>
                    <p className="text-slate-500">Penyewa / PIC Klien</p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-800">
                      ({modalPreviewSnapshot.client.name})
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">
                      Hormat Kami, {modalPreviewCompany.companyName}
                    </p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-800">
                      ({modalPreviewSnapshot.createdBy || 'Budi Santoso - Project Head'})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: BUAT INVOICE BARU                                       */}
      {/* ============================================================== */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewInvoiceSubmit}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Buat Invoice Penawaran Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(false)}
                className="text-white hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Invoice:</label>
                <input
                  type="text"
                  required
                  value={newInvoiceForm.invoiceNumber}
                  onChange={(e) =>
                    setNewInvoiceForm({ ...newInvoiceForm, invoiceNumber: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              {bookings.length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Prefill dari Booking Kalender (Opsional):
                  </label>
                  <select
                    value={newInvoiceForm.selectedBookingId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      const b = bookings.find((bk) => bk.id === bId);
                      if (b) {
                        setNewInvoiceForm({
                          ...newInvoiceForm,
                          selectedBookingId: bId,
                          clientName: b.clientName,
                          clientCompany: b.clientCompany || '',
                          clientPhone: b.clientPhone,
                          clientEmail: b.clientEmail,
                          eventName: b.eventName,
                          eventLocation: b.location,
                          startDate: b.startDate,
                          endDate: b.endDate,
                        });
                      } else {
                        setNewInvoiceForm({
                          ...newInvoiceForm,
                          selectedBookingId: '',
                        });
                      }
                    }}
                    className="w-full p-2 border border-slate-300 rounded bg-slate-50"
                  >
                    <option value="">-- Pilih Booking Tersimpan --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.eventName} — {b.clientName} ({b.startDate})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Klien / PIC:</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.clientName}
                    onChange={(e) =>
                      setNewInvoiceForm({ ...newInvoiceForm, clientName: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded"
                    placeholder="Nama PIC"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Perusahaan / EO:</label>
                  <input
                    type="text"
                    value={newInvoiceForm.clientCompany}
                    onChange={(e) =>
                      setNewInvoiceForm({ ...newInvoiceForm, clientCompany: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded"
                    placeholder="PT / EO Klien"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Acara / Event:</label>
                <input
                  type="text"
                  required
                  value={newInvoiceForm.eventName}
                  onChange={(e) =>
                    setNewInvoiceForm({ ...newInvoiceForm, eventName: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded"
                  placeholder="Nama Acara"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Venue:</label>
                <input
                  type="text"
                  value={newInvoiceForm.eventLocation}
                  onChange={(e) =>
                    setNewInvoiceForm({ ...newInvoiceForm, eventLocation: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded"
                  placeholder="Venue Acara"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Mulai:</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceForm.startDate}
                    onChange={(e) =>
                      setNewInvoiceForm({ ...newInvoiceForm, startDate: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Selesai:</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceForm.endDate}
                    onChange={(e) =>
                      setNewInvoiceForm({ ...newInvoiceForm, endDate: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Buat & Masuk ke Editor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: KUNCI REVISI BARU (SNAPSHOT v1.x)                       */}
      {/* ============================================================== */}
      {showNewRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewRevision}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Kunci Snapshot Revisi Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewRevisionModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Snapshot ini akan membekukan versi data invoice saat ini secara permanen ke riwayat audit trail JSON.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan Ringkasan Revisi:
                </label>
                <textarea
                  rows={3}
                  required
                  value={newRevisionSummary}
                  onChange={(e) => setNewRevisionSummary(e.target.value)}
                  placeholder="cth: Penambahan diskon 10%, penyesuaian durasi sewa, disetujui klien..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewRevisionModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Simpan & Kunci Versi Baru
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DIFF / PERBANDINGAN VERSI                              */}
      {/* ============================================================== */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  Riwayat & Perbandingan Versi Snapshot (#{activeInvoice.invoiceNumber})
                </h3>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {activeInvoice.revisions.map((rev, i) => (
                <div
                  key={rev.id}
                  className="p-3.5 border border-slate-200 rounded-lg bg-slate-50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 font-mono text-sm">
                      {rev.label}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">{rev.createdAt}</span>
                  </div>
                  <p className="text-slate-700">{rev.summary}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-mono text-[11px] text-slate-500">
                    <span>Oleh: {rev.createdBy}</span>
                    <span className="font-bold text-slate-900">
                      Total: {formatRupiah(rev.snapshot.financials.grandTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RAW JSON PAYLOAD SNAPSHOT                              */}
      {/* ============================================================== */}
      {showRawJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-xl shadow-2xl max-w-3xl w-full border border-slate-800 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">
                  JSON Snapshot Payload ({editableSnapshot.invoiceNumber} - {editableSnapshot.version})
                </span>
              </div>
              <button
                onClick={() => setShowRawJsonModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] text-emerald-400 bg-slate-950 leading-relaxed selection:bg-emerald-900 selection:text-white">
              <pre>{JSON.stringify(editableSnapshot, null, 2)}</pre>
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(editableSnapshot, null, 2));
                  showToast('Payload JSON berhasil disalin ke clipboard!');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin JSON</span>
              </button>

              <button
                onClick={() => setShowRawJsonModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS INVOICE (IN-APP MODAL, BEBAS WINDOW.CONFIRM) */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Hapus Invoice #{invoiceToDelete.invoiceNumber}?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Apakah Anda yakin ingin menghapus dokumen invoice ini secara permanen dari sistem VendorOne?
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left text-xs text-slate-700 space-y-1 mb-4">
                <div>
                  <span className="text-slate-400">Klien:</span>{' '}
                  <strong className="text-slate-800">{invoiceToDelete.clientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Event:</span>{' '}
                  <span className="text-slate-800">{invoiceToDelete.eventName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Nilai Tagihan:</span>{' '}
                  <strong className="text-rose-600 font-mono">
                    {formatRupiah(invoiceToDelete.totalAmount)}
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceToDelete(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteInvoice}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Permanen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
