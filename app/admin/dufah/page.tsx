"use client";

import { useState, useEffect } from "react";

export default function ManajemenDufahPage() {
  const [dataDufah, setDataDufah] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State Form Tambah Baru
  const [namaBaru, setNamaBaru] = useState("");
  const [tanggalBuka, setTanggalBuka] = useState("");
  const [tanggalTutup, setTanggalTutup] = useState("");

  // State Modal Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editTanggalBuka, setEditTanggalBuka] = useState("");
  const [editTanggalTutup, setEditTanggalTutup] = useState("");

  const muatData = async () => {
    try {
      const res = await fetch("/api/dufah");
      if (!res.ok) throw new Error("Respons API bermasalah");
      const data = await res.json();
      setDataDufah(data);
    } catch (error) {
      console.error("Gagal memuat daftar Duf'ah:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    muatData();
  }, []);

  // FUNGSI TAMBAH DUF'AH BARU
  const simpanDufahBaru = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/dufah", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaBaru, tanggalBuka, tanggalTutup }),
    });

    if (res.ok) {
      setNamaBaru(""); setTanggalBuka(""); setTanggalTutup("");
      muatData();
    } else {
      alert("Gagal membuat Duf'ah");
    }
    setLoading(false);
  };

  // FUNGSI SET AKTIF (Yang memicu Auto-CO Santri)
  const setAktif = async (id: number, nama: string) => {
    if (!confirm(`PENTING: Mengaktifkan ${nama} akan otomatis menonaktifkan (Auto-CO) semua santri reguler di bulan sebelumnya. Lanjutkan?`)) return;

    setLoading(true);
    const res = await fetch(`/api/dufah/${id}/active`, { method: "PATCH" });
    if (res.ok) {
      alert(`${nama} berhasil diaktifkan!`);
      muatData();
    } else {
      alert("Gagal mengaktifkan Duf'ah");
    }
    setLoading(false);
  };

  // FUNGSI BUKA MODAL EDIT
  const bukaModalEdit = (dufah: any) => {
    setEditId(dufah.id);
    setEditNama(dufah.nama);
    // Format tanggal ke YYYY-MM-DDTHH:MM agar terbaca oleh input type="datetime-local"
    setEditTanggalBuka(dufah.tanggalBuka ? new Date(dufah.tanggalBuka).toISOString().slice(0, 16) : "");
    setEditTanggalTutup(dufah.tanggalTutup ? new Date(dufah.tanggalTutup).toISOString().slice(0, 16) : "");
    setIsModalOpen(true);
  };

  // FUNGSI SIMPAN EDIT
  const simpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    setLoading(true);
    const res = await fetch(`/api/dufah/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: editNama,
        tanggalBuka: editTanggalBuka || null,
        tanggalTutup: editTanggalTutup || null
      }),
    });

    if (res.ok) {
      setIsModalOpen(false);
      muatData();
    } else {
      alert("Gagal menyimpan perubahan");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Manajemen Duf'ah</h1>

      {/* FORM BUAT DUF'AH BARU */}
      <form onSubmit={simpanDufahBaru} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-10">
        <h2 className="text-xl font-bold text-green-700 mb-4">Buat Duf'ah / Periode Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nama Duf'ah</label>
            <input type="text" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} placeholder="Cth: Duf'ah 15 (Syawal)" className="w-full p-3 border border-gray-300 rounded-lg outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Buka Pendaftaran</label>
            <input type="datetime-local" value={tanggalBuka} onChange={(e) => setTanggalBuka(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tutup Pendaftaran</label>
            <input type="datetime-local" value={tanggalTutup} onChange={(e) => setTanggalTutup(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
          Simpan Duf'ah Baru
        </button>
      </form>

      {/* DAFTAR DUF'AH */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="p-4 text-gray-800 font-bold">Nama Periode</th>
              <th className="p-4 text-gray-800 font-bold">Jadwal Pendaftaran</th>
              <th className="p-4 text-gray-800 font-bold text-center">Status</th>
              <th className="p-4 text-gray-800 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && dataDufah.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">Memuat data...</td></tr>
            ) : dataDufah.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">Belum ada Duf'ah.</td></tr>
            ) : (
              dataDufah.map((dufah) => (
                <tr key={dufah.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${dufah.isActive ? 'bg-green-50' : ''}`}>
                  <td className="p-4 font-bold text-lg text-gray-900">{dufah.nama}</td>
                  <td className="p-4">
                    <p className="text-sm"><span className="text-green-600 font-bold">Buka:</span> {dufah.tanggalBuka ? new Date(dufah.tanggalBuka).toLocaleString('id-ID') : '-'}</p>
                    <p className="text-sm"><span className="text-red-600 font-bold">Tutup:</span> {dufah.tanggalTutup ? new Date(dufah.tanggalTutup).toLocaleString('id-ID') : '-'}</p>
                  </td>
                  <td className="p-4 text-center">
                    {dufah.isActive ? (
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-sm">SEDANG AKTIF</span>
                    ) : (
                      <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">Non-Aktif</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      {/* TOMBOL EDIT WAKTU */}
                      <button 
                        onClick={() => bukaModalEdit(dufah)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                      >
                        ✏️ Edit Waktu
                      </button>

                      {/* TOMBOL SET AKTIF */}
                      {!dufah.isActive && (
                        <button 
                          onClick={() => setAktif(dufah.id, dufah.nama)}
                          disabled={loading}
                          className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50"
                        >
                          Set Aktif
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* MODAL EDIT WAKTU PENDAFTARAN               */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 p-5">
              <h2 className="text-xl font-bold text-white">Edit Jadwal Duf'ah</h2>
            </div>
            
            <form onSubmit={simpanEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Duf'ah</label>
                <input type="text" value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Buka Pendaftaran (Diperpanjang/Dimajukan)</label>
                <input type="datetime-local" value={editTanggalBuka} onChange={(e) => setEditTanggalBuka(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tutup Pendaftaran (Deadline Baru)</label>
                <input type="datetime-local" value={editTanggalTutup} onChange={(e) => setEditTanggalTutup(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition">Batal</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm">
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}