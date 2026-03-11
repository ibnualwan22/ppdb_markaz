"use client";

import { useState, useEffect } from "react";

export default function MejaIdCardPage() {
  const [keyword, setKeyword] = useState("");
  const [antrean, setAntrean] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("SEMUA"); // "SEMUA", "BELUM", "SUDAH"
  const [loading, setLoading] = useState(true);

  // Fungsi memuat semua data saat pertama kali buka halaman
  const muatData = async () => {
    setLoading(true);
    const res = await fetch(`/api/id-card${keyword ? `?nama=${keyword}` : ''}`);
    const data = await res.json();
    if (Array.isArray(data)) setAntrean(data);
    setLoading(false);
  };

  useEffect(() => {
    muatData();
  }, []); // Berjalan sekali saat halaman di-load

  // Fungsi pencarian langsung
  const cariAntrean = (teks: string) => {
    setKeyword(teks);
    // Kita panggil API pencarian
    fetch(`/api/id-card?nama=${teks}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAntrean(data);
      });
  };

  // Eksekusi penyerahan kartu
  const serahkanKartu = async (riwayatId: string) => {
    const res = await fetch(`/api/id-card/${riwayatId}`, {
      method: "PATCH",
    });
    
    if (res.ok) {
      muatData(); // Refresh data untuk update warna jadi hijau
    } else {
      alert("Gagal memproses ID Card");
    }
  };

  // Logika Filter Lokal (Berjalan di sisi browser agar cepat)
  const dataDitampilkan = antrean.filter(item => {
    if (filterStatus === "BELUM") return item.isIdCardTaken === false;
    if (filterStatus === "SUDAH") return item.isIdCardTaken === true;
    return true; // Jika "SEMUA"
  });

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Meja ID Card & Check-In</h1>
      
      {/* Area Pencarian dan Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-700 mb-1">Cari Nama Santri</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => cariAntrean(e.target.value)}
            placeholder="Ketik nama yang datang..."
            className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
          />
        </div>
        <div className="md:w-64">
          <label className="block text-sm font-bold text-gray-700 mb-1">Filter Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
          >
            <option value="SEMUA">Tampilkan Semua</option>
            <option value="BELUM">⏳ Belum Ambil</option>
            <option value="SUDAH">✅ Sudah Diambil</option>
          </select>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="p-4 text-gray-800 font-bold">Nama Santri</th>
              <th className="p-4 text-gray-800 font-bold">Lokasi Sakan / Kamar</th>
              <th className="p-4 text-gray-800 font-bold">Status</th>
              <th className="p-4 text-gray-800 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-500 font-medium">Memuat data...</td>
              </tr>
            ) : dataDitampilkan.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-500 font-medium">Data santri tidak ditemukan.</td>
              </tr>
            ) : (
              dataDitampilkan.map((row) => {
                // Menentukan background baris berdasarkan status
                const barisClass = row.isIdCardTaken 
                  ? "bg-green-50 hover:bg-green-100 transition" 
                  : "bg-white hover:bg-gray-50 transition";

                return (
                  <tr key={row.id} className={`border-b border-gray-100 ${barisClass}`}>
                    <td className="p-4">
                      <p className="font-bold text-gray-900 text-lg">{row.santri.nama}</p>
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">{row.santri.kategori}</span>
                    </td>
                    <td className="p-4 text-gray-700 font-medium">
                      {row.lemari ? (
                        <>
                          <span className="font-bold text-green-800">{row.lemari.kamar.sakan.nama}</span><br/>
                          <span className="text-sm">Kamar {row.lemari.kamar.nama} - Loker {row.lemari.nomor}</span>
                        </>
                      ) : (
                        <span className="text-red-500 italic text-sm">Belum dapat sakan</span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.isIdCardTaken ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-300 rounded-full text-sm font-bold shadow-sm">
                          ✅ Selesai
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full text-sm font-bold shadow-sm">
                          ⏳ Menunggu
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {!row.isIdCardTaken && (
                        <button
                          onClick={() => serahkanKartu(row.id)}
                          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-bold shadow-sm w-full md:w-auto"
                        >
                          Serahkan Kartu
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}