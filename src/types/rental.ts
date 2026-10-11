export type UserRole = 'admin' | 'owner' | 'warehouse';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarInitials: string;
  avatarBgColor?: string;
  permissionsDescription: string;
  passwordHash?: string;
  status?: 'active' | 'pending' | 'suspended';
  createdAt?: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: 'Kamera & Lensa' | 'Audio & Sound' | 'Lighting & Effect' | 'Visual & LED' | 'Rigging & Truss' | 'Power & Kabel';
  totalStock: number;
  dailyRate: number; // in IDR
  brand: string;
  locationRack: string;
  condition: 'Sangat Baik' | 'Baik' | 'Perlu Servis';
  imageUrl?: string;
  serialNumbers: string[];
  description?: string;
}

export interface InvoiceCompanyProfile {
  companyName: string;
  legalName: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
  logoText: string;
  logoBgColor: string;
  logoTagline?: string;
  logoUrl?: string;
}

export interface InvoiceRecord {
  id: string; // e.g. "INV-2026-10-0042"
  invoiceNumber: string;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  eventName: string;
  eventLocation?: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  createdAt: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  isArchived: boolean;
  revisions: InvoiceRevision[];
  activeRevisionId: string;
  companyProfile?: InvoiceCompanyProfile;
  notes?: string;
}

export interface BookingEquipmentItem {
  equipmentId: string;
  equipmentName: string;
  category: string;
  quantity: number;
  dailyRate: number;
  days: number;
  subtotal: number;
}

export type EventStatus = 'Draft' | 'Dikonfirmasi' | 'Berjalan' | 'Selesai' | 'Dibatalkan';
export type EquipmentLogisticsStatus = 'Persiapan' | 'Keluar Gudang' | 'Kembali / Selesai';
export type PaymentStatus = 'Lunas' | 'DP 50%' | 'Belum Bayar';

export interface EventBooking {
  id: string;
  code: string; // e.g. "EVT-2026-10-01"
  clientName: string;
  clientPhone: string;
  clientCompany?: string;
  clientEmail: string;
  eventName: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: EventStatus;
  logisticsStatus: EquipmentLogisticsStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  items: BookingEquipmentItem[];
  notes?: string;
  hasConflict?: boolean;
  conflictDetails?: string[];
}

export interface InvoiceSnapshot {
  invoiceNumber: string;
  version: string; // e.g. "v1.0", "v1.1", "v1.2"
  versionLabel: string;
  createdAt: string;
  createdBy: string;
  reason: string;
  client: {
    name: string;
    phone: string;
    email: string;
    company?: string;
    address: string;
  };
  event: {
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    durationDays: number;
  };
  items: {
    equipmentId: string;
    name: string;
    category: string;
    qty: number;
    dailyRate: number;
    days: number;
    subtotal: number;
  }[];
  financials: {
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    crewFee: number;
    deliveryFee: number;
    taxPercent: number; // e.g. 11%
    taxAmount: number;
    grandTotal: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: PaymentStatus;
  };
  terms: string[];
}

export interface InvoiceRevision {
  id: string;
  version: string;
  label: string;
  createdAt: string;
  createdBy: string;
  summary: string;
  snapshot: InvoiceSnapshot;
}

export interface ManifestItem {
  id: string;
  equipmentId: string;
  name: string;
  category: string;
  quantity: number;
  barcode: string;
  status: 'Persiapan' | 'Keluar Gudang' | 'Kembali / Selesai';
  checkedOutAt?: string;
  checkedInAt?: string;
  checkedBy?: string;
  conditionNotes?: string;
}

export interface WarehouseManifest {
  eventId: string;
  eventCode: string;
  eventName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  location: string;
  items: ManifestItem[];
}

export interface ConflictResult {
  hasConflict: boolean;
  equipmentId: string;
  equipmentName: string;
  requestedQty: number;
  totalStock: number;
  allocatedQty: number;
  deficit: number;
  conflictingEvents: {
    eventId: string;
    eventName: string;
    clientName: string;
    allocatedQty: number;
    startDate: string;
    endDate: string;
  }[];
}
