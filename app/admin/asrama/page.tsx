"use client";

import { useState, useEffect, useRef } from "react";
import { usePusher } from "../../providers/PusherProvider";
import { swalSuccess, swalError, swalNotif } from "../../lib/swal";
import { Protect, usePermissions } from "@/components/Protect";

// SVG Icon Components
const IconLock = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);
const IconCreditCard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconInbox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);
const IconMale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline text-blue-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);
const IconFemale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline text-pink-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function MejaAsramaPage() {
  const [dataLokasi, setDataLokasi] = useState<any[]>([]);
  const [antrean, setAntrean] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchAntrean, setSearchAntrean] = useState("");
  const [filterGenderAntrean, setFilterGenderAntrean] = useState("SEMUA"); // Filter Step 1
  const { hasAccess } = usePermissions();
  const canAssignLemari = hasAccess("assign_lemari");

  // State Step 2 (Pemilihan Kursi/Lemari)
  const [selectedSantri, setSelectedSantri] = useState<any>(null);
  const [activeSakanId, setActiveSakanId] = useState<string>("");
  const [sakanGenderFilter, setSakanGenderFilter] = useState<string>("BANIN"); // Filter Step 2
  const [selectedLemari, setSelectedLemari] = useState<any>(null);



  const pusher = usePusher();

  const muatData = async (isBackground = false) => {
    try {
      const resLokasi = await fetch("/api/sakan");
      const resAntrean = await fetch("/api/asrama/antrean");
      if (resLokasi.ok) setDataLokasi(await resLokasi.json());
      if (resAntrean.ok) setAntrean(await resAntrean.json());

      const resIdCard = await fetch("/api/id-card");
    } catch (error) { }
  };

  useEffect(() => {
    muatData();
  }, []);

  // Listen to generic data updates
  useEffect(() => {
    if (!pusher) return;

    const onDataUpdate = () => muatData(true);

    const channel = pusher.subscribe("ppdb-channel");
    channel.bind("data:update", onDataUpdate);

    return () => {
      channel.unbind("data:update", onDataUpdate);
      pusher.unsubscribe("ppdb-channel");
    };
  }, [pusher]);



  // Navigasi ke Pilih Lemari
  const handlePilihSantri = (item: any) => {
    setSelectedSantri(item);
    setSelectedLemari(null);
    const initialGender = item.santri.gender === "BANAT" ? "BANAT" : "BANIN";
    setSakanGenderFilter(initialGender);

    const sakans = dataLokasi.filter(s => !s.isLocked && (initialGender === "BANAT" ? s.kategori === "BANAT" : s.kategori !== "BANAT"));
    if (sakans.length > 0) {
      setActiveSakanId(sakans[0].id);
    } else {
      setActiveSakanId("");
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigasi kembali ke List
  const handleBatalPilih = () => {
    setSelectedSantri(null);
    setActiveSakanId("");
    setSelectedLemari(null);
  };

  // Simpan Penempatan
  const handleSimpanPenempatan = async () => {
    if (!selectedSantri || !selectedLemari) return swalError("Gagal", "Pilih lemari terlebih dahulu!");

    setLoading(true);
    try {
      const res = await fetch(`/api/asrama/assign/${selectedSantri.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lemariId: selectedLemari.id }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        swalSuccess("Berhasil!", "Santri berhasil ditempatkan.");
        handleBatalPilih();
        await muatData();
      } else {
        swalError("Gagal", data.error);
      }
    } catch (e) {
      setLoading(false);
      swalError("Error Server", "Terjadi kesalahan pada server");
    }
  };

  // Filtered antrean list
  const filteredAntrean = antrean.filter(a => {
    const matchName = a.santri.nama.toLowerCase().includes(searchAntrean.toLowerCase());
    const matchGender = filterGenderAntrean === "SEMUA" || a.santri.gender === filterGenderAntrean;
    return matchName && matchGender;
  });

  // Render Step 2: Pilih Kursi/Lemari (KAI Style)
  if (selectedSantri) {
    const sakansForGender = dataLokasi.filter(s => !s.isLocked && (sakanGenderFilter === "BANAT" ? s.kategori === "BANAT" : s.kategori !== "BANAT"));
    const activeSakan = sakansForGender.find(s => s.id === activeSakanId);

    return (
      <Protect permission="view_asrama" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak</div>}>
        <div className="bg-dark-900 min-h-screen relative font-sans pb-28">
          
          {/* Header Sticky Atas */}
          <div className="sticky top-0 z-40 bg-dark-900 shadow-md border-b border-gold-500/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <button onClick={handleBatalPilih} className="text-gold-500 p-2 hover:bg-dark-800 rounded-full transition">
                  <IconArrowLeft />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gold-500 leading-tight">Pilih Kamar & Lemari</h1>
                  <p className="text-sm text-gray-400 uppercase tracking-widest">{selectedSantri.santri.nama} • {selectedSantri.santri.gender}</p>
                </div>
              </div>
              
              {/* Filter Gender Sakan */}
              <div className="flex bg-dark-800 p-1 rounded-xl border border-gold-500/20 shadow-inner w-full md:w-auto mt-2 md:mt-0">
                <button 
                  onClick={() => {
                    setSakanGenderFilter('BANIN');
                    const firstBanin = dataLokasi.find(s => !s.isLocked && s.kategori !== 'BANAT');
                    if(firstBanin) setActiveSakanId(firstBanin.id);
                  }} 
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-all ${sakanGenderFilter === 'BANIN' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <IconMale /> Banin
                </button>
                <button 
                  onClick={() => {
                    setSakanGenderFilter('BANAT');
                    const firstBanat = dataLokasi.find(s => !s.isLocked && s.kategori === 'BANAT');
                    if(firstBanat) setActiveSakanId(firstBanat.id);
                  }} 
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-all ${sakanGenderFilter === 'BANAT' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <IconFemale /> Banat
                </button>
              </div>
            </div>

            {/* Sakan Tabs (Horizontal Scroll) kaya gerbong kereta */}
            <div className="flex overflow-x-auto hide-scrollbar">
              {sakansForGender.map(s => {
                const isActive = s.id === activeSakanId;
                
                let totalLemari = 0;
                let terisiLemari = 0;
                s.kamar.forEach((k: any) => {
                  if (!k.isLocked) {
                    const lemariAktif = k.lemari.filter((l: any) => !l.isLocked);
                    totalLemari += lemariAktif.length;
                    lemariAktif.forEach((l: any) => {
                      if (l.penghuni && l.penghuni.length > 0) terisiLemari++;
                    });
                  }
                });
                const percentage = totalLemari === 0 ? 0 : Math.round((terisiLemari / totalLemari) * 100);

                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSakanId(s.id)}
                    className={`flex flex-col items-center justify-center py-3 px-6 min-w-[120px] whitespace-nowrap border-b-4 transition-colors ${isActive ? 'border-gold-500 bg-gold-500/10 text-gold-500 font-bold' : 'border-transparent text-gray-400 hover:bg-dark-800 hover:text-gray-200 font-medium'}`}
                  >
                    <span className="text-sm uppercase">{s.nama}</span>
                    <span className="text-[10px] opacity-70 mt-0.5">
                      {terisiLemari}/{totalLemari} Terisi ({percentage}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Denah (Grid Lemari per Kamar) */}
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10 mt-4">
            {/* Keterangan Warna */}
            <div className="flex items-center justify-center gap-6 text-xs font-bold bg-dark-800 text-gray-300 p-3 rounded-xl border border-gold-500/10 shadow-sm">
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded border border-gold-500 bg-dark-900"></div> Tersedia</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-blue-600 border border-blue-500"></div> Dipilih</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-gray-700 border border-gray-600"></div> Terisi</div>
            </div>

            {activeSakan && activeSakan.kamar.filter((k:any) => !k.isLocked).map((kamar: any) => {
              const lemariList = kamar.lemari.filter((l:any) => !l.isLocked).sort((a:any, b:any) => Number(a.nomor) - Number(b.nomor));
              if(lemariList.length === 0) return null;

              return (
                <div key={kamar.id}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-[1px] flex-1 bg-gold-500/20"></div>
                    <h3 className="text-lg font-black text-gold-500 tracking-wider">Kamar {kamar.nama}</h3>
                    <div className="h-[1px] flex-1 bg-gold-500/20"></div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-4 mx-auto max-w-2xl">
                    {lemariList.map((lemari: any) => {
                      const isTerisi = lemari.penghuni && lemari.penghuni.length > 0;
                      const isSelected = selectedLemari?.id === lemari.id;

                      let btnClass = "w-full aspect-square rounded-xl sm:rounded-2xl border-2 flex items-center justify-center transition-all font-bold text-sm sm:text-base cursor-pointer shadow-sm relative ";

                      if (isTerisi) {
                        btnClass += "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-80";
                      } else if (isSelected) {
                        btnClass += "bg-blue-600 border-blue-500 text-white shadow-md transform scale-105";
                      } else {
                        btnClass += "bg-dark-900 border-gold-500/30 text-gold-500 hover:bg-gold-500/10 hover:border-gold-500/60";
                      }

                      return (
                        <button
                          key={lemari.id}
                          disabled={isTerisi}
                          onClick={() => {
                            if(!isTerisi) setSelectedLemari({ ...lemari, kamarNama: kamar.nama, sakanNama: activeSakan.nama });
                          }}
                          className={btnClass}
                          title={isTerisi ? lemari.penghuni[0].santri.nama : `Lemari ${lemari.nomor}`}
                        >
                          {lemari.nomor}
                          {/* Label priority */}
                          {lemari.isPriority && !isTerisi && (
                            <span className="absolute -top-2 -right-2 text-orange-500 bg-white rounded-full">★</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {activeSakan && activeSakan.kamar.filter((k:any) => !k.isLocked).length === 0 && (
              <p className="text-center text-gray-400 py-10 font-medium">Tidak ada kamar tersedia di Sakan ini.</p>
            )}
          </div>

          {/* Sticky Action Bar di Bawah */}
          <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-gold-500/20 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-50">
            <div className="max-w-4xl mx-auto p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">Pilihan Anda</p>
                {selectedLemari ? (
                  <p className="font-black text-blue-400 text-base sm:text-lg leading-tight">
                    {selectedLemari.sakanNama} / Km.{selectedLemari.kamarNama} / Lm.{selectedLemari.nomor}
                  </p>
                ) : (
                  <p className="font-bold text-gray-500 text-sm">Belum ada lemari yang dipilih</p>
                )}
              </div>
              <button
                onClick={handleSimpanPenempatan}
                disabled={!selectedLemari || loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-gold-500 text-black font-black rounded-xl hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? "Menyimpan..." : "SIMPAN"}
              </button>
            </div>
          </div>
          
        </div>
      </Protect>
    );
  }

  // Render Step 1: Daftar Santri (Antrean)
  return (
    <Protect permission="view_asrama" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak</div>}>
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto min-h-screen">
        
        <div className="mb-8 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gold-500/10">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Penempatan Asrama</h1>
            <p className="text-gray-400 mt-1 font-medium">Pilih santri yang sudah terkonfirmasi pembayarannya untuk ditempatkan ke kamar.</p>
          </div>
        </div>

        <div className="bg-dark-800 rounded-2xl shadow-inner border border-gold-500/20 overflow-hidden">
          <div className="p-4 border-b border-gold-500/10 bg-dark-900/50 flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Cari nama santri..."
              value={searchAntrean}
              onChange={(e) => setSearchAntrean(e.target.value)}
              className="w-full md:w-80 bg-dark-900 text-gray-200 border border-gold-500/20 px-4 py-2.5 rounded-xl outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 shadow-inner"
            />
            
            <div className="flex bg-dark-800 p-1 rounded-xl border border-gold-500/20 shadow-inner w-full md:w-auto">
              <button 
                onClick={() => setFilterGenderAntrean('SEMUA')} 
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterGenderAntrean === 'SEMUA' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setFilterGenderAntrean('BANIN')} 
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-all ${filterGenderAntrean === 'BANIN' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <IconMale /> Banin
              </button>
              <button 
                onClick={() => setFilterGenderAntrean('BANAT')} 
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-all ${filterGenderAntrean === 'BANAT' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <IconFemale /> Banat
              </button>
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gold-500/10 text-gold-500 uppercase font-black text-xs">
                <tr>
                  <th className="px-4 py-3 border-b border-gold-500/10 w-16 text-center">No</th>
                  <th className="px-4 py-3 border-b border-gold-500/10">Nama Santri</th>
                  <th className="px-4 py-3 border-b border-gold-500/10 w-24 text-center">NIS</th>
                  <th className="px-4 py-3 border-b border-gold-500/10 w-32 text-center">Kabupaten</th>
                  <th className="px-4 py-3 border-b border-gold-500/10 w-24 text-center">Status</th>
                  <th className="px-4 py-3 border-b border-gold-500/10 w-32 text-center">Gender</th>
                  <th className="px-4 py-3 border-b border-gold-500/10">Riwayat Terakhir</th>
                  <th className="px-4 py-3 border-b border-gold-500/10 w-32 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAntrean.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <IconInbox />
                        <p className="mt-3 font-medium">Belum ada santri yang menunggu penempatan.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAntrean.map((item, index) => (
                    <tr key={item.id} className="hover:bg-dark-900/50 transition-colors border-b border-gold-500/5 last:border-0">
                      <td className="px-4 py-3 text-center text-gray-400 font-bold">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-200">{item.santri.nama}</p>
                        <span className="text-[10px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded shadow-sm tracking-widest mt-1 inline-block">Menunggu Kamar</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300 font-medium">
                        {item.santri.nis || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300 font-medium capitalize">
                        {item.santri.kabupaten ? item.santri.kabupaten.toLowerCase() : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded text-white ${item.santri.kategori === 'KSU' ? 'bg-purple-600' : item.santri.kategori === 'LAMA' ? 'bg-orange-500' : 'bg-green-500'}`}>
                          {item.santri.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.santri.gender === 'BANAT' ? (
                          <span className="text-pink-500 font-bold flex items-center justify-center gap-1"><IconFemale /> Banat</span>
                        ) : (
                          <span className="text-blue-500 font-bold flex items-center justify-center gap-1"><IconMale /> Banin</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.keteranganSakanLama ? (
                          <span className="text-xs text-gray-400 bg-dark-900 px-2 py-1 rounded border border-gold-500/10">
                            {item.keteranganSakanLama}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canAssignLemari ? (
                          <button
                            onClick={() => handlePilihSantri(item)}
                            className="bg-gold-500 text-black hover:bg-gold-400 px-4 py-2 rounded-lg text-xs font-black shadow-md transition-all active:scale-95"
                          >
                            Tempatkan
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>



      </div>
    </Protect>
  );
}