"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardHome() {
  const [stats, setStats] = useState<any>(null);
  const [grafikData, setGrafikData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Grafik
  const [filterTahun, setFilterTahun] = useState("ALL");
  const [filterMulai, setFilterMulai] = useState("");
  const [filterAkhir, setFilterAkhir] = useState("");

  useEffect(() => {
    const muatData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setGrafikData(data.grafikData);
        }
      } catch (error) {
        console.error("Gagal memuat dashboard", error);
      }
      setLoading(false);
    };
    muatData();
  }, []);

  // Proses Filter Data Grafik
  const tahunUnik = Array.from(new Set(grafikData.map(g => g.tahun))).sort((a, b) => b - a);
  
  let grafikDitampilkan = grafikData.filter(g => {
    let lolosTahun = filterTahun === "ALL" || g.tahun.toString() === filterTahun;
    let lolosMulai = filterMulai === "" || g.id >= parseInt(filterMulai);
    let lolosAkhir = filterAkhir === "" || g.id <= parseInt(filterAkhir);
    return lolosTahun && lolosMulai && lolosAkhir;
  });

  // Cari nilai tertinggi untuk skala tinggi batang grafik
  const maxPendaftar = grafikDitampilkan.length > 0 ? Math.max(...grafikDitampilkan.map(g => g.totalPendaftar)) : 1;

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Memuat Command Center...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8 border-b border-gray-300 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard & Rekapitulasi</h1>
          <p className="text-gray-500 mt-1">Pemantauan Global Sistem Administrasi Asrama</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-gray-400">Periode Berjalan:</p>
          <p className="text-xl font-black text-green-700">{stats?.dufahNama}</p>
        </div>
      </div>

      {/* ========================================== */}
      {/* 3 KARTU STATISTIK UTAMA                    */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-600 flex flex-col justify-center relative overflow-hidden">
          <p className="text-gray-500 font-bold text-sm z-10">Total Penghuni Sakan</p>
          <p className="text-4xl font-black text-blue-700 mt-2 z-10">{stats?.totalMasukSakan} <span className="text-lg font-medium text-gray-400">Santri</span></p>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">🏢</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500 flex flex-col justify-center relative overflow-hidden">
          <p className="text-gray-500 font-bold text-sm z-10">Selesai ID Card & Check-in</p>
          <p className="text-4xl font-black text-green-600 mt-2 z-10">{stats?.totalAmbilIdCard} <span className="text-lg font-medium text-gray-400">Santri</span></p>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">💳</div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border-l-4 flex flex-col justify-center relative overflow-hidden ${stats?.selisih > 0 ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-400'}`}>
          <p className={`${stats?.selisih > 0 ? 'text-red-800' : 'text-gray-600'} font-bold text-sm z-10`}>Selisih (Belum ID Card)</p>
          <p className={`text-4xl font-black mt-2 z-10 ${stats?.selisih > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {stats?.selisih} <span className="text-lg font-medium opacity-50">Santri</span>
          </p>
          {stats?.selisih > 0 && <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">⚠️ Perlu tindakan!</p>}
        </div>
      </div>

      {/* ========================================== */}
      {/* LAYOUT DUA KOLOM (GRAFIK & LIST SELISIH)   */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: GRAFIK HISTORIS (Porsi 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">📊 Grafik Pendaftar per Duf'ah</h2>
            
            {/* Filter Grafik */}
            <div className="flex gap-2 text-sm">
              <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="p-2 border rounded-lg bg-gray-50 font-bold text-gray-700 outline-none">
                <option value="ALL">Semua Tahun</option>
                {tahunUnik.map(t => <option key={t} value={t.toString()}>{t}</option>)}
              </select>
              <select value={filterMulai} onChange={(e) => setFilterMulai(e.target.value)} className="p-2 border rounded-lg bg-gray-50 text-gray-700 outline-none max-w-[120px]">
                <option value="">Dari Awal</option>
                {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select>
              <span className="py-2 text-gray-400">-</span>
              <select value={filterAkhir} onChange={(e) => setFilterAkhir(e.target.value)} className="p-2 border rounded-lg bg-gray-50 text-gray-700 outline-none max-w-[120px]">
                <option value="">Sampai Akhir</option>
                {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select>
            </div>
          </div>

          {/* Area Render Grafik Bar HTML Murni */}
          <div className="flex-1 flex items-end gap-2 h-64 mt-4 overflow-x-auto pb-2">
            {grafikDitampilkan.length === 0 ? (
              <div className="w-full text-center text-gray-400 italic mb-10">Tidak ada data untuk filter ini.</div>
            ) : (
              grafikDitampilkan.map((item) => {
                const persentaseTinggi = maxPendaftar === 0 ? 0 : (item.totalPendaftar / maxPendaftar) * 100;
                return (
                  <div key={item.id} className="flex flex-col items-center justify-end group min-w-[50px] flex-1 h-full">
                    
                    {/* Tooltip Hover (Posisinya diperbaiki agar tidak terpotong) */}
                    <div className="relative w-full flex justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-1 text-xs font-bold text-white bg-gray-800 px-2 py-1 rounded pointer-events-none z-10 whitespace-nowrap">
                        {item.totalPendaftar} Santri
                      </span>
                    </div>

                    {/* Pembungkus Bar agar % tingginya terhitung sempurna */}
                    <div className="w-full flex-1 flex flex-col justify-end items-center">
                      <span className="text-xs font-bold text-blue-800 mb-1">{item.totalPendaftar}</span>
                      <div 
                        className="w-full bg-blue-500 hover:bg-blue-600 transition-all rounded-t-md"
                        style={{ height: `${persentaseTinggi}%`, minHeight: '4px' }}
                      ></div>
                    </div>

                    {/* Label Bawah (Diberi tinggi tetap h-8 agar rata semua) */}
                    <span className="text-[10px] text-gray-500 mt-2 font-semibold text-center leading-tight h-8 flex items-start justify-center">
                      {item.nama}<br/>({item.tahun})
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LIST SANTRI SELISIH (Porsi 1/3) */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col h-[500px]">
          <div className="bg-red-50 p-5 border-b border-red-100 rounded-t-2xl">
            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
              🚨 Daftar Selisih
            </h2>
            <p className="text-xs text-red-600 mt-1 font-medium">Santri yang sudah masuk kamar tapi belum konfirmasi ID Card.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {stats?.listBelumIdCard.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-70">
                <span className="text-4xl mb-2">🎉</span>
                <p className="font-bold">Aman! Selisih Nol.</p>
                <p className="text-sm">Semua santri sudah ambil kartu.</p>
              </div>
            ) : (
              <ul className="space-y-2 p-2">
                {stats?.listBelumIdCard.map((row: any, i: number) => (
                  <li key={row.id} className="bg-white p-3 border border-red-100 rounded-xl hover:bg-red-50 transition flex gap-3 items-center shadow-sm">
                    <div className="bg-red-100 text-red-800 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{row.santri.nama}</p>
                      <p className="text-[11px] text-red-500 font-bold mt-0.5">
                        {row.lemari.kamar.sakan.nama} | {row.lemari.nomor}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {stats?.listBelumIdCard.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center rounded-b-2xl">
              <Link href="/admin/id-card" className="text-blue-600 font-bold text-sm hover:underline">
                Tindak Lanjuti di Meja ID Card ➔
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}