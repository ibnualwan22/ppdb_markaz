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
  const [filterGender, setFilterGender] = useState("ALL"); 

  useEffect(() => {
    const muatData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setGrafikData(data.grafikData);
        }
      } catch (error) { console.error("Gagal memuat dashboard", error); }
      setLoading(false);
    };
    muatData();
  }, []);

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
    text += `3. Jumlah keseluruhan: *${stats.totalAmbilIdCard} Santri*\n\n`;

    if (stats.listBelumIdCard.length > 0) {
      text += `Ada selisih ${stats.selisih} santri yang belum cek in/ sudah cek out\n\n`;
      const grupSelisih: any = {};
      stats.listBelumIdCard.forEach((row: any) => {
        const sakan = row.lemari?.kamar?.sakan?.nama || "Tanpa Sakan";
        if (!grupSelisih[sakan]) grupSelisih[sakan] = [];
        grupSelisih[sakan].push(`${row.santri.nama} ${row.lemari?.kamar?.nama || ""}${row.lemari?.nomor || ""}`);
      });
      Object.keys(grupSelisih).forEach(sakan => {
        text += `${sakan}\n`;
        grupSelisih[sakan].forEach((santri: string) => { text += `- ${santri}\n`; });
      });
    } else {
      text += `Alhamdulillah, tidak ada selisih santri.\n`;
    }

    navigator.clipboard.writeText(text);
    alert("Laporan berhasil disalin! Silakan Paste (Tempel) di grup WhatsApp Muasis.");
  };

  const tahunUnik = Array.from(new Set(grafikData.map(g => g.tahun))).sort((a, b) => b - a);
  
  let grafikDitampilkan = grafikData.filter(g => {
    let lolosTahun = filterTahun === "ALL" || g.tahun.toString() === filterTahun;
    let lolosMulai = filterMulai === "" || g.id >= parseInt(filterMulai);
    let lolosAkhir = filterAkhir === "" || g.id <= parseInt(filterAkhir);
    return lolosTahun && lolosMulai && lolosAkhir;
  });

  const maxPendaftar = grafikDitampilkan.length > 0 ? Math.max(...grafikDitampilkan.map(g => {
    if (filterGender === "BANIN") return g.totalBanin;
    if (filterGender === "BANAT") return g.totalBanat;
    return g.totalPendaftar;
  })) : 1;

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Memuat Command Center...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      
      {/* HEADER & TOMBOL WA */}
      <div className="mb-8 border-b border-gray-300 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard & Rekapitulasi</h1>
          <p className="text-gray-500 mt-1">Pemantauan Global Sistem Administrasi Asrama</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-400">Periode Berjalan:</p>
            <p className="text-xl font-black text-green-700">{stats?.dufahNama}</p>
          </div>
          <button onClick={copyLaporanWA} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-md flex items-center gap-2 transition active:scale-95">
            <span className="text-xl">📋</span> Copy Laporan WA
          </button>
        </div>
      </div>

      {/* 3 KARTU STATISTIK */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: GRAFIK */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col">
          
          {/* HEADER GRAFIK & FILTER (Dirapikan) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">📊 Grafik Pendaftar per Duf'ah</h2>
            
            <div className="flex flex-wrap items-center gap-2 text-sm justify-end w-full md:w-auto">
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="p-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-700 outline-none cursor-pointer">
                <option value="ALL">Semua Gender</option>
                <option value="BANIN">👨 Banin (Putra)</option>
                <option value="BANAT">🧕 Banat (Putri)</option>
              </select>

              <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="p-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-700 outline-none cursor-pointer">
                <option value="ALL">Semua Tahun</option>
                {tahunUnik.map(t => <option key={t} value={t.toString()}>{t}</option>)}
              </select>

              <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded-lg px-2">
                <select value={filterMulai} onChange={(e) => setFilterMulai(e.target.value)} className="p-2 bg-transparent text-gray-700 outline-none cursor-pointer max-w-[90px]">
                  <option value="">Awal</option>
                  {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
                <span className="text-gray-400 font-bold">-</span>
                <select value={filterAkhir} onChange={(e) => setFilterAkhir(e.target.value)} className="p-2 bg-transparent text-gray-700 outline-none cursor-pointer max-w-[90px]">
                  <option value="">Akhir</option>
                  {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* AREA RENDER GRAFIK BARS */}
          <div className="flex-1 flex items-end gap-2 h-64 mt-4 overflow-x-auto pb-2">
            {grafikDitampilkan.length === 0 ? (
              <div className="w-full text-center text-gray-400 italic mb-10">Tidak ada data untuk filter ini.</div>
            ) : (
              grafikDitampilkan.map((item) => {
                
                let topNumber = item.totalPendaftar;
                if (filterGender === "BANIN") topNumber = item.totalBanin;
                if (filterGender === "BANAT") topNumber = item.totalBanat;

                // Proporsi Tinggi Tiang
                const tinggiTotal = maxPendaftar === 0 ? 0 : (item.totalPendaftar / maxPendaftar) * 100;
                const tinggiBanin = maxPendaftar === 0 ? 0 : (item.totalBanin / maxPendaftar) * 100;
                const tinggiBanat = maxPendaftar === 0 ? 0 : (item.totalBanat / maxPendaftar) * 100;

                let tooltip = `${item.totalPendaftar} Santri\n(👨 ${item.totalBanin} | 🧕 ${item.totalBanat})`;
                if (filterGender === "BANIN") tooltip = `${item.totalBanin} Banin`;
                if (filterGender === "BANAT") tooltip = `${item.totalBanat} Banat`;

                return (
                  <div key={item.id} className="flex flex-col items-center justify-end group min-w-[50px] flex-1 h-full">
                    
                    <div className="relative w-full flex justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-1 text-xs font-bold text-white bg-gray-800 px-2 py-1 rounded pointer-events-none z-10 whitespace-pre text-center">
                        {tooltip}
                      </span>
                    </div>

                    {/* Pembungkus Tiang Grafik (Fix Layout) */}
                    <div className="w-full flex-1 flex flex-col justify-end items-center">
                      <span className={`text-xs font-bold mb-1 ${filterGender === 'BANAT' ? 'text-pink-600' : filterGender === 'BANIN' ? 'text-blue-600' : 'text-gray-700'}`}>
                        {topNumber}
                      </span>
                      
                      {/* Tiang Warna */}
                      <div className="w-full flex-1 flex flex-col justify-end relative">
                        {filterGender === "ALL" && topNumber > 0 && (
                          <div className="w-full absolute bottom-0 flex flex-col justify-end transition-all" style={{ height: `${tinggiTotal}%`, minHeight: '4px' }}>
                            <div className="w-full bg-pink-500 hover:bg-pink-600 rounded-t-md border-b border-white/20 transition-all" style={{ height: `${(item.totalBanat / item.totalPendaftar) * 100}%` }}></div>
                            <div className="w-full bg-blue-500 hover:bg-blue-600 transition-all" style={{ height: `${(item.totalBanin / item.totalPendaftar) * 100}%` }}></div>
                          </div>
                        )}
                        
                        {filterGender === "BANIN" && (
                          <div className="w-full absolute bottom-0 bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all" style={{ height: `${tinggiBanin}%`, minHeight: '4px' }}></div>
                        )}
                        
                        {filterGender === "BANAT" && (
                          <div className="w-full absolute bottom-0 bg-pink-500 hover:bg-pink-600 rounded-t-md transition-all" style={{ height: `${tinggiBanat}%`, minHeight: '4px' }}></div>
                        )}

                        {filterGender === "ALL" && topNumber === 0 && (
                          <div className="w-full absolute bottom-0 bg-gray-200 rounded-t-md" style={{ height: `0%`, minHeight: '4px' }}></div>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-[10px] text-gray-500 mt-2 font-semibold text-center leading-tight h-8 flex items-start justify-center">
                      {item.nama}<br/>({item.tahun})
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LIST SELISIH */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col h-[500px] lg:h-auto">
          <div className="bg-red-50 p-5 border-b border-red-100 rounded-t-2xl">
            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">🚨 Daftar Selisih</h2>
            <p className="text-xs text-red-600 mt-1 font-medium">Santri yang sudah masuk kamar tapi belum konfirmasi ID Card.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {stats?.listBelumIdCard.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-70 p-6 text-center">
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

          {/* TOMBOL LINK ID CARD (DIKEMBALIKAN) */}
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