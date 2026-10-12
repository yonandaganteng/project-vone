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

  // Payment status badge helper
  const paymentBadgeClass = (status: string) => {
    if (status === 'Lunas') return 'badge-emerald';
    if (status === 'DP 50%') return 'badge-amber';
    return 'badge-carmine';
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient background — paper texture */}
      <div className="ambient-invoice-paper absolute inset-0 pointer-events-none" />

      <div className="relative z-10 space-y-0 animate-page-enter">

        {/* ============================================================== */}
        {/* TOP HEADER: Sub-Tab Switcher & Global Actions                   */}
        {/* ============================================================== */}
        <div className="panel mb-5 px-5 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Sub-tab text links with underline indicator */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveSubTab('archive')}
              className={`flex items-center gap-2 pb-0.5 text-[13px] font-semibold transition-colors ${
                activeSubTab === 'archive'
                  ? 'text-[#111318] border-b-2 border-[#4f46e5]'
                  : 'text-[#111318]/50 hover:text-[#111318]/80 border-b-2 border-transparent'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arsip &amp; Daftar Invoice</span>
              <span className="badge-indigo font-mono text-[10px] px-1.5 py-0.5">
                {invoiceList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('editor')}
              className={`flex items-center gap-2 pb-0.5 text-[13px] font-semibold transition-colors ${
                activeSubTab === 'editor'
                  ? 'text-[#111318] border-b-2 border-[#4f46e5]'
                  : 'text-[#111318]/50 hover:text-[#111318]/80 border-b-2 border-transparent'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Data Invoice</span>
              <span className="font-mono text-[11px] text-[#111318]/40">
                #{activeInvoice.invoiceNumber}
              </span>
            </button>
          </div>

          {/* Global Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Main Requested Feature: Buka Preview ketika di-klik saja */}
            <button
              onClick={() => {
                setPreviewInvoiceRecord(activeInvoice);
                setIsPreviewModalOpen(true);
              }}
              className="btn-ghost flex items-center gap-1.5 text-xs"
              title="Buka Pratinjau Kertas Invoice A4 Siap Cetak"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Invoice</span>
            </button>

            <button
              onClick={() => setShowNewInvoiceModal(true)}
              className="btn-primary flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Invoice Baru</span>
            </button>

            {activeSubTab === 'editor' && (
              <>
                <button
                  onClick={() => setShowDiffModal(true)}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Bandingkan Versi</span>
                </button>

                <button
                  onClick={() => setShowRawJsonModal(true)}
                  className="btn-ghost flex items-center gap-1.5 text-xs font-mono"
                  title="Lihat Snapshot JSON Mentah"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
              </>
            )}

            <button
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="btn-ghost flex items-center gap-1.5 text-xs disabled:opacity-50"
              title="Unduh PDF Resmi"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Membuat...' : 'PDF'}</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="toast toast-success animate-toast-enter mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-[13px]">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-3 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUB-VIEW 1: ARSIP & DAFTAR INVOICE                             */}
        {/* ============================================================== */}
        {activeSubTab === 'archive' && (
          <div className="space-y-5">
            {/* KPI Stats — asymmetric, not all cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="panel p-4">
                <p className="section-label mb-2">Total Arsip</p>
                <div className="metric-figure text-[#111318]">{archiveStats.totalCount}</div>
                <p className="text-[11px] text-[#111318]/40 mt-0.5 font-mono">
                  {archiveStats.archivedCount} terarsip
                </p>
              </div>

              <div className="panel p-4">
                <p className="section-label mb-2">Total Penawaran</p>
                <div className="metric-figure-mono text-[#4f46e5] text-[18px]">
                  {formatRupiah(archiveStats.totalAmount)}
                </div>
                <p className="text-[11px] text-[#059669] mt-0.5 font-medium">Omzet tercatat</p>
              </div>

              <div className="panel p-4">
                <p className="section-label mb-2">Sudah Terbayar</p>
                <div className="metric-figure-mono text-[#059669] text-[18px]">
                  {formatRupiah(archiveStats.totalPaid)}
                </div>
                <p className="text-[11px] text-[#111318]/40 mt-0.5">Dana masuk</p>
              </div>

              <div className="panel p-4">
                <p className="section-label mb-2">Sisa Piutang</p>
                <div className="metric-figure-mono text-[#be123c] text-[18px]">
                  {formatRupiah(archiveStats.totalUnpaid)}
                </div>
                <p className="text-[11px] text-[#111318]/40 mt-0.5">Menunggu pelunasan</p>
              </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="panel px-4 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#111318]/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nomor invoice, klien, event…"
                  value={archiveSearchQuery}
                  onChange={(e) => setArchiveSearchQuery(e.target.value)}
                  className="field-input pl-9 text-[12px] w-full"
                />
              </div>

              {/* Filter text links */}
              <div className="flex items-center gap-1 overflow-x-auto">
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
                    className={`px-3 py-1.5 rounded text-[12px] font-medium whitespace-nowrap transition-colors ${
                      archiveStatusFilter === f.id
                        ? 'bg-[#4f46e5] text-white'
                        : 'text-[#111318]/50 hover:text-[#111318] hover:bg-[rgba(17,19,24,0.05)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoice Table */}
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>No. Invoice &amp; Versi</th>
                      <th>Tgl Terbit</th>
                      <th>Klien &amp; Instansi</th>
                      <th>Nama Event</th>
                      <th className="text-right">Nilai Total</th>
                      <th className="text-center">Status Bayar</th>
                      <th className="text-center">Arsip</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-14 text-center">
                          <Archive className="w-8 h-8 mx-auto mb-2 text-[#111318]/20" />
                          <p className="text-[13px] font-semibold text-[#111318]/50">
                            Tidak ada invoice ditemukan.
                          </p>
                          <p className="text-[12px] text-[#111318]/30 mt-0.5">
                            Coba ganti filter atau cari kata kunci lainnya.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv, idx) => {
                        const latestRev = inv.revisions[0];
                        const isArchived = inv.isArchived;

                        return (
                          <tr
                            key={inv.id}
                            className={`table-row-hover stagger-${Math.min(idx + 1, 8)} ${
                              isArchived ? 'opacity-60' : ''
                            }`}
                          >
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[12px] font-bold text-[#111318]">
                                  #{inv.invoiceNumber}
                                </span>
                                <span className="badge-ink font-mono text-[10px]">
                                  {latestRev?.version || 'v1.0'}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#111318]/40 font-mono block mt-0.5">
                                {inv.revisions.length} snapshot
                              </span>
                            </td>

                            <td>
                              <span className="font-mono text-[12px] text-[#111318]/60">
                                {inv.createdAt}
                              </span>
                            </td>

                            <td>
                              <div className="text-[13px] font-semibold text-[#111318]">
                                {inv.clientName}
                              </div>
                              {inv.clientCompany && (
                                <div className="text-[11px] text-[#111318]/50">{inv.clientCompany}</div>
                              )}
                            </td>

                            <td>
                              <div className="text-[13px] font-medium text-[#111318] truncate max-w-[180px]">
                                {inv.eventName}
                              </div>
                              <div className="text-[11px] text-[#111318]/40 truncate max-w-[180px]">
                                {inv.eventLocation}
                              </div>
                            </td>

                            <td className="text-right">
                              <span className="font-mono tabular-nums text-[12px] font-bold text-[#111318]">
                                {formatRupiah(inv.totalAmount)}
                              </span>
                            </td>

                            <td className="text-center">
                              <span className={paymentBadgeClass(inv.paymentStatus)}>
                                {inv.paymentStatus}
                              </span>
                            </td>

                            <td className="text-center">
                              {isArchived ? (
                                <span className="badge-ink">Terarsip</span>
                              ) : (
                                <span className="badge-emerald">Aktif</span>
                              )}
                            </td>

                            <td className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* 1-Click Preview Button */}
                                <button
                                  onClick={() => handleOpenPreview(inv)}
                                  className="p-1.5 rounded text-[#4f46e5] hover:bg-[#4f46e5]/10 transition-colors"
                                  title="Lihat Pratinjau Kertas Invoice"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => handleOpenEditor(inv)}
                                  className="p-1.5 rounded text-[#111318]/60 hover:bg-[rgba(17,19,24,0.07)] transition-colors"
                                  title="Buka Workspace Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {/* Archive Toggle Button */}
                                <button
                                  onClick={() => handleToggleArchive(inv.id)}
                                  className={`p-1.5 rounded transition-colors ${
                                    isArchived
                                      ? 'text-[#d97706] hover:bg-[#d97706]/10'
                                      : 'text-[#111318]/40 hover:bg-[rgba(17,19,24,0.07)]'
                                  }`}
                                  title={isArchived ? 'Buka dari Arsip' : 'Pindahkan ke Arsip'}
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>

                                {/* PDF Download Button */}
                                <button
                                  onClick={() => {
                                    const snap = inv.revisions[0]?.snapshot;
                                    if (snap) handleDownloadPdf(snap);
                                  }}
                                  className="p-1.5 rounded text-[#111318]/40 hover:bg-[rgba(17,19,24,0.07)] transition-colors"
                                  title="Unduh Dokumen PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePromptDeleteInvoice(inv.id);
                                  }}
                                  className="p-1.5 rounded text-[#be123c]/60 hover:bg-[#be123c]/10 transition-colors"
                                  title="Hapus Invoice Permanen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
          <div className="space-y-5">
            {/* Active Invoice Context Banner */}
            <div className="nav-surface rounded-xl px-5 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-[15px] font-bold text-white tracking-tight">
                    Mengedit Invoice
                  </h3>
                  <span className="font-mono text-[13px] font-bold text-white/70">
                    #{activeInvoice.invoiceNumber}
                  </span>
                  <span className="badge-indigo font-mono text-[11px]">
                    {editableSnapshot.version}
                  </span>
                  <span className={paymentBadgeClass(editableSnapshot.financials.paymentStatus)}>
                    {editableSnapshot.financials.paymentStatus}
                  </span>
                </div>
                <p className="text-[12px] text-white/50">
                  {editableSnapshot.event.name} — {editableSnapshot.client.name}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewInvoiceRecord(activeInvoice);
                    setIsPreviewModalOpen(true);
                  }}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau A4</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveInvoiceChanges}
                  className="btn-primary flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowNewRevisionModal(true)}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kunci Revisi Baru</span>
                </button>
              </div>
            </div>

            {/* Warning banner when editing an older snapshot */}
            {isOlderVersion && (
              <div className="panel border-l-4 border-[#d97706] px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                <div className="text-[12px] leading-relaxed text-[#111318]/80">
                  <span className="font-bold text-[#111318] block">
                    Mengedit snapshot versi lama ({currentRevision?.version})
                  </span>
                  Versi terbaru saat ini adalah{' '}
                  <strong className="font-mono">{latestRevision.version}</strong>. Perubahan yang
                  Anda simpan akan memperbarui snapshot versi ini.
                </div>
              </div>
            )}

            {/* GRID FORMULIR EDIT: 2 KOLOM BESAR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              {/* ============================================================== */}
              {/* CARD 1: INFORMASI VENDOR & KOP SURAT                           */}
              {/* ============================================================== */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(17,19,24,0.08)]">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#4f46e5]" />
                    <div>
                      <h4 className="text-[13px] font-bold text-[#111318]">
                        Informasi Vendor &amp; Kop Surat
                      </h4>
                      <p className="text-[11px] text-[#111318]/40">
                        Logo, nama usaha, alamat, dan info rekening yang tercetak
                      </p>
                    </div>
                  </div>
                  <span className="badge-indigo text-[10px]">Vendor</span>
                </div>

                {/* Live Preview Kop & Logo */}
                <div className="p-3 bg-[rgba(17,19,24,0.03)] border border-[rgba(17,19,24,0.08)] rounded-lg flex items-center gap-3">
                  {vendorForm.logoUrl ? (
                    <img
                      src={vendorForm.logoUrl}
                      alt="Logo Vendor"
                      className="w-11 h-11 object-contain rounded border border-[rgba(17,19,24,0.12)] bg-white p-1 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded text-white font-bold text-[13px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: vendorForm.logoBgColor || '#0F172A' }}
                    >
                      {vendorForm.logoText || 'RP'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#111318] truncate">
                      {vendorForm.companyName || 'Nama Bisnis Vendor'}
                    </div>
                    <div className="text-[11px] text-[#111318]/50 truncate">
                      {vendorForm.legalName || 'PT/CV Legal'}
                    </div>
                    <div className="text-[11px] text-[#4f46e5] truncate italic">
                      {vendorForm.logoTagline || 'Tagline Slogan Rental'}
                    </div>
                  </div>
                </div>

                {/* Logo Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[rgba(17,19,24,0.02)] p-3 rounded-lg border border-[rgba(17,19,24,0.07)]">
                  <div>
                    <label className="field-label mb-1 block">Inisial Monogram Logo:</label>
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
                      className="field-input font-mono font-bold text-center tracking-wider uppercase w-full"
                      placeholder="V1"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Warna Latar Logo:</label>
                    <div className="flex items-center gap-1.5 pt-1.5">
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
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${
                            vendorForm.logoBgColor === c.color
                              ? 'scale-125 border-[#4f46e5] ring-2 ring-[#4f46e5]/30'
                              : 'border-white'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-[rgba(17,19,24,0.08)] flex items-center gap-2">
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
                      className="btn-ghost text-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
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
                        className="text-[11px] text-[#be123c] hover:underline"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                </div>

                {/* Vendor Company Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="field-label mb-1 block">Nama Usaha / Brand:</label>
                    <input
                      type="text"
                      value={vendorForm.companyName}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          companyName: e.target.value,
                        })
                      }
                      className="field-input w-full text-[12px]"
                      placeholder="VENDORONE AUDIO VISUAL"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Nama Badan Hukum:</label>
                    <input
                      type="text"
                      value={vendorForm.legalName}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          legalName: e.target.value,
                        })
                      }
                      className="field-input w-full text-[12px]"
                      placeholder="PT VendorOne Teknologi Kreatif"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="field-label mb-1 block">Slogan / Tagline Kop Surat:</label>
                    <input
                      type="text"
                      value={vendorForm.logoTagline || ''}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          logoTagline: e.target.value,
                        })
                      }
                      className="field-input w-full text-[12px]"
                      placeholder="Professional Audio Visual & Event Gear Rental"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="field-label mb-1 block">Alamat Lengkap:</label>
                    <textarea
                      rows={2}
                      value={vendorForm.address}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          address: e.target.value,
                        })
                      }
                      className="field-input w-full text-[12px]"
                      placeholder="Alamat kantor..."
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Telepon Kantor:</label>
                    <input
                      type="text"
                      value={vendorForm.phone}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          phone: e.target.value,
                        })
                      }
                      className="field-input w-full text-[12px] font-mono"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">WhatsApp Admin:</label>
                    <input
                      type="text"
                      value={vendorForm.whatsapp}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          whatsapp: e.target.value,
                        })
                      }
                      className="field-input w-full text-[12px] font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="field-label mb-1 block">Email Resmi Invoice:</label>
                    <input
                      type="email"
                      value={vendorForm.email}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          email: e.target.value,
                        })
                      }
                      className="field-input w-full text-[12px]"
                    />
                  </div>
                </div>

                {/* Vendor Bank Account Information */}
                <div className="bg-[rgba(17,19,24,0.02)] p-3.5 rounded-lg border border-[rgba(17,19,24,0.07)] space-y-2">
                  <span className="section-label block">Rekening Bank Pembayaran</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="field-label mb-1 block text-[10px]">Nama Bank:</label>
                      <input
                        type="text"
                        value={vendorForm.bankName}
                        onChange={(e) =>
                          setVendorForm({
                            ...vendorForm,
                            bankName: e.target.value,
                          })
                        }
                        className="field-input w-full text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="field-label mb-1 block text-[10px]">No. Rekening:</label>
                      <input
                        type="text"
                        value={vendorForm.bankAccount}
                        onChange={(e) =>
                          setVendorForm({
                            ...vendorForm,
                            bankAccount: e.target.value,
                          })
                        }
                        className="field-input w-full text-[12px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="field-label mb-1 block text-[10px]">Atas Nama:</label>
                      <input
                        type="text"
                        value={vendorForm.bankAccountHolder}
                        onChange={(e) =>
                          setVendorForm({
                            ...vendorForm,
                            bankAccountHolder: e.target.value,
                          })
                        }
                        className="field-input w-full text-[12px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* CARD 2: INFORMASI KLIEN & EVENT                                */}
              {/* ============================================================== */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(17,19,24,0.08)]">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-[#4f46e5]" />
                    <div>
                      <h4 className="text-[13px] font-bold text-[#111318]">
                        Informasi Klien &amp; Detail Event
                      </h4>
                      <p className="text-[11px] text-[#111318]/40">
                        Penyewa, PIC, venue, tanggal sewa
                      </p>
                    </div>
                  </div>
                  <span className="badge-emerald text-[10px]">Klien / Acara</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="field-label mb-1 block">Nama Klien / PIC:</label>
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
                      className="field-input w-full text-[12px]"
                      placeholder="cth: Bapak Budi Santoso"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Perusahaan / Instansi:</label>
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
                      className="field-input w-full text-[12px]"
                      placeholder="cth: PT Telkom Indonesia"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">WhatsApp / Telp Klien:</label>
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
                      className="field-input w-full text-[12px] font-mono"
                      placeholder="0812-xxxx-xxxx"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Email Klien:</label>
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
                      className="field-input w-full text-[12px]"
                      placeholder="email@klien.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="field-label mb-1 block">Alamat Lengkap Klien:</label>
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
                      className="field-input w-full text-[12px]"
                      placeholder="Alamat kantor penyewa..."
                    />
                  </div>

                  {/* Event Details */}
                  <div className="sm:col-span-2 pt-2 border-t border-[rgba(17,19,24,0.07)]">
                    <label className="field-label mb-1 block">Nama Acara / Event:</label>
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
                      className="field-input w-full text-[12px] font-semibold"
                      placeholder="cth: Seminar Nasional Digital 2026"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="field-label mb-1 block">Lokasi / Venue:</label>
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
                      className="field-input w-full text-[12px]"
                      placeholder="cth: Ballroom Hotel Mulia Senayan"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Tanggal Mulai Sewa:</label>
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
                      className="field-input w-full text-[12px] font-mono"
                      placeholder="cth: 10 Okt 2026"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Tanggal Selesai Sewa:</label>
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
                      className="field-input w-full text-[12px] font-mono"
                      placeholder="cth: 12 Okt 2026"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Durasi Hari Sewa:</label>
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
                      className="field-input w-full text-[12px] font-mono"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">PIC Internal:</label>
                    <input
                      type="text"
                      value={editableSnapshot.createdBy}
                      onChange={(e) =>
                        setEditableSnapshot({
                          ...editableSnapshot,
                          createdBy: e.target.value,
                        })
                      }
                      className="field-input w-full text-[12px]"
                      placeholder="Admin Project"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* CARD 3: TABEL ITEM ALAT                                         */}
            {/* ============================================================== */}
            <div className="panel p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(17,19,24,0.08)]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4f46e5]" />
                  <div>
                    <h4 className="text-[13px] font-bold text-[#111318]">
                      Rincian Item Alat Rental &amp; Tarif
                    </h4>
                    <p className="text-[11px] text-[#111318]/40">
                      Tarif per hari, jumlah unit, dan durasi dapat diedit langsung
                    </p>
                  </div>
                </div>

                <span className="font-mono text-[11px] font-bold text-[#111318]/50 bg-[rgba(17,19,24,0.05)] px-3 py-1 rounded">
                  {editableSnapshot.items.length} item
                </span>
              </div>

              {/* Table of items */}
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="w-10 text-center">No</th>
                      <th className="min-w-[200px]">Deskripsi Alat</th>
                      <th className="w-32">Kategori</th>
                      <th className="w-20 text-center">Qty</th>
                      <th className="w-20 text-center">Hari</th>
                      <th className="w-36 text-right">Tarif / Hari</th>
                      <th className="w-36 text-right">Subtotal</th>
                      <th className="w-12 text-center">—</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableSnapshot.items.map((item, idx) => (
                      <tr key={idx} className="table-row-hover">
                        <td className="text-center font-mono text-[11px] text-[#111318]/40 font-semibold">
                          {idx + 1}
                        </td>

                        <td>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                            className="field-input w-full text-[12px] font-semibold"
                          />
                        </td>

                        <td>
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateItem(idx, 'category', e.target.value)}
                            className="field-input w-full text-[11px]"
                          >
                            <option value="Kamera & Lensa">Kamera &amp; Lensa</option>
                            <option value="Audio & Sound">Audio &amp; Sound</option>
                            <option value="Lighting & Effect">Lighting &amp; Effect</option>
                            <option value="Visual & LED">Visual &amp; LED</option>
                            <option value="Rigging & Truss">Rigging &amp; Truss</option>
                            <option value="Power & Kabel">Power &amp; Kabel</option>
                          </select>
                        </td>

                        <td className="text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                            className="field-input w-16 text-center text-[12px] font-mono font-bold"
                          />
                        </td>

                        <td className="text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.days}
                            onChange={(e) => handleUpdateItem(idx, 'days', e.target.value)}
                            className="field-input w-16 text-center text-[12px] font-mono"
                          />
                        </td>

                        <td className="text-right">
                          <input
                            type="number"
                            step={50000}
                            min={0}
                            value={item.dailyRate}
                            onChange={(e) => handleUpdateItem(idx, 'dailyRate', e.target.value)}
                            className="field-input w-28 text-right text-[12px] font-mono"
                          />
                          <span className="block text-[10px] text-[#111318]/30 font-mono mt-0.5 tabular-nums">
                            {formatRupiah(item.dailyRate)}
                          </span>
                        </td>

                        <td className="text-right font-mono tabular-nums text-[12px] font-bold text-[#111318]">
                          {formatRupiah(item.subtotal)}
                        </td>

                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 rounded text-[#be123c]/60 hover:bg-[#be123c]/10 transition-colors"
                            title="Hapus baris item ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Form Tambah Item Baru dari Katalog Master Alat */}
              <div className="bg-[rgba(17,19,24,0.02)] p-4 rounded-lg border border-[rgba(17,19,24,0.07)] flex flex-col md:flex-row items-stretch md:items-end gap-3">
                <div className="flex-1">
                  <label className="field-label mb-1 block">Pilih Alat dari Katalog Master:</label>
                  <select
                    value={addItemEquipmentId}
                    onChange={(e) => setAddItemEquipmentId(e.target.value)}
                    className="field-input w-full text-[12px]"
                  >
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} — {eq.category} ({formatRupiah(eq.dailyRate)}/hari)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <label className="field-label mb-1 block">Qty:</label>
                  <input
                    type="number"
                    min={1}
                    value={addItemQty}
                    onChange={(e) => setAddItemQty(Math.max(1, Number(e.target.value) || 1))}
                    className="field-input w-full text-center text-[12px] font-mono"
                  />
                </div>

                <div className="w-24">
                  <label className="field-label mb-1 block">Hari:</label>
                  <input
                    type="number"
                    min={1}
                    value={addItemDays}
                    onChange={(e) => setAddItemDays(Math.max(1, Number(e.target.value) || 1))}
                    className="field-input w-full text-center text-[12px] font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToInvoice}
                  className="btn-primary flex items-center justify-center gap-1.5 text-[12px] whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah ke Invoice</span>
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* CARD 4: KALKULASI FINANSIAL & STATUS PEMBAYARAN                 */}
            {/* ============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              {/* Syarat Sewa / Ketentuan */}
              <div className="panel p-5 space-y-4">
                <h4 className="text-[13px] font-bold text-[#111318] border-b border-[rgba(17,19,24,0.08)] pb-2">
                  Syarat &amp; Ketentuan Sewa
                </h4>
                <p className="text-[11px] text-[#111318]/50">
                  Teks ketentuan ini tercetak di lembar invoice resmi bagi klien:
                </p>

                <div className="space-y-2">
                  {editableSnapshot.terms.map((term, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#111318]/30 font-bold shrink-0">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={term}
                        onChange={(e) => {
                          const clone = JSON.parse(JSON.stringify(editableSnapshot));
                          clone.terms[i] = e.target.value;
                          setEditableSnapshot(clone);
                        }}
                        className="field-input flex-1 text-[12px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clone = JSON.parse(JSON.stringify(editableSnapshot));
                          clone.terms.splice(i, 1);
                          setEditableSnapshot(clone);
                        }}
                        className="text-[#111318]/30 hover:text-[#be123c] transition-colors p-1"
                      >
                        <X className="w-3.5 h-3.5" />
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
                    className="text-[12px] text-[#4f46e5] hover:underline font-semibold flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Baris Ketentuan</span>
                  </button>
                </div>
              </div>

              {/* Kalkulasi Finansial */}
              <div className="panel p-5 space-y-4">
                <h4 className="text-[13px] font-bold text-[#111318] border-b border-[rgba(17,19,24,0.08)] pb-2">
                  Kalkulasi Finansial &amp; Pembayaran
                </h4>

                <div className="space-y-2.5 font-mono text-[12px]">
                  <div className="flex justify-between items-center py-1 text-[#111318]/60 border-b border-[rgba(17,19,24,0.06)]">
                    <span>Subtotal Sewa Alat:</span>
                    <span className="font-bold text-[#111318] tabular-nums">
                      {formatRupiah(editableSnapshot.financials.subtotal)}
                    </span>
                  </div>

                  {/* Diskon */}
                  <div className="flex justify-between items-center py-1 border-b border-[rgba(17,19,24,0.06)]">
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
                          className="field-input w-14 text-center text-[12px]"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <span className="text-[#059669] font-bold tabular-nums">
                      - {formatRupiah(editableSnapshot.financials.discountAmount)}
                    </span>
                  </div>

                  {/* Biaya Kru */}
                  <div className="flex justify-between items-center py-1 border-b border-[rgba(17,19,24,0.06)]">
                    <span>Biaya Kru &amp; Teknisi:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#111318]/30">Rp</span>
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
                        className="field-input w-32 text-right text-[12px]"
                      />
                    </div>
                  </div>

                  {/* Biaya Pengiriman */}
                  <div className="flex justify-between items-center py-1 border-b border-[rgba(17,19,24,0.06)]">
                    <span>Ongkos Kirim &amp; Loading:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#111318]/30">Rp</span>
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
                        className="field-input w-32 text-right text-[12px]"
                      />
                    </div>
                  </div>

                  {/* PPN 11% Toggle */}
                  <div className="flex justify-between items-center py-1 border-b border-[rgba(17,19,24,0.06)]">
                    <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                      <input
                        type="checkbox"
                        checked={editableSnapshot.financials.taxPercent > 0}
                        onChange={(e) => {
                          const clone = JSON.parse(JSON.stringify(editableSnapshot));
                          clone.financials.taxPercent = e.target.checked ? 11 : 0;
                          recalculateSnapshotFinancials(clone);
                          setEditableSnapshot(clone);
                        }}
                        className="rounded border-[rgba(17,19,24,0.2)] text-[#4f46e5] focus:ring-[#4f46e5]"
                      />
                      <span>Aktifkan PPN 11%</span>
                    </label>
                    <span className="tabular-nums">
                      {formatRupiah(editableSnapshot.financials.taxAmount)}
                    </span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-center py-2.5 bg-[rgba(17,19,24,0.04)] px-3 rounded-lg">
                    <span className="text-[13px] font-bold text-[#111318]">TOTAL TAGIHAN:</span>
                    <span className="metric-figure-mono text-[#4f46e5] text-[16px]">
                      {formatRupiah(editableSnapshot.financials.grandTotal)}
                    </span>
                  </div>

                  {/* Status Pembayaran & DP */}
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#111318]/60">Status Pembayaran:</span>
                      <select
                        value={editableSnapshot.financials.paymentStatus}
                        onChange={(e) => {
                          const clone = JSON.parse(JSON.stringify(editableSnapshot));
                          clone.financials.paymentStatus = e.target.value as PaymentStatus;
                          setEditableSnapshot(clone);
                        }}
                        className="field-input text-[12px] font-bold"
                      >
                        <option value="Belum Bayar">Belum Bayar</option>
                        <option value="DP 50%">DP 50%</option>
                        <option value="Lunas">Lunas</option>
                      </select>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#111318]/60">Sudah Dibayar (DP):</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[#111318]/30">Rp</span>
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
                          className="field-input w-32 text-right text-[12px] text-[#059669] font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1 font-bold text-[#111318] border-t border-[rgba(17,19,24,0.08)]">
                      <span>Sisa Tagihan:</span>
                      <span className="font-mono tabular-nums text-[#be123c]">
                        {formatRupiah(editableSnapshot.financials.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save Button Action */}
                <div className="pt-3 border-t border-[rgba(17,19,24,0.08)]">
                  <button
                    type="button"
                    onClick={handleSaveInvoiceChanges}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-[13px]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Invoice &amp; Kop</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: PRATINJAU KERTAS INVOICE A4 ("ketika di-klik saja")     */}
        {/* ============================================================== */}
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#111318]/85 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 flex justify-center items-start animate-backdrop-enter">
            <div className="panel-elevated max-w-4xl w-full overflow-hidden my-auto flex flex-col max-h-[95vh] animate-dialog-enter">
              {/* Modal Top Control Bar */}
              <div className="nav-surface px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#6366f1]" />
                  <h3 className="font-bold text-[13px] text-white">
                    Pratinjau Invoice
                  </h3>
                  <span className="font-mono text-[12px] text-white/60">
                    #{modalPreviewSnapshot.invoiceNumber}
                  </span>
                  <span className="badge-indigo font-mono text-[10px]">
                    {modalPreviewSnapshot.version}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-ghost flex items-center gap-1.5 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(modalPreviewSnapshot)}
                    disabled={isGeneratingPdf}
                    className="btn-primary flex items-center gap-1.5 text-xs disabled:opacity-50"
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
                    className="btn-ghost flex items-center gap-1.5 text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="text-white/40 hover:text-white transition-colors p-1.5 rounded hover:bg-white/10 ml-1"
                    title="Tutup (ESC)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body: KERTAS A4 REALISTIS */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-[#e8e6e3]">
                <div
                  id="printable-invoice"
                  className="bg-white rounded-lg shadow-lg border border-[rgba(17,19,24,0.12)] p-6 sm:p-10 text-[#111318] space-y-6 max-w-3xl mx-auto relative"
                  style={{ background: '#fefdfb' }}
                >
                  {/* Watermark Draft / Versi Lama */}
                  {isOlderVersion && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-25deg] select-none">
                      <span className="text-8xl font-black text-[#111318] uppercase">
                        ARSIP {modalPreviewSnapshot.version}
                      </span>
                    </div>
                  )}

                  {/* KOP SURAT VENDOR */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-[#111318]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        {modalPreviewCompany.logoUrl ? (
                          <img
                            src={modalPreviewCompany.logoUrl}
                            alt="Logo"
                            className="w-10 h-10 object-contain rounded border border-[rgba(17,19,24,0.12)] bg-white p-0.5 shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded text-white font-bold text-[14px] flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: modalPreviewCompany.logoBgColor || '#0F172A',
                            }}
                          >
                            {modalPreviewCompany.logoText || 'RP'}
                          </div>
                        )}
                        <div>
                          <h1 className="text-[20px] font-bold tracking-tight text-[#111318] leading-tight">
                            {modalPreviewCompany.companyName}
                          </h1>
                          <p className="text-[11px] text-[#111318]/60 font-medium">
                            {modalPreviewCompany.legalName}
                          </p>
                        </div>
                      </div>
                      {modalPreviewCompany.logoTagline && (
                        <p className="text-[11px] text-[#4f46e5] font-medium italic pt-0.5">
                          {modalPreviewCompany.logoTagline}
                        </p>
                      )}
                      <p className="text-[11px] text-[#111318]/50 max-w-sm leading-relaxed font-mono pt-1">
                        {modalPreviewCompany.address}
                        <br />
                        Telp: {modalPreviewCompany.phone} | WA: {modalPreviewCompany.whatsapp} |{' '}
                        {modalPreviewCompany.email}
                      </p>
                    </div>

                    <div className="text-left sm:text-right space-y-1 shrink-0">
                      <span className="text-[28px] font-black tracking-tight text-[#111318] block uppercase">
                        INVOICE
                      </span>
                      <div className="font-mono text-[20px] font-bold text-[#111318]">
                        #{modalPreviewSnapshot.invoiceNumber}
                      </div>
                      <div className="font-mono text-[12px] text-[#111318]/50">
                        Tgl Terbit:{' '}
                        <span className="font-semibold text-[#111318]/80">
                          {modalPreviewSnapshot.createdAt}
                        </span>
                      </div>
                      <div className="text-[12px] text-[#111318]/50">
                        Status:{' '}
                        <span className={paymentBadgeClass(modalPreviewSnapshot.financials.paymentStatus)}>
                          {modalPreviewSnapshot.financials.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DETAIL KLIEN & EVENT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px] py-1">
                    <div className="bg-[rgba(17,19,24,0.03)] p-3.5 rounded border border-[rgba(17,19,24,0.08)] space-y-1">
                      <span className="section-label block">Ditujukan Kepada (Penyewa):</span>
                      <div className="text-[14px] font-bold text-[#111318]">
                        {modalPreviewSnapshot.client.name}
                      </div>
                      {modalPreviewSnapshot.client.company && (
                        <div className="text-[#111318]/70 font-medium">
                          {modalPreviewSnapshot.client.company}
                        </div>
                      )}
                      <div className="text-[#111318]/50 font-mono text-[11px]">
                        {modalPreviewSnapshot.client.phone} | {modalPreviewSnapshot.client.email}
                      </div>
                      <div className="text-[#111318]/50 text-[11px] leading-relaxed">
                        {modalPreviewSnapshot.client.address}
                      </div>
                    </div>

                    <div className="bg-[rgba(17,19,24,0.03)] p-3.5 rounded border border-[rgba(17,19,24,0.08)] space-y-1">
                      <span className="section-label block">Rincian Event:</span>
                      <div className="text-[14px] font-bold text-[#111318]">
                        {modalPreviewSnapshot.event.name}
                      </div>
                      <div className="text-[#111318]/70">
                        Lokasi:{' '}
                        <span className="font-medium text-[#111318]">
                          {modalPreviewSnapshot.event.location}
                        </span>
                      </div>
                      <div className="text-[#111318]/50 font-mono text-[11px]">
                        {modalPreviewSnapshot.event.startDate} — {modalPreviewSnapshot.event.endDate}{' '}
                        ({modalPreviewSnapshot.event.durationDays} Hari Sewa)
                      </div>
                      <div className="text-[11px] text-[#111318]/50">
                        PIC: {modalPreviewSnapshot.createdBy}
                      </div>
                    </div>
                  </div>

                  {/* TABEL ITEM ALAT */}
                  <div>
                    <table className="data-table w-full">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Deskripsi Alat &amp; Spesifikasi</th>
                          <th className="text-center">Qty</th>
                          <th className="text-center">Hari</th>
                          <th className="text-right">Tarif / Hari</th>
                          <th className="text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalPreviewSnapshot.items.map((item, idx) => (
                          <tr key={idx} className="table-row-hover">
                            <td className="font-mono text-[11px] text-[#111318]/40">{idx + 1}</td>
                            <td>
                              <div className="font-bold text-[#111318] text-[13px]">{item.name}</div>
                              <div className="text-[11px] text-[#111318]/40">
                                {item.category}
                              </div>
                            </td>
                            <td className="text-center font-mono tabular-nums font-semibold text-[#111318]">
                              {item.qty} Unit
                            </td>
                            <td className="text-center font-mono tabular-nums text-[#111318]/60">
                              {item.days}
                            </td>
                            <td className="text-right font-mono tabular-nums text-[#111318]/60 text-[12px]">
                              {formatRupiah(item.dailyRate)}
                            </td>
                            <td className="text-right font-mono tabular-nums font-bold text-[#111318] text-[12px]">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* KALKULASI FINANSIAL & BANK */}
                  <div className="pt-4 border-t border-[rgba(17,19,24,0.1)] grid grid-cols-1 sm:grid-cols-2 gap-6 text-[12px]">
                    <div className="space-y-2">
                      <span className="section-label block">Ketentuan Pembayaran &amp; Rekening:</span>
                      <div className="bg-[rgba(17,19,24,0.03)] p-3 rounded border border-[rgba(17,19,24,0.08)] text-[11px] space-y-1">
                        <div className="font-bold text-[#111318]">
                          {modalPreviewCompany.bankName}
                        </div>
                        <div>
                          No. Rek:{' '}
                          <strong className="font-mono text-[#111318]">
                            {modalPreviewCompany.bankAccount}
                          </strong>
                        </div>
                        <div>
                          Atas Nama:{' '}
                          <strong className="text-[#111318]">
                            {modalPreviewCompany.bankAccountHolder}
                          </strong>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#111318]/50 space-y-1">
                        <div className="font-bold text-[#111318]/70">Syarat Sewa:</div>
                        {modalPreviewSnapshot.terms.map((term, i) => (
                          <p key={i}>• {term}</p>
                        ))}
                      </div>
                    </div>

                    {/* Rincian Angka — payment status strip */}
                    <div
                      className={`space-y-1.5 font-mono text-[12px] border-l-4 pl-4 ${
                        modalPreviewSnapshot.financials.paymentStatus === 'Lunas'
                          ? 'border-[#059669]'
                          : modalPreviewSnapshot.financials.paymentStatus === 'DP 50%'
                          ? 'border-[#d97706]'
                          : 'border-[#be123c]'
                      }`}
                    >
                      <div className="flex justify-between py-1 text-[#111318]/60 border-b border-[rgba(17,19,24,0.06)]">
                        <span>Subtotal Sewa Alat:</span>
                        <span className="font-semibold text-[#111318] tabular-nums">
                          {formatRupiah(modalPreviewSnapshot.financials.subtotal)}
                        </span>
                      </div>

                      {modalPreviewSnapshot.financials.discountAmount > 0 && (
                        <div className="flex justify-between py-1 text-[#059669] border-b border-[rgba(17,19,24,0.06)]">
                          <span>
                            Diskon ({modalPreviewSnapshot.financials.discountPercent}%):
                          </span>
                          <span className="tabular-nums">- {formatRupiah(modalPreviewSnapshot.financials.discountAmount)}</span>
                        </div>
                      )}

                      {modalPreviewSnapshot.financials.crewFee > 0 && (
                        <div className="flex justify-between py-1 text-[#111318]/60 border-b border-[rgba(17,19,24,0.06)]">
                          <span>Biaya Kru &amp; Teknisi:</span>
                          <span className="tabular-nums">{formatRupiah(modalPreviewSnapshot.financials.crewFee)}</span>
                        </div>
                      )}

                      {modalPreviewSnapshot.financials.deliveryFee > 0 && (
                        <div className="flex justify-between py-1 text-[#111318]/60 border-b border-[rgba(17,19,24,0.06)]">
                          <span>Ongkos Kirim &amp; Loading:</span>
                          <span className="tabular-nums">{formatRupiah(modalPreviewSnapshot.financials.deliveryFee)}</span>
                        </div>
                      )}

                      {modalPreviewSnapshot.financials.taxAmount > 0 && (
                        <div className="flex justify-between py-1 text-[#111318]/60 border-b border-[rgba(17,19,24,0.06)]">
                          <span>PPN 11%:</span>
                          <span className="tabular-nums">{formatRupiah(modalPreviewSnapshot.financials.taxAmount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between py-2.5 font-bold text-[#111318] bg-[rgba(17,19,24,0.04)] px-3 rounded">
                        <span>TOTAL TAGIHAN:</span>
                        <span className="metric-figure-mono text-[#4f46e5] text-[15px] tabular-nums">
                          {formatRupiah(modalPreviewSnapshot.financials.grandTotal)}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 text-[#111318]/60">
                        <span>Sudah Dibayar (DP):</span>
                        <span className="text-[#059669] font-semibold tabular-nums">
                          {formatRupiah(modalPreviewSnapshot.financials.paidAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 text-[#111318] font-bold border-t border-[rgba(17,19,24,0.1)]">
                        <span>Sisa Pembayaran:</span>
                        <span className="text-[#be123c] tabular-nums">
                          {formatRupiah(modalPreviewSnapshot.financials.remainingAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TANDA TANGAN */}
                  <div className="pt-8 border-t border-[rgba(17,19,24,0.1)] grid grid-cols-2 text-center text-[12px]">
                    <div>
                      <p className="text-[#111318]/50">Penyewa / PIC Klien</p>
                      <div className="h-14" />
                      <p className="font-bold text-[#111318]">
                        ({modalPreviewSnapshot.client.name})
                      </p>
                    </div>
                    <div>
                      <p className="text-[#111318]/50">
                        Hormat Kami, {modalPreviewCompany.companyName}
                      </p>
                      <div className="h-14" />
                      <p className="font-bold text-[#111318]">
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
          <div className="fixed inset-0 z-50 bg-[#111318]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop-enter">
            <form
              onSubmit={handleCreateNewInvoiceSubmit}
              className="panel-elevated max-w-lg w-full overflow-hidden animate-dialog-enter"
            >
              <div className="nav-surface px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#6366f1]" />
                  <h3 className="font-bold text-[13px] text-white">Buat Invoice Penawaran Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="text-white/40 hover:text-white transition-colors p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="field-label mb-1 block">Nomor Invoice:</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.invoiceNumber}
                    onChange={(e) =>
                      setNewInvoiceForm({ ...newInvoiceForm, invoiceNumber: e.target.value })
                    }
                    className="field-input w-full font-mono font-bold"
                  />
                </div>

                {bookings.length > 0 && (
                  <div>
                    <label className="field-label mb-1 block">
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
                      className="field-input w-full"
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
                    <label className="field-label mb-1 block">Nama Klien / PIC:</label>
                    <input
                      type="text"
                      required
                      value={newInvoiceForm.clientName}
                      onChange={(e) =>
                        setNewInvoiceForm({ ...newInvoiceForm, clientName: e.target.value })
                      }
                      className="field-input w-full"
                      placeholder="Nama PIC"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Perusahaan / EO:</label>
                    <input
                      type="text"
                      value={newInvoiceForm.clientCompany}
                      onChange={(e) =>
                        setNewInvoiceForm({ ...newInvoiceForm, clientCompany: e.target.value })
                      }
                      className="field-input w-full"
                      placeholder="PT / EO Klien"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label mb-1 block">Nama Acara / Event:</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.eventName}
                    onChange={(e) =>
                      setNewInvoiceForm({ ...newInvoiceForm, eventName: e.target.value })
                    }
                    className="field-input w-full"
                    placeholder="Nama Acara"
                  />
                </div>

                <div>
                  <label className="field-label mb-1 block">Lokasi Venue:</label>
                  <input
                    type="text"
                    value={newInvoiceForm.eventLocation}
                    onChange={(e) =>
                      setNewInvoiceForm({ ...newInvoiceForm, eventLocation: e.target.value })
                    }
                    className="field-input w-full"
                    placeholder="Venue Acara"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label mb-1 block">Tanggal Mulai:</label>
                    <input
                      type="date"
                      required
                      value={newInvoiceForm.startDate}
                      onChange={(e) =>
                        setNewInvoiceForm({ ...newInvoiceForm, startDate: e.target.value })
                      }
                      className="field-input w-full font-mono"
                    />
                  </div>

                  <div>
                    <label className="field-label mb-1 block">Tanggal Selesai:</label>
                    <input
                      type="date"
                      required
                      value={newInvoiceForm.endDate}
                      onChange={(e) =>
                        setNewInvoiceForm({ ...newInvoiceForm, endDate: e.target.value })
                      }
                      className="field-input w-full font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-[rgba(17,19,24,0.03)] border-t border-[rgba(17,19,24,0.08)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="btn-ghost text-[12px]"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary text-[12px]">
                  Buat &amp; Masuk ke Editor
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: KUNCI REVISI BARU (SNAPSHOT v1.x)                       */}
        {/* ============================================================== */}
        {showNewRevisionModal && (
          <div className="fixed inset-0 z-50 bg-[#111318]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop-enter">
            <form
              onSubmit={handleCreateNewRevision}
              className="panel-elevated max-w-md w-full overflow-hidden animate-dialog-enter"
            >
              <div className="nav-surface px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#6366f1]" />
                  <h3 className="font-bold text-[13px] text-white">Kunci Snapshot Revisi Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewRevisionModal(false)}
                  className="text-white/40 hover:text-white transition-colors p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-[12px] text-[#111318]/60 leading-relaxed">
                  Snapshot ini akan membekukan versi data invoice saat ini secara permanen ke riwayat
                  audit trail JSON.
                </p>

                <div>
                  <label className="field-label mb-1 block">Catatan Ringkasan Revisi:</label>
                  <textarea
                    rows={3}
                    required
                    value={newRevisionSummary}
                    onChange={(e) => setNewRevisionSummary(e.target.value)}
                    placeholder="cth: Penambahan diskon 10%, penyesuaian durasi sewa, disetujui klien..."
                    className="field-input w-full text-[12px]"
                  />
                </div>
              </div>

              <div className="px-5 py-4 bg-[rgba(17,19,24,0.03)] border-t border-[rgba(17,19,24,0.08)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRevisionModal(false)}
                  className="btn-ghost text-[12px]"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary text-[12px]">
                  Simpan &amp; Kunci Versi Baru
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: DIFF / PERBANDINGAN VERSI — Revisions Timeline          */}
        {/* ============================================================== */}
        {showDiffModal && (
          <div className="fixed inset-0 z-50 bg-[#111318]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop-enter">
            <div className="panel-elevated max-w-2xl w-full overflow-hidden max-h-[85vh] flex flex-col animate-dialog-enter">
              <div className="nav-surface px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#6366f1]" />
                  <h3 className="font-bold text-[13px] text-white">
                    Riwayat Versi Snapshot
                  </h3>
                  <span className="font-mono text-[11px] text-white/50">
                    #{activeInvoice.invoiceNumber}
                  </span>
                </div>
                <button
                  onClick={() => setShowDiffModal(false)}
                  className="text-white/40 hover:text-white transition-colors p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-0 overflow-y-auto flex-1">
                {/* Timeline-style list */}
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[rgba(17,19,24,0.1)]" />

                  {activeInvoice.revisions.map((rev, i) => (
                    <div key={rev.id} className="relative flex gap-4 pb-5 last:pb-0">
                      {/* Timeline dot */}
                      <div
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                          i === 0
                            ? 'border-[#4f46e5] bg-[#4f46e5]/10'
                            : 'border-[rgba(17,19,24,0.15)] bg-white'
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            i === 0 ? 'bg-[#4f46e5]' : 'bg-[rgba(17,19,24,0.2)]'
                          }`}
                        />
                      </div>

                      <div className="panel flex-1 p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-[13px] font-bold ${i === 0 ? 'text-[#4f46e5]' : 'text-[#111318]'}`}>
                            {rev.label}
                          </span>
                          <span className="font-mono text-[11px] text-[#111318]/40">
                            {rev.createdAt}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#111318]/70">{rev.summary}</p>
                        <div className="flex items-center justify-between pt-1 border-t border-[rgba(17,19,24,0.07)] font-mono text-[11px] text-[#111318]/40">
                          <span>Oleh: {rev.createdBy}</span>
                          <span className="font-bold text-[#111318]/70 tabular-nums">
                            {formatRupiah(rev.snapshot.financials.grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-4 bg-[rgba(17,19,24,0.03)] border-t border-[rgba(17,19,24,0.08)] flex justify-end">
                <button
                  onClick={() => setShowDiffModal(false)}
                  className="btn-ghost text-[12px]"
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
          <div className="fixed inset-0 z-50 bg-[#111318]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop-enter">
            <div
              className="max-w-3xl w-full overflow-hidden max-h-[85vh] flex flex-col rounded-xl border border-[#1a1d24] animate-dialog-enter"
              style={{ background: '#0d0f12' }}
            >
              <div
                className="px-5 py-4 flex items-center justify-between border-b border-[#1a1d24]"
                style={{ background: '#111318' }}
              >
                <div className="flex items-center gap-2 font-mono text-[12px]">
                  <FileCode className="w-4 h-4 text-[#10b981]" />
                  <span className="font-bold text-white">
                    JSON Snapshot — {editableSnapshot.invoiceNumber}{' '}
                    <span className="text-white/40">({editableSnapshot.version})</span>
                  </span>
                </div>
                <button
                  onClick={() => setShowRawJsonModal(false)}
                  className="text-white/30 hover:text-white transition-colors p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 font-mono text-[11px] text-[#10b981] leading-relaxed selection:bg-[#10b981]/20">
                <pre>{JSON.stringify(editableSnapshot, null, 2)}</pre>
              </div>

              <div
                className="px-5 py-3.5 border-t border-[#1a1d24] flex justify-between items-center"
                style={{ background: '#111318' }}
              >
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(editableSnapshot, null, 2));
                    showToast('Payload JSON berhasil disalin ke clipboard!');
                  }}
                  className="flex items-center gap-1.5 font-mono text-[12px] text-white/60 hover:text-white transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin JSON</span>
                </button>

                <button
                  onClick={() => setShowRawJsonModal(false)}
                  className="btn-primary text-[12px]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: KONFIRMASI HAPUS INVOICE */}
        {invoiceToDelete && (
          <div className="fixed inset-0 z-50 bg-[#111318]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop-enter">
            <div className="panel-elevated max-w-md w-full overflow-hidden animate-dialog-enter">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-[#be123c]/10 text-[#be123c] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-[15px] font-bold text-[#111318] mb-1">
                  Hapus Invoice #{invoiceToDelete.invoiceNumber}?
                </h3>
                <p className="text-[12px] text-[#111318]/60 leading-relaxed mb-4">
                  Apakah Anda yakin ingin menghapus dokumen invoice ini secara permanen dari sistem
                  VendorOne?
                </p>
                <div className="bg-[rgba(17,19,24,0.03)] border border-[rgba(17,19,24,0.08)] rounded-lg p-3 text-left text-[12px] text-[#111318]/70 space-y-1.5 mb-5">
                  <div>
                    <span className="text-[#111318]/40">Klien: </span>
                    <strong className="text-[#111318]">{invoiceToDelete.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-[#111318]/40">Event: </span>
                    <span>{invoiceToDelete.eventName}</span>
                  </div>
                  <div>
                    <span className="text-[#111318]/40">Nilai Tagihan: </span>
                    <strong className="font-mono tabular-nums text-[#be123c]">
                      {formatRupiah(invoiceToDelete.totalAmount)}
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvoiceToDelete(null)}
                    className="btn-ghost flex-1 text-[12px]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteInvoice}
                    className="btn-destructive flex-1 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Permanen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
