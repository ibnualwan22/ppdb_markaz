import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

/**
 * Utility untuk mengecek izin akses (Permission) dari sebuah sesi atau API Key eksternal
 * Dapat digunakan di Route Handlers (API Router) atau Server Actions.
 * 
 * @param req Request Object (untuk mengecek header x-api-key)
 * @param requiredPermission string permission yang dibutuhkan. 
 */
export async function checkPermission(req: NextRequest, requiredPermission: string) {
  try {
    // 1. Cek NextAuth Session
    const session = await getServerSession(authOptions)
    
    if (session?.user && (session.user as any).role) {
      const user = session.user as any
      const permissions = user.permissions || []
      
      // Jika memiliki izin yang diminta atau memiliki 'all_access'
      if (permissions.includes(requiredPermission) || permissions.includes('all_access')) {
        return { allowed: true, type: 'session', role: user.role }
      }
      return { allowed: false, reason: 'Forbidden: Insufficient session permissions.' }
    }

    // 2. Jika tidak ada sesi, cek header 'x-api-key'
    const apiKeyHeader = req.headers.get('x-api-key')
    
    if (apiKeyHeader) {
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKeyHeader },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      })

      if (!apiKeyRecord) {
        return { allowed: false, reason: 'Unauthorized: Invalid API Key.' }
      }

      if (!apiKeyRecord.isActive) {
        return { allowed: false, reason: 'Forbidden: API Key is inactive.' }
      }

      const permissions = apiKeyRecord.role.permissions.map(rp => rp.permission.namaAksi)

      if (permissions.includes(requiredPermission) || permissions.includes('all_access')) {
        return { allowed: true, type: 'api-key', role: apiKeyRecord.role.nama, project: apiKeyRecord.namaProject }
      }

      return { allowed: false, reason: 'Forbidden: Insufficient API Key permissions.' }
    }

    // Jika tidak ada session dan tidak ada api key
    return { allowed: false, reason: 'Unauthorized: Missing session or API key.' }

  } catch (error) {
    console.error("Error in checkPermission:", error)
    return { allowed: false, reason: 'Internal Server Error' }
  }
}
