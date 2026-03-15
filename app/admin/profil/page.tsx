"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Swal from "sweetalert2"

export default function ProfilPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    passwordLama: "",
    passwordBaru: "",
    konfirmasiPassword: ""
  })

  // Prevent flickers
  if (status === "loading") {
    return <div className="p-10 text-gray-500">Memuat profil...</div>
  }

  const user = session?.user as any

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.passwordBaru !== formData.konfirmasiPassword) {
      return Swal.fire("Error", "Konfirmasi password baru tidak cocok!", "error")
    }

    if (formData.passwordBaru.length < 5) {
      return Swal.fire("Error", "Password baru minimal 5 karakter", "error")
    }

    setLoading(true)

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordLama: formData.passwordLama,
          passwordBaru: formData.passwordBaru
        })
      })

      const data = await res.json()

      if (res.ok) {
        Swal.fire("Berhasil", "Password Anda berhasil diperbarui", "success")
        setFormData({ passwordLama: "", passwordBaru: "", konfirmasiPassword: "" })
      } else {
        Swal.fire("Gagal", data.error || "Gagal memperbarui password", "error")
      }
    } catch (error) {
      Swal.fire("Error", "Terjadi kesalahan server", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-500">Profil Saya</h1>
        <p className="text-gray-400 text-sm mt-1">Lihat identitas akun Anda dan ubah keamanan kata sandi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Info Card Component */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-dark-800 rounded-2xl shadow-xl overflow-hidden border border-gold-500/20 text-center p-6">
            <div className="w-24 h-24 rounded-full bg-dark-900 border-2 border-gold-500/50 mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg shadow-gold-500/10">
              🧑‍💼
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
            <p className="text-sm text-gold-500 font-medium mb-4">@{user?.username}</p>
            
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold tracking-wide shadow-inner">
              {user?.role}
            </div>
          </div>
          
          <div className="bg-dark-800 rounded-2xl shadow-xl p-5 border border-white/5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Statistik Izin</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Akses</span>
              <span className="text-white font-bold bg-dark-900 px-3 py-1 rounded-md border border-white/10">
                {user?.permissions?.includes('all_access') ? 'Super / Tidak Terbatas' : `${user?.permissions?.length || 0} Izin`}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2">
          <div className="bg-dark-800 rounded-2xl shadow-xl border border-gold-500/20 h-full flex flex-col">
            <div className="p-6 border-b border-white/10 bg-dark-900/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gold-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Ganti Kata Sandi (Password)
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Kata Sandi Lama</label>
                  <input
                    type="password"
                    required
                    value={formData.passwordLama}
                    onChange={(e) => setFormData({...formData, passwordLama: e.target.value})}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                    placeholder="Masukkan password saat ini"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Kata Sandi Baru</label>
                  <input
                    type="password"
                    required
                    minLength={5}
                    value={formData.passwordBaru}
                    onChange={(e) => setFormData({...formData, passwordBaru: e.target.value})}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                    placeholder="Minimal 5 karakter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Konfirmasi Kata Sandi Baru</label>
                  <input
                    type="password"
                    required
                    value={formData.konfirmasiPassword}
                    onChange={(e) => setFormData({...formData, konfirmasiPassword: e.target.value})}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                    placeholder="Ulangi kata sandi baru"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-3 bg-gold-600 hover:bg-gold-500 text-dark-900 font-bold rounded-xl transition shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  )
}
