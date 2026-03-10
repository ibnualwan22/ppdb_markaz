"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [dataDenah, setDataDenah] = useState<any[]>([]);

  // Fungsi untuk memuat data (Bisa diganti WebSocket nanti)
  const muatDenah = () => {
    fetch("/api/sakan")
      .then((res) => res.json())
      .then((data) => setDataDenah(data));
  };

  useEffect(() => {
    muatDenah();
    // Simulasi real-time sederhana dengan Polling (Refresh tiap 10 detik)
    // Nanti bisa diganti dengan Supabase Realtime
    const interval = setInterval(muatDenah, 10000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Visualisasi Sakan (Dashboard Muasis)</h1>
        <div className="flex gap-4 text-sm font-medium">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-sm"></div> Kosong</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> Terisi</div>
        </div>
      </div>

      <div className="space-y-8">
        {dataDenah.map((sakan) => (
          <div key={sakan.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-green-800 border-b pb-3 mb-6">🏢 Sakan {sakan.nama}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sakan.kamar.map((kamar: any) => (
                <div key={kamar.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Kamar {kamar.nama}</h3>
                  
                  {/* Render Kotak-kotak Lemari */}
                  <div className="grid grid-cols-4 gap-2">
                    {kamar.lemari.map((lemari: any) => {
                      // Logika ngecek apakah terisi
                      // (Di schema aslinya kita perlu ngecek relasi 'penghuni' untuk duf'ah aktif)
                      // Untuk simulasi UI ini, anggaplah kita punya boolean isTerisi dari API
                      const isTerisi = Math.random() > 0.5; // Ganti ini dengan data riwayat penghuni asli nanti

                      return (
                        <div 
                          key={lemari.id}
                          className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold text-white transition-all cursor-pointer hover:opacity-80
                            ${isTerisi ? "bg-red-500 shadow-inner" : "bg-green-500 shadow-sm"}
                          `}
                          title={isTerisi ? "Terisi oleh Fulan" : "Lemari Kosong"}
                        >
                          {lemari.nomor}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}