"use client";

import { useState, useEffect } from "react";

// SVG Icon Components
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const IconPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

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

  const bukaModalEdit = (dufah: any) => {
    setEditId(dufah.id);
    setEditNama(dufah.nama);
    setEditTanggalBuka(dufah.tanggalBuka ? new Date(dufah.tanggalBuka).toISOString().slice(0, 16) : "");
    setEditTanggalTutup(dufah.tanggalTutup ? new Date(dufah.tanggalTutup).toISOString().slice(0, 16) : "");
    setIsModalOpen(true);
  };

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
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8 border-b border-blue-100 pb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">Manajemen Duf&apos;ah</h1>
        <p className="text-blue-500 mt-1 font-medium">Kelola periode duf&apos;ah dan jadwal pendaftaran santri.</p>
      </div>

      {/* FORM BUAT DUF'AH BARU */}
      <form onSubmit={simpanDufahBaru} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-10">
        <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
          <IconCalendar /> Buat Duf&apos;ah / Periode Baru
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Nama Duf&apos;ah</label>
            <input type="text" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} placeholder="Cth: Duf'ah 15 (Syawal)" className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Buka Pendaftaran</label>
            <input type="datetime-local" value={tanggalBuka} onChange={(e) => setTanggalBuka(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Tutup Pendaftaran</label>
            <input type="datetime-local" value={tanggalTutup} onChange={(e) => setTanggalTutup(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 shadow-sm disabled:opacity-50">
          Simpan Duf&apos;ah Baru
        </button>
      </form>

      {/* DAFTAR DUF'AH */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200">
              <tr>
                <th className="p-4 text-blue-800 font-bold">Nama Periode</th>
                <th className="p-4 text-blue-800 font-bold">Jadwal Pendaftaran</th>
                <th className="p-4 text-blue-800 font-bold text-center">Status</th>
                <th className="p-4 text-blue-800 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && dataDufah.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-blue-400 font-medium">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    Memuat data...
                  </div>
                </td></tr>
              ) : dataDufah.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-blue-300 font-medium">Belum ada Duf&apos;ah.</td></tr>
              ) : (
                dataDufah.map((dufah) => (
                  <tr key={dufah.id} className={`border-b border-blue-50 hover:bg-blue-50/30 transition ${dufah.isActive ? 'bg-green-50/50' : ''}`}>
                    <td className="p-4 font-bold text-lg text-blue-900">{dufah.nama}</td>
                    <td className="p-4">
                      <p className="text-sm"><span className="text-green-600 font-bold">Buka:</span> {dufah.tanggalBuka ? new Date(dufah.tanggalBuka).toLocaleString('id-ID') : '-'}</p>
                      <p className="text-sm"><span className="text-red-600 font-bold">Tutup:</span> {dufah.tanggalTutup ? new Date(dufah.tanggalTutup).toLocaleString('id-ID') : '-'}</p>
                    </td>
                    <td className="p-4 text-center">
                      {dufah.isActive ? (
                        <span className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-sm inline-flex items-center gap-1">
                          <IconCheck /> SEDANG AKTIF
                        </span>
                      ) : (
                        <span className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold">Non-Aktif</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => bukaModalEdit(dufah)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-1 active:scale-95"
                        >
                          <IconEdit /> Edit
                        </button>

                        {!dufah.isActive && (
                          <button 
                            onClick={() => setAktif(dufah.id, dufah.nama)}
                            disabled={loading}
                            className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1 active:scale-95"
                          >
                            <IconPlay /> Set Aktif
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
      </div>

      {/* MODAL EDIT WAKTU PENDAFTARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><IconEdit /> Edit Jadwal Duf&apos;ah</h2>
            </div>
            
            <form onSubmit={simpanEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Nama Duf&apos;ah</label>
                <input type="text" value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Buka Pendaftaran</label>
                <input type="datetime-local" value={editTanggalBuka} onChange={(e) => setEditTanggalBuka(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Tutup Pendaftaran</label>
                <input type="datetime-local" value={editTanggalTutup} onChange={(e) => setEditTanggalTutup(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" required />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-blue-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition">Batal</button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50">
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