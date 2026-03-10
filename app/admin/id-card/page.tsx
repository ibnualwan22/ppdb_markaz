"use client";

import { useState } from "react";

export default function MejaIdCardPage() {
  const [keyword, setKeyword] = useState("");
  const [antrean, setAntrean] = useState<any[]>([]);

  // Cari nama khusus di bulan aktif
  const cariAntrean = async (teks: string) => {
    setKeyword(teks);
    const res = await fetch(`/api/id-card?nama=${teks}`);
    const data = await res.json();
    if (Array.isArray(data)) setAntrean(data);
  };

  // Eksekusi penyerahan kartu
  const serahkanKartu = async (riwayatId: string) => {
    const res = await fetch(`/api/id-card/${riwayatId}`, {
      method: "PATCH",
    });
    
    if (res.ok) {
      // Refresh daftar antrean agar status berubah jadi hijau
      cariAntrean(keyword); 
    } else {
      alert("Gagal memproses ID Card");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Meja ID Card</h1>
      
      {/* Search Bar Besar */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => cariAntrean(e.target.value)}
        placeholder="Cari nama santri yang datang..."
        className="w-full md:w-1/2 p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none mb-8 shadow-sm"
      />

      {/* Tabel Data */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Nama Santri</th>
              <th className="p-4">Lokasi Asrama</th>
              <th className="p-4">Status Check-In</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {antrean.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{row.santri.nama}</td>
                <td className="p-4 text-gray-600">
                  {row.lemari ? `${row.lemari.kamar.nama} - Lemari ${row.lemari.nomor}` : "Belum dapat sakan"}
                </td>
                <td className="p-4">
                  {row.isIdCardTaken ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      Sudah Check-In
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                      Menunggu Kartu
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {!row.isIdCardTaken && (
                    <button
                      onClick={() => serahkanKartu(row.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
                    >
                      Serahkan Kartu
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {antrean.length === 0 && keyword !== "" && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Data tidak ditemukan atau santri KSU.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}