"use client";

import { useState, useEffect, useRef } from "react";
import { usePusher } from "../../providers/PusherProvider";
import { swalSuccess, swalError, swalNotif } from "../../lib/swal";

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
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);
const IconFemale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline text-pink-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export default function MejaAsramaPage() {
  const [dataLokasi, setDataLokasi] = useState<any[]>([]);
  const [antrean, setAntrean] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Modal Input Santri Baru (klik dari denah)
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [selectedLemari, setSelectedLemari] = useState<any>(null);
  const [selectedKamar, setSelectedKamar] = useState<any>(null);
  const [selectedSakan, setSelectedSakan] = useState<any>(null);
  const [namaSantri, setNamaSantri] = useState("");
  const [kategori, setKategori] = useState("BARU");
  const [genderSantri, setGenderSantri] = useState("BANIN");
  const [bulanKe, setBulanKe] = useState("1");

  // State Modal Antrean
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [santriAntrean, setSantriAntrean] = useState<any>(null);
  const [modalSakanId, setModalSakanId] = useState("");
  const [modalKamarId, setModalKamarId] = useState("");
  const [modalLemariId, setModalLemariId] = useState("");

  const pusher = usePusher();

  // Notifikasi Real-time
  const [notif, setNotif] = useState({ show: false, pesan: "", namaTarget: "" });
  const prevSudahRef = useRef<number | null>(null);

  const putarSuara = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const tampilkanNotif = (pesan: string, namaTarget?: string) => {
    putarSuara();
    setNotif({ show: true, pesan, namaTarget: namaTarget || "" });
    setTimeout(() => setNotif({ show: false, pesan: "", namaTarget: "" }), 6000);
  };

  const muatData = async (isBackground = false) => {
    try {
      const resLokasi = await fetch("/api/sakan");
      const resAntrean = await fetch("/api/asrama/antrean");
      if (resLokasi.ok) setDataLokasi(await resLokasi.json());
      if (resAntrean.ok) setAntrean(await resAntrean.json());

      const resIdCard = await fetch("/api/id-card");
      if (resIdCard.ok) {
        const dataIdCard = await resIdCard.json();
        const totalSudah = dataIdCard.sudah.length;

        if (prevSudahRef.current !== null && totalSudah > prevSudahRef.current) {
          const anakTerakhir = dataIdCard.sudah[totalSudah - 1]; 
          tampilkanNotif(`${anakTerakhir.santri.nama} telah menerima ID Card (No. ${totalSudah})`);
        }
        prevSudahRef.current = totalSudah;
      }
    } catch (error) {}
  };

  useEffect(() => {
    muatData();
  }, []);

  // Listen to generic data updates and specific ID card notifications
  useEffect(() => {
    if (!pusher) return;
    
    const onDataUpdate = () => muatData(true);
    const onIdCardNotif = (payload: any) => {
      tampilkanNotif(payload.message, payload.data?.nama);
      swalNotif("Kartu Diserahkan", payload.message);
    };
    
    const channel = pusher.subscribe("ppdb-channel");
    channel.bind("data:update", onDataUpdate);
    channel.bind("notif:idcard", onIdCardNotif);
    
    return () => {
      channel.unbind("data:update", onDataUpdate);
      channel.unbind("notif:idcard", onIdCardNotif);
      pusher.unsubscribe("ppdb-channel");
    };
  }, [pusher]);

  // Modal antrean helpers
  const sakanDifilterModal = dataLokasi.filter(s => s.kategori === santriAntrean?.gender && !s.isLocked);
  const modalSakan = sakanDifilterModal.find((s) => s.id === modalSakanId);
  const modalDaftarKamar = modalSakan ? modalSakan.kamar.filter((k: any) => !k.isLocked) : [];
  const modalKamar = modalDaftarKamar.find((k: any) => k.id === modalKamarId);
  const modalLemariTersedia = modalKamar ? modalKamar.lemari.filter((l: any) => !l.isLocked && (!l.penghuni || l.penghuni.length === 0)) : [];

  // Klik lemari kosong di denah → buka modal input
  const bukaInputModal = (sakan: any, kamar: any, lemari: any) => {
    setSelectedSakan(sakan);
    setSelectedKamar(kamar);
    setSelectedLemari(lemari);
    setGenderSantri(sakan.kategori === "BANAT" ? "BANAT" : "BANIN");
    setNamaSantri("");
    setKategori("BARU");
    setBulanKe("1");
    setIsInputModalOpen(true);
  };

  const tutupInputModal = () => {
    setIsInputModalOpen(false);
    setSelectedLemari(null);
    setSelectedKamar(null);
    setSelectedSakan(null);
  };

  const simpanSantriDariDenah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSantri || !selectedLemari || !kategori) return alert("Data wajib diisi!");
    setLoading(true);
    const res = await fetch("/api/asrama/santri-baru", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaSantri, kategori, lemariId: selectedLemari.id, bulanKe, gender: genderSantri }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      swalSuccess("Berhasil!", data.message);
      tutupInputModal();
      muatData(); 
    } else { swalError("Gagal menyimpan", data.error); }
  };

  // Antrean modal
  const bukaModalAntrean = (id: string, nama: string, gender: string) => {
    setSantriAntrean({ id, nama, gender }); setIsModalOpen(true);
  };
  const tutupModal = () => {
    setIsModalOpen(false); setSantriAntrean(null); setModalSakanId(""); setModalKamarId(""); setModalLemariId("");
  };
  const eksekusiAssignModal = async () => {
    if (!modalLemariId || !santriAntrean) return swalError("Gagal", "Silakan pilih lemari terlebih dahulu!");
    const res = await fetch(`/api/asrama/assign/${santriAntrean.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lemariId: modalLemariId }),
    });
    const data = await res.json();
    if (res.ok) { swalSuccess("Berhasil!", data.message); tutupModal(); muatData(); } else { swalError("Gagal", data.error); }
  };

  const sakanBanin = dataLokasi.filter(s => s.kategori !== "BANAT" && !s.isLocked);
  const sakanBanat = dataLokasi.filter(s => s.kategori === "BANAT" && !s.isLocked);

  const RenderDenahBlock = ({ data, judul, warnaTema }: { data: any[], judul: string, warnaTema: 'biru' | 'pink' }) => {
    const isBiru = warnaTema === 'biru';
    const bgHeader = isBiru ? 'bg-gradient-to-r from-blue-800 to-blue-700' : 'bg-gradient-to-r from-pink-700 to-pink-600';
    const textWarna = isBiru ? 'text-blue-800' : 'text-pink-800';
    const bgLemariTerisi = isBiru ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200';

    return (
      <div className="mb-10">
        <h2 className={`text-xl font-black mb-4 ${textWarna} flex items-center gap-2`}>
          {isBiru ? <IconMale /> : <IconFemale />} {judul}
        </h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {data.map((sakan) => {
            let totalLemari = 0;
            let terisi = 0;
            sakan.kamar.forEach((k: any) => {
              const aktif = k.lemari.filter((l: any) => !l.isLocked && !k.isLocked);
              totalLemari += aktif.length;
              k.lemari.forEach((l: any) => { if (l.penghuni?.length > 0) terisi++; });
            });
            const persen = totalLemari === 0 ? 0 : Math.round((terisi / totalLemari) * 100);

            return (
              <div key={sakan.id} className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className={`${bgHeader} p-4 text-white`}>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-black">{sakan.nama}</h3>
                      <p className="text-sm opacity-80">{sakan.kamar.length} Kamar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">{persen}%</p>
                      <p className="text-xs opacity-80">Terisi: {terisi}/{totalLemari}</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2 mt-3">
                    <div className="bg-white h-2 rounded-full transition-all duration-700" style={{ width: `${persen}%` }}></div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Show ALL kamar, including locked ones */}
                  {sakan.kamar.map((kamar: any) => {
                    const isKamarLocked = kamar.isLocked;

                    // LOCKED ROOM DISPLAY
                    if (isKamarLocked) {
                      return (
                        <div key={kamar.id} className="p-3 rounded-xl border border-gray-300 bg-gray-100">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-gray-500 flex items-center gap-2 line-through">
                              <IconLock className="h-4 w-4 text-gray-500" /> Kamar {kamar.nama}
                            </h4>
                            <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-lg border border-gray-300 flex items-center gap-1">
                              <IconLock className="h-3 w-3" /> Dikunci
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const kosong = kamar.lemari.filter((l: any) => !l.isLocked && (!l.penghuni || l.penghuni.length === 0)).length;
                    const totalK = kamar.lemari.filter((l: any) => !l.isLocked).length;
                    
                    return (
                      <div key={kamar.id} className="p-3 rounded-xl border border-blue-100 bg-blue-50/30">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-blue-100/50">
                          <h4 className="font-bold text-blue-900">Kamar {kamar.nama}</h4>
                          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            Kosong: {kosong}/{totalK}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {kamar.lemari.filter((l: any) => !l.isLocked).map((lemari: any) => {
                            const isTerisi = lemari.penghuni && lemari.penghuni.length > 0;
                            const dataSantriLemari = isTerisi ? lemari.penghuni[0].santri : null;

                            if (isTerisi) {
                              return (
                                <div key={lemari.id} className={`p-2 rounded-lg border ${bgLemariTerisi} min-h-[65px] flex flex-col justify-between`}>
                                  <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black text-gray-500 bg-white px-1.5 py-0.5 rounded shadow-sm">{lemari.nomor}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${dataSantriLemari.kategori === 'KSU' ? 'bg-purple-600' : dataSantriLemari.kategori === 'LAMA' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                      {dataSantriLemari.kategori}
                                    </span>
                                  </div>
                                  <p className={`font-bold text-xs leading-tight truncate mt-1 ${textWarna}`} title={dataSantriLemari.nama}>
                                    {dataSantriLemari.nama}
                                  </p>
                                </div>
                              );
                            }

                            // Lemari kosong - klikable
                            return (
                              <button
                                key={lemari.id}
                                onClick={() => bukaInputModal(sakan, kamar, lemari)}
                                className="p-2 rounded-lg border border-dashed border-blue-300 bg-white min-h-[65px] flex flex-col justify-between hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all group cursor-pointer"
                              >
                                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shadow-sm self-start">{lemari.nomor}</span>
                                <div className="text-center w-full">
                                  <p className="text-xs text-blue-400 italic font-medium group-hover:hidden">Kosong</p>
                                  <p className="text-xs text-blue-600 font-bold hidden group-hover:flex items-center justify-center gap-1"><IconPlus /> Isi Santri</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen relative overflow-hidden">
      
      {/* POP-UP NOTIFIKASI */}
      <div className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${notif.show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
        <div className="bg-white border-l-4 border-blue-500 shadow-2xl rounded-xl p-4 flex items-center gap-3 min-w-[300px]">
          <div className="bg-blue-100 p-2 rounded-full animate-pulse"><IconCreditCard /></div>
          <div>
            <h4 className="font-bold text-blue-800 text-sm">Update ID Card</h4>
            <p className="text-gray-600 text-xs font-medium">{notif.pesan}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 border-b border-blue-100 pb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">Meja Asrama & Penempatan</h1>
        <p className="text-blue-500 mt-1 font-medium">Klik lemari kosong untuk menempatkan santri baru.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: DENAH VISUAL */}
        <div className="lg:col-span-2">
          {sakanBanin.length > 0 && <RenderDenahBlock data={sakanBanin} judul="Area Banin (Putra)" warnaTema="biru" />}
          {sakanBanat.length > 0 && <RenderDenahBlock data={sakanBanat} judul="Area Banat (Putri)" warnaTema="pink" />}
          {sakanBanin.length === 0 && sakanBanat.length === 0 && (
            <div className="text-center py-20 text-blue-300 font-medium">Belum ada data Sakan.</div>
          )}
        </div>

        {/* KOLOM KANAN: ANTREAN ROLLING */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col h-[600px] lg:h-auto lg:max-h-[80vh] lg:sticky lg:top-4">
          <div className="mb-4 border-b border-blue-50 pb-4">
            <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2"><IconClipboard /> Antrean Rolling</h2>
            <p className="text-sm text-blue-400 mt-1">Santri lama yang wajib pindah kamar.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {antrean.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-blue-300 py-10">
                <IconInbox /><p className="font-medium mt-2">Belum ada antrean.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {antrean.map((item) => (
                  <li key={item.id} className="p-4 border border-blue-100 rounded-xl flex justify-between items-center bg-blue-50/30 border-l-4 border-l-red-400 hover:shadow-sm transition">
                    <div>
                      <p className="font-bold text-blue-900 text-lg flex items-center gap-2">
                        {item.santri.nama} {item.santri.gender === 'BANAT' ? <IconFemale /> : <IconMale />}
                      </p>
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">Wajib Rolling</span>
                    </div>
                    <button onClick={() => bukaModalAntrean(item.id, item.santri.nama, item.santri.gender)} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-bold shadow-sm transition-all active:scale-95">
                      Beri Kamar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* MODAL INPUT SANTRI BARU (Dari klik denah) */}
      {isInputModalOpen && selectedLemari && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className={`p-5 ${genderSantri === 'BANAT' ? 'bg-gradient-to-r from-pink-600 to-pink-500' : 'bg-gradient-to-r from-blue-700 to-blue-600'}`}>
              <h2 className="text-xl font-bold text-white">Input Santri ke Kamar</h2>
              <p className="text-white/80 text-sm mt-1">
                {selectedSakan?.nama} → Kamar {selectedKamar?.nama} → Lemari {selectedLemari?.nomor}
              </p>
            </div>
            
            <form onSubmit={simpanSantriDariDenah} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Nama Lengkap</label>
                <input type="text" value={namaSantri} onChange={(e) => setNamaSantri(e.target.value)} placeholder="Cth: Ahmad / Siti" className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Gender</label>
                  <select value={genderSantri} onChange={(e) => setGenderSantri(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white font-bold text-blue-700" disabled>
                    <option value="BANIN">Putra (BANIN)</option>
                    <option value="BANAT">Putri (BANAT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Kategori Santri</label>
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    <option value="BARU">BARU</option>
                    <option value="LAMA">LAMA</option>
                    <option value="KSU">KSU</option>
                  </select>
                </div>
              </div>

              {kategori === "LAMA" && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <label className="block text-sm font-bold text-yellow-800 mb-1">Sudah menetap berapa bulan?</label>
                  <select value={bulanKe} onChange={(e) => setBulanKe(e.target.value)} className="w-full p-3 border border-yellow-300 rounded-xl outline-none bg-white">
                    <option value="1">1 Bulan (Baru menempati bulan lalu)</option>
                    <option value="2">2 Bulan (Bulan depan wajib rolling)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-blue-50">
                <button type="button" onClick={tutupInputModal} className="px-5 py-2.5 text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition">Batal</button>
                <button type="submit" disabled={loading} className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 ${genderSantri === 'BANAT' ? 'bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'}`}>
                  {loading ? "Menyimpan..." : "Simpan & Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENEMPATAN ANTREAN */}
      {isModalOpen && santriAntrean && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className={`p-5 ${santriAntrean.gender === 'BANAT' ? 'bg-gradient-to-r from-pink-600 to-pink-500' : 'bg-gradient-to-r from-blue-700 to-blue-600'}`}>
              <h2 className="text-xl font-bold text-white">Penempatan Kamar Baru</h2>
              <p className="text-white/80 text-sm mt-1">Untuk: <strong>{santriAntrean.nama}</strong> ({santriAntrean.gender})</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Pilih Sakan</label>
                <select value={modalSakanId} onChange={(e) => { setModalSakanId(e.target.value); setModalKamarId(""); setModalLemariId(""); }} className="w-full p-3 border border-blue-200 rounded-xl outline-none bg-white font-bold focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Pilih Sakan --</option>
                  {sakanDifilterModal.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Pilih Kamar</label>
                <select value={modalKamarId} onChange={(e) => { setModalKamarId(e.target.value); setModalLemariId(""); }} disabled={!modalSakanId} className="w-full p-3 border border-blue-200 rounded-xl outline-none bg-white disabled:bg-gray-50 focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Pilih Kamar --</option>
                  {modalDaftarKamar.map((k: any) => <option key={k.id} value={k.id}>Kamar {k.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Pilih Lemari</label>
                <select value={modalLemariId} onChange={(e) => setModalLemariId(e.target.value)} disabled={!modalKamarId} className="w-full p-3 border border-blue-200 rounded-xl outline-none bg-white disabled:bg-gray-50 focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Pilih Lemari --</option>
                  {modalLemariTersedia.map((l: any) => <option key={l.id} value={l.id}>Lemari {l.nomor}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-blue-50 bg-blue-50/30 flex justify-end gap-3">
              <button onClick={tutupModal} className="px-5 py-2.5 text-blue-600 font-bold hover:bg-blue-100 rounded-xl transition">Batal</button>
              <button onClick={eksekusiAssignModal} disabled={!modalLemariId} className={`px-6 py-2.5 text-white font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-sm ${santriAntrean.gender === 'BANAT' ? 'bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'}`}>
                Simpan Penempatan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}