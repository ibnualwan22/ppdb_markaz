"use client";

import { useState, useEffect } from "react";

export default function MejaAsramaPage() {
  // State untuk Master Data Lokasi
  const [dataLokasi, setDataLokasi] = useState<any[]>([]);
  
  // State untuk Form Input
  const [namaSantri, setNamaSantri] = useState("");
  const [sakanId, setSakanId] = useState("");
  const [kamarId, setKamarId] = useState("");
  const [lemariId, setLemariId] = useState("");

  // Mengambil data lokasi lengkap saat halaman dimuat
  useEffect(() => {
    fetch("/api/sakan")
      .then((res) => res.json())
      .then((data) => setDataLokasi(data));
  }, []);

  // Logika Cascading Dropdown (Dropdown Bertingkat)
  const sakanTerpilih = dataLokasi.find((s) => s.id === sakanId);
  const daftarKamar = sakanTerpilih ? sakanTerpilih.kamar : [];
  
  const kamarTerpilih = daftarKamar.find((k: any) => k.id === kamarId);
  const daftarLemari = kamarTerpilih ? kamarTerpilih.lemari : [];

  // Fungsi Submit Santri Baru
  const simpanSantriBaru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSantri || !lemariId) return alert("Nama dan Lemari wajib diisi!");

    const res = await fetch("/api/asrama/santri-baru", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: namaSantri, lemariId }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      // Reset form
      setNamaSantri("");
      setSakanId("");
      setKamarId("");
      setLemariId("");
    } else {
      alert(`Gagal: ${data.error}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Meja Asrama & Penempatan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: FORM INPUT SANTRI BARU */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-green-700 mb-6">Input Santri Baru</h2>
          
          <form onSubmit={simpanSantriBaru} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={namaSantri}
                onChange={(e) => setNamaSantri(e.target.value)}
                placeholder="Masukkan nama santri..."
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-500"
              />
            </div>

            {/* Dropdown Tingkat 1: Sakan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Sakan</label>
              <select
                value={sakanId}
                onChange={(e) => {
                  setSakanId(e.target.value);
                  setKamarId(""); // Reset kamar jika sakan diganti
                  setLemariId(""); // Reset lemari jika sakan diganti
                }}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-500 bg-white"
              >
                <option value="">-- Pilih Sakan --</option>
                {dataLokasi.map((sakan) => (
                  <option key={sakan.id} value={sakan.id}>{sakan.nama}</option>
                ))}
              </select>
            </div>

            {/* Dropdown Tingkat 2: Kamar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kamar</label>
              <select
                value={kamarId}
                onChange={(e) => {
                  setKamarId(e.target.value);
                  setLemariId(""); // Reset lemari jika kamar diganti
                }}
                disabled={!sakanId}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-500 bg-white disabled:bg-gray-100"
              >
                <option value="">-- Pilih Kamar --</option>
                {daftarKamar.map((kamar: any) => (
                  <option key={kamar.id} value={kamar.id}>Kamar {kamar.nama}</option>
                ))}
              </select>
            </div>

            {/* Dropdown Tingkat 3: Lemari */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Lemari (Kosong)</label>
              <select
                value={lemariId}
                onChange={(e) => setLemariId(e.target.value)}
                disabled={!kamarId}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-500 bg-white disabled:bg-gray-100"
              >
                <option value="">-- Pilih Lemari --</option>
                {daftarLemari.map((lemari: any) => (
                  <option key={lemari.id} value={lemari.id}>Lemari {lemari.nomor}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition mt-4 shadow-md"
            >
              Simpan & Assign Kamar
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: DAFTAR SANTRI LAMA (ROLLING) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-red-600 mb-2">Antrean Rolling Sakan</h2>
          <p className="text-sm text-gray-500 mb-6">Santri lama yang masa tinggal 3 bulannya habis dan wajib pilih sakan baru.</p>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center text-red-700 font-medium">
            <p>Fitur tabel antrean akan dirender di sini.</p>
            <p className="text-sm font-normal mt-2">
              (Panitia tinggal klik nama santri, lalu muncul pop-up form pemilihan kamar seperti di sebelah kiri).
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}