"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePusher } from "../providers/PusherProvider";
import { swalInfo } from "../lib/swal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminDashboardHome() {
  const [stats, setStats] = useState<any>(null);
  const [grafikData, setGrafikData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterTahun, setFilterTahun] = useState("ALL");
  const [filterMulai, setFilterMulai] = useState("");
  const [filterAkhir, setFilterAkhir] = useState("");
  const [filterGender, setFilterGender] = useState("ALL"); 

  const pusher = usePusher();

  const muatData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats); setGrafikData(data.grafikData);
      }
    } catch (error) {}
    if (!isBackground) setLoading(false);
  };

  useEffect(() => {
    muatData();
  }, []);

  // Pusher: listen for data updates
  useEffect(() => {
    if (!pusher) return;
    const handler = () => muatData(true);
    const channel = pusher.subscribe("ppdb-channel");
    channel.bind("data:update", handler);
    return () => { 
      channel.unbind("data:update", handler);
      pusher.unsubscribe("ppdb-channel");
    };
  }, [pusher]);

  const copyLaporanWA = () => {
    if (!stats) return;
    
    let text = `Assalamualaikum Warahmatullahi Wa Barakatuh.\n\n`;
    text += `Afwan Ustadz dan Ustadzah...\n\n`;
    text += `Kami dari tim Id Card & Asrama izin melaporkan jumlah santri yang sudah Cek in dari hari pertama sampai hari ini dan jumlah santri global.\n\n`;

    text += `*Jumlah Santri Banin Per Sakan*\n`;
    stats.sakanBanin.forEach((s: any) => { if (s.total > 0) text += `- ${s.nama} : ${s.total} santri\n`; });

    text += `\n*Jumlah Santri Banat Per Sakan*\n`;
    stats.sakanBanat.forEach((s: any) => { if (s.total > 0) text += `- ${s.nama} : ${s.total} Santri\n`; });

    text += `\nTotal Santri Banin : ${stats.totalBanin} Santri\n`;
    text += `Total Santri Banat : ${stats.totalBanat} Santri\n`;
    text += `Total Global Santri : ${stats.totalMasukSakan} Santri\n\n`;

    text += `*Data santri dari ID Card*\n\n`;
    text += `1. Santri baru: *${stats.idCardBaru} Santri*\n`;
    text += `2. Santri lama: *${stats.idCardLama} Santri*\n`;
    text += `3. Jumlah keseluruhan (ID Card): *${stats.totalAmbilIdCard} Santri*\n\n`;

    if (stats.totalKSU > 0) {
      text += `Catatan: Terdapat *${stats.totalKSU} Santri (KSU)* yang menetap di sakan.\n\n`;
    }

    if (stats.listBelumIdCard.length > 0) {
      text += `Ada selisih ${stats.selisih} santri yang belum cek in/ sudah cek out:\n\n`;
      const grupSelisih: any = {};
      stats.listBelumIdCard.forEach((row: any) => {
        const sakan = row.lemari?.kamar?.sakan?.nama || "Tanpa Sakan";
        if (!grupSelisih[sakan]) grupSelisih[sakan] = [];
        grupSelisih[sakan].push(`${row.santri.nama} ${row.lemari?.nomor || ""}`);
      });
      Object.keys(grupSelisih).forEach(sakan => {
        text += `${sakan}\n`;
        grupSelisih[sakan].forEach((santri: string) => { text += `- ${santri}\n`; });
      });
    } else {
      text += `Alhamdulillah, tidak ada selisih santri.\n`;
    }

    navigator.clipboard.writeText(text);
    swalInfo("Berhasil Disalin!", "Silakan Paste (Tempel) di grup WhatsApp Muasis.");
  };

  const tahunUnik = Array.from(new Set(grafikData.map(g => g.tahun))).sort((a, b) => b - a);
  
  let grafikMurni = grafikData.filter(g => {
    let lolosTahun = filterTahun === "ALL" || g.tahun.toString() === filterTahun;
    let lolosMulai = filterMulai === "" || g.id >= parseInt(filterMulai);
    let lolosAkhir = filterAkhir === "" || g.id <= parseInt(filterAkhir);
    return lolosTahun && lolosMulai && lolosAkhir;
  });

  // Jika tidak ada filter yang digunakan (default state), hanya tampilkan 10 data paling baru
  let grafikDitampilkan = grafikMurni;
  const isDefaultView = filterTahun === "ALL" && filterMulai === "" && filterAkhir === "";
  if (isDefaultView && grafikDitampilkan.length > 10) {
    grafikDitampilkan = grafikDitampilkan.slice(-10);
  }

  const maxPendaftar = grafikDitampilkan.length > 0 ? Math.max(...grafikDitampilkan.map(g => {
    if (filterGender === "BANIN") return g.totalBanin;
    if (filterGender === "BANAT") return g.totalBanat;
    return g.totalPendaftar;
  })) : 1;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f4ff]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold text-blue-800">Memuat Command Center...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      
      {/* HEADER & TOMBOL WA */}
      <div className="mb-8 border-b border-blue-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900">Dashboard & Rekapitulasi</h1>
          <p className="text-blue-500 mt-1 font-medium">Pemantauan Global Sistem Administrasi Asrama</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-blue-400">Periode Berjalan:</p>
            <p className="text-xl font-black text-blue-700">{stats?.dufahNama}</p>
          </div>
          <button onClick={copyLaporanWA} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95">
            <span className="text-xl">📋</span> Copy Laporan WA
          </button>
        </div>
      </div>

      {/* 3 KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 border-l-4 border-l-blue-600 flex flex-col justify-center relative overflow-hidden hover:shadow-md transition-shadow">
          <p className="text-blue-500 font-bold text-sm z-10">Total Penghuni Sakan</p>
          <p className="text-4xl font-black text-blue-700 mt-2 z-10">{stats?.totalMasukSakan} <span className="text-lg font-medium text-blue-300">Santri</span></p>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">🏢</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 border-l-4 border-l-green-500 flex flex-col justify-center relative overflow-hidden hover:shadow-md transition-shadow">
          <p className="text-green-600 font-bold text-sm z-10">Selesai ID Card & Check-in</p>
          <p className="text-4xl font-black text-green-600 mt-2 z-10">{stats?.totalAmbilIdCard} <span className="text-lg font-medium text-green-300">Santri</span></p>
          
          {stats?.totalKSU > 0 && (
            <p className="text-xs font-bold text-purple-600 mt-1 z-10 bg-purple-50 inline-block px-2 py-0.5 rounded-md self-start border border-purple-200">
              + {stats?.totalKSU} (KSU)
            </p>
          )}

          <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">💳</div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border-l-4 flex flex-col justify-center relative overflow-hidden hover:shadow-md transition-shadow ${stats?.selisih > 0 ? 'bg-red-50 border border-red-100 border-l-red-500' : 'bg-white border border-gray-100 border-l-gray-400'}`}>
          <p className={`${stats?.selisih > 0 ? 'text-red-800' : 'text-gray-600'} font-bold text-sm z-10`}>Selisih (Belum ID Card)</p>
          <p className={`text-4xl font-black mt-2 z-10 ${stats?.selisih > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {stats?.selisih} <span className="text-lg font-medium opacity-50">Santri</span>
          </p>
          {stats?.selisih > 0 && <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">⚠️ Perlu tindakan!</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: GRAFIK */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-blue-50 pb-4 mb-6 gap-4">
            <h2 className="text-xl font-bold text-blue-900">📊 Grafik Pendaftar per Duf&apos;ah</h2>
            
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm w-full md:w-auto">
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="p-2 border border-blue-200 rounded-lg bg-white font-bold text-blue-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-300 w-full sm:w-auto">
                <option value="ALL">Semua Gender</option>
                <option value="BANIN">👨 Banin</option>
                <option value="BANAT">🧕 Banat</option>
              </select>

              <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="p-2 border border-blue-200 rounded-lg bg-white font-bold text-blue-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-300 w-full sm:w-auto">
                <option value="ALL">Semua Tahun</option>
                {tahunUnik.map(t => <option key={t} value={t.toString()}>{t}</option>)}
              </select>

              <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 w-full sm:w-auto overflow-hidden">
                <select value={filterMulai} onChange={(e) => setFilterMulai(e.target.value)} className="p-2 bg-transparent text-blue-700 outline-none cursor-pointer flex-1 min-w-0">
                  <option value="">Awal</option>
                  {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
                <span className="text-blue-400 font-bold shrink-0">-</span>
                <select value={filterAkhir} onChange={(e) => setFilterAkhir(e.target.value)} className="p-2 bg-transparent text-blue-700 outline-none cursor-pointer flex-1 min-w-0">
                  <option value="">Akhir</option>
                  {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="w-full mt-4 pb-2 relative z-10 overflow-x-auto overflow-y-hidden">
            {grafikDitampilkan.length === 0 ? (
              <div className="w-full text-center text-blue-300 italic py-10">Tidak ada data untuk filter ini.</div>
            ) : (
              <div className="h-[300px] relative" style={{ minWidth: `${Math.max(100, grafikDitampilkan.length * 60)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={grafikDitampilkan} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="nama" 
                      tick={{ fontSize: 10, fill: '#3b82f6', fontWeight: 600 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[0, 'dataMax + 10']}
                  />
                  <Tooltip
                    cursor={{ fill: '#eff6ff' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-blue-100 shadow-xl rounded-xl">
                            <p className="font-bold text-blue-900 border-b border-blue-50 pb-2 mb-2">
                              {data.nama} <span className="text-gray-400 text-sm font-medium">({data.tahun})</span>
                            </p>
                            {filterGender === "ALL" || filterGender === "BANIN" ? (
                              <p className="text-blue-600 font-bold text-sm">👨 Banin: {data.totalBanin}</p>
                            ) : null}
                            {filterGender === "ALL" || filterGender === "BANAT" ? (
                              <p className="text-pink-600 font-bold text-sm mt-1">🧕 Banat: {data.totalBanat}</p>
                            ) : null}
                            {filterGender === "ALL" && (
                              <p className="text-gray-700 font-bold border-t border-gray-100 mt-2 pt-2 text-sm">
                                Total: {data.totalPendaftar} Santri
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* Rendering logic based on filter */}
                  {filterGender === "ALL" && (
                    <>
                      <Bar dataKey="totalBanin" name="Banin" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={40} />
                      <Bar dataKey="totalBanat" name="Banat" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                    </>
                  )}
                  {filterGender === "BANIN" && (
                    <Bar dataKey="totalBanin" name="Banin" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={40} />
                  )}
                  {filterGender === "BANAT" && (
                    <Bar dataKey="totalBanat" name="Banat" fill="#ec4899" radius={[4, 4, 4, 4]} barSize={40} />
                  )}
                </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LIST SELISIH */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 flex flex-col h-[500px] lg:h-auto">
          <div className="bg-red-50 p-5 border-b border-red-100 rounded-t-2xl">
            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">🚨 Daftar Selisih</h2>
            <p className="text-xs text-red-600 mt-1 font-medium">Santri yang sudah masuk kamar tapi belum konfirmasi ID Card.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {stats?.listBelumIdCard.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-blue-300 opacity-70 p-6 text-center">
                <span className="text-4xl mb-2">🎉</span>
                <p className="font-bold">Aman! Selisih Nol.</p>
                <p className="text-sm">Semua santri sudah ambil kartu.</p>
              </div>
            ) : (
              <ul className="space-y-2 p-2">
                {stats?.listBelumIdCard.map((row: any, i: number) => (
                  <li key={row.id} className="bg-white p-3 border border-red-100 rounded-xl hover:bg-red-50 transition flex gap-3 items-center shadow-sm">
                    <div className="bg-red-100 text-red-800 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">{i + 1}</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm flex items-center gap-1">
                        {row.santri.nama}
                        <span className="text-[10px]">{row.santri.gender === 'BANAT' ? '🧕' : '👨'}</span>
                      </p>
                      <p className="text-[11px] text-red-500 font-bold mt-0.5">
                        {row.lemari.kamar.sakan.nama} | {row.lemari.kamar.nama}{row.lemari.nomor}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {stats?.listBelumIdCard.length > 0 && (
            <div className="p-4 border-t border-red-100 bg-red-50 text-center rounded-b-2xl">
              <Link href="/admin/id-card" className="text-red-700 font-bold text-sm hover:underline flex items-center justify-center gap-1">
                Tindak Lanjuti di Meja ID Card ➔
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}