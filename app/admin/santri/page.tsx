"use client";

import { useState, useEffect } from "react";

export default function MasterSantriPage() {
  const [dataSantri, setDataSantri] = useState<any[]>([]);
  const [daftarDufah, setDaftarDufah] = useState<any[]>([]);
  
  const [keyword, setKeyword] = useState("");
  // STATE BARU: Default sekarang adalah "AKTIF"
  const [filterDufah, setFilterDufah] = useState("AKTIF"); 
  const [loading, setLoading] = useState(true);
  
  const [riwayatTerpilih, setRiwayatTerpilih] = useState<any | null>(null);

  const muatDaftarDufah = async () => {
    const res = await fetch("/api/dufah");
    if (res.ok) setDaftarDufah(await res.json());
  };

  const muatDataSantri = async () => {
    setLoading(true);
    try {
      // Membawa parameter filter ke API
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
    if (!confirm(`Yakin ingin ${aksi} santri bernama ${nama}?`)) return;

    const res = await fetch(`/api/santri/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAktif: !statusSaatIni })
    });

    if (res.ok) muatDataSantri();
    else alert("Gagal merubah status santri");
  };

  const dataDitampilkan = dataSantri.filter((santri) => 
    santri.nama.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Master Data Santri</h1>
          <p className="text-gray-500 mt-1">Kelola status aktif, Check Out, dan riwayat penempatan asrama.</p>
        </div>

        {/* Filter Area */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={filterDufah}
            onChange={(e) => setFilterDufah(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-gray-700 shadow-sm cursor-pointer"
          >
            <optgroup label="Data Terkini">
              <option value="AKTIF">🟢 Santri Aktif Saat Ini</option>
              <option value="ALL">📚 Semua Data Global (Termasuk Check Out)</option>
            </optgroup>
            
            <optgroup label="Histori Per Duf'ah">
              {daftarDufah.map((d) => (
                <option key={d.id} value={d.id}>🗓️ Riwayat {d.nama}</option>
              ))}
            </optgroup>
          </select>

          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="🔍 Cari nama santri..."
            className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm sm:w-64"
          />
        </div>
      </div>

      {/* TABEL MASTER SANTRI */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="p-4 text-gray-800 font-bold">Nama Lengkap</th>
                <th className="p-4 text-gray-800 font-bold">Kategori</th>
                <th className="p-4 text-gray-800 font-bold">Status Saat Ini</th>
                <th className="p-4 text-gray-800 font-bold text-center">Aksi & Riwayat</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500 font-medium">Memuat data database...</td>
                </tr>
              ) : dataDitampilkan.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500 font-medium">Tidak ada santri ditemukan pada filter ini.</td>
                </tr>
              ) : (
                dataDitampilkan.map((santri) => (
                  <tr key={santri.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${!santri.isAktif ? 'bg-red-50 opacity-75' : ''}`}>
                    <td className="p-4">
                      <p className={`font-bold text-lg flex items-center gap-2 ${!santri.isAktif ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                        {santri.nama} <span className="text-sm">{santri.gender === 'BANAT' ? '🧕' : '👨'}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Terdaftar: {new Date(santri.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm text-white ${santri.kategori === 'KSU' ? 'bg-purple-600' : santri.kategori === 'LAMA' ? 'bg-orange-500' : 'bg-green-500'}`}>
                        {santri.kategori}
                      </span>
                    </td>
                    <td className="p-4">
                      {santri.isAktif ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-300 rounded-full text-sm font-bold shadow-sm">
                          ✅ Aktif di Markaz
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-sm font-bold shadow-sm">
                          ❌ Check Out / Keluar
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setRiwayatTerpilih(santri)}
                          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition text-sm font-bold shadow-sm"
                        >
                          Lihat Riwayat
                        </button>
                        
                        <button
                          onClick={() => toggleStatusAktif(santri.id, santri.nama, santri.isAktif)}
                          className={`px-4 py-2 rounded-lg transition text-sm font-bold shadow-sm text-white ${santri.isAktif ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          {santri.isAktif ? 'Set Check Out' : 'Aktifkan'}
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

      {/* OVERLAY MODAL RIWAYAT (Tetap sama seperti sebelumnya) */}
      {riwayatTerpilih && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-800 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Buku Riwayat Asrama</h2>
                <p className="text-gray-300 text-sm mt-1">Santri: <strong>{riwayatTerpilih.nama}</strong></p>
              </div>
              <button onClick={() => setRiwayatTerpilih(null)} className="text-white hover:text-red-400 font-bold text-xl">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {riwayatTerpilih.riwayat.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Belum ada catatan riwayat penempatan.</div>
              ) : (
                <div className="space-y-4">
                  {riwayatTerpilih.riwayat.map((rekamJejejak: any, index: number) => (
                    <div key={rekamJejejak.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                      <div className="bg-blue-100 text-blue-800 font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-blue-200">
                        #{riwayatTerpilih.riwayat.length - index}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 border-b pb-1 mb-2">
                          {rekamJejejak.dufah?.nama || "Duf'ah Tidak Diketahui"}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Status ID Card:</p>
                            <p className="font-semibold text-gray-800">
                              {rekamJejejak.isIdCardTaken ? "✅ Diambil" : "⏳ Menunggu"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Status Kamar:</p>
                            <p className="font-semibold text-gray-800">
                              {rekamJejejak.status === "ASSIGNED" ? "Mendapat Kamar" : "Antrean / Belum Dapat"}
                            </p>
                          </div>
                          <div className="col-span-2 mt-1 bg-gray-50 p-2 rounded border">
                            <p className="text-gray-500 text-xs">Lokasi Lemari (Bulan ke-{rekamJejejak.bulanKe}):</p>
                            <p className="font-bold text-green-800">
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

            <div className="p-5 border-t border-gray-200 bg-white text-right">
              <button onClick={() => setRiwayatTerpilih(null)} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}