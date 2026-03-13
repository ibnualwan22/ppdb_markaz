"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// SVG Icon Components
const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const IconCreditCard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconSparkles = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
const IconChartBar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);
const IconMale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-blue-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);
const IconFemale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-pink-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

export default function AdminDashboardHome() {
  const [stats, setStats] = useState<any>(null);
  const [grafikData, setGrafikData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterTahun, setFilterTahun] = useState("ALL");
  const [filterMulai, setFilterMulai] = useState("");
  const [filterAkhir, setFilterAkhir] = useState("");
  const [filterGender, setFilterGender] = useState("ALL"); 

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
    const interval = setInterval(() => { muatData(true); }, 3000);
    return () => clearInterval(interval);
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
            <IconClipboard /> Copy Laporan WA
          </button>
        </div>
      </div>

      {/* 3 KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 border-l-4 border-l-blue-600 flex flex-col justify-center relative overflow-hidden hover:shadow-md transition-shadow">
          <p className="text-blue-500 font-bold text-sm z-10">Total Penghuni Sakan</p>
          <p className="text-4xl font-black text-blue-700 mt-2 z-10">{stats?.totalMasukSakan} <span className="text-lg font-medium text-blue-300">Santri</span></p>
          <div className="absolute -right-2 -bottom-2"><IconBuilding /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 border-l-4 border-l-green-500 flex flex-col justify-center relative overflow-hidden hover:shadow-md transition-shadow">
          <p className="text-green-600 font-bold text-sm z-10">Selesai ID Card & Check-in</p>
          <p className="text-4xl font-black text-green-600 mt-2 z-10">{stats?.totalAmbilIdCard} <span className="text-lg font-medium text-green-300">Santri</span></p>
          
          {stats?.totalKSU > 0 && (
            <p className="text-xs font-bold text-purple-600 mt-1 z-10 bg-purple-50 inline-block px-2 py-0.5 rounded-md self-start border border-purple-200">
              + {stats?.totalKSU} (KSU)
            </p>
          )}

          <div className="absolute -right-2 -bottom-2"><IconCreditCard /></div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border-l-4 flex flex-col justify-center relative overflow-hidden hover:shadow-md transition-shadow ${stats?.selisih > 0 ? 'bg-red-50 border border-red-100 border-l-red-500' : 'bg-white border border-gray-100 border-l-gray-400'}`}>
          <p className={`${stats?.selisih > 0 ? 'text-red-800' : 'text-gray-600'} font-bold text-sm z-10`}>Selisih (Belum ID Card)</p>
          <p className={`text-4xl font-black mt-2 z-10 ${stats?.selisih > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {stats?.selisih} <span className="text-lg font-medium opacity-50">Santri</span>
          </p>
          {stats?.selisih > 0 && <p className="text-xs text-red-500 mt-2 font-bold animate-pulse flex items-center gap-1"><IconWarning /> Perlu tindakan!</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: GRAFIK */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-blue-50 pb-4 mb-6 gap-4">
            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2"><IconChartBar /> Grafik Pendaftar per Duf&apos;ah</h2>
            
            <div className="flex flex-wrap items-center gap-2 text-sm justify-end w-full md:w-auto">
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="p-2 border border-blue-200 rounded-lg bg-white font-bold text-blue-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-300">
                <option value="ALL">Semua Gender</option>
                <option value="BANIN">Banin (Putra)</option>
                <option value="BANAT">Banat (Putri)</option>
              </select>

              <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="p-2 border border-blue-200 rounded-lg bg-white font-bold text-blue-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-300">
                <option value="ALL">Semua Tahun</option>
                {tahunUnik.map(t => <option key={t} value={t.toString()}>{t}</option>)}
              </select>

              <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2">
                <select value={filterMulai} onChange={(e) => setFilterMulai(e.target.value)} className="p-2 bg-transparent text-blue-700 outline-none cursor-pointer max-w-[90px]">
                  <option value="">Awal</option>
                  {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
                <span className="text-blue-400 font-bold">-</span>
                <select value={filterAkhir} onChange={(e) => setFilterAkhir(e.target.value)} className="p-2 bg-transparent text-blue-700 outline-none cursor-pointer max-w-[90px]">
                  <option value="">Akhir</option>
                  {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* LEGEND */}
          <div className="flex items-center gap-4 mb-4 text-xs font-bold">
            {filterGender === "ALL" && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span> Banin</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-pink-500 inline-block"></span> Banat</span>
              </>
            )}
            {filterGender === "BANIN" && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span> Banin</span>}
            {filterGender === "BANAT" && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-pink-500 inline-block"></span> Banat</span>}
          </div>

          <div className="flex-1 flex items-end gap-1.5 md:gap-2 h-64 mt-2 overflow-x-auto pb-2">
            {grafikDitampilkan.length === 0 ? (
              <div className="w-full text-center text-blue-300 italic mb-10">Tidak ada data untuk filter ini.</div>
            ) : (
              grafikDitampilkan.map((item) => {
                
                let topNumber = item.totalPendaftar;
                if (filterGender === "BANIN") topNumber = item.totalBanin;
                if (filterGender === "BANAT") topNumber = item.totalBanat;

                const tinggiTotal = maxPendaftar === 0 ? 0 : (item.totalPendaftar / maxPendaftar) * 100;
                const tinggiBanin = maxPendaftar === 0 ? 0 : (item.totalBanin / maxPendaftar) * 100;
                const tinggiBanat = maxPendaftar === 0 ? 0 : (item.totalBanat / maxPendaftar) * 100;

                let tooltip = `${item.totalPendaftar} Santri\n(${item.totalBanin} Banin | ${item.totalBanat} Banat)`;
                if (filterGender === "BANIN") tooltip = `${item.totalBanin} Banin`;
                if (filterGender === "BANAT") tooltip = `${item.totalBanat} Banat`;

                return (
                  <div key={item.id} className="flex flex-col items-center justify-end group min-w-[44px] flex-1 h-full">
                    
                    <div className="relative w-full flex justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full mb-2 text-[10px] font-bold text-white bg-blue-900 px-2.5 py-1.5 rounded-lg pointer-events-none z-10 whitespace-pre text-center shadow-lg">
                        {tooltip}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-900"></span>
                      </span>
                    </div>

                    <div className="w-full flex-1 flex flex-col justify-end items-center">
                      <span className={`text-[10px] md:text-xs font-black mb-1.5 ${filterGender === 'BANAT' ? 'text-pink-600' : filterGender === 'BANIN' ? 'text-blue-600' : 'text-blue-700'}`}>
                        {topNumber}
                      </span>
                      
                      <div className="w-full flex-1 flex flex-col justify-end relative px-0.5">
                        {filterGender === "ALL" && topNumber > 0 && (
                          <div className="w-full absolute bottom-0 flex flex-col justify-end transition-all duration-500 ease-out" style={{ height: `${tinggiTotal}%`, minHeight: '4px' }}>
                            <div className="w-full bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-md transition-all hover:brightness-110" style={{ height: `${(item.totalBanat / item.totalPendaftar) * 100}%` }}></div>
                            <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:brightness-110" style={{ height: `${(item.totalBanin / item.totalPendaftar) * 100}%` }}></div>
                          </div>
                        )}
                        
                        {filterGender === "BANIN" && (
                          <div className="w-full absolute bottom-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500 ease-out hover:brightness-110" style={{ height: `${tinggiBanin}%`, minHeight: '4px' }}></div>
                        )}
                        
                        {filterGender === "BANAT" && (
                          <div className="w-full absolute bottom-0 bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-md transition-all duration-500 ease-out hover:brightness-110" style={{ height: `${tinggiBanat}%`, minHeight: '4px' }}></div>
                        )}

                        {filterGender === "ALL" && topNumber === 0 && (
                          <div className="w-full absolute bottom-0 bg-blue-100 rounded-t-md" style={{ height: `0%`, minHeight: '4px' }}></div>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-[9px] md:text-[10px] text-blue-500 mt-2 font-semibold text-center leading-tight h-8 flex items-start justify-center">
                      {item.nama}<br/>({item.tahun})
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LIST SELISIH */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 flex flex-col h-[500px] lg:h-auto">
          <div className="bg-red-50 p-5 border-b border-red-100 rounded-t-2xl">
            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2"><IconAlert /> Daftar Selisih</h2>
            <p className="text-xs text-red-600 mt-1 font-medium">Santri yang sudah masuk kamar tapi belum konfirmasi ID Card.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {stats?.listBelumIdCard.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-blue-300 opacity-70 p-6 text-center">
                <IconSparkles />
                <p className="font-bold mt-2">Aman! Selisih Nol.</p>
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
                        {row.santri.gender === 'BANAT' ? <IconFemale /> : <IconMale />}
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
                Tindak Lanjuti di Meja ID Card <IconArrowRight />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}