"use client";

import { useState, useEffect } from "react";

export default function DashboardMuasisPage() {
  const [dataSakan, setDataSakan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const muatData = async () => {
    try {
      const res = await fetch("/api/sakan");
      if (res.ok) setDataSakan(await res.json());
    } catch (error) { console.error("Gagal memuat data", error); }
    setLoading(false);
  };

  useEffect(() => {
    muatData();
  }, []);

  // =========================================
  // FUNGSI SAKLAR KUNCI UNTUK MUASIS
  // =========================================
  const toggleLock = async (jenis: "sakan" | "kamar" | "lemari", id: string, statusKunciSaatIni: boolean) => {
    const aksi = statusKunciSaatIni ? "MEMBUKA" : "MENGUNCI";
    if (!confirm(`Yakin ingin ${aksi} ${jenis} ini?`)) return;

    await fetch(`/api/${jenis}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !statusKunciSaatIni }),
    });
    muatData();
  };

  const sakanBanin = dataSakan.filter(s => s.kategori !== "BANAT");
  const sakanBanat = dataSakan.filter(s => s.kategori === "BANAT");

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Memuat Visualisasi Asrama...</div>;

  const RenderSakanBlock = ({ data, judul, warnaTema }: { data: any[], judul: string, warnaTema: 'biru' | 'pink' }) => {
    const isBiru = warnaTema === 'biru';
    const bgHeader = isBiru ? 'bg-blue-800' : 'bg-pink-700';
    const textWarna = isBiru ? 'text-blue-800' : 'text-pink-800';
    const bgProgress = isBiru ? 'bg-blue-500' : 'bg-pink-500';
    const bgLemariTerisi = isBiru ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200';

    return (
      <div className="mb-12">
        <h2 className={`text-2xl font-black mb-6 ${textWarna} border-b-2 ${isBiru ? 'border-blue-200' : 'border-pink-200'} pb-2 flex items-center gap-2`}>
          {isBiru ? '👨' : '🧕'} {judul}
        </h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {data.map((sakan) => {
            let totalLemariSakan = 0;
            let terisiSakan = 0;

            sakan.kamar.forEach((kamar: any) => {
              const lemariAktif = kamar.lemari.filter((l: any) => !l.isLocked && !kamar.isLocked && !sakan.isLocked);
              totalLemariSakan += lemariAktif.length;
              
              kamar.lemari.forEach((lemari: any) => {
                if (lemari.penghuni && lemari.penghuni.length > 0) terisiSakan++;
              });
            });

            const persentaseSakan = totalLemariSakan === 0 ? 0 : Math.round((terisiSakan / totalLemariSakan) * 100);
            const sakanGembokStyle = sakan.isLocked ? "grayscale opacity-90" : "";

            return (
              <div key={sakan.id} className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col ${sakanGembokStyle}`}>
                
                <div className={`${sakan.isLocked ? 'bg-gray-700' : bgHeader} p-5 text-white relative`}>
                  {/* TOMBOL KUNCI SAKAN */}
                  <button 
                    onClick={() => toggleLock('sakan', sakan.id, sakan.isLocked)} 
                    className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-all ${sakan.isLocked ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-black/30 hover:bg-black/50 text-white'}`}
                  >
                    {sakan.isLocked ? '🔓 Buka Sakan' : '🔒 Kunci Sakan'}
                  </button>

                  <div className="flex justify-between items-end mb-3 mt-4">
                    <div>
                      <h3 className={`text-2xl font-black flex items-center gap-2 ${sakan.isLocked ? 'line-through text-gray-400' : ''}`}>
                        {sakan.isLocked && '🔒'} {sakan.nama}
                      </h3>
                      <p className="text-sm opacity-80 mt-1">{sakan.kamar.length} Kamar {sakan.isLocked && '(DITUTUP)'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black">{sakan.isLocked ? '0' : persentaseSakan}%</p>
                      <p className="text-xs opacity-80 font-medium">Terisi: {terisiSakan} / {totalLemariSakan}</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div className={`${sakan.isLocked ? 'bg-gray-400' : bgProgress} h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]`} style={{ width: `${sakan.isLocked ? 0 : persentaseSakan}%` }}></div>
                  </div>
                </div>

                <div className="p-5 bg-gray-50 flex-1 flex flex-col gap-4">
                  {sakan.kamar.length === 0 ? (
                    <p className="text-center text-gray-400 italic py-4">Belum ada kamar.</p>
                  ) : (
                    sakan.kamar.map((kamar: any) => {
                      const lemariAktifKamar = kamar.lemari.filter((l:any) => !l.isLocked && !kamar.isLocked && !sakan.isLocked);
                      const totalLemariKamar = lemariAktifKamar.length;
                      const terisiKamar = kamar.lemari.filter((l: any) => l.penghuni && l.penghuni.length > 0).length;

                      const isKamarLocked = kamar.isLocked || sakan.isLocked;

                      return (
                        <div key={kamar.id} className={`p-4 rounded-xl border shadow-sm transition-all ${isKamarLocked ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-200'}`}>
                          <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                            <h4 className={`font-bold text-lg flex items-center gap-2 ${isKamarLocked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                              {isKamarLocked && '🔒'} Kamar {kamar.nama}
                            </h4>
                            <div className="flex items-center gap-2">
                              {/* TOMBOL KUNCI KAMAR */}
                              <button 
                                onClick={() => toggleLock('kamar', kamar.id, kamar.isLocked)} 
                                disabled={sakan.isLocked} // Disable jika sakan-nya sudah dikunci
                                className={`text-[10px] font-bold px-2 py-1 rounded border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${kamar.isLocked ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`}
                              >
                                {kamar.isLocked ? '🔓 Buka' : '🔒 Kunci'}
                              </button>
                              
                              {!isKamarLocked && (
                                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                  Isi: {terisiKamar} / {totalLemariKamar}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {kamar.lemari.map((lemari: any) => {
                              const isTerisi = lemari.penghuni && lemari.penghuni.length > 0;
                              const dataSantri = isTerisi ? lemari.penghuni[0].santri : null;
                              const isLemariLocked = lemari.isLocked || isKamarLocked;

                              // RENDER JIKA LEMARI DIKUNCI
                              if (isLemariLocked) {
                                return (
                                  <div key={lemari.id} className="p-2 rounded-lg border bg-gray-300 border-gray-400 flex flex-col justify-between min-h-[70px] relative group">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-[10px] font-black text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded shadow-sm line-through">
                                        {lemari.nomor}
                                      </span>
                                      {/* TOMBOL BUKA LEMARI */}
                                      <button 
                                        onClick={() => toggleLock('lemari', lemari.id, lemari.isLocked)}
                                        disabled={isKamarLocked}
                                        className="text-[10px] bg-yellow-400 hover:bg-yellow-500 text-black px-1.5 py-0.5 rounded shadow-sm font-bold disabled:hidden"
                                      >
                                        🔓
                                      </button>
                                    </div>
                                    <div className="mt-auto text-center opacity-70">
                                      <span className="text-xl">🔒</span>
                                      <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Ditutup</p>
                                    </div>
                                  </div>
                                )
                              }

                              // RENDER JIKA LEMARI TERBUKA NORMAL
                              return (
                                <div key={lemari.id} className={`p-2 rounded-lg border ${isTerisi ? bgLemariTerisi : 'bg-gray-100 border-gray-200 border-dashed'} flex flex-col justify-between min-h-[70px] group relative`}>
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-black text-gray-500 bg-white px-1.5 py-0.5 rounded shadow-sm">
                                      {lemari.nomor}
                                    </span>
                                    
                                    <div className="flex items-center gap-1">
                                      {isTerisi && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${dataSantri.kategori === 'KSU' ? 'bg-purple-600' : dataSantri.kategori === 'LAMA' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                          {dataSantri.kategori}
                                        </span>
                                      )}
                                      {/* TOMBOL KUNCI LEMARI (Muncul saat di-hover/disentuh) */}
                                      {!isTerisi && (
                                        <button 
                                          onClick={() => toggleLock('lemari', lemari.id, lemari.isLocked)}
                                          className="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Kunci Lemari"
                                        >
                                          🔒
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-auto">
                                    {isTerisi ? (
                                      <p className={`font-bold text-xs leading-tight truncate ${textWarna}`} title={dataSantri.nama}>
                                        {dataSantri.nama}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-gray-400 italic font-medium text-center group-hover:hidden">Kosong</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-10 border-b border-gray-300 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Visual Muasis</h1>
        <p className="text-gray-500 mt-1">Pemantauan denah Sakan, kapasitas, dan kontrol akses kamar santri secara real-time.</p>
      </div>

      {sakanBanin.length > 0 && <RenderSakanBlock data={sakanBanin} judul="Area Asrama Banin (Putra)" warnaTema="biru" />}
      {sakanBanat.length > 0 && <RenderSakanBlock data={sakanBanat} judul="Area Asrama Banat (Putri)" warnaTema="pink" />}
      {sakanBanin.length === 0 && sakanBanat.length === 0 && (
        <div className="text-center py-20 text-gray-400 font-medium">Belum ada data Sakan di Master Lokasi.</div>
      )}
    </div>
  );
}