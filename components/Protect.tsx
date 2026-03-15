"use client"

import { useSession } from "next-auth/react"
import React, { ReactNode } from "react"

interface ProtectProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode // Komponen yang ditampilkan jika tidak ada izin (opsional)
}

/**
 * Komponen Protect untuk menyembunyikan / menampilkan elemen UI berdasarkan Permission pengguna.
 * Pengecekan dilakukan di sisi klien.
 */
export function Protect({ permission, children, fallback = null }: ProtectProps) {
  const { data: session, status } = useSession()

  // Tampilkan null saat masih loading untuk mencegah flickering
  if (status === "loading") {
    return null
  }

  if (session && session.user) {
    const userPermissions = (session.user as any).permissions || []
    
    // Jika punya izin khusus atau akses penuh
    if (userPermissions.includes(permission) || userPermissions.includes("all_access")) {
      return <>{children}</>
    }
  }

  return <>{fallback}</>
}

export function usePermissions() {
  const { data: session } = useSession()
  const userPermissions = (session?.user as any)?.permissions || []
  
  const hasAccess = (permission: string) => {
    return userPermissions.includes(permission) || userPermissions.includes("all_access")
  }
  
  return { hasAccess, permissions: userPermissions }
}
