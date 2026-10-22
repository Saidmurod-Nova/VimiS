// Shared date-range + time-bucket helpers for seller statistics and the
// business dashboard. All boundaries are computed in a single consistent
// business timezone (Asia/Tashkent, UTC+5) and converted back to UTC
// milliseconds so they can be compared directly against stored ISO timestamps
// (created_date, completed_at). Money is integer UZS — never float.

const TZ_OFFSET_MS = 5 * 3600 * 1000;
export const DAY_MS = 86400000;

const MONTHS_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

export const DEFAULT_THRESHOLD = 5;

// Returns { startMs, endMs, label, bucket } for a preset or custom range.
// startMs is inclusive, endMs is inclusive (end-of-day for custom).
export function resolveRange(range: string, from?: string, to?: string) {
  const now = Date.now();
  const tashkentNow = new Date(now + TZ_OFFSET_MS);
  const ty = tashkentNow.getUTCFullYear();
  const tm = tashkentNow.getUTCMonth();
  const td = tashkentNow.getUTCDate();
  const startOfToday = Date.UTC(ty, tm, td) - TZ_OFFSET_MS;

  if (range === 'today') return { startMs: startOfToday, endMs: now, label: 'Bugun', bucket: 'day' as const };
  if (range === '7d') return { startMs: startOfToday - 6 * DAY_MS, endMs: now, label: 'Oxirgi 7 kun', bucket: 'day' as const };
  if (range === '30d') return { startMs: startOfToday - 29 * DAY_MS, endMs: now, label: 'Oxirgi 30 kun', bucket: 'day' as const };

  if (range === 'custom' && from && to) {
    const [fy, fm, fd] = from.split('-').map(Number);
    const [tyy, tmm, tdd] = to.split('-').map(Number);
    const startMs = Date.UTC(fy, fm - 1, fd) - TZ_OFFSET_MS;
    const endMs = Date.UTC(tyy, tmm - 1, tdd) - TZ_OFFSET_MS + DAY_MS - 1;
    const span = endMs - startMs;
    const bucket = span <= 31 * DAY_MS ? 'day' : span <= 95 * DAY_MS ? 'week' : 'month';
    return { startMs, endMs, label: `${from} – ${to}`, bucket };
  }

  // all time — startMs 0 means "no lower bound"; callers adjust to earliest record.
  return { startMs: 0, endMs: now, label: 'Barcha vaqt', bucket: 'month' as const };
}

// Builds a list of { label, start, end } buckets covering [startMs, endMs].
// Each bucket's [start, end] is inclusive in UTC ms. Guards cap pathological spans.
export function buildBuckets(startMs: number, endMs: number, bucket: 'day' | 'week' | 'month') {
  const buckets: { label: string; start: number; end: number }[] = [];
  if (startMs > endMs) return buckets;

  if (bucket === 'day') {
    const ts = new Date(startMs + TZ_OFFSET_MS);
    let cursor = Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()) - TZ_OFFSET_MS;
    let guard = 0;
    while (cursor <= endMs && guard++ < 400) {
      const d = new Date(cursor + TZ_OFFSET_MS);
      const label = `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      buckets.push({ label, start: cursor, end: cursor + DAY_MS - 1 });
      cursor += DAY_MS;
    }
  } else if (bucket === 'week') {
    const ts = new Date(startMs + TZ_OFFSET_MS);
    let cursor = Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()) - TZ_OFFSET_MS;
    const dow = new Date(cursor + TZ_OFFSET_MS).getUTCDay(); // 0=Sun..6=Sat
    cursor -= ((dow + 6) % 7) * DAY_MS; // align to Monday
    let guard = 0;
    while (cursor <= endMs && guard++ < 200) {
      const d = new Date(cursor + TZ_OFFSET_MS);
      const label = `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      buckets.push({ label, start: cursor, end: cursor + 7 * DAY_MS - 1 });
      cursor += 7 * DAY_MS;
    }
  } else {
    const ts = new Date(startMs + TZ_OFFSET_MS);
    let y = ts.getUTCFullYear();
    let m = ts.getUTCMonth();
    let guard = 0;
    while (guard++ < 240) {
      const start = Date.UTC(y, m, 1) - TZ_OFFSET_MS;
      if (start > endMs) break;
      const end = Date.UTC(y, m + 1, 1) - TZ_OFFSET_MS - 1;
      buckets.push({ label: MONTHS_UZ[m], start, end });
      m++; if (m > 11) { m = 0; y++; }
    }
  }
  return buckets;
}