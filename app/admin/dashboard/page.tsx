"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePusher } from "../../providers/PusherProvider";
import { swalConfirm, swalSuccess, swalError } from "../../lib/swal";
// SVG Icon Components
const IconLock = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);
const IconUnlock = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
  </svg>
);
const IconSearch = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconHome = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
  </svg>
);
const IconX = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconMale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-blue-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);
const IconFemale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-pink-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

export default function DashboardMuasisPage() {
  const [dataSakan, setDataSakan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSakan, setSearchSakan] = useState("");
  const [searchSantri, setSearchSantri] = useState("");
  const mainRef = useRef<HTMLDivElement>(null);
  const pusher = usePusher();

  const muatData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/sakan");
      if (res.ok) setDataSakan(await res.json());
    } catch (error) {}
    if (!isBackground) setLoading(false);
  }, []);

  useEffect(() => {
    muatData();
  }, []);

  // Pusher: listen for data updates
  useEffect(() => {
    if (!pusher) return;
    const handler = () => muatData(true);
    const channel = pusher.subscribe("ppdb-channel");
    channel.bind("data:update", handler);
    return () => { 
      channel.unbind("data:update", handler);
      pusher.unsubscribe("ppdb-channel");
    };
  }, [pusher, muatData]);

  const toggleLock = async (jenis: "sakan" | "kamar" | "lemari", id: string, statusKunciSaatIni: boolean) => {
    const aksi = statusKunciSaatIni ? "MEMBUKA" : "MENGUNCI";
    const namaItem = jenis === "sakan" ? "Sakan" : jenis === "kamar" ? "Kamar" : "Lemari";
    
    const result = await swalConfirm(
      `Yakin ingin ${aksi} ${namaItem} ini?`,
      statusKunciSaatIni ? "Santri akan bisa mengisinya kembali." : "Santri tidak akan bisa mengisinya!"
    );
    
    if (!result.isConfirmed) return;

    setLoading(true);
    const scrollContainer = mainRef.current?.parentElement;
    const scrollTop = scrollContainer?.scrollTop || 0;
    
    // Simpan status detail sebelum scroll position reset
    const activeStates = {
      searchSakan,
      searchSantri
    };

    const res = await fetch(`/api/${jenis}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !statusKunciSaatIni }),
    });
    await muatData(true);

    // Restore scroll position
    requestAnimationFrame(() => {
      if (scrollContainer) scrollContainer.scrollTop = scrollTop;
    });
  };

  // Filter sakan berdasarkan pencarian
  const filterSakan = (data: any[]) => {
    let filtered = data;
    if (searchSakan) {
      filtered = filtered.filter(s => s.nama.toLowerCase().includes(searchSakan.toLowerCase()));
    }
    return filtered;
  };

  // Cek apakah santri ada di suatu sakan (untuk highlight)
  const sakanContainsSantri = (sakan: any): boolean => {
    if (!searchSantri) return true;
    return sakan.kamar.some((kamar: any) =>
      kamar.lemari.some((lemari: any) =>
        lemari.penghuni && lemari.penghuni.length > 0 &&
        lemari.penghuni[0].santri.nama.toLowerCase().includes(searchSantri.toLowerCase())
      )
    );
  };

  const lemariMatchesSantri = (lemari: any): boolean => {
    if (!searchSantri) return false;
    return lemari.penghuni && lemari.penghuni.length > 0 &&
      lemari.penghuni[0].santri.nama.toLowerCase().includes(searchSantri.toLowerCase());
  };

  const sakanBanin = filterSakan(dataSakan.filter(s => s.kategori !== "BANAT"));
  const sakanBanat = filterSakan(dataSakan.filter(s => s.kategori === "BANAT"));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold text-blue-800">Memuat Visualisasi Asrama...</p>
      </div>
    </div>
  );

  const RenderSakanBlock = ({ data, judul, warnaTema }: { data: any[], judul: string, warnaTema: 'biru' | 'pink' }) => {
    const isBiru = warnaTema === 'biru';
    const bgHeader = isBiru ? 'bg-gradient-to-r from-blue-800 to-blue-700' : 'bg-gradient-to-r from-pink-700 to-pink-600';
    const textWarna = isBiru ? 'text-blue-800' : 'text-pink-800';
    const bgProgress = isBiru ? 'bg-blue-500' : 'bg-pink-500';
    const bgLemariTerisi = isBiru ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200';

    // Filter sakan yang mengandung santri yang dicari
    const filteredData = searchSantri ? data.filter(sakanContainsSantri) : data;

    return (
      <div className="mb-12">
        <h2 className={`text-2xl font-black mb-6 ${textWarna} border-b-2 ${isBiru ? 'border-blue-200' : 'border-pink-200'} pb-2 flex items-center gap-2`}>
          {isBiru ? <IconMale /> : <IconFemale />} {judul}
          <span className="text-sm font-medium text-gray-400 ml-2">({filteredData.length} Sakan)</span>
        </h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredData.map((sakan) => {
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
              <div key={sakan.id} className={`bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow ${sakanGembokStyle}`}>
                
                <div className={`${sakan.isLocked ? 'bg-gradient-to-r from-gray-700 to-gray-600' : bgHeader} p-5 text-white relative`}>
                  {/* TOMBOL KUNCI SAKAN */}
                  <button 
                    onClick={() => toggleLock('sakan', sakan.id, sakan.isLocked)} 
                    className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 ${sakan.isLocked ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'}`}
                  >
                    {sakan.isLocked ? <><IconUnlock className="h-3.5 w-3.5" /> Buka Sakan</> : <><IconLock className="h-3.5 w-3.5" /> Kunci Sakan</>}
                  </button>

                  <div className="flex justify-between items-end mb-3 mt-4">
                    <div>
                      <h3 className={`text-2xl font-black flex items-center gap-2 ${sakan.isLocked ? 'line-through text-gray-400' : ''}`}>
                        {sakan.isLocked && <IconLock className="h-5 w-5" />} {sakan.nama}
                      </h3>
                      <p className="text-sm opacity-80 mt-1">{sakan.kamar.length} Kamar {sakan.isLocked && '(DITUTUP)'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black">{sakan.isLocked ? '0' : persentaseSakan}%</p>
                      <p className="text-xs opacity-80 font-medium">Terisi: {terisiSakan} / {totalLemariSakan}</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2.5">
                    <div className={`${sakan.isLocked ? 'bg-gray-400' : 'bg-white'} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${sakan.isLocked ? 0 : persentaseSakan}%` }}></div>
                  </div>
                </div>

                <div className="p-5 bg-white flex-1 flex flex-col gap-4">
                  {sakan.kamar.length === 0 ? (
                    <p className="text-center text-blue-300 italic py-4">Belum ada kamar.</p>
                  ) : (
                    sakan.kamar.map((kamar: any) => {
                      const lemariAktifKamar = kamar.lemari.filter((l:any) => !l.isLocked && !kamar.isLocked && !sakan.isLocked);
                      const totalLemariKamar = lemariAktifKamar.length;
                      const terisiKamar = kamar.lemari.filter((l: any) => l.penghuni && l.penghuni.length > 0).length;

                      const isKamarLocked = kamar.isLocked || sakan.isLocked;

                      return (
                        <div key={kamar.id} className={`p-4 rounded-xl border shadow-sm transition-all ${isKamarLocked ? 'bg-gray-100 border-gray-300' : 'bg-blue-50/30 border-blue-100'}`}>
                          <div className="flex justify-between items-center border-b border-blue-100/50 pb-2 mb-3">
                            <h4 className={`font-bold text-lg flex items-center gap-2 ${isKamarLocked ? 'text-gray-500 line-through' : 'text-blue-900'}`}>
                              {isKamarLocked && <IconLock className="h-4 w-4" />} Kamar {kamar.nama}
                            </h4>
                            <div className="flex items-center gap-2">
                              {/* TOMBOL KUNCI KAMAR - always visible */}
                              <button 
                                onClick={() => toggleLock('kamar', kamar.id, kamar.isLocked)} 
                                disabled={sakan.isLocked}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${kamar.isLocked ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                              >
                                {kamar.isLocked ? <><IconUnlock className="h-3 w-3" /> Buka</> : <><IconLock className="h-3 w-3" /> Kunci</>}
                              </button>
                              
                              {!isKamarLocked && (
                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-200">
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
                              const isHighlighted = lemariMatchesSantri(lemari);

                              // RENDER JIKA LEMARI DIKUNCI
                              if (isLemariLocked) {
                                return (
                                  <div key={lemari.id} className="p-2 rounded-lg border bg-gray-200 border-gray-300 flex flex-col justify-between min-h-[70px] relative group">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shadow-sm line-through">
                                        {lemari.nomor}
                                      </span>
                                      {/* TOMBOL BUKA LEMARI - always visible on mobile */}
                                      {!isKamarLocked && (
                                        <button 
                                          onClick={() => toggleLock('lemari', lemari.id, lemari.isLocked)}
                                          className="text-[10px] bg-yellow-400 hover:bg-yellow-500 text-black px-1.5 py-0.5 rounded shadow-sm font-bold flex items-center gap-0.5"
                                        >
                                          <IconUnlock className="h-2.5 w-2.5" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="mt-auto text-center opacity-70">
                                      <IconLock className="h-5 w-5 mx-auto text-gray-500" />
                                      <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Ditutup</p>
                                    </div>
                                  </div>
                                )
                              }

                              // RENDER JIKA LEMARI TERBUKA NORMAL
                              return (
                                <div key={lemari.id} className={`p-2 rounded-lg border flex flex-col justify-between min-h-[70px] group relative transition-all ${
                                  isHighlighted 
                                    ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-400 shadow-md' 
                                    : isTerisi 
                                      ? bgLemariTerisi 
                                      : 'bg-gray-50 border-gray-200 border-dashed'
                                }`}>
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
                                      {/* TOMBOL KUNCI LEMARI - visible on mobile, hover on desktop */}
                                      <button 
                                        onClick={() => toggleLock('lemari', lemari.id, lemari.isLocked)}
                                        className="text-[10px] px-1.5 py-0.5 rounded shadow-sm font-bold transition-opacity bg-gray-200 hover:bg-gray-300 text-gray-700 md:opacity-0 md:group-hover:opacity-100"
                                        title="Kunci Lemari"
                                      >
                                        <IconLock className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-auto">
                                    {isTerisi ? (
                                      <p className={`font-bold text-xs leading-tight truncate ${isHighlighted ? 'text-yellow-800' : textWarna}`} title={dataSantri.nama}>
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
    <div ref={mainRef} className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 border-b border-blue-100 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900">Dashboard Visual Muasis</h1>
            <p className="text-blue-500 mt-1 font-medium">Pemantauan denah Sakan, kapasitas, dan kontrol akses kamar santri secara real-time.</p>
          </div>
        </div>

        {/* SEARCH BARS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"><IconHome className="h-4 w-4" /></span>
            <input
              type="text"
              value={searchSakan}
              onChange={(e) => setSearchSakan(e.target.value)}
              placeholder="Cari nama sakan..."
              className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm text-blue-900 font-medium placeholder:text-blue-300"
            />
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"><IconSearch className="h-4 w-4" /></span>
            <input
              type="text"
              value={searchSantri}
              onChange={(e) => setSearchSantri(e.target.value)}
              placeholder="Cari nama santri di denah..."
              className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm text-blue-900 font-medium placeholder:text-blue-300"
            />
            {searchSantri && (
              <button onClick={() => setSearchSantri("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 font-bold"><IconX /></button>
            )}
          </div>
        </div>
      </div>

      {sakanBanin.length > 0 && <RenderSakanBlock data={sakanBanin} judul="Area Asrama Banin (Putra)" warnaTema="biru" />}
      {sakanBanat.length > 0 && <RenderSakanBlock data={sakanBanat} judul="Area Asrama Banat (Putri)" warnaTema="pink" />}
      {sakanBanin.length === 0 && sakanBanat.length === 0 && (
        <div className="text-center py-20 text-blue-300 font-medium">Belum ada data Sakan di Master Lokasi.</div>
      )}
    </div>
  );
}