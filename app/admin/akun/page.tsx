"use client"

import { useState, useEffect } from "react"
import { Protect } from "@/components/Protect"
import Swal from "sweetalert2"
import { useRouter } from "next/navigation"

interface User {
  id: string
  nama: string
  username: string
  roleId: string
  roleName: string
}

interface Role {
  id: string
  nama: string
}

export default function AccountManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editUserId, setEditUserId] = useState("")
  
  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    password: "", // Opsional saat edit
    roleId: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const respUser = await fetch("/api/users")
      const dataUser = await respUser.json()
      if (respUser.ok) setUsers(dataUser)

      const respRole = await fetch("/api/roles")
      const dataRole = await respRole.json()
      if (respRole.ok) setRoles(dataRole)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEditMode && !formData.password) {
      return Swal.fire("Error", "Password wajib diisi untuk akun baru", "error")
    }

    try {
      const url = "/api/users"
      const method = isEditMode ? "PUT" : "POST"
      const payload = isEditMode ? { ...formData, id: editUserId } : formData

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const result = await res.json()
      if (res.ok) {
        Swal.fire("Berhasil", "Akun berhasil disimpan", "success")
        setIsModalOpen(false)
        fetchData()
      } else {
        Swal.fire("Gagal", result.error || "Gagal menyimpan akun", "error")
      }
    } catch (error) {
      Swal.fire("Error", "Terjadi kesalahan sistem", "error")
    }
  }

  const handleDelete = async (id: string, nama: string, roleName: string) => {
    if (roleName === "Super Admin") {
      return Swal.fire("Ditolak", "Akun Super Admin tidak bisa dihapus", "error")
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Hapus Akun?',
      text: `Anda yakin ingin menghapus akun milik ${nama}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!'
    })

    if (isConfirmed) {
      try {
        const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" })
        const result = await res.json()
        
        if (res.ok) {
          Swal.fire("Berhasil", "Akun dihapus", "success")
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
    setFormData({ nama: "", username: "", password: "", roleId: roles[0]?.id || "" })
    setIsEditMode(false)
    setIsModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditUserId(user.id)
    setIsEditMode(true)
    setFormData({
      nama: user.nama,
      username: user.username,
      password: "", // Dikosongkan, admin bisa isi jika ingin reset password
      roleId: user.roleId
    })
    setIsModalOpen(true)
  }

  return (
    <Protect 
      permission="manage_users" 
      fallback={
        <div className="p-8 text-center text-red-500 mt-20">
          <h2 className="text-2xl font-bold">Akses Ditolak</h2>
          <p>Anda tidak memiliki izin untuk mengelola pengaturan akun.</p>
          <button onClick={() => router.push('/admin/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Kembali ke Dashboard</button>
        </div>
      }
    >
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gold-500">Manajemen Akun</h1>
            <p className="text-gray-400 text-sm mt-1">Kelola staf dan kredensial akses ke sistem ini.</p>
          </div>
          <button onClick={openAddModal} className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-dark-900 font-bold rounded-lg transition-colors shadow-lg shadow-gold-600/20">
            + Tambah Akun Baru
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 opacity-50">Memuat data...</div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-dark-800 border border-gold-500/20 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-dark-900/80 text-xs uppercase font-semibold text-gold-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nama & Username</th>
                    <th className="px-6 py-4">Status & Role</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white text-base">{user.nama}</div>
                        <div className="text-gray-500 text-xs mt-0.5">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${user.roleName === 'Super Admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {user.roleName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(user)} className="px-3 py-1.5 bg-dark-900 hover:bg-white/10 text-gold-400 text-xs font-semibold rounded-lg border border-gold-500/20 transition">Edit</button>
                        {user.roleName !== "Super Admin" && (
                          <button onClick={() => handleDelete(user.id, user.nama, user.roleName)} className="px-3 py-1.5 bg-dark-900 hover:bg-red-500/10 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition">Hapus</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gold-500/20 flex flex-col">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark-900/50">
                <h3 className="text-xl font-bold text-gold-500">{isEditMode ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition">✕</button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      className="w-full bg-dark-900 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 placeholder-gray-600"
                      placeholder="e.g. Fulan bin Fulan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Username (Login)</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-dark-900 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 placeholder-gray-600"
                      placeholder="e.g. admin_asrama"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Password {isEditMode && <span className="text-xs text-gray-500 font-normal">(Kosongkan jika tidak ingin mengubah)</span>}
                    </label>
                    <input
                      type="password"
                      required={!isEditMode}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-dark-900 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                      placeholder="••••••••"
                      minLength={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Peran / Role</label>
                    <select
                      required
                      value={formData.roleId}
                      onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                      className="w-full bg-dark-900 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>-- Pilih Role --</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 pt-6 border-t border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-dark-900 text-gray-300 rounded-xl hover:bg-white/5 font-semibold transition">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-gold-600 hover:bg-gold-500 text-dark-900 rounded-xl font-bold transition shadow-lg shadow-gold-500/20">Simpan Akun</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Protect>
  )
}
