"use client"; // Wajib karena kita pakai State dan Hooks

import { useState, useEffect } from "react";

export default function DaftarUlangPage() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [pesanStatus, setPesanStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [hasilCari, setHasilCari] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Cek status pendaftaran saat halaman pertama kali dibuka
  useEffect(() => {
    fetch("/api/status-pendaftaran")
      .then((res) => res.json())
      .then((data) => {
        setIsOpen(data.isOpen);
        setPesanStatus(data.message);
      });
  }, []);

  // Fungsi mencari nama
  const cariNama = async (teks: string) => {
    setKeyword(teks);
    if (teks.length < 3) return setHasilCari([]); // Minimal 3 huruf

    const res = await fetch(`/api/daftar-ulang?nama=${teks}`);
    const data = await res.json();
    if (Array.isArray(data)) setHasilCari(data);
  };

  // Fungsi submit pendaftaran
  const daftarDufah = async (santriId: string, namaSantri: string) => {
    if (!confirm(`Daftarkan ulang ${namaSantri} untuk bulan ini?`)) return;
    
    setLoading(true);
    const res = await fetch("/api/daftar-ulang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ santriId }),
    });
    
    const data = await res.json();
    setLoading(false);
    
    if (res.ok) {
      alert(data.message); // Notifikasi sukses (termasuk info rolling)
      setKeyword("");
      setHasilCari([]);
    } else {
      alert(`Gagal: ${data.error}`); // Notifikasi gagal (KSU atau sudah daftar)
    }
  };

  if (isOpen === null) return <div className="p-10 text-center">Memuat status...</div>;

  // Tampilan jika pendaftaran ditutup
  if (isOpen === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Pendaftaran Ditutup</h1>
          <p className="text-gray-600">{pesanStatus}</p>
        </div>
      </div>
    );
  }

  // Tampilan Utama jika pendaftaran dibuka
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-2xl font-bold text-center text-green-700 mb-2">Daftar Ulang Duf'ah</h1>
      <p className="text-sm text-center text-gray-500 mb-6">{pesanStatus}</p>

      <div className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => cariNama(e.target.value)}
          placeholder="Ketik minimal 3 huruf nama Anda..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />

        {/* Dropdown Hasil Pencarian */}
        {hasilCari.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {hasilCari.map((santri) => (
              <li 
                key={santri.id} 
                className="p-3 border-b hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">{santri.nama}</p>
                  <p className="text-xs text-gray-500">Kategori: {santri.kategori}</p>
                </div>
                <button
                  onClick={() => daftarDufah(santri.id, santri.nama)}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Pilih
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}