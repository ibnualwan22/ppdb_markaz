"use client";

import { useState, useEffect } from "react";

export default function MejaAsramaPage() {
  const [dataLokasi, setDataLokasi] = useState<any[]>([]);
  const [antrean, setAntrean] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE FORM INPUT MANUAL ---
  const [namaSantri, setNamaSantri] = useState("");
  const [kategori, setKategori] = useState("BARU"); 
  const [bulanKe, setBulanKe] = useState("1"); 
  const [sakanId, setSakanId] = useState("");
  const [kamarId, setKamarId] = useState("");
  const [lemariId, setLemariId] = useState("");

  // --- STATE MODAL ANTREAN ROLLING ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [santriAntrean, setSantriAntrean] = useState<{ id: string, nama: string } | null>(null);
  const [modalSakanId, setModalSakanId] = useState("");
  const [modalKamarId, setModalKamarId] = useState("");
  const [modalLemariId, setModalLemariId] = useState("");

  const muatData = async () => {
    try {
      const resLokasi = await fetch("/api/sakan");
      const resAntrean = await fetch("/api/asrama/antrean");
      if (resLokasi.ok) setDataLokasi(await resLokasi.json());
      if (resAntrean.ok) setAntrean(await resAntrean.json());
    } catch (error) {
      console.error("Gagal memuat data", error);
    }
  };

  useEffect(() => { muatData(); }, []);

  // Logika Dropdown untuk Form Kiri
  const sakanTerpilih = dataLokasi.find((s) => s.id === sakanId);
  const kamarTerpilih = sakanTerpilih?.kamar.find((k: any) => k.id === kamarId);
  const daftarLemariTersedia = kamarTerpilih 
    ? kamarTerpilih.lemari.filter((l: any) => !l.penghuni || l.penghuni.length === 0) 
    : [];

  // Logika Dropdown untuk Modal Kanan
  const modalSakan = dataLokasi.find((s) => s.id === modalSakanId);
  const modalKamar = modalSakan?.kamar.find((k: any) => k.id === modalKamarId);
  const modalLemariTersedia = modalKamar 
    ? modalKamar.lemari.filter((l: any) => !l.penghuni || l.penghuni.length === 0) 
    : [];

  // Submit Santri Manual
  const simpanSantriManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSantri || !lemariId || !kategori) return alert("Data wajib diisi!");

    setLoading(true);
    const res = await fetch("/api/asrama/santri-baru", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaSantri, kategori, lemariId, bulanKe }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert(data.message);
      setNamaSantri(""); setSakanId(""); setKamarId(""); setLemariId(""); setBulanKe("1");
      muatData(); 
    } else { alert(`Gagal: ${data.error}`); }
  };

  // Fungsi Buka Modal & Tutup Modal
  const bukaModalAntrean = (id: string, nama: string) => {
    setSantriAntrean({ id, nama });
    setIsModalOpen(true);
  };

  const tutupModal = () => {
    setIsModalOpen(false);
    setSantriAntrean(null);
    setModalSakanId(""); setModalKamarId(""); setModalLemariId("");
  };

  // Eksekusi Simpan dari Modal
  const eksekusiAssignModal = async () => {
    if (!modalLemariId || !santriAntrean) return alert("Silakan pilih lemari terlebih dahulu!");

    const res = await fetch(`/api/asrama/assign/${santriAntrean.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lemariId: modalLemariId }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      tutupModal();
      muatData(); 
    } else { alert(`Gagal: ${data.error}`); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900 relative">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Meja Asrama & Penempatan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-green-700">Input Santri ke Kamar</h2>
            <p className="text-sm text-gray-500 mt-1">Gunakan ini untuk pendaftaran santri baru atau pendataan rilis web perdana.</p>
          </div>
          
          <form onSubmit={simpanSantriManual} className="space-y-4">
            {/* ... (Isi Form Kiri Sama Persis Seperti Sebelumnya) ... */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" value={namaSantri} onChange={(e) => setNamaSantri(e.target.value)} placeholder="Cth: Ahmad Ibnu Alwan" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Santri</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" >
                <option value="BARU">BARU (Santri Baru)</option>
                <option value="LAMA">LAMA (Pendataan Rilis Perdana)</option>
                <option value="KSU">KSU (Khidmat/Pengurus)</option>
              </select>
            </div>

            {kategori === "LAMA" && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <label className="block text-sm font-bold text-yellow-800 mb-1">Sudah menetap berapa bulan?</label>
                <select value={bulanKe} onChange={(e) => setBulanKe(e.target.value)} className="w-full p-3 border border-yellow-300 rounded-lg outline-none bg-white">
                  <option value="1">1 Bulan (Baru menempati bulan lalu)</option>
                  <option value="2">2 Bulan (Masa tinggal sudah 2 bulan)</option>
                  <option value="3">3 Bulan (Bulan depan wajib rolling)</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Sakan</label>
                <select value={sakanId} onChange={(e) => { setSakanId(e.target.value); setKamarId(""); setLemariId(""); }} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white">
                  <option value="">-- Sakan --</option>
                  {dataLokasi.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kamar</label>
                <select value={kamarId} onChange={(e) => { setKamarId(e.target.value); setLemariId(""); }} disabled={!sakanId} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                  <option value="">-- Kamar --</option>
                  {sakanTerpilih?.kamar.map((k: any) => <option key={k.id} value={k.id}>Kamar {k.nama}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Lemari</label>
              <select value={lemariId} onChange={(e) => setLemariId(e.target.value)} disabled={!kamarId} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                <option value="">-- Lemari Tersedia --</option>
                {daftarLemariTersedia.map((l: any) => <option key={l.id} value={l.id}>Lemari {l.nomor}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
              {loading ? "Menyimpan..." : "Simpan & Assign Kamar"}
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: ANTREAN */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col h-[600px]">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-blue-700">Daftar Antrean Rolling</h2>
            <p className="text-sm text-gray-500 mt-1">Santri lama yang wajib pindah kamar karena batas waktu habis.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {antrean.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                <span className="text-4xl mb-3">📭</span>
                <p>Belum ada antrean santri.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {antrean.map((item) => (
                  <li key={item.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50 hover:bg-blue-50 transition border-l-4 border-l-red-500">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{item.santri.nama}</p>
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">Wajib Rolling</span>
                    </div>
                    <button 
                      onClick={() => bukaModalAntrean(item.id, item.santri.nama)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-bold shadow-sm"
                    >
                      Beri Kamar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* OVERLAY MODAL UNTUK ASSIGN KAMAR ANTREAN    */}
      {/* ========================================== */}
      {isModalOpen && santriAntrean && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-blue-600 p-5">
              <h2 className="text-xl font-bold text-white">Penempatan Kamar Baru</h2>
              <p className="text-blue-100 text-sm mt-1">Pilih sakan baru untuk: <strong>{santriAntrean.nama}</strong></p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Sakan</label>
                <select value={modalSakanId} onChange={(e) => { setModalSakanId(e.target.value); setModalKamarId(""); setModalLemariId(""); }} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white">
                  <option value="">-- Pilih Sakan --</option>
                  {dataLokasi.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kamar</label>
                <select value={modalKamarId} onChange={(e) => { setModalKamarId(e.target.value); setModalLemariId(""); }} disabled={!modalSakanId} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                  <option value="">-- Pilih Kamar --</option>
                  {modalSakan?.kamar.map((k: any) => <option key={k.id} value={k.id}>Kamar {k.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Lemari</label>
                <select value={modalLemariId} onChange={(e) => setModalLemariId(e.target.value)} disabled={!modalKamarId} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                  <option value="">-- Pilih Lemari --</option>
                  {modalLemariTersedia.map((l: any) => <option key={l.id} value={l.id}>Lemari {l.nomor}</option>)}
                </select>
                {modalKamarId && modalLemariTersedia.length === 0 && (
                  <p className="text-red-500 text-xs mt-1">Kamar ini sudah penuh!</p>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={tutupModal} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition">
                Batal
              </button>
              <button onClick={eksekusiAssignModal} disabled={!modalLemariId} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm">
                Simpan Penempatan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}