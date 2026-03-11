"use client";

import { useState, useEffect } from "react";

export default function DashboardMuasisPage() {
  const [dataSakan, setDataSakan] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const muatData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sakan");
      if (res.ok) setDataSakan(await res.json());
    } catch (error) {
      console.error("Gagal memuat denah", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    muatData();
  }, []);

  // Fungsi Toggle Kunci Kamar
  const toggleKunciKamar = async (kamarId: string, statusSaatIni: boolean, namaKamar: string) => {
    const aksi = statusSaatIni ? "membuka kunci" : "mengunci";
    if (!confirm(`Yakin ingin ${aksi} Kamar ${namaKamar}? Panitia asrama tidak akan bisa memasukkan santri ke kamar yang dikunci.`)) return;

    const res = await fetch(`/api/kamar/${kamarId}/lock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !statusSaatIni })
    });

    if (res.ok) {
      muatData(); // Refresh UI
    } else {
      alert("Gagal merubah status kamar");
    }
  };
  const toggleKunciLemari = async (lemariId: string, statusSaatIni: boolean, nomorLemari: string) => {
    const aksi = statusSaatIni ? "membuka kunci" : "mengunci";
    if (!confirm(`Yakin ingin ${aksi} Lemari ${nomorLemari}?`)) return;

    const res = await fetch(`/api/lemari/${lemariId}/lock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !statusSaatIni })
    });

    if (res.ok) {
      muatData(); // Refresh UI
    } else {
      alert("Gagal merubah status lemari");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Muasis</h1>
          <p className="text-gray-500 mt-1">Pemantauan Real-time & Kontrol Asrama</p>
        </div>

        {/* Search Bar Besar */}
        <div className="w-full md:w-96">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="🔍 Cari nama santri / loker..."
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-gray-500 font-bold">Memuat data asrama...</div>
      ) : (
        <div className="space-y-8">
          {dataSakan.map((sakan) => {
            
            // Logika Pencarian: Hanya tampilkan Sakan/Kamar/Lemari yang cocok dengan keyword
            const kamarDifilter = sakan.kamar.map((kamar: any) => {
              const lemariDifilter = kamar.lemari.filter((lemari: any) => {
                if (!keyword) return true; // Tampil semua jika tidak mencari
                const cari = keyword.toLowerCase();
                const namaSantri = lemari.penghuni[0]?.santri?.nama?.toLowerCase() || "";
                return lemari.nomor.toLowerCase().includes(cari) || namaSantri.includes(cari);
              });
              return { ...kamar, lemari: lemariDifilter };
            }).filter((kamar: any) => kamar.lemari.length > 0 || !keyword);

            // Jika sedang mencari dan tidak ada kecocokan di sakan ini, sembunyikan sakan
            if (keyword && kamarDifilter.length === 0) return null;

            return (
              <div key={sakan.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {/* Header Sakan */}
                <div className="bg-green-800 text-white p-4">
                  <h2 className="text-2xl font-bold">🏢 Sakan {sakan.nama}</h2>
                </div>

                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kamarDifilter.map((kamar: any) => (
                    <div 
                      key={kamar.id} 
                      className={`border-2 rounded-xl overflow-hidden shadow-sm transition ${kamar.isLocked ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                    >
                      {/* Header Kamar */}
                      <div className={`p-3 border-b flex justify-between items-center ${kamar.isLocked ? 'bg-red-100 border-red-200' : 'bg-gray-100 border-gray-200'}`}>
                        <h3 className="font-bold text-lg text-gray-800">Kamar {kamar.nama}</h3>
                        
                        {/* Saklar Interaktif Kunci Kamar */}
                        <button
                          onClick={() => toggleKunciKamar(kamar.id, kamar.isLocked, kamar.nama)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm ${kamar.isLocked ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'}`}
                        >
                          {kamar.isLocked ? '🔒 DIKUNCI' : '✅ AKTIF'}
                        </button>
                      </div>

                      {/* Tabel Lemari & Nama Santri */}
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="p-2 font-semibold text-gray-600 w-16 text-center">Lemari</th>
                              <th className="p-2 font-semibold text-gray-600">Penghuni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {kamar.lemari.map((lemari: any) => {
                              const terisi = lemari.penghuni && lemari.penghuni.length > 0;
                              const namaSantri = terisi ? lemari.penghuni[0].santri.nama : "Kosong";
                              const kategoriSantri = terisi ? lemari.penghuni[0].santri.kategori : "";

                              return (
                                <tr key={lemari.id} className="border-b last:border-0 hover:bg-gray-50">
                                  <td className="p-2 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`px-2 py-1 rounded font-bold text-xs ${lemari.isLocked ? 'bg-red-100 text-red-800 line-through' : terisi ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                        {lemari.nomor}
                                      </span>
                                      <button
                                        onClick={() => toggleKunciLemari(lemari.id, lemari.isLocked, lemari.nomor)}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm transition ${lemari.isLocked ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        title={lemari.isLocked ? "Buka Kunci" : "Kunci Lemari"}
                                      >
                                        {lemari.isLocked ? '🔒' : '🔓'}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    {terisi ? (
                                      <div>
                                        <p className="font-bold text-gray-900">{namaSantri}</p>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">{kategoriSantri}</p>
                                      </div>
                                    ) : (
                                      <p className="text-gray-400 italic">Belum ada penghuni</p>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {kamar.lemari.length === 0 && (
                              <tr><td colSpan={2} className="p-3 text-center text-gray-400 italic">Belum ada data lemari</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}