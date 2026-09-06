import type { BookingStatus } from '@/lib/types';

export type StatBooking = {
  status: BookingStatus;
  total_price: number;
  scheduled_at: string;
};

export type FarmStats = {
  completed: number;
  accepted: number;
  pending: number;
  revenue: number; // accepted + completed
  weekly: { label: string; value: number }[]; // last 8 weeks
};

const earns = (s: BookingStatus) => s === 'accepted' || s === 'completed';

function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); // back to Sunday
  return x;
}

export function computeFarmStats(bookings: StatBooking[]): FarmStats {
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const accepted = bookings.filter((b) => b.status === 'accepted').length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const revenue = bookings
    .filter((b) => earns(b.status))
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const thisWeek = weekStart(new Date());
  const buckets = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - (7 - i) * 7);
    return { start, value: 0 };
  });

  for (const b of bookings) {
    if (!earns(b.status)) continue;
    const t = new Date(b.scheduled_at).getTime();
    for (const bucket of buckets) {
      const from = bucket.start.getTime();
      if (t >= from && t < from + 7 * 86400000) {
        bucket.value += Number(b.total_price || 0);
        break;
      }
    }
  }

  return {
    completed,
    accepted,
    pending,
    revenue,
    weekly: buckets.map((b) => ({
      label: b.start.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: Math.round(b.value),
    })),
  };
}

export function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}
