import { NextRequest } from 'next/server'

/**
 * Validates the cron secret on an incoming request.
 * The secret must be set in the CRON_SECRET environment variable.
 * Generate with: openssl rand -base64 32
 *
 * Vercel sends it as: Authorization: Bearer <secret>
 * Direct invocations can send: x-cron-secret: <secret>
 */
export function validateCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  // Vercel sends Authorization: Bearer <secret>
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  // Allow direct invocation with x-cron-secret header (dev/testing)
  const cronHeader = request.headers.get('x-cron-secret')
  if (cronHeader === secret) return true

  return false
}

export function unauthorizedResponse(): Response {
  return new Response('Unauthorized', { status: 401 })
}
