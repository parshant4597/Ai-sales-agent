// The sales team works in India, so "today" always means the Indian date.
const TIME_ZONE = 'Asia/Kolkata';
const DAY_MS = 24 * 60 * 60 * 1000;

const toIstDay = (date) => date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE }); // YYYY-MM-DD

// ['2026-11-10', ..., '2026-11-16'] : the last `count` Indian dates, oldest first.
export function lastDays(count, now = new Date()) {
  return Array.from({ length: count }, (_, index) => toIstDay(new Date(now.getTime() - (count - 1 - index) * DAY_MS)));
}

// Midnight (IST) at the start of a 'YYYY-MM-DD' day.
export const startOfDay = (day) => new Date(`${day}T00:00:00+05:30`);

// Turns [{ _id: 'YYYY-MM-DD', count }] from MongoDB into one row per day, with 0 for empty days.
export function fillDailySeries(rows, days) {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return days.map((day) => ({ day, count: counts.get(day) || 0 }));
}
