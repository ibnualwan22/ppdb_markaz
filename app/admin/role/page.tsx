"use client"

import { useState, useEffect } from "react"
import { Protect } from "@/components/Protect"
import Swal from "sweetalert2"
import { useRouter } from "next/navigation"

interface Role {
  id: string
  nama: string
  usersCount: number
  permissions: string[]
}

interface Permission {
  id: string
  namaAksi: string
  deskripsi: string
}

export default function RoleManagementPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionsList, setPermissionsList] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editRoleId, setEditRoleId] = useState("")
  
  const [formData, setFormData] = useState<{ nama: string, permissionIds: string[] }>({
    nama: "",
    permissionIds: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const respRole = await fetch("/api/roles")
      const dataRole = await respRole.json()
      if (respRole.ok) setRoles(dataRole)

      const respPerm = await fetch("/api/permissions")
      const dataPerm = await respPerm.json()
      if (respPerm.ok) setPermissionsList(dataPerm)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckboxChange = (permId: string) => {
    setFormData(prev => {
      const pIds = prev.permissionIds
      if (pIds.includes(permId)) {
        return { ...prev, permissionIds: pIds.filter(id => id !== permId) }
      } else {
        return { ...prev, permissionIds: [...pIds, permId] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.permissionIds.length === 0) {
      return Swal.fire("Error", "Pilih setidaknya satu hak akses", "error")
    }

    try {
      const url = "/api/roles"
      const method = isEditMode ? "PUT" : "POST"
      const payload = isEditMode ? { ...formData, id: editRoleId } : formData

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const result = await res.json()
      if (res.ok) {
        Swal.fire("Berhasil", "Role berhasil disimpan", "success")
        setIsModalOpen(false)
        fetchData()
      } else {
        Swal.fire("Gagal", result.error || "Gagal menyimpan role", "error")
      }
    } catch (error) {
      Swal.fire("Error", "Terjadi kesalahan sistem", "error")
    }
  }

  const handleDelete = async (id: string, nama: string) => {
    if (nama === "Super Admin") {
      return Swal.fire("Ditolak", "Role Super Admin tidak bisa dihapus", "error")
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Hapus Role?',
      text: `Anda yakin ingin menghapus role ${nama}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!'
    })

    if (isConfirmed) {
      try {
        const res = await fetch(`/api/roles?id=${id}`, { method: "DELETE" })
        const result = await res.json()
        
        if (res.ok) {
          Swal.fire("Berhasil", "Role dihapus", "success")
          fetchData()
        } else {
          Swal.fire("Gagal", result.error, "error")
        }
      } catch (error) {
        Swal.fire("Error", "Terjadi kesalahan", "error")
      }
    }
  }

  const openAddModal = () => {
    setFormData({ nama: "", permissionIds: [] })
    setIsEditMode(false)
    setIsModalOpen(true)
  }

  const openEditModal = (role: Role) => {
    if (role.nama === "Super Admin") {
      return Swal.fire("Info", "Role Super Admin memiliki semua akses by default dan tidak perlu diedit", "info")
    }
    
    setEditRoleId(role.id)
    setIsEditMode(true)
    // Map existing permissions ke ID nya berdasar array namaAksi
    const perms = permissionsList.filter(p => role.permissions.includes(p.namaAksi)).map(p => p.id)
    
    setFormData({
      nama: role.nama,
      permissionIds: perms
    })
    setIsModalOpen(true)
  }

  return (
    <Protect 
      permission="manage_roles" 
      fallback={
        <div className="p-8 text-center text-red-500 mt-20">
          <h2 className="text-2xl font-bold">Akses Ditolak</h2>
          <p>Anda tidak memiliki izin untuk mengelola role.</p>
          <button onClick={() => router.push('/admin/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Kembali ke Dashboard</button>
        </div>
      }
    >
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gold-500">Manajemen Role</h1>
            <p className="text-gray-400 text-sm mt-1">Kelola peranan dan hak akses aplikasi tingkat lanjut.</p>
          </div>
          <button onClick={openAddModal} className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-dark-900 font-bold rounded-lg transition-colors">
            + Tambah Role Baru
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 opacity-50">Memuat data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-dark-800 border border-gold-500/20 shadow-xl rounded-2xl p-6 relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl text-white">{role.nama}</h3>
                  <span className="text-xs bg-dark-900 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-full whitespace-nowrap">
                    {role.usersCount} Pengguna
                  </span>
                </div>
                
                <div className="flex-1 mb-6">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Hak Akses:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.nama === "Super Admin" ? (
                      <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-md border border-red-500/20">All Access</span>
                    ) : (
                      role.permissions.slice(0, 5).map(perm => (
                        <span key={perm} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md border border-blue-500/20">
                          {perm}
                        </span>
                      ))
                    )}
                    {role.permissions.length > 5 && (
                      <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-md border border-gray-700">+{role.permissions.length - 5} lainnya</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-auto pt-4 border-t border-white/5">
                  <button onClick={() => openEditModal(role)} className="flex-1 py-2 text-sm text-gold-500 font-semibold bg-gold-500/10 rounded-lg hover:bg-gold-500/20 transition">Edit</button>
                  <button onClick={() => handleDelete(role.id, role.nama)} className="flex-1 py-2 text-sm text-red-500 font-semibold bg-red-500/10 rounded-lg hover:bg-red-500/20 transition">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gold-500/20 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark-900/50">
                <h3 className="text-xl font-bold text-gold-500">{isEditMode ? 'Edit Role' : 'Tambah Role Baru'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition">✕</button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nama Role</label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      className="w-full bg-dark-900 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                      placeholder="e.g. Staf Asrama"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Pilih Hak Akses (Permissions)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2">
                      {permissionsList.filter(p => p.namaAksi !== 'all_access').map((perm) => (
                        <label key={perm.id} className={`flex items-start p-3 rounded-xl border cursor-pointer transition-colors ${formData.permissionIds.includes(perm.id) ? 'bg-gold-500/10 border-gold-500/50' : 'bg-dark-900 border-white/5 hover:border-gold-500/30'}`}>
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(perm.id)}
                              onChange={() => handleCheckboxChange(perm.id)}
                              className="w-4 h-4 text-gold-500 bg-dark-800 border-gray-600 rounded focus:ring-gold-500 focus:ring-2"
                            />
                          </div>
                          <div className="ml-3 text-sm flex flex-col justify-center">
                            <span className={`font-medium ${formData.permissionIds.includes(perm.id) ? 'text-gold-400' : 'text-gray-300'}`}>{perm.namaAksi}</span>
                            {perm.deskripsi && <span className="text-gray-500 text-xs mt-0.5">{perm.deskripsi}</span>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 pt-6 border-t border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-dark-900 text-gray-300 rounded-xl hover:bg-white/5 font-semibold transition">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-gold-600 hover:bg-gold-500 text-dark-900 rounded-xl font-bold transition">Simpan Role</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Protect>
  )
}
