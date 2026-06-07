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
    } catch (error) { }
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
    <div className="flex items-center justify-center min-h-screen relative">
      <div className="text-center z-10">
        <div className="w-16 h-16 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(158,129,35,0.5)]"></div>
        <p className="font-bold text-gold-500">Memuat Command Center...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">

      {/* HEADER & TOMBOL WA */}
      <div className="mb-8 border-b border-gold-500/20 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gold-500">Dashboard & Rekapitulasi</h1>
          <p className="text-gray-400 mt-1 font-medium">Pemantauan Global Sistem Administrasi Asrama</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-400">Periode Berjalan:</p>
            <p className="text-xl font-black text-gold-400">{stats?.dufahNama}</p>
          </div>
          <button onClick={copyLaporanWA} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black font-bold py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-2 transition-all active:scale-95">
            <span className="text-xl">📋</span> Copy Laporan WA
          </button>
        </div>
      </div>

      {/* 4 KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8 relative z-10">

        {/* KARTU 1: ADMINISTRASI PENDAFTARAN (GLOBAL) */}
        <div className="bg-dark-800 p-5 rounded-2xl shadow-sm border border-gold-500/20 border-l-4 border-l-gold-500 flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-gold-500 font-bold text-xs uppercase tracking-wider">Total Pendaftar Global</p>
            <p className="text-4xl font-black text-gold-400 mt-2">{stats?.totalPendaftar} <span className="text-base font-medium text-gray-500">Santri</span></p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 z-10">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
              🆕 Baru: {stats?.totalPendaftarBaru}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">
              🔄 Lama: {stats?.totalPendaftarLama}
            </span>
            {stats?.totalPendaftarKSU > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
                🎓 KSU: {stats?.totalPendaftarKSU}
              </span>
            )}
          </div>
          <div className="absolute -right-3 -bottom-3 text-6xl opacity-[0.04]">📋</div>
        </div>

        {/* KARTU 2: STATUS KEUANGAN */}
        <div className="bg-dark-800 p-5 rounded-2xl shadow-sm border border-gold-500/20 border-l-4 border-l-emerald-500 flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Status Keuangan</p>
            <p className="text-4xl font-black text-emerald-400 mt-2">{stats?.totalLunas} <span className="text-base font-medium text-gray-500">Lunas</span></p>
          </div>
          {/* Progress bar */}
          <div className="mt-3 z-10">
            <div className="w-full h-2.5 bg-dark-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700"
                style={{ width: stats?.totalPendaftar > 0 ? `${(stats.totalLunas / stats.totalPendaftar) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] font-bold text-emerald-400">✅ {stats?.totalLunas} Lunas</span>
              <span className="text-[10px] font-bold text-amber-400">⏳ {stats?.totalBelumLunas} Pending</span>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-3 text-6xl opacity-[0.04]">💰</div>
        </div>

        {/* KARTU 3: PENEMPATAN HUNIAN */}
        <div className="bg-dark-800 p-5 rounded-2xl shadow-sm border border-gold-500/20 border-l-4 border-l-sky-500 flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-sky-400 font-bold text-xs uppercase tracking-wider">Penempatan Hunian</p>
            <p className="text-4xl font-black text-sky-400 mt-2">{stats?.totalMasukSakan} <span className="text-base font-medium text-gray-500">di Sakan</span></p>
          </div>
          {/* Progress bar */}
          <div className="mt-3 z-10">
            <div className="w-full h-2.5 bg-dark-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: stats?.totalPendaftar > 0 ? `${(stats.totalMasukSakan / stats.totalPendaftar) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] font-bold text-sky-400">🏠 {stats?.totalMasukSakan} Dapat Kamar</span>
              <span className="text-[10px] font-bold text-gray-500">🚫 {stats?.totalBelumDapatKamar > 0 ? stats.totalBelumDapatKamar : 0} Belum</span>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-3 text-6xl opacity-[0.04]">🏘️</div>
        </div>

        {/* KARTU 4: SERAH TERIMA CHECK-IN */}
        <div className={`p-5 rounded-2xl shadow-sm border-l-4 flex flex-col justify-between relative overflow-hidden ${stats?.selisih > 0 ? 'bg-dark-800 border border-amber-500/20 border-l-amber-500' : 'bg-dark-800 border border-gold-500/20 border-l-green-500'}`}>
          <div className="z-10">
            <p className={`font-bold text-xs uppercase tracking-wider ${stats?.selisih > 0 ? 'text-amber-400' : 'text-green-400'}`}>
              Check-In (ID Card)
            </p>
            <p className={`text-4xl font-black mt-2 ${stats?.selisih > 0 ? 'text-amber-400' : 'text-green-400'}`}>
              {stats?.totalAmbilIdCard} <span className="text-base font-medium text-gray-500">Check In</span>
            </p>
          </div>
          {/* Progress bar */}
          <div className="mt-3 z-10">
            <div className="w-full h-2.5 bg-dark-900 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${stats?.selisih > 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
                style={{ width: stats?.totalMasukSakan > 0 ? `${((stats.totalAmbilIdCard + (stats?.totalKSU || 0)) / stats.totalMasukSakan) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] font-bold text-green-400">
                💳 {stats?.totalAmbilIdCard}
                {stats?.totalKSU > 0 && <span className="text-purple-400"> +{stats.totalKSU} KSU</span>}
              </span>
              {stats?.selisih > 0 && (
                <span className="text-[10px] font-bold text-red-400 animate-pulse">⚠️ {stats.selisih} Belum</span>
              )}
            </div>
          </div>
          <div className="absolute -right-3 -bottom-3 text-6xl opacity-[0.04]">💳</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

        {/* KOLOM KIRI: GRAFIK */}
        <div className="lg:col-span-2 bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 p-6 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gold-500/10 pb-4 mb-6 gap-4">
            <h2 className="text-xl font-bold text-gold-500">Grafik Pendaftar per Duf&apos;ah</h2>

            <div className="flex flex-wrap items-center justify-end gap-2 text-sm w-full md:w-auto">
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="p-2 border border-dark-900 rounded-lg bg-dark-900 font-bold text-gold-500 outline-none cursor-pointer focus:ring-1 focus:ring-gold-500/50 w-full sm:w-auto shadow-inner">
                <option value="ALL">Semua Gender</option>
                <option value="BANIN">👨 Banin</option>
                <option value="BANAT">🧕 Banat</option>
              </select>

              <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="p-2 border border-dark-900 rounded-lg bg-dark-900 font-bold text-gold-500 outline-none cursor-pointer focus:ring-1 focus:ring-gold-500/50 w-full sm:w-auto shadow-inner">
                <option value="ALL">Semua Tahun</option>
                {tahunUnik.map(t => <option key={t} value={t.toString()}>{t}</option>)}
              </select>

              <div className="flex items-center gap-1 bg-dark-900 border border-dark-900 rounded-lg px-2 w-full sm:w-auto overflow-hidden shadow-inner">
                <select value={filterMulai} onChange={(e) => setFilterMulai(e.target.value)} className="p-2 bg-transparent text-gold-500 outline-none cursor-pointer flex-1 min-w-0 font-bold">
                  <option value="">Awal</option>
                  {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
                <span className="text-gold-600 font-bold shrink-0">-</span>
                <select value={filterAkhir} onChange={(e) => setFilterAkhir(e.target.value)} className="p-2 bg-transparent text-gold-500 outline-none cursor-pointer flex-1 min-w-0 font-bold">
                  <option value="">Akhir</option>
                  {grafikData.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="w-full mt-4 pb-2 relative z-10 overflow-x-auto overflow-y-hidden">
            {grafikDitampilkan.length === 0 ? (
              <div className="w-full text-center text-gray-500 italic py-10">Tidak ada data untuk filter ini.</div>
            ) : (
              <div className="h-[300px] relative" style={{ minWidth: `${Math.max(100, grafikDitampilkan.length * 60)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={grafikDitampilkan} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="nama"
                      tick={{ fontSize: 10, fill: '#ba9a2f', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 'dataMax + 10']}
                    />
                    <Tooltip
                      cursor={{ fill: '#ffffff10' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-dark-900 p-3 border border-gold-500/20 shadow-xl rounded-xl">
                              <p className="font-bold text-gold-400 border-b border-gold-500/10 pb-2 mb-2">
                                {data.nama} <span className="text-gray-500 text-sm font-medium">({data.tahun})</span>
                              </p>
                              {filterGender === "ALL" || filterGender === "BANIN" ? (
                                <p className="text-blue-400 font-bold text-sm">👨 Banin: {data.totalBanin}</p>
                              ) : null}
                              {filterGender === "ALL" || filterGender === "BANAT" ? (
                                <p className="text-pink-400 font-bold text-sm mt-1">🧕 Banat: {data.totalBanat}</p>
                              ) : null}
                              {filterGender === "ALL" && (
                                <p className="text-gray-300 font-bold border-t border-gray-700 mt-2 pt-2 text-sm">
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
        <div className="bg-dark-800 rounded-2xl shadow-sm border border-red-900/50 flex flex-col h-[500px] lg:h-auto overflow-hidden">
          <div className="bg-red-900/20 p-5 border-b border-red-900/50 rounded-t-2xl">
            <h2 className="text-lg font-bold text-red-500 flex items-center gap-2">🚨 Daftar Selisih</h2>
            <p className="text-xs text-red-400 mt-1 font-medium">Santri yang sudah masuk kamar tapi belum konfirmasi ID Card.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {stats?.listBelumIdCard.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-70 p-6 text-center">
                <span className="text-4xl mb-2">🎉</span>
                <p className="font-bold">Aman! Selisih Nol.</p>
                <p className="text-sm">Semua santri sudah ambil kartu.</p>
              </div>
            ) : (
              <ul className="space-y-2 p-2">
                {stats?.listBelumIdCard.map((row: any, i: number) => (
                  <li key={row.id} className="bg-dark-900 p-3 border border-red-900/30 rounded-xl hover:bg-red-900/10 transition flex gap-3 items-center shadow-sm">
                    <div className="bg-red-900/50 text-red-500 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-red-500/30">{i + 1}</div>
                    <div>
                      <p className="font-bold text-gray-200 text-sm flex items-center gap-1">
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
            <div className="p-4 border-t border-red-900/50 bg-red-900/20 text-center rounded-b-2xl">
              <Link href="/admin/id-card" className="text-red-500 font-bold text-sm hover:underline flex items-center justify-center gap-1">
                Tindak Lanjuti di Meja ID Card ➔
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}