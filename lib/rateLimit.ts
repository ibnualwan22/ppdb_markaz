/**
 * In-memory Rate Limiter to prevent Brute Force attacks.
 * Tracks login attempts per IP address.
 */

// Key: IP Address, Value: { count: number, resetAt: number }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export const MAX_LOGIN_ATTEMPTS = 5
export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000 // 5 menit

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  // Jika record belum ada atau waktu pemblokiran sudah selesai (reset)
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1, resetTime: now + RATE_LIMIT_WINDOW_MS }
  }

  // Jika waktu masih dalam periode yang sama
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetAt }
  }

  // Tambah count jika masih di bawah max limit
  record.count += 1
  rateLimitMap.set(ip, record)

  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - record.count, resetTime: record.resetAt }
}

export function resetRateLimit(ip: string) {
  rateLimitMap.delete(ip)
}
