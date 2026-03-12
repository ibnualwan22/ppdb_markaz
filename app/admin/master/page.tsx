"use client";

import { useState, useEffect } from "react";

export default function MasterLokasiPage() {
  const [dataSakan, setDataSakan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Form Tambah
  const [namaSakan, setNamaSakan] = useState("");
  const [kategoriSakan, setKategoriSakan] = useState("BANIN");
  const [namaKamar, setNamaKamar] = useState("");
  const [sakanIdKamar, setSakanIdKamar] = useState("");
  const [nomorLemari, setNomorLemari] = useState("");
  const [kamarIdLemari, setKamarIdLemari] = useState("");

  // State Modal Pindah Kamar
  const [isModalPindahOpen, setIsModalPindahOpen] = useState(false);
  const [santriPindah, setSantriPindah] = useState<any>(null); // Menyimpan data riwayat santri yg mau dipindah
  const [sakanTujuan, setSakanTujuan] = useState("");
  const [kamarTujuan, setKamarTujuan] = useState("");
  const [lemariTujuan, setLemariTujuan] = useState("");

  const muatData = async () => {
    try {
      const res = await fetch("/api/sakan");
      if (res.ok) setDataSakan(await res.json());
    } catch (error) { console.error("Gagal memuat data", error); }
  };

  useEffect(() => { muatData(); }, []);

  // [Fungsi Tambah, Edit, Hapus, Lock tetap sama seperti sebelumnya disembunyikan untuk ringkasnya]
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
      if (!confirm(`YAKIN HAPUS ${jenis.toUpperCase()} ${dataLama}? Semua isinya ikut terhapus!`)) return;
      await fetch(`/api/${jenis}/${id}`, { method: "DELETE" }); muatData();
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
      await fetch(`/api/${jenis}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyData) }); muatData();
    }
  };
  const toggleLock = async (jenis: "sakan" | "kamar" | "lemari", id: string, statusKunciSaatIni: boolean) => {
    await fetch(`/api/${jenis}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isLocked: !statusKunciSaatIni }) }); muatData();
  };

  // =========================================
  // LOGIKA PINDAH KAMAR
  // =========================================
  const bukaModalPindah = (riwayatId: string, namaSantri: string, gender: string) => {
    setSantriPindah({ id: riwayatId, nama: namaSantri, gender: gender });
    setIsModalPindahOpen(true);
  };

  const eksekusiPindahKamar = async () => {
    if (!lemariTujuan) return alert("Pilih lemari tujuan!");
    setLoading(true);
    const res = await fetch(`/api/riwayat/${santriPindah.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lemariIdBaru: lemariTujuan }),
    });

    if (res.ok) {
      setIsModalPindahOpen(false);
      setSakanTujuan(""); setKamarTujuan(""); setLemariTujuan("");
      muatData();
    } else { alert("Gagal memindahkan santri."); }
    setLoading(false);
  };

  // Dropdown options untuk modal pindah kamar
  const sakanPindahDifilter = dataSakan.filter(s => s.kategori === santriPindah?.gender && !s.isLocked);
  const sakanPindahTerpilih = sakanPindahDifilter.find(s => s.id === sakanTujuan);
  const kamarPindahDifilter = sakanPindahTerpilih ? sakanPindahTerpilih.kamar.filter((k:any) => !k.isLocked) : [];
  const kamarPindahTerpilih = kamarPindahDifilter.find((k:any) => k.id === kamarTujuan);
  const lemariPindahTersedia = kamarPindahTerpilih ? kamarPindahTerpilih.lemari.filter((l:any) => !l.isLocked && (!l.penghuni || l.penghuni.length === 0)) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Master Lokasi Asrama</h1>

      {/* Form Tambah [Sengaja tidak diubah] */}
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

      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        Denah Sakan Saat Ini 
        <span className="text-sm font-normal text-gray-500 bg-yellow-100 px-3 py-1 rounded border border-yellow-300">
          💡 Jika ada loker warna merah (Bentrok), klik 🔄 untuk memindahkan santri.
        </span>
      </h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {dataSakan.map((sakan) => (
          <div key={sakan.id} className={`rounded-xl shadow-md border overflow-hidden transition-all ${sakan.isLocked ? 'bg-gray-200 border-gray-400 opacity-80' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 flex justify-between items-center ${sakan.isLocked ? 'bg-gray-600' : sakan.kategori === 'BANAT' ? 'bg-pink-700' : 'bg-green-800'} text-white`}>
              <div>
                <h3 className={`font-bold text-xl flex items-center gap-2 ${sakan.isLocked ? 'line-through text-gray-300' : ''}`}>
                  {sakan.isLocked && '🔒'} {sakan.nama}
                </h3>
                <span className="text-xs font-bold bg-white text-gray-900 px-2 py-0.5 rounded opacity-80 uppercase">{sakan.kategori || "BANIN"}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleLock('sakan', sakan.id, sakan.isLocked)} className={`text-xs px-2 py-1 rounded font-bold ${sakan.isLocked ? 'bg-yellow-500 text-black' : 'bg-gray-900 hover:bg-black'}`}>
                  {sakan.isLocked ? '🔓 Buka' : '🔒 Kunci'}
                </button>
                <button onClick={() => aksiData('sakan', 'edit', sakan.id, sakan.nama, sakan.kategori)} className="text-xs bg-white/20 hover:bg-white/40 px-2 py-1 rounded">✏️</button>
                <button onClick={() => aksiData('sakan', 'hapus', sakan.id, sakan.nama)} className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded">🗑️</button>
              </div>
            </div>

            <div className="p-4 bg-gray-50/50">
              {sakan.kamar.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Belum ada kamar.</p>
              ) : (
                <div className="space-y-4">
                  {sakan.kamar.map((kamar: any) => (
                    <div key={kamar.id} className={`p-3 rounded-lg border shadow-sm transition-all ${kamar.isLocked ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <span className={`font-bold flex items-center gap-1 ${kamar.isLocked ? 'text-red-700 line-through' : 'text-gray-800'}`}>
                          {kamar.isLocked && '🔒'} Kamar {kamar.nama}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => toggleLock('kamar', kamar.id, kamar.isLocked)} className={`text-[10px] px-2 py-1 rounded border font-bold ${kamar.isLocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {kamar.isLocked ? '🔓 Buka' : '🔒 Kunci'}
                          </button>
                          <button onClick={() => aksiData('kamar', 'edit', kamar.id, kamar.nama)} className="text-[10px] text-blue-600 hover:bg-blue-50 px-2 py-1 rounded border">Edit</button>
                          <button onClick={() => aksiData('kamar', 'hapus', kamar.id, kamar.nama)} className="text-[10px] text-red-600 hover:bg-red-50 px-2 py-1 rounded border">Hapus</button>
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
                              <div key={lemari.id} className={`flex flex-col border p-2 rounded relative group transition-all 
                                ${lemari.isLocked ? 'bg-gray-200 border-gray-400 opacity-75' 
                                : isBentrok ? 'bg-red-100 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                                : isTerisi ? 'bg-blue-50 border-blue-200' 
                                : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                                
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm ${isBentrok ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}>
                                    {lemari.isLocked && '🔒'} Loker {lemari.nomor}
                                  </span>
                                  <div className="flex gap-1">
                                    <button onClick={() => toggleLock('lemari', lemari.id, lemari.isLocked)} className="text-[10px] bg-white rounded px-1 shadow-sm border hover:bg-gray-100">{lemari.isLocked ? '🔓' : '🔒'}</button>
                                    <button onClick={() => aksiData('lemari', 'edit', lemari.id, lemari.nomor)} className="text-[10px] bg-white rounded px-1 shadow-sm border hover:bg-gray-100">✏️</button>
                                    <button onClick={() => aksiData('lemari', 'hapus', lemari.id, lemari.nomor)} className="text-[10px] bg-white rounded px-1 shadow-sm border hover:bg-gray-100 text-red-500">❌</button>
                                  </div>
                                </div>

                                {/* LIST PENGHUNI */}
                                {isTerisi ? (
                                  <div className="space-y-1 mt-auto">
                                    {lemari.penghuni.map((p:any) => (
                                      <div key={p.id} className="flex justify-between items-center bg-white/70 px-1.5 py-1 rounded border border-white/50">
                                        <p className="font-bold text-xs truncate max-w-[100px]" title={p.santri.nama}>{p.santri.nama}</p>
                                        <button 
                                          onClick={() => bukaModalPindah(p.id, p.santri.nama, sakan.kategori)}
                                          className="text-[10px] bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 px-1.5 py-0.5 rounded transition shadow-sm font-bold"
                                          title="Pindah Kamar"
                                        >
                                          🔄 Pindah
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mt-auto text-center"><span className="text-xs text-gray-400 italic">Kosong</span></div>
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
        ))}
      </div>

      {/* ========================================== */}
      {/* MODAL PINDAH KAMAR                         */}
      {/* ========================================== */}
      {isModalPindahOpen && santriPindah && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className={`p-5 ${santriPindah.gender === 'BANAT' ? 'bg-pink-600' : 'bg-blue-600'}`}>
              <h2 className="text-xl font-bold text-white">🔄 Pindah Lokasi Kamar</h2>
              <p className="text-white opacity-80 text-sm mt-1">Pilih kamar baru untuk: <strong>{santriPindah.nama}</strong></p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Sakan Tujuan</label>
                <select value={sakanTujuan} onChange={(e) => { setSakanTujuan(e.target.value); setKamarTujuan(""); setLemariTujuan(""); }} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white font-bold">
                  <option value="">-- Pilih Sakan --</option>
                  {sakanPindahDifilter.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kamar Tujuan</label>
                <select value={kamarTujuan} onChange={(e) => { setKamarTujuan(e.target.value); setLemariTujuan(""); }} disabled={!sakanTujuan} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                  <option value="">-- Pilih Kamar --</option>
                  {kamarPindahDifilter.map((k: any) => <option key={k.id} value={k.id}>Kamar {k.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Lemari (Yang Kosong)</label>
                <select value={lemariTujuan} onChange={(e) => setLemariTujuan(e.target.value)} disabled={!kamarTujuan} className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100">
                  <option value="">-- Pilih Lemari --</option>
                  {lemariPindahTersedia.map((l: any) => <option key={l.id} value={l.id}>Loker {l.nomor}</option>)}
                </select>
                {kamarTujuan && lemariPindahTersedia.length === 0 && <p className="text-xs text-red-500 mt-1 font-bold">Semua lemari di kamar ini penuh/dikunci!</p>}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalPindahOpen(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition">Batal</button>
              <button onClick={eksekusiPindahKamar} disabled={!lemariTujuan || loading} className={`px-5 py-2 text-white font-bold rounded-lg disabled:opacity-50 transition shadow-sm ${santriPindah.gender === 'BANAT' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {loading ? "Memproses..." : "Konfirmasi Pindah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}