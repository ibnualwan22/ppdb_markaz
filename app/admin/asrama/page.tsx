"use client";

import { useState, useEffect } from "react";

export default function MejaAsramaPage() {
  // State Data dari Backend
  const [dataLokasi, setDataLokasi] = useState<any[]>([]);
  const [antrean, setAntrean] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Form Input Manual (Rilis Perdana / Santri Baru)
  const [namaSantri, setNamaSantri] = useState("");
  const [kategori, setKategori] = useState("BARU"); // Default BARU, bisa pilih LAMA/KSU
  const [sakanId, setSakanId] = useState("");
  const [kamarId, setKamarId] = useState("");
  const [lemariId, setLemariId] = useState("");

  // Memuat Data Lokasi & Antrean
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

  useEffect(() => {
    muatData();
  }, []);

  // --- LOGIKA DROPDOWN BERTINGKAT & FILTER 1 LEMARI 1 ORANG ---
  const sakanTerpilih = dataLokasi.find((s) => s.id === sakanId);
  const daftarKamar = sakanTerpilih ? sakanTerpilih.kamar : [];
  
  const kamarTerpilih = daftarKamar.find((k: any) => k.id === kamarId);
  
  // Filter lemari: HANYA tampilkan lemari yang array penghuninya KOSONG (0 orang) di bulan aktif
  const daftarLemariTersedia = kamarTerpilih 
    ? kamarTerpilih.lemari.filter((l: any) => !l.penghuni || l.penghuni.length === 0) 
    : [];

  // --- FUNGSI SUBMIT SANTRI BARU / MANUAL ---
  const simpanSantriManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSantri || !lemariId || !kategori) return alert("Nama, Kategori, dan Lemari wajib diisi!");

    setLoading(true);
    const res = await fetch("/api/asrama/santri-baru", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaSantri, kategori, lemariId }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert(data.message);
      // Reset form
      setNamaSantri("");
      setSakanId("");
      setKamarId("");
      setLemariId("");
      muatData(); // Refresh ketersediaan lemari
    } else {
      alert(`Gagal: ${data.error}`);
    }
  };

  // --- FUNGSI SUBMIT PENEMPATAN ANTREAN (SANTRI LAMA ROLLING) ---
  const assignAntrean = async (riwayatId: string, namaSantriAntre: string) => {
    // Kita buat prompt sederhana untuk panitia memasukkan ID lemari
    // Nanti bisa dikembangkan jadi modal/pop-up yang lebih elegan
    const inputLemariId = prompt(`Masukkan ID Lemari untuk ${namaSantriAntre}\n(Fitur ini sementara, sebaiknya dikembangkan jadi UI Modal dropdown)`);
    
    if (!inputLemariId) return;

    const res = await fetch(`/api/asrama/assign/${riwayatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lemariId: inputLemariId }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      muatData(); // Refresh antrean dan lemari
    } else {
      alert(`Gagal: ${data.error}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Meja Asrama & Penempatan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: FORM INPUT MANUAL (RILIS PERDANA & SANTRI BARU) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-green-700">Input Santri ke Kamar</h2>
            <p className="text-sm text-gray-500 mt-1">Gunakan ini untuk pendaftaran santri baru atau pendataan awal rilis web.</p>
          </div>
          
          <form onSubmit={simpanSantriManual} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={namaSantri}
                onChange={(e) => setNamaSantri(e.target.value)}
                placeholder="Cth: Ahmad Ibnu Alwan"
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
                required
              />
            </div>

            {/* Tambahan: Dropdown Kategori */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Santri</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="BARU">BARU (Santri Baru)</option>
                <option value="LAMA">LAMA (Pendataan Rilis Perdana)</option>
                <option value="KSU">KSU (Khidmat/Pengurus)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Sakan</label>
                <select
                  value={sakanId}
                  onChange={(e) => { setSakanId(e.target.value); setKamarId(""); setLemariId(""); }}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white"
                >
                  <option value="">-- Sakan --</option>
                  {dataLokasi.map((sakan) => (
                    <option key={sakan.id} value={sakan.id}>{sakan.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kamar</label>
                <select
                  value={kamarId}
                  onChange={(e) => { setKamarId(e.target.value); setLemariId(""); }}
                  disabled={!sakanId}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100"
                >
                  <option value="">-- Kamar --</option>
                  {daftarKamar.map((kamar: any) => (
                    <option key={kamar.id} value={kamar.id}>Kamar {kamar.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Lemari (Yang Kosong)</label>
              <select
                value={lemariId}
                onChange={(e) => setLemariId(e.target.value)}
                disabled={!kamarId}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100 focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Lemari Tersedia --</option>
                {daftarLemariTersedia.map((lemari: any) => (
                  <option key={lemari.id} value={lemari.id}>Lemari {lemari.nomor}</option>
                ))}
              </select>
              {kamarId && daftarLemariTersedia.length === 0 && (
                <p className="text-red-500 text-sm mt-1">Peringatan: Kamar ini sudah penuh!</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-50 mt-4"
            >
              {loading ? "Menyimpan..." : "Simpan & Assign Kamar"}
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: DAFTAR SANTRI LAMA (ROLLING / ANTREAN) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col h-full">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-blue-700">Daftar Antrean Kamar</h2>
            <p className="text-sm text-gray-500 mt-1">Santri lama yang mendaftar online dan menunggu penempatan Sakan.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {antrean.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                <span className="text-4xl mb-3">📭</span>
                <p>Belum ada antrean santri.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {antrean.map((item) => (
                  <li key={item.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{item.santri.nama}</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                        {item.santri.kategori}
                      </span>
                    </div>
                    {/* Tombol aksi sementara menggunakan prompt() */}
                    <button 
                      onClick={() => assignAntrean(item.id, item.santri.nama)}
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
    </div>
  );
}