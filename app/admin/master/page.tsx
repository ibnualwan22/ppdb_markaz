"use client";

import { useState, useEffect } from "react";

export default function MasterLokasiPage() {
  const [dataSakan, setDataSakan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Form
  const [namaSakan, setNamaSakan] = useState("");
  const [kategoriSakan, setKategoriSakan] = useState("BANIN");
  const [namaKamar, setNamaKamar] = useState("");
  const [sakanIdKamar, setSakanIdKamar] = useState("");
  const [nomorLemari, setNomorLemari] = useState("");
  const [kamarIdLemari, setKamarIdLemari] = useState("");

  const muatData = async () => {
    try {
      const res = await fetch("/api/sakan");
      if (res.ok) setDataSakan(await res.json());
    } catch (error) {
      console.error("Gagal memuat data", error);
    }
  };

  useEffect(() => { muatData(); }, []);

  const tambahSakan = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch("/api/sakan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaSakan, kategori: kategoriSakan }),
    });
    if (res.ok) { setNamaSakan(""); muatData(); }
    setLoading(false);
  };

  const tambahKamar = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch("/api/kamar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaKamar, sakanId: sakanIdKamar }),
    });
    if (res.ok) { setNamaKamar(""); muatData(); }
    setLoading(false);
  };

  const tambahLemari = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch("/api/lemari", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomor: nomorLemari, kamarId: kamarIdLemari }),
    });
    if (res.ok) { setNomorLemari(""); muatData(); }
    setLoading(false);
  };

  const aksiData = async (jenis: "sakan" | "kamar" | "lemari", aksi: "edit" | "hapus", id: string, dataLama: string, kategoriLama?: string) => {
    if (aksi === "hapus") {
      if (!confirm(`YAKIN HAPUS ${jenis.toUpperCase()} ${dataLama}? Semua isinya akan ikut terhapus permanen!`)) return;
      await fetch(`/api/${jenis}/${id}`, { method: "DELETE" });
      muatData();
    } 
    
    if (aksi === "edit") {
      const namaBaru = prompt(`Masukkan nama/nomor baru untuk ${dataLama}:`, dataLama);
      if (!namaBaru || namaBaru === dataLama) return;

      let bodyData: any = { nama: namaBaru };
      if (jenis === "lemari") bodyData = { nomor: namaBaru };
      if (jenis === "sakan") {
        const katBaru = prompt(`Kategori Sakan (BANIN/BANAT):`, kategoriLama)?.toUpperCase();
        if (katBaru === "BANIN" || katBaru === "BANAT") bodyData.kategori = katBaru;
      }
      await fetch(`/api/${jenis}/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyData),
      });
      muatData();
    }
  };

  // =========================================
  // FUNGSI BARU: TOGGLE KUNCI (LOCK/UNLOCK)
  // =========================================
  const toggleLock = async (jenis: "sakan" | "kamar" | "lemari", id: string, statusKunciSaatIni: boolean) => {
    await fetch(`/api/${jenis}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !statusKunciSaatIni }),
    });
    muatData();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Master Lokasi Asrama</h1>

      {/* FORM TAMBAH DATA (Tetap sama) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <form onSubmit={tambahSakan} className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
          <h2 className="font-bold text-lg mb-4 text-green-700">1. Tambah Sakan</h2>
          <input type="text" value={namaSakan} onChange={(e) => setNamaSakan(e.target.value)} placeholder="Nama Sakan (Cth: Alkaf)" className="w-full p-2 mb-3 border rounded" required />
          <select value={kategoriSakan} onChange={(e) => setKategoriSakan(e.target.value)} className="w-full p-2 mb-3 border rounded font-bold" >
            <option value="BANIN">👨 Putra (BANIN)</option>
            <option value="BANAT">🧕 Putri (BANAT)</option>
          </select>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Simpan Sakan</button>
        </form>

        <form onSubmit={tambahKamar} className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
          <h2 className="font-bold text-lg mb-4 text-green-700">2. Tambah Kamar</h2>
          <select value={sakanIdKamar} onChange={(e) => setSakanIdKamar(e.target.value)} className="w-full p-2 mb-3 border rounded" required >
            <option value="">-- Pilih Sakan --</option>
            {dataSakan.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.kategori})</option>)}
          </select>
          <input type="text" value={namaKamar} onChange={(e) => setNamaKamar(e.target.value)} placeholder="Nama Kamar (Cth: A)" className="w-full p-2 mb-3 border rounded" required />
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Simpan Kamar</button>
        </form>

        <form onSubmit={tambahLemari} className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
          <h2 className="font-bold text-lg mb-4 text-green-700">3. Tambah Lemari</h2>
          <select value={kamarIdLemari} onChange={(e) => setKamarIdLemari(e.target.value)} className="w-full p-2 mb-3 border rounded" required >
            <option value="">-- Pilih Kamar --</option>
            {dataSakan.map((s) => s.kamar.map((k: any) => <option key={k.id} value={k.id}>{s.nama} - Kamar {k.nama}</option>))}
          </select>
          <input type="text" value={nomorLemari} onChange={(e) => setNomorLemari(e.target.value)} placeholder="Nomor Lemari (Cth: A1)" className="w-full p-2 mb-3 border rounded" required />
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Simpan Lemari</button>
        </form>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Denah Sakan Saat Ini</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataSakan.map((sakan) => (
          // Jika Sakan digembok, warnanya jadi abu-abu kusam
          <div key={sakan.id} className={`rounded-xl shadow-md border overflow-hidden transition-all ${sakan.isLocked ? 'bg-gray-200 border-gray-400 opacity-80' : 'bg-white border-gray-200'}`}>
            
            {/* Header Sakan */}
            <div className={`p-4 flex justify-between items-center ${sakan.isLocked ? 'bg-gray-600' : sakan.kategori === 'BANAT' ? 'bg-pink-700' : 'bg-green-800'} text-white`}>
              <div>
                <h3 className={`font-bold text-xl flex items-center gap-2 ${sakan.isLocked ? 'line-through text-gray-300' : ''}`}>
                  {sakan.isLocked && '🔒'} {sakan.nama}
                </h3>
                <span className="text-xs font-bold bg-white text-gray-900 px-2 py-0.5 rounded opacity-80 uppercase">
                  {sakan.kategori || "BANIN"}
                </span>
              </div>
              <div className="flex gap-1">
                {/* Tombol Kunci Sakan */}
                <button onClick={() => toggleLock('sakan', sakan.id, sakan.isLocked)} className={`text-xs px-2 py-1 rounded font-bold ${sakan.isLocked ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-gray-900 hover:bg-black'}`}>
                  {sakan.isLocked ? '🔓 Buka' : '🔒 Kunci'}
                </button>
                <button onClick={() => aksiData('sakan', 'edit', sakan.id, sakan.nama, sakan.kategori)} className="text-xs bg-white/20 hover:bg-white/40 px-2 py-1 rounded">✏️</button>
                <button onClick={() => aksiData('sakan', 'hapus', sakan.id, sakan.nama)} className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded">🗑️</button>
              </div>
            </div>

            {/* List Kamar & Lemari */}
            <div className="p-4 bg-gray-50/50">
              {sakan.kamar.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Belum ada kamar.</p>
              ) : (
                <div className="space-y-4">
                  {sakan.kamar.map((kamar: any) => (
                    // Jika kamar digembok, background jadi merah muda pudar
                    <div key={kamar.id} className={`p-3 rounded-lg border shadow-sm transition-all ${kamar.isLocked ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <span className={`font-bold flex items-center gap-1 ${kamar.isLocked ? 'text-red-700 line-through' : 'text-gray-800'}`}>
                          {kamar.isLocked && '🔒'} Kamar {kamar.nama}
                        </span>
                        <div className="flex gap-1">
                          {/* Tombol Kunci Kamar */}
                          <button onClick={() => toggleLock('kamar', kamar.id, kamar.isLocked)} className={`text-[10px] px-2 py-1 rounded border font-bold ${kamar.isLocked ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                            {kamar.isLocked ? '🔓 Buka' : '🔒 Kunci'}
                          </button>
                          <button onClick={() => aksiData('kamar', 'edit', kamar.id, kamar.nama)} className="text-[10px] text-blue-600 hover:bg-blue-50 px-2 py-1 rounded border border-blue-200">Edit</button>
                          <button onClick={() => aksiData('kamar', 'hapus', kamar.id, kamar.nama)} className="text-[10px] text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200">Hapus</button>
                        </div>
                      </div>
                      
                      {kamar.lemari.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Kosong</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {kamar.lemari.map((lemari: any) => (
                            // Jika lemari digembok, dicoret dan warna merah
                            <div key={lemari.id} className={`flex items-center gap-1 border px-2 py-1 rounded group transition-all ${lemari.isLocked ? 'bg-red-100 border-red-300 opacity-75' : 'bg-gray-100 border-gray-300'}`}>
                              <span className={`text-xs font-bold flex items-center gap-1 ${lemari.isLocked ? 'text-red-700 line-through' : 'text-gray-700'}`}>
                                {lemari.isLocked && '🔒'} {lemari.nomor}
                              </span>
                              <div className="hidden group-hover:flex gap-1 ml-1">
                                {/* Tombol Kunci Lemari */}
                                <button onClick={() => toggleLock('lemari', lemari.id, lemari.isLocked)} className="text-[10px] hover:scale-110 bg-white rounded px-1 shadow-sm">
                                  {lemari.isLocked ? '🔓' : '🔒'}
                                </button>
                                <button onClick={() => aksiData('lemari', 'edit', lemari.id, lemari.nomor)} className="text-[10px] hover:scale-110">✏️</button>
                                <button onClick={() => aksiData('lemari', 'hapus', lemari.id, lemari.nomor)} className="text-[10px] hover:scale-110">❌</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}