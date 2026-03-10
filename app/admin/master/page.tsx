"use client";

import { useState, useEffect } from "react";

export default function MasterLokasiPage() {
  const [dataSakan, setDataSakan] = useState<any[]>([]);
  
  // State form Sakan
  const [namaSakanBaru, setNamaSakanBaru] = useState("");
  
  // State form Kamar
  const [sakanTerpilihKamar, setSakanTerpilihKamar] = useState("");
  const [namaKamarBaru, setNamaKamarBaru] = useState("");

  // State form Lemari
  const [sakanTerpilihLemari, setSakanTerpilihLemari] = useState("");
  const [kamarTerpilihLemari, setKamarTerpilihLemari] = useState("");
  const [nomorLemariBaru, setNomorLemariBaru] = useState("");

  const muatData = () => {
    fetch("/api/sakan")
      .then((res) => res.json())
      .then((data) => setDataSakan(data));
  };

  useEffect(() => {
    muatData();
  }, []);

  const sakanUntukLemari = dataSakan.find((s) => s.id === sakanTerpilihLemari);
  const daftarKamarUntukLemari = sakanUntukLemari ? sakanUntukLemari.kamar : [];

  const tambahSakan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSakanBaru) return;
    await fetch("/api/sakan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaSakanBaru }),
    });
    setNamaSakanBaru("");
    muatData();
  };

  const tambahKamar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sakanTerpilihKamar || !namaKamarBaru) return;
    await fetch("/api/kamar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaKamarBaru, sakanId: sakanTerpilihKamar }),
    });
    setNamaKamarBaru("");
    muatData();
  };

  const tambahLemari = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kamarTerpilihLemari || !nomorLemariBaru) return;
    await fetch("/api/lemari", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomor: nomorLemariBaru, kamarId: kamarTerpilihLemari }),
    });
    setNomorLemariBaru("");
    muatData();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Pengaturan Master Lokasi</h1>
      
      {/* AREA FORM INPUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* 1. Form Sakan */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-green-700">1. Tambah Sakan</h2>
          <form onSubmit={tambahSakan} className="flex flex-col gap-3">
            <input
              type="text"
              value={namaSakanBaru}
              onChange={(e) => setNamaSakanBaru(e.target.value)}
              placeholder="Cth: Balfaqih"
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
            />
            <button className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 font-bold transition shadow-sm">
              Simpan Sakan
            </button>
          </form>
        </div>

        {/* 2. Form Kamar */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-blue-700">2. Tambah Kamar</h2>
          <form onSubmit={tambahKamar} className="flex flex-col gap-3">
            <select
              value={sakanTerpilihKamar}
              onChange={(e) => setSakanTerpilihKamar(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
            >
              <option value="" className="text-gray-500">-- Pilih Sakan --</option>
              {dataSakan.map((s) => (
                <option key={s.id} value={s.id} className="text-gray-900">{s.nama}</option>
              ))}
            </select>
            <input
              type="text"
              value={namaKamarBaru}
              onChange={(e) => setNamaKamarBaru(e.target.value)}
              placeholder="Nama Kamar (Cth: A)"
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
            />
            <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-bold transition shadow-sm">
              Simpan Kamar
            </button>
          </form>
        </div>

        {/* 3. Form Lemari */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-purple-700">3. Tambah Lemari</h2>
          <form onSubmit={tambahLemari} className="flex flex-col gap-3">
            <select
              value={sakanTerpilihLemari}
              onChange={(e) => {
                setSakanTerpilihLemari(e.target.value);
                setKamarTerpilihLemari("");
              }}
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 font-medium"
            >
              <option value="" className="text-gray-500">-- Pilih Sakan --</option>
              {dataSakan.map((s) => (
                <option key={s.id} value={s.id} className="text-gray-900">{s.nama}</option>
              ))}
            </select>
            
            <select
              value={kamarTerpilihLemari}
              onChange={(e) => setKamarTerpilihLemari(e.target.value)}
              disabled={!sakanTerpilihLemari}
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 disabled:bg-gray-200 font-medium"
            >
              <option value="" className="text-gray-500">-- Pilih Kamar --</option>
              {daftarKamarUntukLemari.map((k: any) => (
                <option key={k.id} value={k.id} className="text-gray-900">Kamar {k.nama}</option>
              ))}
            </select>

            <input
              type="text"
              value={nomorLemariBaru}
              onChange={(e) => setNomorLemariBaru(e.target.value)}
              placeholder="Nomor Lemari (Cth: A1)"
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
            />
            <button className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 font-bold transition shadow-sm">
              Simpan Lemari
            </button>
          </form>
        </div>

      </div>

      {/* AREA TAMPILAN STRUKTUR LOKASI */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Struktur Asrama Saat Ini</h2>
        <div className="space-y-6">
          {dataSakan.length === 0 && <p className="text-gray-500 italic">Belum ada data Sakan.</p>}
          
          {dataSakan.map((sakan) => (
            <div key={sakan.id} className="p-5 bg-gray-50 rounded-xl border border-gray-300 shadow-sm">
              <h3 className="font-bold text-green-800 text-2xl mb-4 border-b border-gray-300 pb-2">🏢 {sakan.nama}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sakan.kamar.length === 0 && <p className="text-sm text-gray-500 italic">Belum ada kamar.</p>}
                
                {sakan.kamar.map((kamar: any) => (
                  <div key={kamar.id} className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                    <h4 className="font-bold text-blue-800 text-lg mb-2">🚪 Kamar {kamar.nama}</h4>
                    <div className="flex flex-wrap gap-2">
                      {kamar.lemari.length === 0 && <span className="text-xs text-gray-500 italic">Lemari kosong</span>}
                      
                      {kamar.lemari.map((lemari: any) => (
                        <span key={lemari.id} className="px-3 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-md text-sm font-bold">
                          {lemari.nomor}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}