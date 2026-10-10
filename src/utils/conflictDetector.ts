import { Equipment, EventBooking, ConflictResult } from '../types/rental';

/**
 * Checks if two date ranges overlap.
 * Format expected: YYYY-MM-DD
 */
export function isDateOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 <= end2 && end1 >= start2;
}

/**
 * Calculates remaining stock for a specific equipment in a given date range.
 */
export function getAvailableStockForRange(
  equipment: Equipment,
  startDate: string,
  endDate: string,
  allBookings: EventBooking[],
  excludeBookingId?: string
): {
  availableStock: number;
  maxAllocated: number;
  conflictingEvents: {
    eventId: string;
    eventName: string;
    clientName: string;
    allocatedQty: number;
    startDate: string;
    endDate: string;
  }[];
} {
  const overlappingBookings = allBookings.filter(b => {
    if (b.status === 'Dibatalkan') return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    return isDateOverlap(startDate, endDate, b.startDate, b.endDate);
  });

  const conflictingEvents: {
    eventId: string;
    eventName: string;
    clientName: string;
    allocatedQty: number;
    startDate: string;
    endDate: string;
  }[] = [];

  // Sum up all allocated quantities of this equipment across overlapping bookings
  let totalAllocated = 0;
  for (const booking of overlappingBookings) {
    const item = booking.items.find(i => i.equipmentId === equipment.id);
    if (item && item.quantity > 0) {
      totalAllocated += item.quantity;
      conflictingEvents.push({
        eventId: booking.id,
        eventName: booking.eventName,
        clientName: booking.clientName,
        allocatedQty: item.quantity,
        startDate: booking.startDate,
        endDate: booking.endDate,
      });
    }
  }

  const availableStock = Math.max(0, equipment.totalStock - totalAllocated);

  return {
    availableStock,
    maxAllocated: totalAllocated,
    conflictingEvents,
  };
}

/**
 * Evaluates whether a proposed booking request causes a conflict.
 */
export function evaluateBookingConflict(
  equipmentList: Equipment[],
  requestedEquipmentId: string,
  requestedQty: number,
  startDate: string,
  endDate: string,
  allBookings: EventBooking[],
  excludeBookingId?: string
): ConflictResult {
  const eq = equipmentList.find(e => e.id === requestedEquipmentId);
  if (!eq) {
    return {
      hasConflict: false,
      equipmentId: requestedEquipmentId,
      equipmentName: 'Unknown',
      requestedQty,
      totalStock: 0,
      allocatedQty: 0,
      deficit: 0,
      conflictingEvents: [],
    };
  }

  const { availableStock, maxAllocated, conflictingEvents } = getAvailableStockForRange(
    eq,
    startDate,
    endDate,
    allBookings,
    excludeBookingId
  );

  const deficit = Math.max(0, requestedQty - availableStock);
  const hasConflict = deficit > 0;

  return {
    hasConflict,
    equipmentId: eq.id,
    equipmentName: eq.name,
    requestedQty,
    totalStock: eq.totalStock,
    allocatedQty: maxAllocated,
    deficit,
    conflictingEvents,
  };
}

/**
 * Scans all bookings in the system to determine which ones currently have stock conflicts.
 */
export function scanSystemForConflicts(
  equipmentList: Equipment[],
  allBookings: EventBooking[]
): Map<string, { hasConflict: boolean; details: string[] }> {
  const resultMap = new Map<string, { hasConflict: boolean; details: string[] }>();

  for (const booking of allBookings) {
    resultMap.set(booking.id, { hasConflict: false, details: [] });
  }

  // Group events by day or test pairwise overlaps
  for (let i = 0; i < allBookings.length; i++) {
    const bookingA = allBookings[i];
    if (bookingA.status === 'Dibatalkan') continue;

    for (const itemA of bookingA.items) {
      const eq = equipmentList.find(e => e.id === itemA.equipmentId);
      if (!eq) continue;

      // Find all overlapping bookings with the same equipment
      let concurrentTotal = itemA.quantity;
      const overlaps: { name: string; qty: number }[] = [];

      for (let j = 0; j < allBookings.length; j++) {
        if (i === j) continue;
        const bookingB = allBookings[j];
        if (bookingB.status === 'Dibatalkan') continue;

        if (isDateOverlap(bookingA.startDate, bookingA.endDate, bookingB.startDate, bookingB.endDate)) {
          const itemB = bookingB.items.find(ib => ib.equipmentId === itemA.equipmentId);
          if (itemB) {
            concurrentTotal += itemB.quantity;
            overlaps.push({ name: bookingB.eventName, qty: itemB.quantity });
          }
        }
      }

      if (concurrentTotal > eq.totalStock) {
        const excess = concurrentTotal - eq.totalStock;
        const detailMsg = `${eq.name}: Dipesan ${concurrentTotal} unit (Stok ${eq.totalStock}, Kurang ${excess} unit). Bentrok dengan ${overlaps.map(o => `"${o.name}" (${o.qty} unit)`).join(', ')}`;
        
        const existingA = resultMap.get(bookingA.id)!;
        existingA.hasConflict = true;
        if (!existingA.details.includes(detailMsg)) {
          existingA.details.push(detailMsg);
        }
      }
    }
  }

  return resultMap;
}
