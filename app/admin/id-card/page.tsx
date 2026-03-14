"use client";

import { useState, useEffect, useRef } from "react";
import { usePusher } from "../../providers/PusherProvider";
import { swalConfirm, swalSuccess, swalError, swalNotif } from "../../lib/swal";

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

export default function MejaIdCardPage() {
  const [dataGabungan, setDataGabungan] = useState<any[]>([]);
  const [sudahAmbilMurni, setSudahAmbilMurni] = useState<any[]>([]);
  const [dufahNama, setDufahNama] = useState("");
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // STATE NOTIFIKASI & TRACKING REAL-TIME
  const [notif, setNotif] = useState({ show: false, pesan: "", namaTarget: "" });
  const prevAntreanRef = useRef<number | null>(null);
  const pusher = usePusher();

  const putarSuara = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
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

        const sudahDenganNomor = data.sudah.map((item: any, index: number) => ({
          ...item, nomorUrut: index + 1
        }));

        setDataGabungan([...data.belum, ...sudahDenganNomor]);
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
      swalNotif("Penempatan Baru", payload.message);
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen relative overflow-hidden">

      {/* POP-UP NOTIFIKASI */}
      <div className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${notif.show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
        <div className="bg-white border-l-4 border-blue-500 shadow-2xl rounded-xl p-4 flex items-center gap-3 min-w-[300px]">
          <div className="bg-blue-100 p-2 rounded-full animate-bounce text-blue-700"><IconBell /></div>
          <div>
            <h4 className="font-bold text-blue-800 text-sm">Informasi Baru</h4>
            <p className="text-gray-600 text-xs font-medium">{notif.pesan}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 border-b border-blue-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900">Meja ID Card & Check-In</h1>
          <p className="text-blue-500 mt-1 font-medium">Verifikasi penyerahan ID Card secara Real-Time.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={copyLaporanHarian} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base">
            📋 Laporan Harian
          </button>
          <button onClick={copyLaporanGlobal} className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm md:text-base">
            📊 Laporan Global
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-sm font-bold text-blue-800 mb-2">Cari Nama Santri</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"><IconSearch /></span>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ketik nama yang datang..." className="w-full pl-10 p-3 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
          </div>
        </div>
        <div className="md:w-64">
          <label className="block text-sm font-bold text-blue-800 mb-2">Filter Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-3 border border-blue-200 rounded-xl outline-none font-bold text-blue-700 focus:ring-2 focus:ring-blue-400 bg-white">
            <option value="Semua">Tampilkan Semua</option>
            <option value="Belum">Menunggu / Belum Selesai</option>
            <option value="Selesai">Sudah Selesai</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200">
              <tr>
                <th className="p-4 text-blue-800 font-bold text-center w-16">No</th>
                <th className="p-4 text-blue-800 font-bold">Nama Santri</th>
                <th className="p-4 text-blue-800 font-bold">Lokasi Sakan / Kamar</th>
                <th className="p-4 text-blue-800 font-bold text-center">Status</th>
                <th className="p-4 text-blue-800 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && !notif.show && dataGabungan.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-blue-400 font-medium">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    Memuat antrean...
                  </div>
                </td></tr>
              ) : dataDitampilkan.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-blue-300 italic font-medium">Data santri tidak ditemukan.</td></tr>
              ) : (
                dataDitampilkan.map((item) => {
                  if (!item.isIdCardTaken) nomorBelum++;
                  return (
                    <tr key={item.id} className={`border-b border-blue-50 transition ${item.isIdCardTaken ? 'bg-green-50/30' : 'hover:bg-blue-50/30'}`}>
                      <td className="p-4 text-center">
                        {item.isIdCardTaken ? (
                          <span className="bg-green-600 text-white px-2.5 py-1 rounded-lg font-black text-sm shadow-sm inline-block min-w-[32px]">
                            {item.nomorUrut}
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg font-bold text-sm inline-block min-w-[32px]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-blue-900 text-lg">
                          {item.santri.nama}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded text-white ${item.santri.kategori === 'LAMA' ? 'bg-orange-500' : item.santri.kategori === 'KSU' ? 'bg-purple-600' : 'bg-blue-500'}`}>{item.santri.kategori}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-green-700">{item.lemari.kamar.sakan.nama}</p>
                        <p className="text-sm text-blue-500 font-medium">Kamar {item.lemari.kamar.nama} - Loker {item.lemari.nomor}</p>
                      </td>
                      <td className="p-4 text-center">
                        {item.isIdCardTaken ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold border border-green-300">
                            <IconCheck /> Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-bold border border-yellow-300">
                            <IconClock /> Menunggu
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {!item.isIdCardTaken ? (
                          <button onClick={() => submitIdCard(item.id, item.santri.nama)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition active:scale-95">Serahkan Kartu</button>
                        ) : <span className="text-blue-300 font-medium text-sm italic">Selesai</span>}
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
  );
}