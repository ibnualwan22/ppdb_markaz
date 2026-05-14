"use client";

import { useState, useEffect } from "react";
import { swalConfirm, swalSuccess, swalError } from "../../lib/swal";
import { Protect, usePermissions } from "@/components/Protect";
import Swal from "sweetalert2";

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
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

  const { hasAccess } = usePermissions();
  const isSuperAdmin = hasAccess("all_access");

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

  const handleCustomFormat = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v.length > 12) v = v.substring(0, 12);

    if (v.length >= 11) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4, 8)} ${v.substring(8, 10)}:${v.substring(10)}`;
    } else if (v.length >= 9) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4, 8)} ${v.substring(8)}`;
    } else if (v.length >= 5) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
    } else if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  const parseCustomDateTime = (formattedStr: string) => {
    if (!formattedStr) return null;
    const parts = formattedStr.trim().split(/\s+/);
    if (parts.length < 1) return null;
    const dateParts = parts[0].split("/");
    if (dateParts.length !== 3) return null;
    
    const day = dateParts[0].padStart(2, "0");
    const month = dateParts[1].padStart(2, "0");
    const year = dateParts[2];
    if (year.length !== 4) return null;

    let hour = "00";
    let minute = "00";
    if (parts.length > 1) {
      const timeParts = parts[1].split(":");
      hour = timeParts[0].padStart(2, "0");
      if (timeParts.length > 1) {
        minute = timeParts[1].padStart(2, "0");
      }
    }

    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const simpanDufahBaru = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBuka = parseCustomDateTime(tanggalBuka);
    const parsedTutup = parseCustomDateTime(tanggalTutup);

    if (tanggalBuka && !parsedBuka) {
      return swalError("Format Salah", "Format Buka Pendaftaran harus DD/MM/YYYY HH:mm lengkap (Contoh: 01/05/2026 08:30)");
    }
    if (tanggalTutup && !parsedTutup) {
      return swalError("Format Salah", "Format Tutup Pendaftaran harus DD/MM/YYYY HH:mm lengkap (Contoh: 01/05/2026 08:30)");
    }

    setLoading(true);
    const res = await fetch("/api/dufah", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaBaru, tanggalBuka: parsedBuka, tanggalTutup: parsedTutup }),
    });

    if (res.ok) {
      swalSuccess("Berhasil", "Duf'ah baru berhasil ditambahkan.");
      setNamaBaru(""); setTanggalBuka(""); setTanggalTutup("");
      muatData();
    } else {
      swalError("Gagal membuat Duf'ah");
    }
    setLoading(false);
  };

  const setAktif = async (id: number, nama: string) => {
    const result = await swalConfirm(
      "Aktifkan Duf'ah?",
      `PENTING: Mengaktifkan ${nama} akan otomatis menonaktifkan (Auto-CO) semua santri reguler di bulan sebelumnya. Lanjutkan?`
    );
    if (!result.isConfirmed) return;

    setLoading(true);
    const res = await fetch(`/api/dufah/${id}/active`, { method: "PATCH" });
    if (res.ok) {
      swalSuccess("Berhasil!", `${nama} berhasil diaktifkan.`);
      muatData();
    } else {
      swalError("Gagal mengaktifkan Duf'ah");
    }
    setLoading(false);
  };

  const formatDateForDisplayCustom = (dateString: string | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const dWib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    const day = dWib.getUTCDate().toString().padStart(2, "0");
    const month = (dWib.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = dWib.getUTCFullYear();
    const hours = dWib.getUTCHours().toString().padStart(2, "0");
    const minutes = dWib.getUTCMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const bukaModalEdit = (dufah: any) => {
    setEditId(dufah.id);
    setEditNama(dufah.nama);
    setEditTanggalBuka(formatDateForDisplayCustom(dufah.tanggalBuka));
    setEditTanggalTutup(formatDateForDisplayCustom(dufah.tanggalTutup));
    setIsModalOpen(true);
  };

  const simpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    const parsedBuka = parseCustomDateTime(editTanggalBuka);
    const parsedTutup = parseCustomDateTime(editTanggalTutup);

    if (editTanggalBuka && !parsedBuka) {
      return swalError("Format Salah", "Format Buka Pendaftaran harus DD/MM/YYYY HH:mm lengkap (Contoh: 01/05/2026 08:30)");
    }
    if (editTanggalTutup && !parsedTutup) {
      return swalError("Format Salah", "Format Tutup Pendaftaran harus DD/MM/YYYY HH:mm lengkap (Contoh: 01/05/2026 08:30)");
    }

    setLoading(true);
    const res = await fetch(`/api/dufah/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: editNama,
        tanggalBuka: parsedBuka,
        tanggalTutup: parsedTutup
      }),
    });

    if (res.ok) {
      swalSuccess("Berhasil!", "Jadwal pendaftaran diperbarui.");
      setIsModalOpen(false);
      muatData();
    } else {
      swalError("Gagal menyimpan perubahan");
    }
    setLoading(false);
  };

  const hapusDufah = async (id: number, nama: string) => {
    const result = await Swal.fire({
      title: "Hapus Permanen Duf'ah?",
      html: `Yakin ingin menghapus <b>${nama}</b>? Semua riwayat asrama di bulan ini akan ikut terhapus.<br><br>Ketik <b>${nama}</b> untuk melanjutkan:`,
      input: "text",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus Permanen",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (value !== nama) {
          return "Nama tidak cocok!";
        }
      }
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    const res = await fetch(`/api/dufah/${id}`, { method: "DELETE" });
    if (res.ok) {
      swalSuccess("Berhasil", "Duf'ah berhasil dihapus.");
      muatData();
    } else {
      swalError("Gagal menghapus Duf'ah");
    }
    setLoading(false);
  };

  return (
    <Protect permission="manage_dufah" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin untuk mengelola manajemen duf'ah.</div>}>
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8 border-b border-gold-500/10 pb-6">
        <h1 className="text-3xl font-extrabold text-gold-500">Manajemen Duf&apos;ah</h1>
        <p className="text-gray-400 mt-1 font-medium">Kelola periode duf&apos;ah dan jadwal pendaftaran santri.</p>
      </div>

      {/* FORM BUAT DUF'AH BARU */}
      <form onSubmit={simpanDufahBaru} className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-gold-500/20 mb-10">
        <h2 className="text-xl font-bold text-gold-500 mb-4 flex items-center gap-2">
          <IconCalendar /> Buat Duf&apos;ah / Periode Baru
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Nama Duf&apos;ah</label>
            <input type="text" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} placeholder="Cth: Duf'ah 15 (Syawal)" className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 placeholder:text-gray-600 shadow-inner" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Buka Pendaftaran</label>
            <input type="text" placeholder="DD/MM/YYYY HH:mm" value={tanggalBuka} onChange={(e) => setTanggalBuka(handleCustomFormat(e.target.value))} className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 placeholder:text-gray-600 shadow-inner font-mono" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Tutup Pendaftaran</label>
            <input type="text" placeholder="DD/MM/YYYY HH:mm" value={tanggalTutup} onChange={(e) => setTanggalTutup(handleCustomFormat(e.target.value))} className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 placeholder:text-gray-600 shadow-inner font-mono" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="mt-4 w-full bg-gold-500 text-black font-bold py-3 rounded-xl hover:bg-gold-400 transition-all active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50">
          Simpan Duf&apos;ah Baru
        </button>
      </form>

      {/* DAFTAR DUF'AH */}
      <div className="bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-dark-900 border-b border-gold-500/20">
              <tr>
                <th className="p-4 text-gold-600 font-bold">Nama Periode</th>
                <th className="p-4 text-gold-600 font-bold">Jadwal Pendaftaran</th>
                <th className="p-4 text-gold-600 font-bold text-center">Status</th>
                <th className="p-4 text-gold-600 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && dataDufah.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                    Memuat data...
                  </div>
                </td></tr>
              ) : dataDufah.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500 font-medium">Belum ada Duf&apos;ah.</td></tr>
              ) : (
                dataDufah.map((dufah) => (
                  <tr key={dufah.id} className={`border-b border-gold-500/5 hover:bg-dark-900/50 transition ${dufah.isActive ? 'bg-green-900/10' : ''}`}>
                    <td className="p-4 font-bold text-lg text-gray-200">{dufah.nama}</td>
                    <td className="p-4">
                      <p className="text-sm"><span className="text-green-500 font-bold">Buka:</span> {dufah.tanggalBuka ? `${new Date(dufah.tanggalBuka).getDate().toString().padStart(2, '0')}/${(new Date(dufah.tanggalBuka).getMonth() + 1).toString().padStart(2, '0')}/${new Date(dufah.tanggalBuka).getFullYear()} ${new Date(dufah.tanggalBuka).getHours().toString().padStart(2, '0')}:${new Date(dufah.tanggalBuka).getMinutes().toString().padStart(2, '0')}` : '-'}</p>
                      <p className="text-sm"><span className="text-red-500 font-bold">Tutup:</span> {dufah.tanggalTutup ? `${new Date(dufah.tanggalTutup).getDate().toString().padStart(2, '0')}/${(new Date(dufah.tanggalTutup).getMonth() + 1).toString().padStart(2, '0')}/${new Date(dufah.tanggalTutup).getFullYear()} ${new Date(dufah.tanggalTutup).getHours().toString().padStart(2, '0')}:${new Date(dufah.tanggalTutup).getMinutes().toString().padStart(2, '0')}` : '-'}</p>
                    </td>
                    <td className="p-4 text-center">
                      {dufah.isActive ? (
                        <span className="bg-green-500/20 text-green-500 border border-green-500/30 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-sm inline-flex items-center gap-1">
                          <IconCheck /> SEDANG AKTIF
                        </span>
                      ) : (
                        <span className="bg-dark-900 text-gray-600 border border-gray-800 px-3 py-1.5 rounded-full text-xs font-bold">Non-Aktif</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => bukaModalEdit(dufah)}
                          className="bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 border border-gold-500/30 px-3 py-2 rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-1 active:scale-95"
                        >
                          <IconEdit /> Edit
                        </button>

                        {!dufah.isActive && (
                          <button 
                            onClick={() => setAktif(dufah.id, dufah.nama)}
                            disabled={loading}
                            className="bg-dark-900 border border-gray-800 hover:border-gold-500/50 text-gray-300 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1 active:scale-95 hover:text-gold-500"
                          >
                            <IconPlay /> Set Aktif
                          </button>
                        )}

                        {isSuperAdmin && (
                          <button 
                            onClick={() => hapusDufah(dufah.id, dufah.nama)}
                            disabled={loading}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-2 rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-1 active:scale-95"
                          >
                            <IconTrash /> Hapus
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-gold-500/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="bg-dark-900 border-b border-gold-500/10 p-5">
              <h2 className="text-xl font-bold text-gold-500 flex items-center gap-2"><IconEdit /> Edit Jadwal Duf&apos;ah</h2>
            </div>
            
            <form onSubmit={simpanEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Nama Duf&apos;ah</label>
                <input type="text" value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 shadow-inner" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Buka Pendaftaran</label>
                <input type="text" placeholder="DD/MM/YYYY HH:mm" value={editTanggalBuka} onChange={(e) => setEditTanggalBuka(handleCustomFormat(e.target.value))} className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 shadow-inner font-mono" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Tutup Pendaftaran</label>
                <input type="text" placeholder="DD/MM/YYYY HH:mm" value={editTanggalTutup} onChange={(e) => setEditTanggalTutup(handleCustomFormat(e.target.value))} className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 shadow-inner font-mono" required />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gold-500/10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-dark-900 rounded-xl transition">Batal</button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] active:scale-95 disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
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