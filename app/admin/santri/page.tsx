"use client";

import { useState, useEffect } from "react";
import { swalConfirm, swalSuccess, swalError, swalDanger } from "../../lib/swal";

// SVG Icon Components
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconDocument = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);
const IconDoor = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconMale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-blue-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);
const IconFemale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-pink-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);

export default function MasterSantriPage() {
  const [dataSantri, setDataSantri] = useState<any[]>([]);
  const [daftarDufah, setDaftarDufah] = useState<any[]>([]);

  const [keyword, setKeyword] = useState("");
  const [filterDufah, setFilterDufah] = useState("AKTIF");
  const [filterGender, setFilterGender] = useState("SEMUA");
  const [filterKategori, setFilterKategori] = useState("SEMUA");
  const [loading, setLoading] = useState(true);

  const [riwayatTerpilih, setRiwayatTerpilih] = useState<any | null>(null);

  // State Edit Modal
  const [editModal, setEditModal] = useState<any | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editKategori, setEditKategori] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const muatDaftarDufah = async () => {
    const res = await fetch("/api/dufah");
    if (res.ok) setDaftarDufah(await res.json());
  };

  const muatDataSantri = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/santri?filter=${filterDufah}`);
      if (res.ok) setDataSantri(await res.json());
    } catch (error) {
      console.error("Gagal memuat master santri", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    muatDaftarDufah();
  }, []);

  useEffect(() => {
    muatDataSantri();
  }, [filterDufah]);

  const toggleStatusAktif = async (id: string, nama: string, statusSaatIni: boolean) => {
    const aksi = statusSaatIni ? "MENGELUARKAN (Check Out)" : "MENGAKTIFKAN KEMBALI";
    
    const result = await swalConfirm(
      `Yakin ingin ${aksi}?`,
      `Aksi ini untuk santri bernama ${nama}`
    );
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/santri/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAktif: !statusSaatIni })
    });

    if (res.ok) {
      swalSuccess("Berhasil", `Status ${nama} berhasil diubah.`);
      muatDataSantri();
    } else {
      swalError("Gagal merubah status santri");
    }
  };

  const bukaEditModal = (santri: any) => {
    setEditModal(santri);
    setEditNama(santri.nama);
    setEditKategori(santri.kategori);
    setEditGender(santri.gender);
  };

  const simpanEdit = async () => {
    if (!editModal || !editNama.trim()) return swalError("Nama tidak boleh kosong!");
    setEditLoading(true);
    const res = await fetch(`/api/santri/${editModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: editNama, kategori: editKategori, gender: editGender })
    });
    setEditLoading(false);
    if (res.ok) {
      swalSuccess("Data santri berhasil diperbarui!");
      setEditModal(null);
      muatDataSantri();
    } else {
      swalError("Gagal memperbarui data santri");
    }
  };

  const hapusSantri = async (id: string, nama: string) => {
    const result = await swalDanger(
      "Hapus Permanen Santri?",
      `Yakin ingin menghapus ${nama}? Semua riwayat asrama akan ikut terhapus. Aksi ini tidak bisa dibatalkan!`
    );
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/santri/${id}`, { method: "DELETE" });
    if (res.ok) {
      swalSuccess("Santri berhasil dihapus.");
      muatDataSantri();
    } else {
      swalError("Gagal menghapus santri");
    }
  };

  // Copy Laporan WA Duf'ah
  const copyLaporanWADufah = () => {
    // Group santri by gender > sakan > kamar
    const santriAssigned = dataSantri.filter(s => {
      const riwayatAktif = s.riwayat?.[0];
      return riwayatAktif?.lemari;
    });

    // Build structure: gender > sakan > kamar > santri[]
    const struktur: any = { BANIN: {}, BANAT: {} };

    santriAssigned.forEach(s => {
      const riwayat = s.riwayat[0];
      const lemari = riwayat.lemari;
      if (!lemari) return;

      const sakanNama = lemari.kamar.sakan.nama;
      const kamarNama = lemari.kamar.nama;
      const gender = s.gender === "BANAT" ? "BANAT" : "BANIN";

      if (!struktur[gender][sakanNama]) struktur[gender][sakanNama] = {};
      if (!struktur[gender][sakanNama][kamarNama]) struktur[gender][sakanNama][kamarNama] = [];

      const ket = s.kategori === "KSU" ? " (KSU)" : s.kategori === "LAMA" ? " (Lama)" : s.kategori === "BARU" ? " (Baru)" : "";
      const ustadz = s.kategori === "KSU" ? "U. " : "";

      struktur[gender][sakanNama][kamarNama].push({
        nomor: lemari.nomor,
        nama: `${ustadz}${s.nama}${ket}`,
        nomorSort: lemari.nomor
      });
    });

    // Generate text
    let text = `*📂DATA SANTRI  DUF'AH*\n\n`;

    // BANIN
    const sakanBanin = Object.keys(struktur.BANIN).sort();
    if (sakanBanin.length > 0) {
      text += `*🏘️SAKAN BANIN*\n`;
      sakanBanin.forEach(sakanNama => {
        text += `🏠 *${sakanNama.toUpperCase()}*\n`;
        const kamars = Object.keys(struktur.BANIN[sakanNama]).sort();
        kamars.forEach(kamarNama => {
          text += `\`Kamar ${kamarNama}\`\n`;
          const santriList = struktur.BANIN[sakanNama][kamarNama].sort((a: any, b: any) => a.nomorSort.localeCompare(b.nomorSort));
          santriList.forEach((s: any) => {
            text += `* ${s.nomor}_ ${s.nama}\n`;
          });
          text += `\n`;
        });
      });
    }

    // BANAT
    const sakanBanat = Object.keys(struktur.BANAT).sort();
    if (sakanBanat.length > 0) {
      text += `*🏘️SAKAN BANAT*\n`;
      sakanBanat.forEach(sakanNama => {
        text += `🏠 *${sakanNama.toUpperCase()}*\n`;
        const kamars = Object.keys(struktur.BANAT[sakanNama]).sort();
        kamars.forEach(kamarNama => {
          text += `\`Kamar ${kamarNama}\`\n`;
          const santriList = struktur.BANAT[sakanNama][kamarNama].sort((a: any, b: any) => a.nomorSort.localeCompare(b.nomorSort));
          santriList.forEach((s: any) => {
            text += `* ${s.nomor}_ ${s.nama}\n`;
          });
          text += `\n`;
        });
      });
    }

    navigator.clipboard.writeText(text);
    swalSuccess("Berhasil Disalin!", "Laporan Data Santri Duf'ah siap di-paste di WhatsApp.");
  };

  const dataDitampilkan = dataSantri.filter((santri) => {
    const cocokNama = santri.nama.toLowerCase().includes(keyword.toLowerCase());
    const cocokGender = filterGender === "SEMUA" || santri.gender === filterGender;
    const cocokKategori = filterKategori === "SEMUA" || santri.kategori === filterKategori;
    return cocokNama && cocokGender && cocokKategori;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-blue-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900">Master Data Santri</h1>
          <p className="text-blue-500 mt-1 font-medium">Kelola status aktif, Check Out, edit data, dan riwayat penempatan asrama.</p>
        </div>
        <button onClick={copyLaporanWADufah} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-green-200 flex items-center gap-2 transition-all active:scale-95">
          <IconClipboard /> Laporan WA Duf&apos;ah
        </button>
      </div>

      {/* FILTER AREA */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1.5 uppercase tracking-wide">Periode / Duf&apos;ah</label>
            <select
              value={filterDufah}
              onChange={(e) => setFilterDufah(e.target.value)}
              className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white font-bold text-blue-700 shadow-sm cursor-pointer text-sm"
            >
              <optgroup label="Data Terkini">
                <option value="AKTIF">Santri Aktif Saat Ini</option>
                <option value="ALL">Semua Data Global</option>
              </optgroup>

              <optgroup label="Histori Per Duf'ah">
                {daftarDufah.map((d) => (
                  <option key={d.id} value={d.id}>Riwayat {d.nama}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1.5 uppercase tracking-wide">Gender</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white font-bold text-blue-700 shadow-sm cursor-pointer text-sm"
            >
              <option value="SEMUA">Semua Gender</option>
              <option value="BANIN">Banin (Putra)</option>
              <option value="BANAT">Banat (Putri)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1.5 uppercase tracking-wide">Kategori</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white font-bold text-blue-700 shadow-sm cursor-pointer text-sm"
            >
              <option value="SEMUA">Semua Kategori</option>
              <option value="BARU">Baru</option>
              <option value="LAMA">Lama</option>
              <option value="KSU">KSU</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1.5 uppercase tracking-wide">Cari Nama</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"><IconSearch /></span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari santri..."
                className="w-full pl-10 pr-4 p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm text-blue-900 placeholder:text-blue-300 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Counter */}
      <div className="mb-4 flex items-center gap-3">
        <span className="bg-blue-50 text-blue-700 font-bold text-sm px-3 py-1.5 rounded-xl border border-blue-200">
          Total: {dataDitampilkan.length} santri
        </span>
      </div>

      {/* TABEL MASTER SANTRI */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200">
              <tr>
                <th className="p-4 text-blue-800 font-bold text-center w-12">No</th>
                <th className="p-4 text-blue-800 font-bold">Nama Lengkap</th>
                <th className="p-4 text-blue-800 font-bold">Kategori</th>
                <th className="p-4 text-blue-800 font-bold">Status</th>
                <th className="p-4 text-blue-800 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-blue-500 font-medium">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : dataDitampilkan.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-blue-300 font-medium">Tidak ada santri ditemukan pada filter ini.</td>
                </tr>
              ) : (
                dataDitampilkan.map((santri, index) => (
                  <tr key={santri.id} className={`border-b border-blue-50 hover:bg-blue-50/50 transition ${!santri.isAktif ? 'bg-red-50/50 opacity-75' : ''}`}>
                    <td className="p-4 text-center">
                      <span className="bg-blue-100 text-blue-700 font-bold text-xs w-7 h-7 rounded-full inline-flex items-center justify-center">
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className={`font-bold text-lg flex items-center gap-2 ${!santri.isAktif ? 'text-red-700 line-through' : 'text-blue-900'}`}>
                        {santri.nama} {santri.gender === 'BANAT' ? <IconFemale /> : <IconMale />}
                      </p>
                      <p className="text-xs text-blue-400 mt-1">
                        Terdaftar: {new Date(santri.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg shadow-sm text-white ${santri.kategori === 'KSU' ? 'bg-purple-600' : santri.kategori === 'LAMA' ? 'bg-orange-500' : 'bg-green-500'}`}>
                        {santri.kategori}
                      </span>
                    </td>
                    <td className="p-4">
                      {santri.isAktif ? (
                        <span className="px-3 py-1 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm font-bold inline-flex items-center gap-1">
                          <IconCheck /> Aktif
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm font-bold inline-flex items-center gap-1">
                          <IconX /> Keluar
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setRiwayatTerpilih(santri)}
                          className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition text-xs font-bold border border-blue-200 flex items-center gap-1"
                        >
                          <IconDocument /> Riwayat
                        </button>

                        <button
                          onClick={() => bukaEditModal(santri)}
                          className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition text-xs font-bold border border-yellow-200 flex items-center gap-1"
                        >
                          <IconEdit /> Edit
                        </button>

                        <button
                          onClick={() => toggleStatusAktif(santri.id, santri.nama, santri.isAktif)}
                          className={`px-3 py-1.5 rounded-lg transition text-xs font-bold border flex items-center gap-1 ${santri.isAktif ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                        >
                          {santri.isAktif ? <><IconDoor /> Check Out</> : <><IconCheck /> Aktifkan</>}
                        </button>

                        <button
                          onClick={() => hapusSantri(santri.id, santri.nama)}
                          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition text-xs font-bold border border-red-200 flex items-center gap-1"
                        >
                          <IconTrash /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT SANTRI */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><IconEdit /> Edit Data Santri</h2>
              <p className="text-white/80 text-sm mt-1">Perbarui informasi santri</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Nama Lengkap</label>
                <input type="text" value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Kategori</label>
                  <select value={editKategori} onChange={(e) => setEditKategori(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white font-bold">
                    <option value="BARU">BARU</option>
                    <option value="LAMA">LAMA</option>
                    <option value="KSU">KSU</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Gender</label>
                  <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white font-bold">
                    <option value="BANIN">Banin</option>
                    <option value="BANAT">Banat</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-blue-50 bg-blue-50/30 flex justify-end gap-3">
              <button onClick={() => setEditModal(null)} className="px-5 py-2.5 text-blue-600 font-bold hover:bg-blue-100 rounded-xl transition">Batal</button>
              <button onClick={simpanEdit} disabled={editLoading} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all active:scale-95 shadow-sm">
                {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT */}
      {riwayatTerpilih && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><IconDocument /> Buku Riwayat Asrama</h2>
                <p className="text-blue-200 text-sm mt-1">Santri: <strong>{riwayatTerpilih.nama}</strong></p>
              </div>
              <button onClick={() => setRiwayatTerpilih(null)} className="text-white hover:text-red-300 font-bold text-xl transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {riwayatTerpilih.riwayat.length === 0 ? (
                <div className="text-center py-10 text-blue-300">Belum ada catatan riwayat penempatan.</div>
              ) : (
                <div className="space-y-4">
                  {riwayatTerpilih.riwayat.map((rekamJejejak: any, index: number) => (
                    <div key={rekamJejejak.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-start gap-4 hover:shadow-md transition">
                      <div className="bg-blue-100 text-blue-800 font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-blue-200">
                        #{riwayatTerpilih.riwayat.length - index}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-blue-900 border-b border-blue-50 pb-1 mb-2">
                          {rekamJejejak.dufah?.nama || "Duf'ah Tidak Diketahui"}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-blue-400">Status ID Card:</p>
                            <p className="font-semibold text-blue-900 flex items-center gap-1">
                              {rekamJejejak.isIdCardTaken ? <><IconCheck /> Diambil</> : "Menunggu"}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-400">Status Kamar:</p>
                            <p className="font-semibold text-blue-900">
                              {rekamJejejak.status === "ASSIGNED" ? "Mendapat Kamar" : "Antrean / Belum Dapat"}
                            </p>
                          </div>
                          <div className="col-span-2 mt-1 bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <p className="text-blue-400 text-xs">Lokasi Lemari (Bulan ke-{rekamJejejak.bulanKe}):</p>
                            <p className="font-bold text-blue-800">
                              {rekamJejejak.lemari
                                ? `${rekamJejejak.lemari.kamar.sakan.nama} | Kamar ${rekamJejejak.lemari.kamar.nama} - Loker ${rekamJejejak.lemari.nomor}`
                                : "Belum ditentukan"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-blue-100 bg-blue-50/30 text-right">
              <button onClick={() => setRiwayatTerpilih(null)} className="px-6 py-2.5 bg-blue-100 text-blue-800 font-bold rounded-xl hover:bg-blue-200 transition">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}