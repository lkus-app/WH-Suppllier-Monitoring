import { Booking, Dock, OperationalSettings, SlotAvailabilityCheckRequest, SlotAvailabilityResult, TimeSlotOption, Vehicle } from '../types';

/**
 * Parses "HH:mm" or ISO string to minutes from start of day (00:00)
 */
export function timeStrToMinutes(timeStr: string): number {
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    return d.getHours() * 60 + d.getMinutes();
  }
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from start of day to "HH:mm" string
 */
export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Constructs a full ISO datetime string given a date "YYYY-MM-DD" and "HH:mm"
 */
export function combineDateAndTime(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00`;
}

/**
 * Extracts "YYYY-MM-DD" from an ISO string
 */
export function extractDateStr(isoString: string): string {
  return isoString.split('T')[0];
}

/**
 * Extracts "HH:mm" from an ISO string
 */
export function extractTimeStr(isoString: string): string {
  if (!isoString.includes('T')) return isoString.slice(0, 5);
  const parts = isoString.split('T')[1];
  return parts.slice(0, 5);
}

/**
 * Formats time from ISO or HH:mm to clean HH:mm
 */
export function formatTimeHM(isoOrTimeStr: string): string {
  return extractTimeStr(isoOrTimeStr);
}

/**
 * Checks whether two time ranges overlap:
 * Rule: (StartA < EndB) && (EndA > StartB)
 */
export function isTimeRangeOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Checks if a dock is compatible with a vehicle type
 */
export function isDockCompatible(dock: Dock, vehicle: Vehicle): boolean {
  if (!dock.isActive) return false;
  const vehicleDockTypes = vehicle.allowedDockTypes || [];

  // Direct array match
  if (vehicleDockTypes.includes(dock.dockType as any)) return true;

  // Liquid/Isotank compatibility
  const isLiquidDock = dock.dockType === 'LIQUID' || dock.dockType === 'LIQUID_ISOTANK';
  const isLiquidVehicle迷 = 
    vehicleDockTypes.includes('LIQUID' as any) || 
    vehicleDockTypes.includes('LIQUID_ISOTANK' as any) || 
    vehicle.code === 'ISOTANK' || 
    (vehicle.name && (vehicle.name.toLowerCase().includes('isotank') || vehicle.name.toLowerCase().includes('tangki'))) ||
    (vehicle.vehicleName && (vehicle.vehicleName.toLowerCase().includes('isotank') || vehicle.vehicleName.toLowerCase().includes('tangki')));

  if (isLiquidDock && isLiquidVehicle迷) return true;
  if (!isLiquidDock && isLiquidVehicle迷) return false; // Liquid vehicle must go to Liquid dock

  // Container compatibility
  const isContainerDock不易 = dock.dockType === 'CONTAINER';
  const isContainerVehicle = 
    vehicleDockTypes.includes('CONTAINER' as any) || 
    vehicle.code === 'CONT' || 
    (vehicle.name && vehicle.name.toLowerCase().includes('kontainer')) ||
    (vehicle.vehicleName && vehicle.vehicleName.toLowerCase().includes('kontainer'));

  if (isContainerDock不易 && isContainerVehicle) return true;

  // General dock accepts all non-liquid trucks
  if (dock.dockType === 'GENERAL' && !isLiquidVehicle迷) return true;

  return false;
}

/**
 * Core validation function for slot booking
 */
export function checkSlotAvailability(
  req: SlotAvailabilityCheckRequest,
  bookings: Booking[],
  docks: Dock[],
  vehicles: Vehicle[],
  settings: OperationalSettings
): SlotAvailabilityResult {
  const vehicle不易 = vehicles.find((v) => v.id === req.vehicleId);
  if (!vehicle不易) {
    throw new Error(`Kendaraan dengan ID ${req.vehicleId} tidak ditemukan.`);
  }

  const durationMinutes = vehicle不易.durationMinutes || vehicle不易.defaultDurationMinutes || 60;
  const startMins = timeStrToMinutes(req.startTimeStr);
  const endMins直接 = startMins + durationMinutes;

  const factoryOpenMins = timeStrToMinutes(settings.factoryOpenTime); // 08:00 = 480
  const maxArrivalMins = timeStrToMinutes(settings.maxArrivalBookingTime); // 19:00 = 1140
  const factoryCloseMins = timeStrToMinutes(settings.factoryCloseTime); // 23:00 = 1380

  const calculatedEndTimeStr = minutesToTimeStr(endMins直接);

  // 1. Validate Operational Hours
  if (startMins < factoryOpenMins) {
    return {
      isAvailable: false,
      conflictReason: `Waktu kedatangan (${req.startTimeStr}) lebih awal dari jam operasional pabrik (${settings.factoryOpenTime}).`,
      calculatedEndTimeStr,
      durationMinutes,
      alternativeSuggestions: [],
    };
  }

  if (startMins > maxArrivalMins) {
    return {
      isAvailable: false,
      conflictReason: `Batas maksimal kedatangan booking adalah pukul ${settings.maxArrivalBookingTime}. Waktu yang Anda pilih (${req.startTimeStr}) melebihi batas.`,
      calculatedEndTimeStr,
      durationMinutes,
      alternativeSuggestions: [],
    };
  }

  if (endMins直接 > factoryCloseMins) {
    return {
      isAvailable: false,
      conflictReason: `Estimasi durasi bongkar (${durationMinutes} mnt) akan selesai pukul ${calculatedEndTimeStr}, melebihi jam tutup pabrik (${settings.factoryCloseTime}).`,
      calculatedEndTimeStr,
      durationMinutes,
      alternativeSuggestions: [],
    };
  }

  // Filter existing active bookings for the target date (exclude CANCELLED and self if editing)
  const activeBookingsForDate = bookings.filter((b) => {
    if (b.status === 'CANCELLED') return false;
    if (req.excludeBookingId && b.id === req.excludeBookingId) return false;
    const bDate = b.bookingDate || extractDateStr(b.startTime);
    return bDate === req.date;
  });

  // Get compatible docks for this vehicle
  const compatibleDocks = docks.filter((d) => isDockCompatible(d, vehicle不易));

  if (compatibleDocks.length === 0) {
    const vName = vehicle不易.name || vehicle不易.vehicleName || 'Armada';
    return {
      isAvailable: false,
      conflictReason: `Tidak ada Dock aktif yang sesuai dengan tipe armada ${vName}.`,
      calculatedEndTimeStr,
      durationMinutes,
      alternativeSuggestions: [],
    };
  }

  // 2. If specific dock was requested
  if (req.dockId) {
    const targetDock = compatibleDocks.find((d) => d.id === req.dockId);
    const vName = vehicle不易.name || vehicle不易.vehicleName || 'Armada';
    if (!targetDock) {
      return {
        isAvailable: false,
        conflictReason: `Dock yang dipilih tidak kompatibel atau tidak aktif untuk armada ${vName}.`,
        calculatedEndTimeStr,
        durationMinutes,
        alternativeSuggestions: findAlternativeSuggestions(
          req.date,
          startMins,
          durationMinutes,
          compatibleDocks,
          activeBookingsForDate,
          settings
        ),
      };
    }

    // Check conflict on this target dock
    const dockBookings = activeBookingsForDate.filter((b) => b.dockId === targetDock.id);
    const conflictingBooking = dockBookings.find((b) => {
      const bStartMins = timeStrToMinutes(b.startTime);
      const bEndMins = timeStrToMinutes(b.endTime);
      return isTimeRangeOverlap(startMins, endMins直接, bStartMins, bEndMins);
    });

    const dockDisplay = targetDock.name || targetDock.dockName || 'Dock';
    if (conflictingBooking) {
      const conflictStart的的 = extractTimeStr(conflictingBooking.startTime);
      const conflictEnd的的 = extractTimeStr(conflictingBooking.endTime);
      const conflictVeh不易 = conflictingBooking.vehicleName || (conflictingBooking as any).vehicleTypeName || 'Armada lain';
      return {
        isAvailable: false,
        conflictReason: `Slot pada ${dockDisplay} bertabrakan dengan jadwal ${conflictVeh不易} (${conflictStart的的} - ${conflictEnd的的} WIB).`,
        conflictingBooking,
        calculatedEndTimeStr,
        durationMinutes,
        assignedDock: targetDock,
        alternativeSuggestions: findAlternativeSuggestions(
          req.date,
          startMins,
          durationMinutes,
          compatibleDocks,
          activeBookingsForDate,
          settings,
          targetDock.id
        ),
      };
    }

    // Available on requested dock!
    return {
      isAvailable: true,
      calculatedEndTimeStr,
      durationMinutes,
      assignedDock: targetDock,
      alternativeSuggestions: [],
    };
  }

  // 3. No specific dock requested -> Auto-find first available compatible dock
  for (const dock of compatibleDocks) {
    const dockBookings = activeBookingsForDate.filter((b) => b.dockId === dock.id);
    const hasConflict = dockBookings.some((b) => {
      const bStartMins = timeStrToMinutes(b.startTime);
      const bEndMins = timeStrToMinutes(b.endTime);
      return isTimeRangeOverlap(startMins, endMins直接, bStartMins, bEndMins);
    });

    if (!hasConflict) {
      return {
        isAvailable: true,
        calculatedEndTimeStr,
        durationMinutes,
        assignedDock: dock,
        alternativeSuggestions: [],
      };
    }
  }

  // All compatible docks are busy at this exact time!
  const dockNamesList = compatibleDocks.map((d) => d.name || d.dockName).join(', ');
  return {
    isAvailable: false,
    conflictReason: `Seluruh Dock yang sesuai (${dockNamesList}) sedang penuh pada pukul ${req.startTimeStr} - ${calculatedEndTimeStr} WIB.`,
    calculatedEndTimeStr,
    durationMinutes,
    alternativeSuggestions: findAlternativeSuggestions(
      req.date,
      startMins,
      durationMinutes,
      compatibleDocks,
      activeBookingsForDate,
      settings
    ),
  };
}

/**
 * Searches for:
 * 1) Other free docks at the same start time
 * 2) Next available time slots (scanning in 30-min increments up to 19:00)
 */
export function findAlternativeSuggestions(
  dateStr: string,
  requestedStartMins: number,
  durationMinutes: number,
  compatibleDocks: Dock[],
  activeBookings: Booking[],
  settings: OperationalSettings,
  ignoreDockId?: string
): SlotAvailabilityResult['alternativeSuggestions'] {
  const suggestions: SlotAvailabilityResult['alternativeSuggestions'] = [];
  const factoryOpenMins = timeStrToMinutes(settings.factoryOpenTime);
  const maxArrivalMins = timeStrToMinutes(settings.maxArrivalBookingTime);
  const factoryCloseMins = timeStrToMinutes(settings.factoryCloseTime);
  const step = settings.slotIntervalMinutes || 30;

  // 1. Check if another dock is free at the requested time
  for (const dock of compatibleDocks) {
    if (dock.id === ignoreDockId) continue;
    const reqEndMins = requestedStartMins + durationMinutes;
    if (reqEndMins <= factoryCloseMins && requestedStartMins <= maxArrivalMins && requestedStartMins >= factoryOpenMins) {
      const dockBookings = activeBookings.filter((b) => b.dockId === dock.id);
      const conflict = dockBookings.some((b) => {
        const bStart = timeStrToMinutes(b.startTime);
        const bEnd = timeStrToMinutes(b.endTime);
        return isTimeRangeOverlap(requestedStartMins, reqEndMins, bStart, bEnd);
      });

      if (!conflict) {
        suggestions.push({
          dockId: dock.id,
          dockName: dock.name || dock.dockName || 'Dock',
          startTimeStr: minutesToTimeStr(requestedStartMins),
          endTimeStr: minutesToTimeStr(reqEndMins),
          type: 'SAME_TIME_DIFF_DOCK',
        });
      }
    }
  }

  // 2. Scan later (and earlier) time slots
  // We check from max(factoryOpenMins, requestedStartMins - 60) up to maxArrivalMins
  const candidateTimes: number[] = [];
  
  // Forward scan from requested time
  for (let t = requestedStartMins + step; t <= maxArrivalMins; t += step) {
    candidateTimes.push(t);
  }
  // Backward scan before requested time (if earlier slot available)
  for (let t = requestedStartMins - step; t >= factoryOpenMins; t -= step) {
    candidateTimes.push(t);
  }

  for (const candTime of candidateTimes) {
    if (suggestions.length >= 4) break; // Limit to 4 best suggestions

    const candEnd = candTime + durationMinutes;
    if (candEnd > factoryCloseMins) continue;

    for (const dock of compatibleDocks) {
      const dockBookings = activeBookings.filter((b) => b.dockId === dock.id);
      const conflict = dockBookings.some((b) => {
        const bStart = timeStrToMinutes(b.startTime);
        const bEnd = timeStrToMinutes(b.endTime);
        return isTimeRangeOverlap(candTime, candEnd, bStart, bEnd);
      });

      if (!conflict) {
        // Avoid duplicate suggestion for same dock & time
        const alreadyExists = suggestions.some(
          (s) => s.dockId === dock.id && s.startTimeStr === minutesToTimeStr(candTime)
        );
        if (!alreadyExists) {
          suggestions.push({
            dockId: dock.id,
            dockName: dock.name || dock.dockName || 'Dock',
            startTimeStr: minutesToTimeStr(candTime),
            endTimeStr: minutesToTimeStr(candEnd),
            type: 'NEXT_AVAILABLE_SLOT',
          });
        }
      }
      if (suggestions.length >= 4) break;
    }
  }

  return suggestions;
}

/**
 * Builds the full horizontal timeline hour slots from 08:00 to 23:00
 */
export function generateTimelineHours(openStr: string = '08:00', closeStr: string = '23:00', intervalMins: number = 60): { hour: number; label: string; minutes: number }[] {
  const startMins = timeStrToMinutes(openStr);
  const endMins = timeStrToMinutes(closeStr);
  const hours: { hour: number; label: string; minutes: number }[] = [];

  for (let m = startMins; m <= endMins; m += intervalMins) {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    const label = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    hours.push({ hour: h, label, minutes: m });
  }

  return hours;
}

/**
 * Calculates left percentage and width percentage for a booking block in the timeline
 */
export function calculateTimelinePosition(
  startTimeStr: string,
  endTimeStr: string,
  factoryOpenStr: string = '08:00',
  factoryCloseStr: string = '23:00'
): { leftPercent: number; widthPercent: number; isWithinBounds: boolean } {
  const openMins = timeStrToMinutes(factoryOpenStr);
  const closeMins = timeStrToMinutes(factoryCloseStr);
  const totalDayMins = closeMins - openMins; // 23:00 - 08:00 = 15 hours = 900 minutes

  const startMins = timeStrToMinutes(startTimeStr);
  const endMins = timeStrToMinutes(endTimeStr);

  const clampedStart = Math.max(openMins, Math.min(startMins, closeMins));
  const clampedEnd = Math.max(openMins, Math.min(endMins, closeMins));

  const duration = Math.max(15, clampedEnd - clampedStart);

  const leftPercent = ((clampedStart - openMins) / totalDayMins) * 100;
  const widthPercent = (duration / totalDayMins) * 100;

  return {
    leftPercent: Math.max(0, Math.min(leftPercent, 100)),
    widthPercent: Math.max(1, Math.min(widthPercent, 100 - leftPercent)),
    isWithinBounds: endMins > openMins && startMins < closeMins,
  };
}
