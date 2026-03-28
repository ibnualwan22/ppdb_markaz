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
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconStar = ({ className = "h-4 w-4", title }: { className?: string, title?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    {title && <title>{title}</title>}
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function MejaAsramaPage() {
  const [dataLokasi, setDataLokasi] = useState<any[]>([]);
  const [antrean, setAntrean] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterGender, setFilterGender] = useState("SEMUA");
  const [viewMode, setViewMode] = useState<"DENAH" | "TABEL">("TABEL");
  const [isAntreanOpen, setIsAntreanOpen] = useState(true);
  const { hasAccess } = usePermissions();
  const canAssignLemari = hasAccess("assign_lemari");

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

  // State Modal Tarik Santri Comeback
  const [isTarikModalOpen, setIsTarikModalOpen] = useState(false);
  const [tarikSearchKeyword, setTarikSearchKeyword] = useState("");
  const [tarikResults, setTarikResults] = useState<any[]>([]);
  const [isSearchingTarik, setIsSearchingTarik] = useState(false);

  const pusher = usePusher();

  // Notifikasi Real-time
  const [notif, setNotif] = useState({ show: false, pesan: "", namaTarget: "" });
  const prevSudahRef = useRef<number | null>(null);

  const putarSuara = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
      audio.play().catch(() => { });
    } catch (e) { }
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
    } catch (error) { }
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

    // Simpan posisi scroll
    const scrollContainer = document.querySelector('main');
    const scrollTop = scrollContainer?.scrollTop || 0;

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
      await muatData();

      // Kembalikan posisi scroll (delay sedikit agar DOM selesai render ulang)
      setTimeout(() => {
        if (scrollContainer) scrollContainer.scrollTop = scrollTop;
      }, 50);
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

    // Simpan posisi scroll
    const scrollContainer = document.querySelector('main');
    const scrollTop = scrollContainer?.scrollTop || 0;

    const res = await fetch(`/api/asrama/assign/${santriAntrean.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lemariId: modalLemariId }),
    });
    const data = await res.json();
    if (res.ok) {
      swalSuccess("Berhasil!", data.message);
      tutupModal();
      await muatData();

      // Kembalikan posisi scroll (delay sedikit agar DOM selesai render ulang)
      setTimeout(() => {
        if (scrollContainer) scrollContainer.scrollTop = scrollTop;
      }, 50);
    } else {
      swalError("Gagal", data.error);
    }
  };

  // Handler Tarik Santri Comeback
  const cariSantriNonAktif = async (keyword: string) => {
    setTarikSearchKeyword(keyword);
    if (keyword.length < 3) {
      setTarikResults([]);
      return;
    }
    setIsSearchingTarik(true);
    try {
      const res = await fetch(`/api/asrama/santri-nonaktif?nama=${encodeURIComponent(keyword)}`);
      if (res.ok) setTarikResults(await res.json());
    } catch (e) { }
    setIsSearchingTarik(false);
  };

  const eksekusiTarikSantri = async (santriId: string, nama: string) => {
    const confirm = window.confirm(`Yakin ingin menarik kembali santri ${nama}? Santri akan diaktifkan dan langsung masuk antrean asrama.`);
    if (!confirm) return;

    setLoading(true);
    try {
      const res = await fetch("/api/asrama/tarik-santri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santriId }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        swalSuccess("Berhasil!", data.message);
        setIsTarikModalOpen(false);
        setTarikSearchKeyword("");
        setTarikResults([]);
        await muatData();
      } else {
        swalError("Gagal", data.error);
      }
    } catch (e) {
      setLoading(false);
      swalError("Error Server", "Terjadi kesalahan pada server");
    }
  };

  // Fungsi helper untuk mengecek apakah sebuah Sakan memiliki lemari prioritas
  const hasPriorityLemari = (sakan: any) => {
    return sakan.kamar.some((kamar: any) =>
      kamar.lemari.some((lemari: any) => lemari.isPriority && !lemari.isLocked && (!lemari.penghuni || lemari.penghuni.length === 0))
    );
  };

  // Filter dan Sorting Sakan: 
  // 1. Sakan dengan lemari prioritas kosong ditaruh di atas
  // 2. Sisanya diurutkan sesuai abjad nama Sakan
  const sortSakan = (a: any, b: any) => {
    const aPriority = hasPriorityLemari(a);
    const bPriority = hasPriorityLemari(b);

    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    return a.nama.localeCompare(b.nama);
  };

  const sakanBanin = dataLokasi
    .filter(s => s.kategori !== "BANAT" && !s.isLocked && (filterGender === "SEMUA" || filterGender === "BANIN"))
    .sort(sortSakan);

  const sakanBanat = dataLokasi
    .filter(s => s.kategori === "BANAT" && !s.isLocked && (filterGender === "SEMUA" || filterGender === "BANAT"))
    .sort(sortSakan);

  const RenderDenahBlock = ({ data, judul, warnaTema }: { data: any[], judul: string, warnaTema: 'biru' | 'pink' }) => {
    const isBiru = warnaTema === 'biru';
    const bgHeader = 'bg-dark-800 border-b border-gold-500/10';
    const textWarna = 'text-gold-500';
    const bgLemariTerisi = 'bg-dark-800 border-gold-500/30';

    return (
      <div className="mb-10">
        <h2 className={`text-xl font-black mb-4 ${textWarna} flex items-center gap-2`}>
          {isBiru ? <IconMale /> : <IconFemale />} {judul}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
              <div key={sakan.id} className="bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 overflow-hidden hover:border-gold-500/40 transition-all">
                <div className={`${bgHeader} p-4 text-gray-200`}>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-black text-gold-500">{sakan.nama}</h3>
                      <p className="text-sm opacity-80">{sakan.kamar.length} Kamar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gold-500">{persen}%</p>
                      <p className="text-xs opacity-80">Terisi: {terisi}/{totalLemari}</p>
                    </div>
                  </div>
                  <div className="w-full bg-dark-900/50 rounded-full h-2 mt-3 border border-gold-500/10">
                    <div className="bg-gold-500 h-2 rounded-full transition-all duration-700" style={{ width: `${persen}%` }}></div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Show ALL kamar, including locked ones */}
                  {sakan.kamar.map((kamar: any) => {
                    const isKamarLocked = kamar.isLocked;

                    // LOCKED ROOM DISPLAY
                    if (isKamarLocked) {
                      return (
                        <div key={kamar.id} className="p-3 rounded-xl border border-gray-800 bg-dark-900">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-gray-600 flex items-center gap-2 line-through">
                              <IconLock className="h-4 w-4 text-gray-600" /> Kamar {kamar.nama}
                            </h4>
                            <span className="text-xs font-bold text-gray-600 bg-black/50 px-2.5 py-1 rounded-lg border border-gray-800 flex items-center gap-1">
                              <IconLock className="h-3 w-3" /> Dikunci
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const kosong = kamar.lemari.filter((l: any) => !l.isLocked && (!l.penghuni || l.penghuni.length === 0)).length;
                    const totalK = kamar.lemari.filter((l: any) => !l.isLocked).length;

                    return (
                      <div key={kamar.id} className="p-3 rounded-xl border border-gold-500/10 bg-dark-900/50">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gold-500/10">
                          <h4 className="font-bold text-gold-400 flex items-center gap-2">
                            Kamar {kamar.nama}
                          </h4>
                          <span className="text-xs font-bold text-gold-500 bg-dark-800 px-2 py-0.5 rounded-lg border border-gold-500/20">
                            Kosong: {kosong}/{totalK}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {kamar.lemari.filter((l: any) => !l.isLocked).sort((a: any, b: any) => (b.isPriority === true ? 1 : 0) - (a.isPriority === true ? 1 : 0)).map((lemari: any) => {
                            const isTerisi = lemari.penghuni && lemari.penghuni.length > 0;
                            const dataSantriLemari = isTerisi ? lemari.penghuni[0].santri : null;

                            if (isTerisi) {
                              return (
                                <div key={lemari.id} className={`p-2 rounded-lg border ${bgLemariTerisi} min-h-[65px] flex flex-col justify-between`}>
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-black text-gray-500 bg-white px-1.5 py-0.5 rounded shadow-sm">{lemari.nomor}</span>
                                      {lemari.isPriority && <IconStar className="h-3 w-3 text-orange-500 animate-pulse" title="Prioritas" />}
                                    </div>
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
                                onClick={() => canAssignLemari ? bukaInputModal(sakan, kamar, lemari) : null}
                                className={`p-2 rounded-lg border border-dashed min-h-[65px] flex flex-col justify-between transition-all group ${canAssignLemari ? 'hover:border-gold-500/50 hover:shadow-md cursor-pointer' : 'cursor-default'} ${lemari.isPriority ? 'bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/30 ' + (canAssignLemari ? 'hover:bg-orange-500/20' : '') : 'border-gray-800 bg-dark-900/30 ' + (canAssignLemari ? 'hover:bg-gold-500/5' : '')}`}
                              >
                                <div className="flex items-center gap-1 self-start">
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border ${lemari.isPriority ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 'text-gray-400 bg-dark-900 border-gray-800'}`}>{lemari.nomor}</span>
                                  {lemari.isPriority && <IconStar className="h-3 w-3 text-orange-500 animate-pulse" title="Prioritas Pengisian" />}
                                </div>
                                <div className="text-center w-full">
                                  <p className={`text-xs italic font-medium ${canAssignLemari ? 'group-hover:hidden' : ''} ${lemari.isPriority ? 'text-orange-500/80' : 'text-gray-600'}`}>{lemari.isPriority ? "Prioritas" : "Kosong"}</p>
                                  {canAssignLemari && <p className="text-xs text-gold-500 font-bold hidden group-hover:flex items-center justify-center gap-1"><IconPlus /> Isi Santri</p>}
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

  const RenderTableBlock = ({ data, judul, warnaTema }: { data: any[], judul: string, warnaTema: 'biru' | 'pink' }) => {
    const isBiru = warnaTema === 'biru';
    return (
      <div className="mb-14 w-full">
        <h2 className={`text-xl font-black mb-6 ${isBiru ? 'text-blue-500' : 'text-pink-500'} flex items-center gap-2`}>
          {isBiru ? <IconMale /> : <IconFemale />} {judul}
        </h2>

        <div className="space-y-12">
          {data.map((sakan) => {
            // Cek apakah sakan ini punya kamar & lemari valid untuk dirender
            const hasKamar = sakan.kamar.some((k: any) => !k.isLocked && k.lemari.some((l: any) => !l.isLocked));
            if (!hasKamar) return null;

            return (
              <div key={sakan.id} className="space-y-6">
                {/* SAKAN SEPARATOR */}
                <div className="border-b-2 border-gold-500/30 pb-2 mb-6">
                  <h3 className="text-xl font-black text-gold-500 tracking-wider">SAKAN {sakan.nama}</h3>
                </div>

                {sakan.kamar.filter((k: any) => !k.isLocked).map((kamar: any) => {
                  const lemariList = kamar.lemari.filter((l: any) => !l.isLocked).sort((a: any, b: any) => Number(a.nomor) - Number(b.nomor));
                  if (lemariList.length === 0) return null;

                  return (
                    <div key={kamar.id} className="bg-dark-900 rounded border border-gold-500/20 shadow-sm overflow-hidden text-gray-200 font-sans max-w-4xl mx-auto">
                      <div className="bg-dark-800 text-gold-500 text-center font-black py-2.5 border-b border-gold-500/20 tracking-wider uppercase text-[13px]">
                        KAMAR {kamar.nama}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] text-left border-collapse">
                          <thead className="bg-gold-500/10 text-gold-500 uppercase font-black">
                            <tr>
                              <th className="px-3 py-2 border border-gold-500/10 text-center w-10">NO</th>
                              <th className="px-3 py-2 border border-gold-500/10 text-center w-24 leading-tight">NO.<br />LEMARI</th>
                              <th className="px-4 py-2 border border-gold-500/10">NAMA LENGKAP</th>
                              <th className="px-3 py-2 border border-gold-500/10 text-center w-24">BULAN</th>
                              <th className="px-3 py-2 border border-gold-500/10 text-center w-28 leading-tight">NO.<br />ID CARD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lemariList.map((lemari: any, idx: number) => {
                              const isTerisi = lemari.penghuni && lemari.penghuni.length > 0;
                              const santri = isTerisi ? lemari.penghuni[0].santri : null;
                              const riwayat = isTerisi ? lemari.penghuni[0] : null;

                              if (isTerisi) {
                                return (
                                  <tr key={lemari.id} className="hover:bg-dark-800/50">
                                    <td className="px-3 py-2 border border-gold-500/10 text-center font-medium text-gray-500">{idx + 1}</td>
                                    <td className="px-3 py-2 border border-gold-500/10 text-center font-black text-gold-500/80 bg-gold-500/5">{lemari.nomor}</td>
                                    <td className="px-4 py-2 border border-gold-500/10 font-semibold text-gray-200">{santri.nama}</td>
                                    <td className="px-3 py-2 border border-gold-500/10 text-center font-bold text-gray-400">{riwayat.bulanKe}</td>
                                    <td className="px-3 py-2 border border-gold-500/10 text-center font-bold text-gray-300 bg-dark-800/50">{riwayat.nomorIdCard ? String(riwayat.nomorIdCard).padStart(3, '0') : '-'}</td>
                                  </tr>
                                );
                              }

                              return (
                                <tr
                                  key={lemari.id}
                                  onClick={() => canAssignLemari ? bukaInputModal(sakan, kamar, lemari) : null}
                                  className={`cursor-pointer hover:bg-gold-500/5 transition-colors group ${canAssignLemari ? '' : 'opacity-50 cursor-default'}`}
                                >
                                  <td className="px-3 py-2 border border-gold-500/10 text-center text-gray-600 font-medium">{idx + 1}</td>
                                  <td className="px-3 py-2 border border-gold-500/10 text-center font-bold text-gray-500 bg-dark-900/50">{lemari.nomor}</td>
                                  <td className="px-4 py-2 border border-gold-500/10 text-gray-500 italic font-medium w-full">
                                    <span className="group-hover:hidden opacity-60">(Kosong)</span>
                                    {canAssignLemari && <span className="hidden group-hover:flex text-gold-500 items-center justify-start gap-1.5 ml-2 font-bold"><IconPlus /> Klik di sini untuk isi santri baru</span>}
                                  </td>
                                  <td className="px-3 py-2 border border-gold-500/10 text-center"></td>
                                  <td className="px-3 py-2 border border-gold-500/10 text-center"></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          })}
        </div>
      </div>
    );
  };


  return (
    <Protect permission="view_asrama" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin untuk melihat meja asrama.</div>}>
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen relative pb-24">
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

        <div className="mb-8 border-b border-gold-500/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Meja Asrama & Penempatan</h1>
            <p className="text-gray-400 mt-1 font-medium">Klik lemari kosong untuk menempatkan santri baru.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex bg-dark-800 p-1 rounded-xl border border-gold-500/20 shadow-inner">
              <button
                onClick={() => setViewMode('DENAH')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'DENAH' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <div className="w-4 h-4 rounded-sm border-2 border-current bg-transparent opacity-80 grid grid-cols-2 gap-[1px] p-[1px]"><div className="bg-current" /><div className="bg-current" /><div className="bg-current" /><div className="bg-current" /></div> Denah
              </button>
              <button
                onClick={() => setViewMode('TABEL')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'TABEL' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> Tabel Ringan
              </button>
            </div>
            <div className="flex bg-dark-800 p-1 rounded-xl border border-gold-500/20 shadow-inner">
              <button onClick={() => setFilterGender('SEMUA')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterGender === 'SEMUA' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>Semua Gender</button>
              <button onClick={() => setFilterGender('BANIN')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all ${filterGender === 'BANIN' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}><IconMale /> Banin</button>
              <button onClick={() => setFilterGender('BANAT')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all ${filterGender === 'BANAT' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}><IconFemale /> Banat</button>
            </div>
          </div>
        </div>

        <div className="w-full">
          {viewMode === 'DENAH' ? (
            <>
              {sakanBanin.length > 0 && <RenderDenahBlock data={sakanBanin} judul="Area Banin (Putra)" warnaTema="biru" />}
              {sakanBanat.length > 0 && <RenderDenahBlock data={sakanBanat} judul="Area Banat (Putri)" warnaTema="pink" />}
            </>
          ) : (
            <div className="bg-dark-800 p-6 md:p-8 rounded-2xl shadow-inner border border-gold-500/10">
              {sakanBanin.length > 0 && <RenderTableBlock data={sakanBanin} judul="Daftar Absen Banin" warnaTema="biru" />}
              {sakanBanat.length > 0 && <RenderTableBlock data={sakanBanat} judul="Daftar Absen Banat" warnaTema="pink" />}
            </div>
          )}
          {sakanBanin.length === 0 && sakanBanat.length === 0 && (
            <div className="text-center py-20 text-blue-300 font-medium z-10 relative">Belum ada data Sakan.</div>
          )}
        </div>

        {/* WIDGET MENGAMBANG: ANTREAN ROLLING */}
        <div className={`fixed bottom-0 right-0 sm:right-6 z-40 transition-all duration-300 ${isAntreanOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3.5rem)]'}`}>
          <div className="bg-dark-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-gold-500/30 sm:rounded-tl-2xl sm:rounded-tr-2xl flex flex-col w-screen sm:w-[360px] h-[55vh] max-h-[450px]">
            <div
              className="flex justify-between items-center p-4 border-b border-gold-500/20 bg-dark-900 cursor-pointer hover:bg-dark-800 transition-colors sm:rounded-t-2xl group"
              onClick={() => setIsAntreanOpen(!isAntreanOpen)}
            >
              <h2 className="text-sm font-black text-gold-500 flex items-center gap-2 uppercase tracking-widest">
                <IconClipboard /> Antrean Rolling
                {antrean.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm ml-1">{antrean.length}</span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                {canAssignLemari && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsTarikModalOpen(true); }}
                    className="bg-gold-500 text-black px-2 py-1 rounded text-[10px] font-black hover:bg-gold-400 transition-colors shadow-sm"
                  >
                    ➕ TARIK SANTRI
                  </button>
                )}
                <button className="text-gray-400 group-hover:text-white transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform duration-300 ${isAntreanOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-dark-800">
              {antrean.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <IconInbox /><p className="font-medium mt-2 text-sm">Sedang kosong.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {antrean.map((item) => (
                    <li key={item.id} className="p-3 border border-gold-500/10 rounded-xl flex justify-between items-center bg-dark-900/80 border-l-4 border-l-gold-500 hover:border-gold-500/40 transition-all shadow-sm">
                      <div className="overflow-hidden mr-3">
                        <p className="font-bold text-gray-200 text-sm flex items-center gap-1.5 truncate">
                          <span className="truncate">{item.santri.nama}</span> {item.santri.gender === 'BANAT' ? <IconFemale /> : <IconMale />}
                        </p>
                        <div className="flex flex-col gap-1 items-start mt-1.5">
                          <span className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded shadow-sm tracking-widest">Wajib Rolling</span>
                          {item.keteranganSakanLama && (
                            <span className="text-[10px] font-medium text-gray-400 italic flex items-center gap-1 truncate max-w-[180px]" title={item.keteranganSakanLama}>
                              <IconLock className="h-2.5 w-2.5 opacity-60 flex-shrink-0" /> {item.keteranganSakanLama}
                            </span>
                          )}
                        </div>
                      </div>
                      {canAssignLemari && (
                        <button onClick={(e) => { e.stopPropagation(); bukaModalAntrean(item.id, item.santri.nama, item.santri.gender); }} className="bg-gold-500 text-black hover:bg-gold-400 px-3 py-1.5 rounded-lg text-xs font-black shadow-md transition-all active:scale-95 shrink-0">
                          Pilih
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* MODAL INPUT SANTRI BARU (Dari klik denah) */}
        {isInputModalOpen && selectedLemari && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gold-500/20" style={{ animation: 'scaleIn 0.2s ease-out' }}>
              <div className={`p-5 bg-dark-900 border-b border-gold-500/10`}>
                <h2 className="text-xl font-bold text-gold-500">Input Santri ke Kamar</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedSakan?.nama} → Kamar {selectedKamar?.nama} → Lemari {selectedLemari?.nomor}
                </p>
              </div>

              <form onSubmit={simpanSantriDariDenah} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Nama Lengkap</label>
                  <input type="text" value={namaSantri} onChange={(e) => setNamaSantri(e.target.value)} placeholder="Cth: Ahmad / Siti" className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 bg-dark-900 text-gray-200 placeholder:text-gray-600 shadow-inner" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Gender</label>
                    <select value={genderSantri} onChange={(e) => setGenderSantri(e.target.value)} className="w-full p-3 border border-dark-900 rounded-xl outline-none bg-dark-900 font-bold text-gold-500 shadow-inner" disabled>
                      <option value="BANIN">Putra (BANIN)</option>
                      <option value="BANAT">Putri (BANAT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Kategori Santri</label>
                    <select
                      value={kategori}
                      onChange={(e) => {
                        const val = e.target.value;
                        setKategori(val);
                        if (val === "LAMA" && bulanKe === "1") setBulanKe("2");
                        if (val !== "LAMA") setBulanKe("1");
                      }}
                      className="w-full p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 shadow-inner"
                    >
                      <option value="BARU">BARU</option>
                      <option value="LAMA">LAMA</option>
                      <option value="KSU">KSU</option>
                    </select>
                  </div>
                </div>

                {kategori === "LAMA" && (
                  <div className="bg-yellow-900/10 p-4 rounded-xl border border-yellow-500/20">
                    <label className="block text-sm font-bold text-yellow-500 mb-1">Sudah menetap berapa bulan?</label>
                    <select value={bulanKe} onChange={(e) => setBulanKe(e.target.value)} className="w-full p-3 border border-dark-900 rounded-xl outline-none bg-dark-900 text-gray-200 focus:ring-1 focus:ring-gold-500/50">
                      <option value="2">Bulan ke-2 (Baru menempati bulan lalu)</option>
                      <option value="3">Bulan ke-3 (Bulan depan wajib rolling)</option>
                      <option value="4">Bulan ke-4 (testing)</option>
                      <option value="5">Bulan ke-5 (testing)</option>
                      <option value="6">Bulan ke-6 (testing)</option>
                      <option value="7">Bulan ke-7 (testing)</option>
                      <option value="8">Bulan ke-8 (testing)</option>
                      <option value="9">Bulan ke-9 (testing)</option>
                      <option value="10">Bulan ke-10 (testing)</option>
                      <option value="11">Bulan ke-11 (testing)</option>
                      <option value="12">Bulan ke-12 (testing)</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
                  <button type="button" onClick={tutupInputModal} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-dark-900 rounded-xl transition">Batal</button>
                  <button type="submit" disabled={loading} className={`px-6 py-2.5 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all active:scale-95 disabled:opacity-50 bg-gold-500 hover:bg-gold-400`}>
                    {loading ? "Menyimpan..." : "Simpan & Assign"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PENEMPATAN ANTREAN */}
        {isModalOpen && santriAntrean && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gold-500/20" style={{ animation: 'scaleIn 0.2s ease-out' }}>
              <div className="p-5 bg-dark-900 border-b border-gold-500/10">
                <h2 className="text-xl font-bold text-gold-500">Penempatan Kamar Baru</h2>
                <p className="text-gray-400 text-sm mt-1">Untuk: <strong className="text-gray-200">{santriAntrean.nama}</strong> ({santriAntrean.gender})</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Pilih Sakan</label>
                  <select value={modalSakanId} onChange={(e) => { setModalSakanId(e.target.value); setModalKamarId(""); setModalLemariId(""); }} className="w-full p-3 border border-dark-900 rounded-xl outline-none bg-dark-900 text-gray-200 font-bold focus:ring-1 focus:ring-gold-500/50 shadow-inner">
                    <option value="">-- Pilih Sakan --</option>
                    {sakanDifilterModal.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Pilih Kamar</label>
                  <select value={modalKamarId} onChange={(e) => { setModalKamarId(e.target.value); setModalLemariId(""); }} disabled={!modalSakanId} className="w-full p-3 border border-dark-900 rounded-xl outline-none bg-dark-900 text-gray-200 disabled:bg-dark-900/50 focus:ring-1 focus:ring-gold-500/50 shadow-inner">
                    <option value="">-- Pilih Kamar --</option>
                    {modalDaftarKamar.map((k: any) => <option key={k.id} value={k.id}>Kamar {k.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Pilih Lemari</label>
                  <select value={modalLemariId} onChange={(e) => setModalLemariId(e.target.value)} disabled={!modalKamarId} className="w-full p-3 border border-dark-900 rounded-xl outline-none bg-dark-900 text-gray-200 disabled:bg-dark-900/50 focus:ring-1 focus:ring-gold-500/50 shadow-inner">
                    <option value="">-- Pilih Lemari --</option>
                    {modalLemariTersedia.map((l: any) => <option key={l.id} value={l.id}>Lemari {l.nomor}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-5 border-t border-gold-500/10 bg-dark-900/50 flex justify-end gap-3">
                <button onClick={tutupModal} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-dark-900 rounded-xl transition">Batal</button>
                <button onClick={eksekusiAssignModal} disabled={!modalLemariId} className={`px-6 py-2.5 text-black font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.3)] bg-gold-500 hover:bg-gold-400`}>
                  Simpan Penempatan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TARIK SANTRI KEMBALI */}
        {isTarikModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gold-500/20" style={{ animation: 'scaleIn 0.2s ease-out' }}>
              <div className="p-5 bg-dark-900 border-b border-gold-500/10 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gold-500 flex items-center gap-2">
                    Tarik Santri Comeback
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Cari santri non-aktif untuk dimasukkan langsung ke antrean.</p>
                </div>
                <button onClick={() => { setIsTarikModalOpen(false); setTarikSearchKeyword(""); setTarikResults([]); }} className="text-gray-400 hover:text-white transition-colors bg-dark-800 hover:bg-dark-700 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Ketik minimal 3 huruf nama santri (contoh: ahmad)..."
                    value={tarikSearchKeyword}
                    onChange={(e) => cariSantriNonAktif(e.target.value)}
                    className="w-full p-4 border border-dark-900 rounded-xl outline-none bg-dark-900 text-gray-200 focus:ring-1 focus:ring-gold-500/50 shadow-inner text-sm"
                    autoFocus
                  />
                  {isSearchingTarik && <p className="text-xs text-gold-500 mt-2 ml-1 animate-pulse">Mencari data di database...</p>}
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-2 mt-4 pr-1">
                  {tarikResults.length === 0 && tarikSearchKeyword.length >= 3 && !isSearchingTarik ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-50">
                      <IconInbox />
                      <p className="text-center text-sm text-gray-400 mt-3 font-medium">Santri non-aktif dengan nama tersebut tidak ditemukan.</p>
                    </div>
                  ) : (
                    tarikResults.map((s) => {
                      const lastRiwayat = s.riwayat && s.riwayat.length > 0 ? s.riwayat[0] : null;
                      const letakInfo = lastRiwayat?.lemari
                        ? `${lastRiwayat.lemari.kamar.sakan.nama} (Kmr.${lastRiwayat.lemari.kamar.nama}-Lmri.${lastRiwayat.lemari.nomor})`
                        : 'Belum menetap';

                      return (
                        <div key={s.id} className="p-4 bg-dark-900/50 border border-gold-500/10 rounded-xl flex justify-between items-center hover:border-gold-500/40 transition-colors shadow-sm gap-4">
                          <div className="overflow-hidden">
                            <p className="font-bold text-gray-200 text-sm flex items-center gap-2 truncate">
                              {s.nama} {s.gender === "BANAT" ? <IconFemale /> : <IconMale />}
                            </p>
                            <p className="text-[11px] text-red-400 font-medium mt-1">Status: Non-Aktif • Kategori Terakhir: {s.kategori}</p>
                            {lastRiwayat && (
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 truncate" title={letakInfo}>
                                <IconLock className="h-2 w-2 opacity-50 flex-shrink-0" /> Terakhir: {lastRiwayat.dufah?.nama} • {letakInfo}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => eksekusiTarikSantri(s.id, s.nama)}
                            disabled={loading}
                            className="px-4 py-2 bg-gold-500 text-black text-xs font-black rounded-lg shadow-sm hover:bg-gold-400 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all whitespace-nowrap"
                          >
                            Tarik ke Antrean
                          </button>
                        </div>
                      );
                    })
                  )}
                  {tarikResults.length === 0 && tarikSearchKeyword.length < 3 && !isSearchingTarik && (
                    <p className="text-center text-xs text-gray-500 opacity-60 italic mt-6">Ketik nama untuk mulai mencari. Hanya menampilkan santri non-aktif (boyong/pulang).</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Protect>
  );
}