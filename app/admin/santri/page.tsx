"use client";

import { useState, useEffect } from "react";
import { swalConfirm, swalSuccess, swalError, swalDanger } from "../../lib/swal";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [filterBulanKe, setFilterBulanKe] = useState("SEMUA");
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [riwayatTerpilih, setRiwayatTerpilih] = useState<any | null>(null);

  // State Edit Modal
  const [editModal, setEditModal] = useState<any | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editKategori, setEditKategori] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editBulanKe, setEditBulanKe] = useState("");
  const [editNomorIdCard, setEditNomorIdCard] = useState("");
  const [editRiwayatId, setEditRiwayatId] = useState("");
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
    setCurrentPage(1); // Reset page on filter change
    muatDataSantri();
  }, [filterDufah, filterGender, filterKategori, filterBulanKe, keyword]);

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
    setEditBulanKe(santri.riwayat?.[0]?.bulanKe || "1");
    setEditNomorIdCard(santri.riwayat?.[0]?.nomorIdCard || "");
    setEditRiwayatId(santri.riwayat?.[0]?.id || "");
  };

  const simpanEdit = async () => {
    if (!editModal || !editNama.trim()) return swalError("Nama tidak boleh kosong!");
    setEditLoading(true);
    const res = await fetch(`/api/santri/${editModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        nama: editNama, 
        kategori: editKategori, 
        gender: editGender, 
        riwayatId: editRiwayatId,
        bulanKe: editBulanKe, 
        nomorIdCard: editNomorIdCard 
      })
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
    const cocokBulanKe = filterBulanKe === "SEMUA" || (santri.riwayat?.[0]?.bulanKe?.toString() === filterBulanKe);
    return cocokNama && cocokGender && cocokKategori && cocokBulanKe;
  });

  const exportToExcel = () => {
    if (dataDitampilkan.length === 0) return swalError("Tidak ada data untuk diexport!");
    const dataExport = dataDitampilkan.map((santri, index) => ({
      No: index + 1,
      Nama: santri.nama,
      Sakan: santri.riwayat?.[0]?.lemari?.kamar?.sakan?.nama || "-",
      Lemari: santri.riwayat?.[0]?.lemari ? `Kamar ${santri.riwayat[0].lemari.kamar.nama} - Loker ${santri.riwayat[0].lemari.nomor}` : "-",
      "No. ID Card": santri.kategori === "KSU" ? "-" : (santri.riwayat?.[0]?.nomorIdCard || "-"),
      "Bulan Ke": santri.riwayat?.[0]?.bulanKe || "-",
      Kategori: santri.kategori,
      Status: santri.isAktif ? "Aktif" : "Keluar"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Santri");
    XLSX.writeFile(workbook, `Master_Santri_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    if (dataDitampilkan.length === 0) return swalError("Tidak ada data untuk diexport!");
    const doc = new jsPDF("p", "pt", "a4");

    doc.setFontSize(14);
    doc.text("Data Master Santri Markaz", 40, 40);

    const tableData = dataDitampilkan.map((santri, index) => [
      index + 1,
      santri.nama,
      santri.riwayat?.[0]?.lemari?.kamar?.sakan?.nama || "-",
      santri.riwayat?.[0]?.lemari ? `Kamar ${santri.riwayat[0].lemari.kamar.nama} - Loker ${santri.riwayat[0].lemari.nomor}` : "-",
      santri.kategori === "KSU" ? "-" : (santri.riwayat?.[0]?.nomorIdCard || "-"),
      santri.riwayat?.[0]?.bulanKe || "-",
      santri.kategori,
      santri.isAktif ? "Aktif" : "Keluar",
      santri.gender // For styling purposes
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["No", "Nama", "Sakan", "Lemari", "ID Card", "Bln", "Kategori", "Status"]],
      body: tableData.map(row => row.slice(0, 8)), // Extract the actual table fields
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
      didParseCell: function(data) {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const gender = tableData[rowIndex][8];
          if (gender === 'BANIN') {
             // Light blue background for Banin
             data.cell.styles.fillColor = [224, 242, 254];
          } else if (gender === 'BANAT') {
             // Light pink background for Banat
             data.cell.styles.fillColor = [252, 231, 243];
          }
        }
      }
    });

    doc.save(`Master_Santri_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gold-500/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gold-500">Master Data Santri</h1>
          <p className="text-gray-400 mt-1 font-medium">Kelola status aktif, Check Out, edit data, dan riwayat penempatan asrama.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={exportToExcel} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2 px-4 rounded-xl shadow-sm text-sm flex items-center gap-1 transition-all active:scale-95">
            <IconDocument /> Excel
          </button>
          <button onClick={exportToPDF} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-4 rounded-xl shadow-sm text-sm flex items-center gap-1 transition-all active:scale-95">
            <IconDocument /> PDF
          </button>
          <button onClick={copyLaporanWADufah} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black font-bold py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] text-sm flex items-center gap-1 transition-all active:scale-95">
            <IconClipboard /> Laporan WA
          </button>
        </div>
      </div>

      {/* FILTER AREA */}
      <div className="bg-dark-800 p-5 rounded-2xl shadow-sm border border-gold-500/20 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">Periode / Duf&apos;ah</label>
            <select
              value={filterDufah}
              onChange={(e) => setFilterDufah(e.target.value)}
              className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 font-bold text-gold-500 shadow-inner cursor-pointer text-sm"
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
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">Gender</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 font-bold text-gold-500 shadow-inner cursor-pointer text-sm"
            >
              <option value="SEMUA">Semua Gender</option>
              <option value="BANIN">Banin (Putra)</option>
              <option value="BANAT">Banat (Putri)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">Kategori</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 font-bold text-gold-500 shadow-inner cursor-pointer text-sm"
            >
              <option value="SEMUA">Semua Kategori</option>
              <option value="BARU">Baru</option>
              <option value="LAMA">Lama</option>
              <option value="KSU">KSU</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">Bulan Ke</label>
            <select
              value={filterBulanKe}
              onChange={(e) => setFilterBulanKe(e.target.value)}
              className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 font-bold text-gold-500 shadow-inner cursor-pointer text-sm"
            >
              <option value="SEMUA">Semua Bulan</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">Cari Nama</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-600"><IconSearch /></span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari santri..."
                className="w-full pl-10 pr-4 p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 shadow-inner text-gray-200 placeholder:text-gray-600 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Counter */}
      <div className="mb-4 flex items-center gap-3">
        <span className="bg-dark-800 text-gold-500 font-bold text-sm px-3 py-1.5 rounded-xl border border-gold-500/20">
          Total: {dataDitampilkan.length} santri
        </span>
      </div>

      {/* TABEL MASTER SANTRI */}
      <div className="bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-dark-900 border-b border-gold-500/20 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-gold-600 font-bold text-center w-12">No</th>
                <th className="p-4 text-gold-600 font-bold">Nama Lengkap</th>
                <th className="p-4 text-gold-600 font-bold text-center">No. ID Card</th>
                <th className="p-4 text-gold-600 font-bold text-center">Bulan Ke-</th>
                <th className="p-4 text-gold-600 font-bold">Kategori</th>
                <th className="p-4 text-gold-600 font-bold">Status</th>
                <th className="p-4 text-gold-600 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                      <span className="text-gray-400 font-medium">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : dataDitampilkan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500 font-medium">Tidak ada santri ditemukan pada filter ini.</td>
                </tr>
              ) : (
                (() => {
                  const totalPages = Math.ceil(dataDitampilkan.length / itemsPerPage);
                  const currentData = dataDitampilkan.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  return currentData.map((santri, i) => {
                    const index = (currentPage - 1) * itemsPerPage + i;
                    return (
                      <tr key={santri.id} className={`border-b border-gold-500/5 hover:bg-dark-900/50 transition ${!santri.isAktif ? 'bg-red-900/10 opacity-75' : ''}`}>
                        <td className="p-4 text-center">
                      <span className="bg-dark-900 border border-gold-500/20 text-gold-500 font-bold text-xs w-7 h-7 rounded-full inline-flex items-center justify-center">
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className={`font-bold text-lg flex items-center gap-2 ${!santri.isAktif ? 'text-red-500 line-through' : 'text-gray-200'}`}>
                        {santri.nama} {santri.gender === 'BANAT' ? <IconFemale /> : <IconMale />}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Terdaftar: {new Date(santri.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="p-4 text-center font-bold text-gold-400">
                      {santri.kategori === 'KSU' ? '-' : santri.riwayat?.[0]?.nomorIdCard || '-'}
                    </td>
                    <td className="p-4 text-center font-bold text-gold-400">
                      {santri.riwayat?.[0]?.bulanKe || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg shadow-sm text-white ${santri.kategori === 'KSU' ? 'bg-purple-900/80' : santri.kategori === 'LAMA' ? 'bg-orange-800' : 'bg-green-800'}`}>
                        {santri.kategori}
                      </span>
                    </td>
                    <td className="p-4">
                      {santri.isAktif ? (
                        <span className="px-3 py-1 bg-green-900/20 text-green-500 border border-green-500/30 rounded-lg text-sm font-bold inline-flex items-center gap-1">
                          <IconCheck /> Aktif
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-900/20 text-red-500 border border-red-500/30 rounded-lg text-sm font-bold inline-flex items-center gap-1">
                          <IconX /> Keluar
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setRiwayatTerpilih(santri)}
                          className="bg-dark-900 text-gold-500 px-3 py-1.5 rounded-lg hover:bg-gold-500/10 transition text-xs font-bold border border-gold-500/20 flex items-center gap-1"
                        >
                          <IconDocument /> Riwayat
                        </button>

                        <button
                          onClick={() => bukaEditModal(santri)}
                          className="bg-dark-900 text-gray-400 hover:text-gold-500 px-3 py-1.5 rounded-lg hover:bg-gold-500/10 transition text-xs font-bold border border-gray-700 flex items-center gap-1"
                        >
                          <IconEdit /> Edit
                        </button>

                        <button
                          onClick={() => toggleStatusAktif(santri.id, santri.nama, santri.isAktif)}
                          className={`px-3 py-1.5 rounded-lg transition text-xs font-bold border flex items-center gap-1 ${santri.isAktif ? 'bg-dark-900 text-red-500 border-red-900/50 hover:bg-red-900/20' : 'bg-dark-900 text-green-500 border-green-900/50 hover:bg-green-900/20'}`}
                        >
                          {santri.isAktif ? <><IconDoor /> Check Out</> : <><IconCheck /> Aktifkan</>}
                        </button>

                        <button
                          onClick={() => hapusSantri(santri.id, santri.nama)}
                          className="bg-dark-900 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition text-xs font-bold border border-red-900/50 flex items-center gap-1"
                        >
                          <IconTrash /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })})()
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION UI */}
        {Math.ceil(dataDitampilkan.length / itemsPerPage) > 1 && (
          <div className="p-4 border-t border-gold-500/20 bg-dark-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-gray-400 font-medium">Halaman {currentPage} dari {Math.ceil(dataDitampilkan.length / itemsPerPage)}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1} 
                className="px-4 py-2 bg-dark-800 text-gold-500 rounded-lg border border-gold-500/20 hover:bg-gold-500/10 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition"
              >
                Prev
              </button>
              
              <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                {[...Array(Math.ceil(dataDitampilkan.length / itemsPerPage))].map((_, i) => {
                  // Basic windowed pagination display for many pages
                  const total = Math.ceil(dataDitampilkan.length / itemsPerPage);
                  if (
                    i === 0 || 
                    i === total - 1 || 
                    (i >= currentPage - 2 && i <= currentPage)
                  ) {
                    return (
                      <button 
                        key={i + 1} 
                        onClick={() => setCurrentPage(i + 1)} 
                        className={`w-10 h-10 rounded-lg font-bold border transition shrink-0 ${currentPage === i + 1 ? 'bg-gold-500 text-black border-gold-500 shadow-sm' : 'bg-dark-800 text-gray-400 border-gray-700 hover:border-gold-500/50'}`}
                      >
                        {i + 1}
                      </button>
                    );
                  } else if (
                    (i === 1 && currentPage > 3) || 
                    (i === total - 2 && currentPage < total - 2)
                  ) {
                    return <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-500 shrink-0">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(dataDitampilkan.length / itemsPerPage), prev + 1))} 
                disabled={currentPage === Math.ceil(dataDitampilkan.length / itemsPerPage)} 
                className="px-4 py-2 bg-dark-800 text-gold-500 rounded-lg border border-gold-500/20 hover:bg-gold-500/10 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT SANTRI */}
      {editModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-gold-500/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="bg-dark-900 border-b border-gold-500/10 p-5">
              <h2 className="text-xl font-bold text-gold-500 flex items-center gap-2"><IconEdit /> Edit Data Santri</h2>
              <p className="text-gray-400 text-sm mt-1">Perbarui informasi santri</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Nama Lengkap</label>
                <input type="text" value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full p-3 border border-dark-900 bg-dark-900 text-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Kategori</label>
                  <select value={editKategori} onChange={(e) => setEditKategori(e.target.value)} className="w-full p-3 border border-dark-900 bg-dark-900 text-gold-500 font-bold rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner">
                    <option value="BARU">BARU</option>
                    <option value="LAMA">LAMA</option>
                    <option value="KSU">KSU</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Gender</label>
                  <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full p-3 border border-dark-900 bg-dark-900 text-gold-500 font-bold rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner">
                    <option value="BANIN">Banin</option>
                    <option value="BANAT">Banat</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Bulan Ke-</label>
                  <input type="number" value={editBulanKe} onChange={(e) => setEditBulanKe(e.target.value)} min="1" className="w-full p-3 border border-dark-900 bg-dark-900 text-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" disabled={!editRiwayatId} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Nomor ID Card</label>
                  <input type="number" value={editNomorIdCard} onChange={(e) => setEditNomorIdCard(e.target.value)} placeholder="-" className="w-full p-3 border border-dark-900 bg-dark-900 text-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" disabled={!editRiwayatId || editKategori === "KSU"} />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gold-500/10 bg-dark-900/50 flex justify-end gap-3">
              <button onClick={() => setEditModal(null)} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-dark-900 rounded-xl transition">Batal</button>
              <button onClick={simpanEdit} disabled={editLoading} className="px-6 py-2.5 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 disabled:opacity-50 transition-all active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT */}
      {riwayatTerpilih && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-gold-500/20 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="bg-dark-900 border-b border-gold-500/10 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gold-500 flex items-center gap-2"><IconDocument /> Buku Riwayat Asrama</h2>
                <p className="text-gray-400 text-sm mt-1">Santri: <strong className="text-gray-200">{riwayatTerpilih.nama}</strong></p>
              </div>
              <button onClick={() => setRiwayatTerpilih(null)} className="text-gray-400 hover:text-red-500 font-bold text-xl transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {riwayatTerpilih.riwayat.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Belum ada catatan riwayat penempatan.</div>
              ) : (
                <div className="space-y-4">
                  {riwayatTerpilih.riwayat.map((rekamJejejak: any, index: number) => (
                    <div key={rekamJejejak.id} className="bg-dark-900 p-4 rounded-xl border border-gold-500/10 shadow-sm flex items-start gap-4 hover:border-gold-500/30 transition">
                      <div className="bg-dark-800 text-gold-500 font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-gold-500/20">
                        #{riwayatTerpilih.riwayat.length - index}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gold-400 border-b border-gold-500/10 pb-1 mb-2">
                          {rekamJejejak.dufah?.nama || "Duf'ah Tidak Diketahui"}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-400">Status ID Card:</p>
                            <p className="font-semibold text-gray-200 flex items-center gap-1">
                              {rekamJejejak.isIdCardTaken ? <><IconCheck /> Diambil</> : "Menunggu"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Status Kamar:</p>
                            <p className="font-semibold text-gray-200">
                              {rekamJejejak.status === "ASSIGNED" ? "Mendapat Kamar" : "Antrean / Belum Dapat"}
                            </p>
                          </div>
                          <div className="col-span-2 mt-1 bg-dark-800 p-2 rounded-lg border border-gold-500/10">
                            <p className="text-gray-400 text-xs">Lokasi Lemari (Bulan ke-{rekamJejejak.bulanKe}):</p>
                            <p className="font-bold text-gray-200">
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

            <div className="p-5 border-t border-gold-500/10 bg-dark-900/50 text-right">
              <button onClick={() => setRiwayatTerpilih(null)} className="px-6 py-2.5 bg-dark-800 text-gray-400 font-bold rounded-xl hover:bg-dark-900 hover:text-gray-200 border border-gray-700 transition">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}