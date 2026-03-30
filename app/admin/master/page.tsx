"use client";

import { useState, useEffect, useRef } from "react";
import { swalConfirm, swalSuccess, swalError, swalDanger, swalInput } from "../../lib/swal";
import { usePusher } from "../../providers/PusherProvider";
import { Protect } from "@/components/Protect";

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
const IconEdit = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconTrash = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconRefresh = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default function MasterLokasiPage() {
  const [dataSakan, setDataSakan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // State Form Tambah
  const [namaSakan, setNamaSakan] = useState("");
  const [kategoriSakan, setKategoriSakan] = useState("BANIN");
  const [namaKamar, setNamaKamar] = useState("");
  const [sakanIdKamar, setSakanIdKamar] = useState("");
  const [nomorLemari, setNomorLemari] = useState("");
  const [kamarIdLemari, setKamarIdLemari] = useState("");

  // State Modal Pindah Kamar
  const [isModalPindahOpen, setIsModalPindahOpen] = useState(false);
  const [santriPindah, setSantriPindah] = useState<any>(null);
  const [sakanTujuan, setSakanTujuan] = useState("");
  const [kamarTujuan, setKamarTujuan] = useState("");
  const [lemariTujuan, setLemariTujuan] = useState("");

  const pusher = usePusher();

  const muatData = async () => {
    try {
      const res = await fetch("/api/sakan");
      if (res.ok) setDataSakan(await res.json());
    } catch (error) { console.error("Gagal memuat data", error); }
  };

  useEffect(() => { muatData(); }, []);

  useEffect(() => {
    if (!pusher) return;
    
    const onDataUpdate = () => muatData();
    const channel = pusher.subscribe("ppdb-channel");
    channel.bind("data:update", onDataUpdate);
    
    return () => {
      channel.unbind("data:update", onDataUpdate);
      pusher.unsubscribe("ppdb-channel");
    };
  }, [pusher]);

  const tambahSakan = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch("/api/sakan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama: namaSakan, kategori: kategoriSakan }) });
    if (res.ok) { setNamaSakan(""); muatData(); } setLoading(false);
  };
  const tambahKamar = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch("/api/kamar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama: namaKamar, sakanId: sakanIdKamar }) });
    if (res.ok) { setNamaKamar(""); muatData(); } setLoading(false);
  };
  const tambahLemari = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch("/api/lemari", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nomor: nomorLemari, kamarId: kamarIdLemari }) });
    if (res.ok) { setNomorLemari(""); muatData(); } setLoading(false);
  };
  const aksiData = async (jenis: "sakan" | "kamar" | "lemari", aksi: "edit" | "hapus", id: string, dataLama: string, kategoriLama?: string) => {
    if (aksi === "hapus") {
      const result = await swalDanger(
        `Hapus ${jenis.toUpperCase()}?`,
        `YAKIN HAPUS ${dataLama}? Semua isinya ikut terhapus!`
      );
      if (!result.isConfirmed) return;
      
      await fetch(`/api/${jenis}/${id}`, { method: "DELETE" }); 
      swalSuccess(`${jenis} dihapus!`);
      muatData();
    } 
    if (aksi === "edit") {
      const resInput = await swalInput(`Edit nama/nomor ${dataLama}`, dataLama, `Masukkan nama baru untuk ${jenis}`);
      const namaBaru = resInput.value;
      
      if (!namaBaru || namaBaru === dataLama) return;
      let bodyData: any = { nama: namaBaru };
      if (jenis === "lemari") bodyData = { nomor: namaBaru };
      if (jenis === "sakan") {
        const katInput = await swalInput("Kategori Sakan (BANIN/BANAT)", kategoriLama, "Ketik BANIN atau BANAT");
        const katBaru = katInput.value?.toUpperCase();
        if (katBaru === "BANIN" || katBaru === "BANAT") bodyData.kategori = katBaru;
      }
      await fetch(`/api/${jenis}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyData) }); 
      swalSuccess("Berhasil diubah!");
      muatData();
    }
  };
  const toggleLock = async (jenis: "sakan" | "kamar" | "lemari", id: string, statusKunciSaatIni: boolean) => {
    const scrollContainer = mainRef.current?.closest('main');
    const scrollTop = scrollContainer?.scrollTop || 0;
    
    // Optimistic Update: Update UI instan tanpa menunggu loading
    setDataSakan(prevData => prevData.map((s) => {
      if (jenis === "sakan" && s.id === id) {
        return { ...s, isLocked: !statusKunciSaatIni };
      }
      if (jenis === "kamar" || jenis === "lemari") {
        return {
          ...s,
          kamar: s.kamar.map((k: any) => {
            if (jenis === "kamar" && k.id === id) {
              return { ...k, isLocked: !statusKunciSaatIni };
            }
            if (jenis === "lemari") {
              return {
                ...k,
                lemari: k.lemari.map((l: any) => 
                  l.id === id ? { ...l, isLocked: !statusKunciSaatIni } : l
                )
              };
            }
            return k;
          })
        };
      }
      return s;
    }));
    
    try {
      await fetch(`/api/${jenis}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isLocked: !statusKunciSaatIni }) }); 
    } catch (error) {
      console.error(error);
      await muatData(); // Revert on failure
    }

    requestAnimationFrame(() => {
      if (scrollContainer) scrollContainer.scrollTop = scrollTop;
    });
  };

  const bukaModalPindah = (riwayatId: string, namaSantri: string, gender: string) => {
    setSantriPindah({ id: riwayatId, nama: namaSantri, gender: gender });
    setIsModalPindahOpen(true);
  };

  const eksekusiPindahKamar = async () => {
    if (!lemariTujuan) return swalError("Pilih lemari tujuan!");
    setLoading(true);
    const res = await fetch(`/api/riwayat/${santriPindah.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lemariIdBaru: lemariTujuan }),
    });

    if (res.ok) {
      swalSuccess("Pindah Kamar Berhasil!");
      setIsModalPindahOpen(false);
      setSakanTujuan(""); setKamarTujuan(""); setLemariTujuan("");
      muatData();
    } else { swalError("Gagal memindahkan santri."); }
    setLoading(false);
  };

  const sakanPindahDifilter = dataSakan.filter(s => s.kategori === santriPindah?.gender && !s.isLocked);
  const sakanPindahTerpilih = sakanPindahDifilter.find(s => s.id === sakanTujuan);
  const kamarPindahDifilter = sakanPindahTerpilih ? sakanPindahTerpilih.kamar.filter((k:any) => !k.isLocked) : [];
  const kamarPindahTerpilih = kamarPindahDifilter.find((k:any) => k.id === kamarTujuan);
  const lemariPindahTersedia = kamarPindahTerpilih ? kamarPindahTerpilih.lemari.filter((l:any) => !l.isLocked && (!l.penghuni || l.penghuni.length === 0)) : [];

  // Group sakan by kategori
  const sakanBanin = dataSakan.filter(s => s.kategori !== "BANAT");
  const sakanBanat = dataSakan.filter(s => s.kategori === "BANAT");

  const RenderSakanCard = ({ sakan }: { sakan: any }) => {
    const isBanat = sakan.kategori === "BANAT";
    const headerColor = sakan.isLocked ? 'bg-dark-900' : isBanat ? 'bg-gradient-to-r from-rose-900 to-rose-800' : 'bg-dark-900 border-b border-gold-500/10';

    return (
      <div className={`rounded-2xl shadow-sm border overflow-hidden ${sakan.isLocked ? 'bg-dark-900 border-gray-800 opacity-80' : 'bg-dark-800 border-gold-500/20 hover:border-gold-500/50'}`}>
        <div className={`${headerColor} p-4 flex justify-between items-center text-gray-200`}>
          <div>
            <h3 className={`font-bold text-xl flex items-center gap-2 ${sakan.isLocked ? 'line-through text-gray-500' : 'text-gold-500'}`}>
              {sakan.isLocked && <IconLock className="h-4 w-4 text-gray-500" />} {sakan.nama}
            </h3>
            <span className="text-xs font-bold bg-dark-800 text-gold-500 border border-gold-500/20 px-2 py-0.5 rounded uppercase">{sakan.kategori || "BANIN"}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => toggleLock('sakan', sakan.id, sakan.isLocked)} className={`text-xs px-2 py-1 rounded font-bold flex items-center gap-1 border ${sakan.isLocked ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-dark-800 text-gray-400 border-gray-700 hover:bg-dark-900'}`}>
              {sakan.isLocked ? <><IconUnlock className="h-3 w-3" /> Buka</> : <><IconLock className="h-3 w-3" /> Kunci</>}
            </button>
            <button onClick={() => aksiData('sakan', 'edit', sakan.id, sakan.nama, sakan.kategori)} className="text-xs bg-dark-800 text-gray-400 border border-gray-700 hover:bg-dark-900 px-2 py-1 rounded flex items-center gap-1"><IconEdit className="h-3 w-3" /></button>
            <button onClick={() => aksiData('sakan', 'hapus', sakan.id, sakan.nama)} className="text-xs bg-red-900/20 text-red-500 border border-red-900/30 hover:bg-red-900/50 px-2 py-1 rounded flex items-center gap-1"><IconTrash className="h-3 w-3" /></button>
          </div>
        </div>

        <div className="p-4 bg-dark-900/50">
          {sakan.kamar.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Belum ada kamar.</p>
          ) : (
            <div className="space-y-4">
              {sakan.kamar.map((kamar: any) => (
                <div key={kamar.id} className={`p-3 rounded-xl border shadow-sm ${kamar.isLocked ? 'bg-red-900/10 border-red-900/30' : 'bg-dark-900 border-gold-500/10'}`}>
                  <div className="flex justify-between items-center border-b border-gold-500/10 pb-2 mb-2">
                    <span className={`font-bold flex items-center gap-1 ${kamar.isLocked ? 'text-red-500 line-through' : 'text-gold-400'}`}>
                      {kamar.isLocked && <IconLock className="h-3.5 w-3.5" />} Kamar {kamar.nama}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => toggleLock('kamar', kamar.id, kamar.isLocked)} className={`text-[10px] px-2 py-1 rounded border font-bold flex items-center gap-1 ${kamar.isLocked ? 'bg-green-900/20 text-green-500 border-green-900/30' : 'bg-red-900/20 text-red-500 border-red-900/30'}`}>
                        {kamar.isLocked ? <><IconUnlock className="h-2.5 w-2.5" /> Buka</> : <><IconLock className="h-2.5 w-2.5" /> Kunci</>}
                      </button>
                      <button onClick={() => aksiData('kamar', 'edit', kamar.id, kamar.nama)} className="text-[10px] text-gray-400 hover:text-gold-500 bg-dark-800 border-gray-700 px-2 py-1 rounded border flex items-center gap-1"><IconEdit className="h-2.5 w-2.5" /> Edit</button>
                      <button onClick={() => aksiData('kamar', 'hapus', kamar.id, kamar.nama)} className="text-[10px] text-red-500 bg-dark-800 border-gray-700 hover:text-red-400 px-2 py-1 rounded border flex items-center gap-1"><IconTrash className="h-2.5 w-2.5" /> Hapus</button>
                    </div>
                  </div>
                  
                  {kamar.lemari.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Kosong</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {kamar.lemari.map((lemari: any) => {
                        const isBentrok = lemari.penghuni && lemari.penghuni.length > 1;
                        const isTerisi = lemari.penghuni && lemari.penghuni.length > 0;
                        
                        return (
                          <div key={lemari.id} className={`flex flex-col border p-2 rounded relative group 
                            ${lemari.isLocked ? 'bg-dark-900 border-gray-800 opacity-75' 
                            : isBentrok ? 'bg-red-900/20 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' 
                            : isTerisi ? 'bg-dark-800 border-gold-500/30' 
                            : 'bg-dark-900 border-gray-800 border-dashed hover:border-gold-500/50'}`}>
                            
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border ${isBentrok ? 'bg-red-600 text-white border-red-600' : 'bg-dark-900 text-gray-400 border-gray-800'}`}>
                                {lemari.isLocked && <IconLock className="h-2.5 w-2.5 inline mr-0.5" />} Loker {lemari.nomor}
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleLock('lemari', lemari.id, lemari.isLocked)} className="text-[10px] bg-dark-900 text-gray-400 rounded px-1 shadow-sm border border-gray-700 hover:bg-dark-800 flex items-center">{lemari.isLocked ? <IconUnlock className="h-2.5 w-2.5" /> : <IconLock className="h-2.5 w-2.5" />}</button>
                                <button onClick={() => aksiData('lemari', 'edit', lemari.id, lemari.nomor)} className="text-[10px] bg-dark-900 text-gray-400 rounded px-1 shadow-sm border border-gray-700 hover:bg-dark-800 flex items-center"><IconEdit className="h-2.5 w-2.5" /></button>
                                <button onClick={() => aksiData('lemari', 'hapus', lemari.id, lemari.nomor)} className="text-[10px] bg-dark-900 text-red-500 rounded px-1 shadow-sm border border-gray-700 hover:bg-dark-800 flex items-center"><IconTrash className="h-2.5 w-2.5" /></button>
                              </div>
                            </div>

                            {isTerisi ? (
                              <div className="space-y-1 mt-auto">
                                {lemari.penghuni.map((p:any) => (
                                  <div key={p.id} className="flex justify-between items-center bg-dark-900 px-1.5 py-1 rounded border border-gold-500/20">
                                    <p className="font-bold text-xs text-gray-200 truncate max-w-[100px]" title={p.santri.nama}>{p.santri.nama}</p>
                                    <button 
                                      onClick={() => bukaModalPindah(p.id, p.santri.nama, sakan.kategori)}
                                      className="text-[10px] bg-gold-500/10 hover:bg-gold-500 hover:text-black text-gold-500 border border-gold-500/30 px-1.5 py-0.5 rounded transition shadow-sm font-bold flex items-center gap-0.5"
                                      title="Pindah Kamar"
                                    >
                                      <IconRefresh className="h-2.5 w-2.5" /> Pindah
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-auto text-center"><span className="text-xs text-gray-600 italic">Kosong</span></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Protect permission="manage_asrama" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin untuk mengelola asrama.</div>}>
    <div ref={mainRef} className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 border-b border-gold-500/10 pb-6">
        <h1 className="text-3xl font-extrabold text-gold-500">Master Lokasi Asrama</h1>
        <p className="text-gray-400 mt-1 font-medium">Kelola sakan, kamar, dan lemari asrama.</p>
      </div>

      {/* Form Tambah */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <form onSubmit={tambahSakan} className="bg-dark-800 p-5 rounded-2xl shadow-sm border border-gold-500/20">
          <h2 className="font-bold text-lg mb-4 text-gold-500">1. Tambah Sakan</h2>
          <input type="text" value={namaSakan} onChange={(e) => setNamaSakan(e.target.value)} placeholder="Nama Sakan (Cth: Alkaf)" className="w-full p-3 mb-3 border border-dark-900 bg-dark-900 text-gray-200 placeholder:text-gray-600 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" required />
          <select value={kategoriSakan} onChange={(e) => setKategoriSakan(e.target.value)} className="w-full p-3 mb-3 border border-dark-900 bg-dark-900 text-gold-500 rounded-xl font-bold outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" >
            <option value="BANIN">Putra (BANIN)</option>
            <option value="BANAT">Putri (BANAT)</option>
          </select>
          <button type="submit" disabled={loading} className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] active:scale-95">Simpan Sakan</button>
        </form>
        <form onSubmit={tambahKamar} className="bg-dark-800 p-5 rounded-2xl shadow-sm border border-gold-500/20">
          <h2 className="font-bold text-lg mb-4 text-gold-500">2. Tambah Kamar</h2>
          <select value={sakanIdKamar} onChange={(e) => setSakanIdKamar(e.target.value)} className="w-full p-3 mb-3 border border-dark-900 bg-dark-900 text-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" required >
            <option value="">-- Pilih Sakan --</option>
            {dataSakan.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.kategori})</option>)}
          </select>
          <input type="text" value={namaKamar} onChange={(e) => setNamaKamar(e.target.value)} placeholder="Nama Kamar (Cth: A)" className="w-full p-3 mb-3 border border-dark-900 bg-dark-900 text-gray-200 placeholder:text-gray-600 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" required />
          <button type="submit" disabled={loading} className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] active:scale-95">Simpan Kamar</button>
        </form>
        <form onSubmit={tambahLemari} className="bg-dark-800 p-5 rounded-2xl shadow-sm border border-gold-500/20">
          <h2 className="font-bold text-lg mb-4 text-gold-500">3. Tambah Lemari</h2>
          <select value={kamarIdLemari} onChange={(e) => setKamarIdLemari(e.target.value)} className="w-full p-3 mb-3 border border-dark-900 bg-dark-900 text-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" required >
            <option value="">-- Pilih Kamar --</option>
            {dataSakan.map((s) => s.kamar.map((k: any) => <option key={k.id} value={k.id}>{s.nama} - Kamar {k.nama}</option>))}
          </select>
          <input type="text" value={nomorLemari} onChange={(e) => setNomorLemari(e.target.value)} placeholder="Nomor Lemari (Cth: A1)" className="w-full p-3 mb-3 border border-dark-900 bg-dark-900 text-gray-200 placeholder:text-gray-600 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 shadow-inner" required />
          <button type="submit" disabled={loading} className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] active:scale-95">Simpan Lemari</button>
        </form>
      </div>

      <div className="mb-6 bg-yellow-900/20 p-4 rounded-xl border border-yellow-500/30 flex items-center gap-3">
        <IconWarning />
        <p className="text-sm text-yellow-500 font-medium">Jika ada loker warna merah (Bentrok), klik tombol Pindah untuk memindahkan santri.</p>
      </div>

      {/* BANIN SECTION */}
      {sakanBanin.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-black text-gold-500 mb-6 flex items-center gap-2 border-b border-gold-500/10 pb-2">
            <IconMale /> <span className="text-gray-200">Sakan</span> Banin (Putra)
            <span className="text-sm font-medium text-gray-500 ml-2">({sakanBanin.length} Sakan)</span>
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sakanBanin.map((sakan) => <RenderSakanCard key={sakan.id} sakan={sakan} />)}
          </div>
        </div>
      )}

      {/* BANAT SECTION */}
      {sakanBanat.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-black text-rose-500 mb-6 flex items-center gap-2 border-b border-gold-500/10 pb-2">
            <IconFemale /> <span className="text-gray-200">Sakan</span> Banat (Putri)
            <span className="text-sm font-medium text-gray-500 ml-2">({sakanBanat.length} Sakan)</span>
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sakanBanat.map((sakan) => <RenderSakanCard key={sakan.id} sakan={sakan} />)}
          </div>
        </div>
      )}

      {dataSakan.length === 0 && (
        <div className="text-center py-20 text-gray-500 font-medium">Belum ada data Sakan.</div>
      )}

      {/* MODAL PINDAH KAMAR */}
      {isModalPindahOpen && santriPindah && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl shadow-2xl border border-gold-500/20 w-full max-w-lg overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className={`p-5 bg-dark-900 border-b border-gold-500/10`}>
              <h2 className="text-xl font-bold text-gold-500 flex items-center gap-2"><IconRefresh className="h-5 w-5" /> Pindah Lokasi Kamar</h2>
              <p className="text-gray-400 text-sm mt-1">Pilih kamar baru untuk: <strong className="text-gray-200">{santriPindah.nama}</strong></p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Pilih Sakan Tujuan</label>
                <select value={sakanTujuan} onChange={(e) => { setSakanTujuan(e.target.value); setKamarTujuan(""); setLemariTujuan(""); }} className="w-full p-3 border border-dark-900 rounded-xl outline-none bg-dark-900 font-bold focus:ring-1 focus:ring-gold-500/50 text-gray-200">
                  <option value="">-- Pilih Sakan --</option>
                  {sakanPindahDifilter.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Pilih Kamar Tujuan</label>
                <select value={kamarTujuan} onChange={(e) => { setKamarTujuan(e.target.value); setLemariTujuan(""); }} disabled={!sakanTujuan} className="w-full p-3 border border-dark-900 rounded-xl outline-none bg-dark-900 disabled:bg-dark-900/50 focus:ring-1 focus:ring-gold-500/50 text-gray-200">
                  <option value="">-- Pilih Kamar --</option>
                  {kamarPindahDifilter.map((k: any) => <option key={k.id} value={k.id}>Kamar {k.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Pilih Lemari (Yang Kosong)</label>
                <select value={lemariTujuan} onChange={(e) => setLemariTujuan(e.target.value)} disabled={!kamarTujuan} className="w-full p-3 border border-dark-900 rounded-xl outline-none bg-dark-900 disabled:bg-dark-900/50 focus:ring-1 focus:ring-gold-500/50 text-gray-200">
                  <option value="">-- Pilih Lemari --</option>
                  {lemariPindahTersedia.map((l: any) => <option key={l.id} value={l.id}>Loker {l.nomor}</option>)}
                </select>
                {kamarTujuan && lemariPindahTersedia.length === 0 && <p className="text-xs text-red-500 mt-1 font-bold">Semua lemari di kamar ini penuh/dikunci!</p>}
              </div>
            </div>

            <div className="p-5 border-t border-gold-500/10 bg-dark-900/50 flex justify-end gap-3">
              <button onClick={() => setIsModalPindahOpen(false)} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-dark-900 rounded-xl transition">Batal</button>
              <button onClick={eksekusiPindahKamar} disabled={!lemariTujuan || loading} className={`px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.3)]`}>
                {loading ? "Memproses..." : "Konfirmasi Pindah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Protect>
  );
}