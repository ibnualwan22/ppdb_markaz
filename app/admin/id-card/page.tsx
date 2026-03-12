"use client";

import { useState, useEffect, useRef } from "react";

export default function MejaIdCardPage() {
  const [dataGabungan, setDataGabungan] = useState<any[]>([]);
  const [sudahAmbilMurni, setSudahAmbilMurni] = useState<any[]>([]); 
  const [dufahNama, setDufahNama] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // ==========================================
  // STATE NOTIFIKASI & TRACKING REAL-TIME
  // ==========================================
  const [notif, setNotif] = useState({ show: false, pesan: "" });
  const prevAntreanRef = useRef<number | null>(null);

  // Fungsi Memutar Suara "Ting!"
  const putarSuara = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => console.log("Browser memblokir autoplay suara"));
    } catch (e) {}
  };

  const tampilkanNotif = (pesan: string) => {
    putarSuara();
    setNotif({ show: true, pesan });
    setTimeout(() => setNotif({ show: false, pesan: "" }), 5000); // Hilang otomatis setelah 5 detik
  };

  const muatData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/id-card");
      if (res.ok) {
        const data = await res.json();
        setDufahNama(data.dufahNama);
        setSudahAmbilMurni(data.sudah);
        
        // Cek apakah ada santri baru di antrean (Hanya jika ini bukan muatan pertama)
        if (prevAntreanRef.current !== null && data.belum.length > prevAntreanRef.current) {
          const selisih = data.belum.length - prevAntreanRef.current;
          tampilkanNotif(`🛎️ Ada ${selisih} santri baru masuk ke antrean ID Card!`);
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
    // MESIN SMART POLLING (Setiap 3 Detik)
    const interval = setInterval(() => { muatData(true); }, 3000);
    return () => clearInterval(interval);
  }, []);

  const submitIdCard = async (idRiwayat: string, namaSantri: string) => {
    if (!confirm(`Tandai ID Card untuk ${namaSantri} sudah diserahkan?`)) return;
    const res = await fetch("/api/id-card", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: idRiwayat }),
    });
    if (res.ok) muatData(); else alert("Gagal memproses ID Card");
  };

  // [Fungsi copyLaporanIdCard dan return JSX tetap sama, saya sertakan penuh di bawah ini]
  const copyLaporanIdCard = () => {
    const totalBaru = sudahAmbilMurni.filter(s => s.santri.kategori === 'BARU').length;
    const totalLama = sudahAmbilMurni.filter(s => s.santri.kategori === 'LAMA').length;
    const totalKeseluruhan = totalBaru + totalLama;
    const opsiTanggal: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalHariIni = new Date().toLocaleDateString('id-ID', opsiTanggal);

    let text = `Assalamualaikum warahmatullahi wabarakatuh.\n\nAfwan ustadz dan ustadzah\n@274147863187646\n@250057441992951 @210393385435192\n@31344738459884\n\nKami dari team Id Card\nIzin melaporkan jumlah santri yang cek in dari hari pertama sampai hari ini, ${tanggalHariIni} (Periode ${dufahNama}):\n\n1. Santri baru: *${totalBaru} Santri*\n2. Santri lama: *${totalLama} Santri*\n3. Jumlah keseluruhan: *${totalKeseluruhan} Santri*\n\nSekian laporan dari kami\nJazilasyukri 🙏\n\nWassalamu'alaikum warahmatullahi wabarakatuh`;
    navigator.clipboard.writeText(text); alert("Laporan ID Card berhasil disalin!");
  };

  const dataDitampilkan = dataGabungan.filter(item => {
    const cocokNama = item.santri.nama.toLowerCase().includes(keyword.toLowerCase());
    const cocokStatus = filterStatus === "Semua" ? true : filterStatus === "Selesai" ? item.isIdCardTaken === true : item.isIdCardTaken === false;
    return cocokNama && cocokStatus;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen text-gray-900 relative overflow-hidden">
      
      {/* ========================================== */}
      {/* POP-UP NOTIFIKASI PROFESIONAL              */}
      {/* ========================================== */}
      <div className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${notif.show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
        <div className="bg-white border-l-4 border-blue-500 shadow-2xl rounded-lg p-4 flex items-center gap-3 min-w-[300px]">
          <div className="bg-blue-100 p-2 rounded-full text-xl animate-bounce">🔔</div>
          <div>
            <h4 className="font-bold text-gray-800 text-sm">Informasi Baru</h4>
            <p className="text-gray-600 text-xs font-medium">{notif.pesan}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 border-b border-gray-300 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meja ID Card & Check-In</h1>
          <p className="text-gray-500 mt-1">Verifikasi penyerahan ID Card secara Real-Time.</p>
        </div>
        <button onClick={copyLaporanIdCard} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-md flex items-center gap-2">
          <span className="text-xl">📋</span> Copy Laporan WA
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-700 mb-2">Cari Nama Santri</label>
          <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ketik nama yang datang..." className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="md:w-64">
          <label className="block text-sm font-bold text-gray-700 mb-2">Filter Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none font-bold text-gray-700">
            <option value="Semua">Tampilkan Semua</option>
            <option value="Belum">Menunggu / Belum Selesai</option>
            <option value="Selesai">Sudah Selesai</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-gray-700 font-bold">Nama Santri</th>
                <th className="p-4 text-gray-700 font-bold">Lokasi Sakan / Kamar</th>
                <th className="p-4 text-gray-700 font-bold text-center">Status</th>
                <th className="p-4 text-gray-700 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && !notif.show && dataGabungan.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500 font-medium">Memuat antrean...</td></tr>
              ) : dataDitampilkan.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic font-medium">Data santri tidak ditemukan.</td></tr>
              ) : (
                dataDitampilkan.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-100 transition ${item.isIdCardTaken ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}>
                    <td className="p-4">
                      <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {item.isIdCardTaken && <span className="text-sm bg-green-600 text-white px-2 py-0.5 rounded-md font-black shadow-sm">{item.nomorUrut}.</span>}
                        {item.santri.nama}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded text-white ${item.santri.kategori === 'LAMA' ? 'bg-orange-500' : 'bg-blue-500'}`}>{item.santri.kategori}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-green-700">{item.lemari.kamar.sakan.nama}</p>
                      <p className="text-sm text-gray-600 font-medium">Kamar {item.lemari.kamar.nama} - Loker {item.lemari.nomor}</p>
                    </td>
                    <td className="p-4 text-center">
                      {item.isIdCardTaken ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold border border-green-300">✅ Selesai</span> : <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-bold border border-yellow-300">⏳ Menunggu</span>}
                    </td>
                    <td className="p-4 text-center">
                      {!item.isIdCardTaken ? (
                        <button onClick={() => submitIdCard(item.id, item.santri.nama)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition active:scale-95">Serahkan Kartu</button>
                      ) : <span className="text-gray-400 font-medium text-sm italic">Selesai</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}