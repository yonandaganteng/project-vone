/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  initialEquipment,
  initialBookings,
  invoiceRevisionsData,
  initialInvoiceRecords,
  initialWarehouseManifests,
  initialCompanyProfile,
  mockUserAccounts,
  initialUsersList,
} from './data/mockData';
import {
  Equipment,
  EventBooking,
  InvoiceRevision,
  InvoiceRecord,
  WarehouseManifest,
  InvoiceCompanyProfile,
  UserRole,
  UserAccount,
} from './types/rental';
import { scanSystemForConflicts } from './utils/conflictDetector';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CalendarConflictView } from './components/CalendarConflictView';
import { InvoiceDetailView } from './components/InvoiceDetailView';
import { InventoryView } from './components/InventoryView';
import { WarehouseManifestView } from './components/WarehouseManifestView';
import { NewBookingModal } from './components/NewBookingModal';
import { LoginView } from './components/LoginView';

export default function App() {
  // Authentication & Current User State (Default logged in as Admin, can logout or switch anytime)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(mockUserAccounts.admin);

  // Navigation & User State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Domain Database State
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(initialEquipment);
  const [bookings, setBookings] = useState<EventBooking[]>(initialBookings);
  const [invoiceRecords, setInvoiceRecords] = useState<InvoiceRecord[]>(initialInvoiceRecords);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>('INV-2026-10-0042');
  const [invoiceRevisions, setInvoiceRevisions] = useState<InvoiceRevision[]>(
    invoiceRevisionsData['INV-2026-10-0042'] || []
  );
  const [warehouseManifests, setWarehouseManifests] = useState<WarehouseManifest[]>(
    initialWarehouseManifests
  );
  const [companyProfile, setCompanyProfile] = useState<InvoiceCompanyProfile>(
    initialCompanyProfile
  );

  // User Accounts Database State (Role assignments & signups managed by Owner)
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(initialUsersList);

  // New Booking Modal State
  const [isNewBookingOpen, setIsNewBookingOpen] = useState<boolean>(false);
  const [prefilledBookingItem, setPrefilledBookingItem] = useState<{
    equipmentId: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  // Pause ambient animations when tab is hidden (visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.classList.add('page-hidden');
      } else {
        document.body.classList.remove('page-hidden');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Real-time Anti Double-Booking Conflict Scanner
  const conflictMap = useMemo(() => {
    return scanSystemForConflicts(equipmentList, bookings);
  }, [equipmentList, bookings]);

  const conflictCount = useMemo(() => {
    let count = 0;
    conflictMap.forEach((val) => {
      if (val.hasConflict) count++;
    });
    return count;
  }, [conflictMap]);

  // Handler: Resolve conflict by substituting equipment
  const handleResolveConflictSubstitute = (
    bookingId: string,
    conflictEquipmentId: string,
    substituteEquipmentId: string
  ) => {
    const subEq = equipmentList.find((e) => e.id === substituteEquipmentId);
    if (!subEq) return;

    setBookings((prevBookings) =>
      prevBookings.map((b) => {
        if (b.id !== bookingId) return b;

        const updatedItems = b.items.map((it) => {
          if (it.equipmentId === conflictEquipmentId) {
            return {
              ...it,
              equipmentId: subEq.id,
              equipmentName: `${subEq.name} (Substitusi)`,
              category: subEq.category,
              dailyRate: subEq.dailyRate,
              subtotal: subEq.dailyRate * it.quantity * it.days,
            };
          }
          return it;
        });

        const newTotal = updatedItems.reduce((sum, it) => sum + it.subtotal, 0);

        return {
          ...b,
          items: updatedItems,
          totalAmount: newTotal,
          notes: `Telah disubstitusi ke ${subEq.name} untuk mengatasi bentrok stok pada jadwal bersamaan.`,
        };
      })
    );
  };

  // Handler: Add new equipment to master inventory
  const handleAddNewEquipment = (newEq: Equipment) => {
    setEquipmentList((prev) => [newEq, ...prev]);
  };

  // Handler: Update equipment total stock
  const handleUpdateEquipmentStock = (equipmentId: string, newTotalStock: number) => {
    setEquipmentList((prev) =>
      prev.map((eq) =>
        eq.id === equipmentId ? { ...eq, totalStock: newTotalStock } : eq
      )
    );
  };

  // Handler: Update complete equipment data (price/dailyRate, name, description, etc.)
  const handleUpdateEquipment = (updatedEq: Equipment) => {
    setEquipmentList((prev) =>
      prev.map((eq) => (eq.id === updatedEq.id ? updatedEq : eq))
    );
  };

  // Handler: Delete equipment from master inventory (synced across all roles)
  const handleDeleteEquipment = (equipmentId: string) => {
    setEquipmentList((prev) => prev.filter((eq) => eq.id !== equipmentId));
  };

  // Handler: Update equipment condition and location rack (Role: Staf Gudang)
  const handleUpdateEquipmentCondition = (
    equipmentId: string,
    newCondition: Equipment['condition'],
    newRack?: string
  ) => {
    setEquipmentList((prev) =>
      prev.map((eq) =>
        eq.id === equipmentId
          ? {
              ...eq,
              condition: newCondition,
              locationRack: newRack || eq.locationRack,
            }
          : eq
      )
    );
  };

  // Handler: Create new event booking
  const handleCreateBooking = (newBooking: EventBooking) => {
    setBookings((prev) => [newBooking, ...prev]);

    // Also generate initial manifest for this booking in warehouse
    const newManifest: WarehouseManifest = {
      eventId: newBooking.id,
      eventCode: newBooking.code,
      eventName: newBooking.eventName,
      clientName: newBooking.clientName,
      startDate: newBooking.startDate,
      endDate: newBooking.endDate,
      location: newBooking.location,
      items: newBooking.items.map((it, idx) => ({
        id: `man-${Date.now()}-${idx}`,
        equipmentId: it.equipmentId,
        name: `${it.equipmentName} (${it.quantity} Unit)`,
        category: it.category,
        quantity: it.quantity,
        barcode: `BC-${it.equipmentId.toUpperCase()}-${idx + 1}`,
        status: 'Persiapan',
      })),
    };

    setWarehouseManifests((prev) => [newManifest, ...prev]);
  };

  // Handler: Add new invoice revision snapshot (v1.3, etc.)
  const handleAddNewRevision = (newRevision: InvoiceRevision) => {
    setInvoiceRevisions((prev) => [newRevision, ...prev]);
  };

  // Handler: Update complete invoice record & revisions
  const handleUpdateInvoiceRecord = (updatedInvoice: InvoiceRecord) => {
    setInvoiceRecords((prev) =>
      prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
    );
  };

  // Handler: Add new invoice record
  const handleAddNewInvoiceRecord = (newInvoice: InvoiceRecord) => {
    setInvoiceRecords((prev) => [newInvoice, ...prev]);
    setActiveInvoiceId(newInvoice.id);
  };

  // Handler: Archive / Unarchive invoice
  const handleToggleArchiveInvoice = (invoiceId: string) => {
    setInvoiceRecords((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, isArchived: !inv.isArchived } : inv
      )
    );
  };

  // Handler: Delete invoice record
  const handleDeleteInvoiceRecord = (invoiceId: string) => {
    setInvoiceRecords((prev) => prev.filter((inv) => inv.id !== invoiceId));
  };

  // Handler: Update warehouse item status
  const handleUpdateManifestItemStatus = (
    eventId: string,
    itemId: string,
    newStatus: 'Persiapan' | 'Keluar Gudang' | 'Kembali / Selesai',
    notes?: string
  ) => {
    setWarehouseManifests((prevManifests) =>
      prevManifests.map((manifest) => {
        if (manifest.eventId !== eventId) return manifest;

        const updatedItems = manifest.items.map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            status: newStatus,
            conditionNotes: notes !== undefined ? notes : it.conditionNotes,
            checkedOutAt:
              newStatus === 'Keluar Gudang'
                ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : it.checkedOutAt,
            checkedInAt:
              newStatus === 'Kembali / Selesai'
                ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : it.checkedInAt,
          };
        });

        return { ...manifest, items: updatedItems };
      })
    );

    // Sync with event booking logisticsStatus
    setBookings((prevBookings) =>
      prevBookings.map((b) => {
        if (b.id !== eventId) return b;
        return {
          ...b,
          logisticsStatus: newStatus,
        };
      })
    );
  };

  // Handler: Bulk update all items in an event manifest
  const handleBulkUpdateManifestStatus = (
    eventId: string,
    newStatus: 'Keluar Gudang' | 'Kembali / Selesai'
  ) => {
    setWarehouseManifests((prevManifests) =>
      prevManifests.map((manifest) => {
        if (manifest.eventId !== eventId) return manifest;
        const updatedItems = manifest.items.map((it) => ({
          ...it,
          status: newStatus,
        }));
        return { ...manifest, items: updatedItems };
      })
    );

    setBookings((prevBookings) =>
      prevBookings.map((b) => {
        if (b.id !== eventId) return b;
        return { ...b, logisticsStatus: newStatus };
      })
    );
  };

  // Helper to open modal from calculator
  const handleOpenNewBookingWithItem = (
    equipmentId: string,
    startDate: string,
    endDate: string
  ) => {
    setPrefilledBookingItem({ equipmentId, startDate, endDate });
    setIsNewBookingOpen(true);
  };

  // Authentication & User Management Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setUserRole(user.role);
    if (user.role === 'warehouse') {
      setCurrentTab('dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    const targetAccount = registeredUsers.find((u) => u.role === newRole) || mockUserAccounts[newRole];
    if (targetAccount) {
      setCurrentUser(targetAccount);
      setUserRole(newRole);
      if (newRole === 'warehouse') {
        setCurrentTab('dashboard');
      }
    }
  };

  // Handler: Register a new user (Sign Up)
  const handleRegisterUser = (newUser: UserAccount) => {
    setRegisteredUsers((prev) => [newUser, ...prev]);
  };

  // Handler: Owner changes/grants role to any user
  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const roleDesc =
          newRole === 'owner'
            ? 'Akses Penuh: Finansial, Omzet, Ubah Kop/Logo Invoice, Monitoring'
            : newRole === 'warehouse'
            ? 'Akses Lapangan: Master Alat, Kontrol Stok Fisik & Kesiapan Logistik'
            : 'Akses Operasional: Kalender Bentrok, Booking, Monitoring Invoice Belum Lunas';
        const roleColor =
          newRole === 'owner' ? '#059669' : newRole === 'warehouse' ? '#D97706' : '#4F46E5';

        const updated = {
          ...u,
          role: newRole,
          permissionsDescription: roleDesc,
          avatarBgColor: roleColor,
        };

        // If current logged-in user role was updated, update active state too
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updated);
          setUserRole(newRole);
        }

        return updated;
      })
    );
  };

  // If not logged in, render the dedicated Login Screen with Sign Up support
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        registeredUsers={registeredUsers}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  return (
    <div className="min-h-screen app-bg flex font-sans antialiased">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={handleSwitchRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        conflictCount={conflictCount}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
      />

      {/* Main Content Area (Offset by 64px width on desktop) */}
      <div className="lg:pl-64 flex flex-col min-h-screen w-full">
        {/* Sticky Header */}
        <Header
          currentTab={currentTab}
          userRole={userRole}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          conflictCount={conflictCount}
          onNavigateToCalendar={() => setCurrentTab('calendar')}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNewBooking={() => {
            setPrefilledBookingItem(null);
            setIsNewBookingOpen(true);
          }}
        />

        {/* View Content Port */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto relative">
          {currentTab === 'dashboard' && (
            <DashboardView
              bookings={bookings}
              equipmentList={equipmentList}
              invoices={invoiceRecords}
              userRole={userRole}
              conflictMap={conflictMap}
              onSelectEvent={(eventId) => setCurrentTab('calendar')}
              onNavigateToCalendar={() => setCurrentTab('calendar')}
              onNavigateToInvoice={(invId) => {
                if (invId) setActiveInvoiceId(invId);
                setCurrentTab('invoice');
              }}
              onNavigateToInventory={() => setCurrentTab('inventory')}
              userAccounts={registeredUsers}
              onUpdateUserRole={handleUpdateUserRole}
              onAddNewUser={handleRegisterUser}
              onDeleteUser={(uid) => setRegisteredUsers((prev) => prev.filter((u) => u.id !== uid))}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarConflictView
              bookings={bookings}
              equipmentList={equipmentList}
              conflictMap={conflictMap}
              onOpenNewBookingWithItem={handleOpenNewBookingWithItem}
              onResolveConflictSubstitue={handleResolveConflictSubstitute}
              onOpenNewBooking={() => {
                setPrefilledBookingItem(null);
                setIsNewBookingOpen(true);
              }}
            />
          )}

          {currentTab === 'invoice' && (
            <InvoiceDetailView
              invoices={invoiceRecords}
              activeInvoiceId={activeInvoiceId}
              onChangeActiveInvoiceId={setActiveInvoiceId}
              onUpdateInvoiceRecord={handleUpdateInvoiceRecord}
              onAddNewInvoiceRecord={handleAddNewInvoiceRecord}
              onToggleArchiveInvoice={handleToggleArchiveInvoice}
              onDeleteInvoiceRecord={handleDeleteInvoiceRecord}
              revisions={invoiceRevisions}
              equipmentList={equipmentList}
              bookings={bookings}
              companyProfile={companyProfile}
              userRole={userRole}
              onAddNewRevision={handleAddNewRevision}
              onUpdateCompanyProfile={setCompanyProfile}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              equipmentList={equipmentList}
              bookings={bookings}
              userRole={userRole}
              onAddNewEquipment={handleAddNewEquipment}
              onUpdateEquipmentStock={handleUpdateEquipmentStock}
              onUpdateEquipmentCondition={handleUpdateEquipmentCondition}
              onUpdateEquipment={handleUpdateEquipment}
              onDeleteEquipment={handleDeleteEquipment}
            />
          )}

          {currentTab === 'warehouse' && (
            <WarehouseManifestView
              manifests={warehouseManifests}
              userRole={userRole}
              onUpdateItemStatus={handleUpdateManifestItemStatus}
              onBulkUpdateStatus={handleBulkUpdateManifestStatus}
            />
          )}
        </main>

        {/* Minimal Footer */}
        <footer
          className="no-print flex items-center justify-between py-3 px-6"
          style={{ borderTop: '1px solid rgba(17,19,24,0.06)' }}
        >
          <span className="text-[11px] font-mono" style={{ color: 'rgba(17,19,24,0.35)' }}>
            VendorOne &copy; 2026
          </span>
          <span className="text-[11px] font-mono" style={{ color: 'rgba(17,19,24,0.35)' }}>
            Conflict Detection: Active
          </span>
        </footer>
      </div>

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setPrefilledBookingItem(null);
        }}
        equipmentList={equipmentList}
        allBookings={bookings}
        onCreateBooking={handleCreateBooking}
        initialEquipmentId={prefilledBookingItem?.equipmentId}
        initialStartDate={prefilledBookingItem?.startDate}
        initialEndDate={prefilledBookingItem?.endDate}
      />
    </div>
  );
}
