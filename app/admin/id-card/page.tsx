"use client";

import { useState, useEffect, useRef } from "react";
import { usePusher } from "../../providers/PusherProvider";
import { swalConfirm, swalSuccess, swalError, swalNotif } from "../../lib/swal";
import { Protect, usePermissions } from "@/components/Protect";

// SVG Icon Components
const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconWhatsapp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default function MejaIdCardPage() {
  const [dataGabungan, setDataGabungan] = useState<any[]>([]);
  const [sudahAmbilMurni, setSudahAmbilMurni] = useState<any[]>([]);
  const [dufahNama, setDufahNama] = useState("");
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const { hasAccess } = usePermissions();
  const canManageIdCard = hasAccess("manage_idcard");

  // STATE NOTIFIKASI & TRACKING REAL-TIME
  const [notif, setNotif] = useState({ show: false, pesan: "", namaTarget: "" });
  const prevAntreanRef = useRef<number | null>(null);
  const pusher = usePusher();

  const putarSuara = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
      audio.play().catch(() => console.log("Browser memblokir autoplay suara"));
    } catch (e) { }
  };

  const tampilkanNotif = (pesan: string, namaTarget?: string) => {
    putarSuara();
    setNotif({ show: true, pesan, namaTarget: namaTarget || "" });
    setTimeout(() => setNotif({ show: false, pesan: "", namaTarget: "" }), 5000);
  };

  const muatData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/id-card");
      if (res.ok) {
        const data = await res.json();
        setDufahNama(data.dufahNama);
        setSudahAmbilMurni(data.sudah);

        if (prevAntreanRef.current !== null && data.belum.length > prevAntreanRef.current) {
          const selisih = data.belum.length - prevAntreanRef.current;
          tampilkanNotif(`Ada ${selisih} santri baru masuk ke antrean ID Card!`);
        }
        prevAntreanRef.current = data.belum.length;

        setDataGabungan([...data.belum, ...data.sudah]);
      }
    } catch (error) { console.error("Gagal memuat data ID Card", error); }
    if (!isBackground) setLoading(false);
  };

  useEffect(() => {
    muatData();
  }, []);

  // Pusher listeners
  useEffect(() => {
    if (!pusher) return;

    const onDataUpdate = () => muatData(true);
    const onAsramaNotif = (payload: any) => {
      tampilkanNotif(payload.message, payload.data?.nama);
    };

    const channel = pusher.subscribe("ppdb-channel");
    channel.bind("data:update", onDataUpdate);
    channel.bind("notif:asrama", onAsramaNotif);

    return () => {
      channel.unbind("data:update", onDataUpdate);
      channel.unbind("notif:asrama", onAsramaNotif);
      pusher.unsubscribe("ppdb-channel");
    };
  }, [pusher]);

  const submitIdCard = async (idRiwayat: string, namaSantri: string) => {
    const resConfirm = await swalConfirm(
      "Konfirmasi ID Card",
      `Tandai ID Card untuk ${namaSantri} sudah diserahkan?`
    );
    if (!resConfirm.isConfirmed) return;

    const res = await fetch("/api/id-card", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: idRiwayat }),
    });
    if (res.ok) {
      swalSuccess("ID Card Diserahkan", `Kartu untuk ${namaSantri} berhasil dicatat.`);
      muatData();
    } else {
      swalError("Gagal memproses ID Card");
    }
  };

  const sendWhatsAppCard = (item: any) => {
    // Formatting Phone Number to start with 62
    let phone = item.santri.noWaSantri || item.santri.noWaOrtu || "";
    if (phone) {
      phone = phone.replace(/\D/g, ""); // remove non digits
      if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    }

    const imageUrl = `${window.location.origin}/digital-card/${item.id}`;

    let pesan = `Assalamualaikum warahmatullahi wabarakatuh,

Berikut adalah *Kartu Santri Digital* antum.
Silakan klik link berikut untuk melihat dan mendownload kartu digital antum:
${imageUrl}

_Catatan: Harap tunjukkan gambar kartu digital ini pada saat verifikasi pengambilan barang di Mims Store._

Wassalamu'alaikum warahmatullahi wabarakatuh.`;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}` : `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  };

  const copyLaporanHarian = () => {
    const isToday = (dateString: string | Date | null) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const today = new Date();

      const df = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
      return df.format(date) === df.format(today);
    };

    const dataHariIni = sudahAmbilMurni.filter(s => isToday(s.waktuAmbilKartu));
    const totalBaru = dataHariIni.filter(s => s.santri?.kategori === 'BARU').length;
    const totalLama = dataHariIni.filter(s => s.santri?.kategori === 'LAMA').length;
    const totalKeseluruhan = totalBaru + totalLama;

    const todaysDate = new Date();
    const namaHari = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(todaysDate);
    // id-ID format is usually DD/MM/YYYY
    const tanggalFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(todaysDate);

    let text = `Assalamualaikum warahmatullahi wabarakatuh.

Afwan ustadz dan ustadzah 
@Ustadz Trilaks 
@Ust Miqdarul Khoir Syarofit  
@U. Rika Trikaks  
@~Aqmarina 

Kami dari team Id Card 
Izin melaporkan jumlah  santri yang cek in pada hari ini ${namaHari}, ${tanggalFormat}: 

1. Santri baru: *${totalBaru} Santri*
2. Santri lama: *${totalLama} Santri*
3. Jumlah keseluruhan: *${totalKeseluruhan} Santri*

Sekian laporan dari kami
Jazilasyukri 🙏

Wassalamu'alaikum warahmatullahi wabarakatuh`;
    navigator.clipboard.writeText(text);
    swalSuccess("Berhasil Disalin!", "Laporan Harian siap untuk di-paste ke WhatsApp.");
  };

  const copyLaporanGlobal = () => {
    const totalBaru = sudahAmbilMurni.filter(s => s.santri?.kategori === 'BARU').length;
    const totalLama = sudahAmbilMurni.filter(s => s.santri?.kategori === 'LAMA').length;
    const totalKeseluruhan = totalBaru + totalLama;

    const rincianPerHari: Record<string, number> = {};
    // Sort array by date first so that rincian text can be ordered if we want, but it's optional.
    sudahAmbilMurni.forEach(s => {
      if (!s.waktuAmbilKartu) return;
      const date = new Date(s.waktuAmbilKartu);
      const namaHari = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(date);
      const tanggalFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
      const dateStr = `${namaHari}, ${tanggalFormat}`;

      rincianPerHari[dateStr] = (rincianPerHari[dateStr] || 0) + 1;
    });

    const rincianText = Object.entries(rincianPerHari)
      .map(([tanggal, jumlah]) => `- ${tanggal} : ${jumlah} Santri`)
      .join('\n');

    let text = `Assalamualaikum warahmatullahi wabarakatuh.

Afwan ustadz dan ustadzah 
@Ustadz Trilaks 
@Ust Miqdarul Khoir Syarofit  
@U. Rika Trikaks  
@~Aqmarina 

Kami dari team Id Card 
Izin melaporkan rekap jumlah santri yang sudah cek in dari hari pertama sampai hari ketiga (Periode ${dufahNama}):

1. Santri baru: *${totalBaru} Santri*
2. Santri lama: *${totalLama} Santri*
3. Jumlah keseluruhan: *${totalKeseluruhan} Santri*

*Rincian Per Hari:*
${rincianText || '- Belum ada data'}

Sekian laporan dari kami
Jazilasyukri 🙏


Wassalamu'alaikum warahmatullahi wabarakatuh`;
    navigator.clipboard.writeText(text);
    swalSuccess("Berhasil Disalin!", "Laporan Global siap untuk di-paste ke WhatsApp.");
  };

  const dataDitampilkan = dataGabungan.filter(item => {
    const cocokNama = item.santri.nama.toLowerCase().includes(keyword.toLowerCase());
    const cocokStatus = filterStatus === "Semua" ? true : filterStatus === "Selesai" ? item.isIdCardTaken === true : item.isIdCardTaken === false;
    return cocokNama && cocokStatus;
  });

  // Counter for sequential numbering
  let nomorBelum = 0;

  return (
    <Protect permission="view_idcard" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin untuk melihat antrean ID Card.</div>}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen relative overflow-hidden">

        {/* POP-UP NOTIFIKASI */}
        <div className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${notif.show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
          <div className="bg-dark-800 border-l-4 border-gold-500 shadow-2xl rounded-xl p-4 flex items-center gap-3 min-w-[300px] border-y border-r border-gold-500/20">
            <div className="bg-dark-900 border border-gold-500/30 p-2 rounded-full animate-bounce text-gold-500"><IconBell /></div>
            <div>
              <h4 className="font-bold text-gold-400 text-sm">Informasi Baru</h4>
              <p className="text-gray-300 text-xs font-medium">{notif.pesan}</p>
            </div>
          </div>
        </div>

        <div className="mb-8 border-b border-gold-500/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Meja ID Card & Check-In</h1>
            <p className="text-gray-400 mt-1 font-medium">Verifikasi penyerahan ID Card secara Real-Time.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={copyLaporanHarian} className="bg-dark-800 border border-gold-500/50 hover:bg-gold-500/10 text-gold-500 font-bold py-2.5 px-5 rounded-xl shadow-[0_0_10px_rgba(212,175,55,0.1)] flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base">
              📋 Laporan Harian
            </button>
            <button onClick={copyLaporanGlobal} className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-2.5 px-5 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base">
              📊 Laporan Global
            </button>
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-gold-500/20 mb-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-300 mb-2">Cari Nama Santri</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><IconSearch /></span>
              <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ketik nama yang datang..." className="w-full pl-10 p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 placeholder:text-gray-600 shadow-inner" />
            </div>
          </div>
          <div className="md:w-64">
            <label className="block text-sm font-bold text-gray-300 mb-2">Filter Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-3 border border-dark-900 rounded-xl outline-none font-bold text-gold-500 shadow-inner focus:ring-1 focus:ring-gold-500/50 bg-dark-900">
              <option value="Semua">Tampilkan Semua</option>
              <option value="Belum">Menunggu / Belum Selesai</option>
              <option value="Selesai">Sudah Selesai</option>
            </select>
          </div>
        </div>

        <div className="bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead className="bg-dark-900 border-b border-gold-500/20">
                <tr>
                  <th className="p-4 text-gold-600 font-bold text-center w-32">NIS</th>
                  <th className="p-4 text-gold-600 font-bold">Nama Santri</th>
                  <th className="p-4 text-gold-600 font-bold">Lokasi Sakan / Kamar</th>
                  <th className="p-4 text-gold-600 font-bold text-center">Status</th>
                  <th className="p-4 text-gold-600 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && !notif.show && dataGabungan.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                      Memuat antrean...
                    </div>
                  </td></tr>
                ) : dataDitampilkan.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-500 italic font-medium">Data santri tidak ditemukan.</td></tr>
                ) : (
                  dataDitampilkan.map((item) => {
                    if (!item.isIdCardTaken) nomorBelum++;
                    return (
                      <tr key={item.id} className={`border-b border-gold-500/5 transition ${item.isIdCardTaken ? 'bg-green-900/10' : 'hover:bg-dark-900/50'}`}>
                        <td className="p-4 text-center">
                          <span className="bg-dark-900 text-gray-300 border border-gray-700 font-black text-sm px-2.5 py-1 rounded-lg">
                            {item.santri.nis || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-200 text-lg">
                            {item.santri.nama}
                          </p>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded text-white shadow-sm ${item.santri.kategori === 'LAMA' ? 'bg-orange-600' : item.santri.kategori === 'KSU' ? 'bg-purple-700' : 'bg-blue-600'}`}>{item.santri.kategori}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gold-400">{item.lemari.kamar.sakan.nama}</p>
                          <p className="text-sm text-gray-400 font-medium">Kamar {item.lemari.kamar.nama} - Loker {item.lemari.nomor}</p>
                        </td>
                        <td className="p-4 text-center">
                          {item.isIdCardTaken ? (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full text-sm font-bold border border-green-500/30">
                              <IconCheck /> Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full text-sm font-bold border border-yellow-500/30">
                              <IconClock /> Menunggu
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!item.isIdCardTaken ? (
                              canManageIdCard ? (
                                <button onClick={() => submitIdCard(item.id, item.santri.nama)} className="bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 border border-gold-500/30 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition active:scale-95">Serahkan Kartu</button>
                              ) : <span className="text-gray-500 font-medium text-sm italic">Menunggu diserahkan</span>
                            ) : <span className="text-gray-500 font-medium text-sm italic">Selesai</span>}

                            <button onClick={() => window.open(`/digital-card/${item.id}`, "_blank")} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 p-2.5 rounded-xl shadow-sm transition active:scale-95" title="Preview Kartu">
                              <IconEye />
                            </button>

                            <button onClick={() => sendWhatsAppCard(item)} className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 p-2.5 rounded-xl shadow-sm transition active:scale-95" title="Kirim Kartu WA">
                              <IconWhatsapp />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Protect>
  );
}