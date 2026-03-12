"use client";

import { useState, useEffect, useRef } from "react";

export default function MejaAsramaPage() {
  const [dataLokasi, setDataLokasi] = useState<any[]>([]);
  const [antrean, setAntrean] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Form Input
  const [namaSantri, setNamaSantri] = useState("");
  const [kategori, setKategori] = useState("BARU"); 
  const [genderSantri, setGenderSantri] = useState("BANIN");
  const [bulanKe, setBulanKe] = useState("1"); 
  const [sakanId, setSakanId] = useState("");
  const [kamarId, setKamarId] = useState("");
  const [lemariId, setLemariId] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [santriAntrean, setSantriAntrean] = useState<any>(null);
  const [modalSakanId, setModalSakanId] = useState("");
  const [modalKamarId, setModalKamarId] = useState("");
  const [modalLemariId, setModalLemariId] = useState("");

  // ==========================================
  // STATE NOTIFIKASI REAL-TIME
  // ==========================================
  const [notif, setNotif] = useState({ show: false, pesan: "" });
  const prevSudahRef = useRef<number | null>(null);

  const putarSuara = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const tampilkanNotif = (pesan: string) => {
    putarSuara();
    setNotif({ show: true, pesan });
    setTimeout(() => setNotif({ show: false, pesan: "" }), 6000);
  };

  const muatData = async (isBackground = false) => {
    try {
      const resLokasi = await fetch("/api/sakan");
      const resAntrean = await fetch("/api/asrama/antrean");
      if (resLokasi.ok) setDataLokasi(await resLokasi.json());
      if (resAntrean.ok) setAntrean(await resAntrean.json());

      // CEK STATUS MEJA ID CARD SECARA DIAM-DIAM
      const resIdCard = await fetch("/api/id-card");
      if (resIdCard.ok) {
        const dataIdCard = await resIdCard.json();
        const totalSudah = dataIdCard.sudah.length;

        if (prevSudahRef.current !== null && totalSudah > prevSudahRef.current) {
          // Ada yang baru saja disubmit ID Card-nya! Ambil data anak terakhir.
          const anakTerakhir = dataIdCard.sudah[totalSudah - 1]; 
          tampilkanNotif(`✅ ${anakTerakhir.santri.nama} telah menerima ID Card (No. ${totalSudah})`);
        }
        prevSudahRef.current = totalSudah;
      }
    } catch (error) {}
  };

  useEffect(() => {
    muatData();
    // MESIN SMART POLLING (Setiap 3 Detik)
    const interval = setInterval(() => { muatData(true); }, 3000);
    return () => clearInterval(interval);
  }, []);

  // [Sisa fungsi form tetap sama...]
  const sakanDifilterKiri = dataLokasi.filter(s => s.kategori === genderSantri && !s.isLocked);
  const sakanTerpilih = sakanDifilterKiri.find((s) => s.id === sakanId);
  const daftarKamar = sakanTerpilih ? sakanTerpilih.kamar.filter((k: any) => !k.isLocked) : [];
  const kamarTerpilih = daftarKamar.find((k: any) => k.id === kamarId);
  const daftarLemariTersedia = kamarTerpilih ? kamarTerpilih.lemari.filter((l: any) => !l.isLocked && (!l.penghuni || l.penghuni.length === 0)) : [];

  const sakanDifilterModal = dataLokasi.filter(s => s.kategori === santriAntrean?.gender && !s.isLocked);
  const modalSakan = sakanDifilterModal.find((s) => s.id === modalSakanId);
  const modalDaftarKamar = modalSakan ? modalSakan.kamar.filter((k: any) => !k.isLocked) : [];
  const modalKamar = modalDaftarKamar.find((k: any) => k.id === modalKamarId);
  const modalLemariTersedia = modalKamar ? modalKamar.lemari.filter((l: any) => !l.isLocked && (!l.penghuni || l.penghuni.length === 0)) : [];

  const simpanSantriManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSantri || !lemariId || !kategori) return alert("Data wajib diisi!");
    setLoading(true);
    const res = await fetch("/api/asrama/santri-baru", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaSantri, kategori, lemariId, bulanKe, gender: genderSantri }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      alert(data.message);
      setNamaSantri(""); setSakanId(""); setKamarId(""); setLemariId(""); setBulanKe("1");
      muatData(); 
    } else { alert(`Gagal: ${data.error}`); }
  };

  const bukaModalAntrean = (id: string, nama: string, gender: string) => {
    setSantriAntrean({ id, nama, gender }); setIsModalOpen(true);
  };
  const tutupModal = () => {
    setIsModalOpen(false); setSantriAntrean(null); setModalSakanId(""); setModalKamarId(""); setModalLemariId("");
  };
  const eksekusiAssignModal = async () => {
    if (!modalLemariId || !santriAntrean) return alert("Pilih lemari!");
    const res = await fetch(`/api/asrama/assign/${santriAntrean.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lemariId: modalLemariId }),
    });
    if (res.ok) { alert("Berhasil!"); tutupModal(); muatData(); } else { alert(`Gagal`); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900 relative overflow-hidden">
      
      {/* POP-UP NOTIFIKASI MEJA ASRAMA (WARNA HIJAU) */}
      <div className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${notif.show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
        <div className="bg-white border-l-4 border-green-500 shadow-2xl rounded-lg p-4 flex items-center gap-3 min-w-[300px]">
          <div className="bg-green-100 p-2 rounded-full text-xl animate-pulse">💳</div>
          <div>
            <h4 className="font-bold text-gray-800 text-sm">Update ID Card</h4>
            <p className="text-gray-600 text-xs font-medium">{notif.pesan}</p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Meja Asrama & Penempatan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-green-700">Input Santri ke Kamar</h2>
            <p className="text-sm text-gray-500 mt-1">Data yang diinput otomatis masuk ke Meja ID Card secara real-time.</p>
          </div>
          
          <form onSubmit={simpanSantriManual} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" value={namaSantri} onChange={(e) => setNamaSantri(e.target.value)} placeholder="Cth: Ahmad / Siti" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                <select value={genderSantri} onChange={(e) => {setGenderSantri(e.target.value); setSakanId(""); setKamarId("");}} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white font-bold text-gray-700" >
                  <option value="BANIN">👨 Putra (BANIN)</option>
                  <option value="BANAT">🧕 Putri (BANAT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Santri</label>
                <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" >
                  <option value="BARU">BARU</option>
                  <option value="LAMA">LAMA</option>
                  <option value="KSU">KSU</option>
                </select>
              </div>
            </div>

            {kategori === "LAMA" && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <label className="block text-sm font-bold text-yellow-800 mb-1">Sudah menetap berapa bulan?</label>
                <select value={bulanKe} onChange={(e) => setBulanKe(e.target.value)} className="w-full p-3 border border-yellow-300 rounded-lg outline-none bg-white">
                  <option value="1">1 Bulan (Baru menempati bulan lalu)</option>
                  <option value="2">2 Bulan (Bulan depan wajib rolling)</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Sakan</label>
                <select value={sakanId} onChange={(e) => { setSakanId(e.target.value); setKamarId(""); setLemariId(""); }} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white">
                  <option value="">-- Sakan --</option>
                  {sakanDifilterKiri.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kamar</label>
                <select value={kamarId} onChange={(e) => { setKamarId(e.target.value); setLemariId(""); }} disabled={!sakanId} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                  <option value="">-- Kamar --</option>
                  {daftarKamar.map((k: any) => <option key={k.id} value={k.id}>Kamar {k.nama}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Lemari</label>
              <select value={lemariId} onChange={(e) => setLemariId(e.target.value)} disabled={!kamarId} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                <option value="">-- Lemari --</option>
                {daftarLemariTersedia.map((l: any) => <option key={l.id} value={l.id}>Lemari {l.nomor}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
              {loading ? "Menyimpan..." : "Simpan & Assign Kamar"}
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: ANTREAN ROLLING */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col h-[600px]">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-blue-700">Daftar Antrean Rolling</h2>
            <p className="text-sm text-gray-500 mt-1">Santri lama yang wajib pindah kamar.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {antrean.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                <span className="text-4xl mb-3">📭</span><p>Belum ada antrean.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {antrean.map((item) => (
                  <li key={item.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50 border-l-4 border-l-red-500">
                    <div>
                      <p className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        {item.santri.nama} <span className="text-sm">{item.santri.gender === 'BANAT' ? '🧕' : '👨'}</span>
                      </p>
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">Wajib Rolling</span>
                    </div>
                    <button onClick={() => bukaModalAntrean(item.id, item.santri.nama, item.santri.gender)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-bold shadow-sm">
                      Beri Kamar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PENEMPATAN [Tetap sama] */}
      {isModalOpen && santriAntrean && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className={`p-5 ${santriAntrean.gender === 'BANAT' ? 'bg-pink-600' : 'bg-blue-600'}`}>
              <h2 className="text-xl font-bold text-white">Penempatan Kamar Baru</h2>
              <p className="text-white opacity-80 text-sm mt-1">Untuk: <strong>{santriAntrean.nama}</strong> ({santriAntrean.gender})</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Sakan</label>
                <select value={modalSakanId} onChange={(e) => { setModalSakanId(e.target.value); setModalKamarId(""); setModalLemariId(""); }} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white font-bold">
                  <option value="">-- Pilih Sakan --</option>
                  {sakanDifilterModal.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kamar</label>
                <select value={modalKamarId} onChange={(e) => { setModalKamarId(e.target.value); setModalLemariId(""); }} disabled={!modalSakanId} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                  <option value="">-- Pilih Kamar --</option>
                  {modalDaftarKamar.map((k: any) => <option key={k.id} value={k.id}>Kamar {k.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Lemari</label>
                <select value={modalLemariId} onChange={(e) => setModalLemariId(e.target.value)} disabled={!modalKamarId} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                  <option value="">-- Pilih Lemari --</option>
                  {modalLemariTersedia.map((l: any) => <option key={l.id} value={l.id}>Lemari {l.nomor}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={tutupModal} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition">Batal</button>
              <button onClick={eksekusiAssignModal} disabled={!modalLemariId} className={`px-5 py-2 text-white font-bold rounded-lg disabled:opacity-50 transition shadow-sm ${santriAntrean.gender === 'BANAT' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                Simpan Penempatan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}