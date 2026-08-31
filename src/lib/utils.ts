import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeHM(dateStringOrDate: string | Date): string {
  const d = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateIndo(dateStringOrDate: string | Date): string {
  const d = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} mnt`;
  if (mins === 0) return `${hours} jam`;
  return `${hours}j ${mins}m`;
}

/**
 * Menghitung variasi waktu antara jadwal kedatangan dengan waktu aktual gate-in
 */
export function calculateArrivalVariance(
  scheduledStartISO: string,
  actualGateInISO?: string
): { diffMinutes: number; status: 'ON_TIME' | 'EARLY' | 'LATE' | 'PENDING'; label: string; badgeColor: string } {
  if (!actualGateInISO) {
    return { diffMinutes: 0, status: 'PENDING', label: 'Menunggu Kedatangan', badgeColor: 'text-slate-400 bg-slate-800' };
  }

  const scheduled = new Date(scheduledStartISO).getTime();
  const actual = new Date(actualGateInISO).getTime();
  const diffMinutes = Math.round((actual - scheduled) / (1000 * 60));

  if (Math.abs(diffMinutes) <= 15) {
    return {
      diffMinutes,
      status: 'ON_TIME',
      label: diffMinutes === 0 ? 'Tepat Waktu (0 mnt)' : diffMinutes > 0 ? `Tepat Waktu (+${diffMinutes} mnt)` : `Tepat Waktu (${diffMinutes} mnt)`,
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    };
  } else if (diffMinutes < -15) {
    return {
      diffMinutes,
      status: 'EARLY',
      label: `Tiba Lebih Awal (${Math.abs(diffMinutes)} mnt)`,
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
    };
  } else {
    return {
      diffMinutes,
      status: 'LATE',
      label: `Terlambat (${diffMinutes} mnt)`,
      badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
    };
  }
}

/**
 * Menghitung variasi durasi proses pembongkaran muat (SOP standar vs waktu aktual)
 */
export function calculateUnloadingVariance(
  sopDurationMinutes: number,
  startISO?: string,
  finishISO?: string
): {
  actualMinutes: number;
  diffMinutes: number;
  status: 'FASTER' | 'ON_TRACK' | 'OVERTIME' | 'IN_PROGRESS' | 'PENDING';
  label: string;
  badgeColor: string;
} {
  if (!startISO) {
    return {
      actualMinutes: 0,
      diffMinutes: 0,
      status: 'PENDING',
      label: `SOP: ${sopDurationMinutes} mnt`,
      badgeColor: 'text-slate-400 bg-slate-800',
    };
  }

  const start = new Date(startISO).getTime();
  const end = finishISO ? new Date(finishISO).getTime() : Date.now();
  const actualMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
  const diffMinutes = actualMinutes - sopDurationMinutes;

  if (!finishISO) {
    const isOver = actualMinutes > sopDurationMinutes;
    return {
      actualMinutes,
      diffMinutes,
      status: 'IN_PROGRESS',
      label: isOver
        ? `Bongkar Berjalan: ${actualMinutes} mnt (+${diffMinutes} mnt Over SOP)`
        : `Bongkar Berjalan: ${actualMinutes} / ${sopDurationMinutes} mnt`,
      badgeColor: isOver ? 'text-rose-400 bg-rose-950/60 border-rose-800' : 'text-amber-400 bg-amber-950/60 border-amber-800',
    };
  }

  if (diffMinutes > 15) {
    return {
      actualMinutes,
      diffMinutes,
      status: 'OVERTIME',
      label: `Overtime (+${diffMinutes} mnt, total ${actualMinutes} mnt)`,
      badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800',
    };
  } else if (diffMinutes < -10) {
    return {
      actualMinutes,
      diffMinutes,
      status: 'FASTER',
      label: `Lebih Cepat (${Math.abs(diffMinutes)} mnt lebih awal)`,
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    };
  } else {
    return {
      actualMinutes,
      diffMinutes,
      status: 'ON_TRACK',
      label: `Sesuai Target SOP (${actualMinutes} mnt)`,
      badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800',
    };
  }
}

/**
 * Menghitung Total Dwell Time (Total waktu truk di pabrik dari Gate In sampai Gate Out)
 */
export function calculateDwellTime(gateInISO?: string, gateOutISO?: string): { totalMinutes: number; label: string } {
  if (!gateInISO) return { totalMinutes: 0, label: '-' };
  const inTime = new Date(gateInISO).getTime();
  const outTime = gateOutISO ? new Date(gateOutISO).getTime() : Date.now();
  const totalMinutes = Math.max(0, Math.round((outTime - inTime) / (1000 * 60)));
  return {
    totalMinutes,
    label: formatDuration(totalMinutes),
  };
}
