"use client";

import { useState, useEffect } from "react";
import { Protect, usePermissions } from "@/components/Protect";
import { swalSuccess, swalError, swalDanger } from "@/app/lib/swal";

export default function MasterKategoriProgramPage() {
  const [kategori, setKategori] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { hasAccess } = usePermissions();
  const canManage = hasAccess("manage_program");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editId, setEditId] = useState("");
  const [nama, setNama] = useState("");
  const [isActive, setIsActive] = useState(true);

  const muatData = async () => {
    try {
      const res = await fetch("/api/kategori-program");
      if (res.ok) setKategori(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  const resetForm = () => {
    setEditId("");
    setNama("");
    setIsActive(true);
  };

  const bukaModalEdit = (k: any) => {
    setEditId(k.id);
    setNama(k.nama);
    setIsActive(k.isActive);
    setIsModalOpen(true);
  };

  const simpanKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editId ? `/api/kategori-program/${editId}` : "/api/kategori-program";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, isActive }),
    });

    setLoading(false);
    if (res.ok) {
      swalSuccess("Berhasil", `Kategori berhasil ${editId ? "diperbarui" : "ditambahkan"}`);
      setIsModalOpen(false);
      resetForm();
      muatData();
    } else {
      const data = await res.json();
      swalError("Gagal", data.error || "Gagal menyimpan kategori");
    }
  };

  const hapusKategori = async (id: string, namaKat: string) => {
      const result = await swalDanger("Hapus Kategori?", `Yakin hapus kategori ${namaKat}? Kategori yang dihapus tidak bisa dikembalikan.`);
      if (result.isConfirmed) {
          const res = await fetch(`/api/kategori-program/${id}`, { method: "DELETE" });
          if(res.ok) {
              swalSuccess("Terhapus", "Kategori berhasil dihapus");
              muatData();
          } else {
              const data = await res.json();
              swalError("Gagal", data.error || "Gagal menghapus kategori");
          }
      }
  }

  return (
    <Protect permission="view_program" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin.</div>}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-gold-500/10 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Master Kategori Program</h1>
            <p className="text-gray-400 mt-1">Kelola daftar pilihan kategori yang dapat dipilih saat membuat Program.</p>
          </div>
          {canManage && (
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-gold-500 text-black px-4 py-2 font-bold rounded-xl shadow-md hover:bg-gold-400 transition"
            >
              + Tambah Kategori
            </button>
          )}
        </div>

        <div className="bg-dark-800 rounded-2xl p-6 border border-gold-500/10 shadow-inner">
          {kategori.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium">Belum ada kategori. Silakan tambahkan baru.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-dark-900 text-gold-500 text-sm font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-16 text-center">No</th>
                    <th className="p-3">Nama Kategori</th>
                    <th className="p-3 text-center w-32">Status</th>
                    <th className="p-3 text-right w-48">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 divide-y divide-gold-500/10">
                  {kategori.map((k, i) => (
                    <tr key={k.id} className="hover:bg-dark-900/50 transition">
                      <td className="p-3 text-center">{i + 1}</td>
                      <td className="p-3 font-semibold text-lg">{k.nama}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${k.isActive ? "bg-green-500/10 text-green-500 border border-green-500/30" : "bg-red-500/10 text-red-500 border border-red-500/30"}`}>
                          {k.isActive ? "AKTIF" : "NON-AKTIF"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {canManage && (
                          <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => bukaModalEdit(k)}
                                className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => hapusKategori(k.id, k.nama)}
                                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                                Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gold-500/20">
              <div className="p-5 bg-dark-900 border-b border-gold-500/10">
                <h2 className="text-xl font-bold text-gold-500">{editId ? "Edit Kategori" : "Tambah Kategori Baru"}</h2>
              </div>
              <form onSubmit={simpanKategori} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Nama Kategori</label>
                  <input type="text" value={nama} onChange={(e) => setNama(e.target.value.toUpperCase())} required className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50 uppercase" placeholder="Cth: TAHFIDZ" />
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-gold-500" />
                  <label htmlFor="isActive" className="font-bold text-sm text-gray-300">Kategori Aktif (Muncul saat buat program)</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-dark-900 rounded-xl transition">Batal</button>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 text-black font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 bg-gold-500 hover:bg-gold-400">
                    {loading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Protect>
  );
}
