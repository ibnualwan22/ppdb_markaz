type RateLimitStore = {
  count: number;
  resetTime: number;
};

// In-memory store (akan hilang saat server restart/di lingkungan serverless edge)
const store = new Map<string, RateLimitStore>();

const RATE_LIMIT_MAX = 5; // Maksimal request
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 menit

export function checkRateLimit(ip: string): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = store.get(ip);

  // Jika belum ada record atau record sudah kadaluwarsa (lewat 5 menit)
  if (!record || record.resetTime < now) {
    store.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { success: true, limit: RATE_LIMIT_MAX, remaining: RATE_LIMIT_MAX - 1, reset: now + RATE_LIMIT_WINDOW_MS };
  }

  // Jika request lebih dari limit
  if (record.count >= RATE_LIMIT_MAX) {
    return { success: false, limit: RATE_LIMIT_MAX, remaining: 0, reset: record.resetTime };
  }

  // Tambahkan hitungan
  record.count += 1;
  store.set(ip, record);

  return {
    success: true,
    limit: RATE_LIMIT_MAX,
    remaining: RATE_LIMIT_MAX - record.count,
    reset: record.resetTime
  };
}
