import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Protect } from "@/components/Protect"
import React from 'react'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  // Meskipun middleware bisa melindungi, ini pertahanan berlapis di Server Component
  if (!session) {
    redirect("/login")
  }

  const user = session.user as any

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-2">Selamat datang, {user.name}!</h2>
        <p className="text-gray-600 mb-4">Role Anda adalah: <span className="font-medium text-blue-600">{user.role}</span></p>
        
        <div className="flex gap-4 mb-8">
          {/* Tombol yang bisa dilihat semua admin */}
          <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md">
            Lihat Laporan
          </button>

          {/* Contoh Penggunaan Protect Component (hanya muncul jika punya izin delete_data atau all_access) */}
          <Protect permission="delete_data">
            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition">
              Hapus Semua Data
            </button>
          </Protect>
        </div>
      </div>
    </div>
  )
}
