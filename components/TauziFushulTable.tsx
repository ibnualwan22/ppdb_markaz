"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

type SantriData = {
  santriId: string;
  nama: string;
  gender: string;
  kategori: string;
  nis: string | null;
  program: string;
  riwayatId: string;
  nilaiTauzi: number | null;
  kelasRekomendasi: string | null;
};

interface Props {
  initialData: SantriData[];
}

// Opsi kelas untuk dropdown rekomendasi. 
// Bisa diambil dari data unik program yang ada, tapi karena di foto ada:
// SHIFR, I'DAD AWWAL, I'DAD TSANI, ATIQOH, TAKHOSSUS AWWAL, TAKHOSSUS TSANI
const opsiKelas = [
  "SHIFR",
  "I'DAD AWWAL",
  "I'DAD TSANI",
  "ATIQOH",
  "TAKHOSSUS AWWAL",
  "TAKHOSSUS TSANI",
  "SYARQI AWWAL",
  "SYARQI TSANI"
];

export default function TauziFushulTable({ initialData }: Props) {
  const [data, setData] = useState<SantriData[]>(initialData);
  const [activeTab, setActiveTab] = useState<string>("");
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const programs = Array.from(new Set(data.map((d) => d.program))).sort((a, b) => a.localeCompare(b));
  if (programs.length > 0 && !activeTab) {
    setActiveTab(programs[0]);
  }

  const filteredData = searchQuery.trim() !== "" 
    ? data.filter((d) => d.nama.toLowerCase().includes(searchQuery.toLowerCase()))
    : data.filter((d) => d.program === activeTab);

  const handleUpdate = async (riwayatId: string, field: string, value: string | number | null) => {
    const parsedValue = field === "nilaiTauzi" ? (value === "" ? null : Number(value)) : value;

    setData((prev) =>
      prev.map((item) =>
        item.riwayatId === riwayatId ? { ...item, [field]: parsedValue } : item
      )
    );

    setIsSaving(riwayatId);
    try {
      const itemToUpdate = data.find((d) => d.riwayatId === riwayatId);
      if (!itemToUpdate) return;

      const payload = {
        nilaiTauzi: field === "nilaiTauzi" ? parsedValue : itemToUpdate.nilaiTauzi,
        kelasRekomendasi: field === "kelasRekomendasi" ? parsedValue : itemToUpdate.kelasRekomendasi,
      };

      await fetch(`/api/tauzi-fushul/${riwayatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(null);
    }
  };

  const exportExcel = (type: "ALL" | "BELUM_TAUZI") => {
    let exportData = data;
    if (type === "BELUM_TAUZI") {
      exportData = data.filter((d) => d.nilaiTauzi === null || d.nilaiTauzi === undefined || d.nilaiTauzi.toString() === "");
    }

    const wsData = exportData.map((d) => ({
      NAMA: d.nama,
      NILAI: d.nilaiTauzi ?? "",
      "KELAS REKOMENDASI": d.kelasRekomendasi ?? d.program,
      PROGRAM_SAAT_INI: d.program,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Tauzi Fushul");

    const filename = "Laporan_Tauzi_Fushul_Global.xlsx";
    XLSX.writeFile(wb, filename);
  };

  const generateWaReport = () => {
    // Filter santri yang nilainya masih kosong
    const belumTauzi = data.filter((d) => d.nilaiTauzi === null || d.nilaiTauzi === undefined || (d.nilaiTauzi as any) === "" || Number.isNaN(d.nilaiTauzi as any));

    if (belumTauzi.length === 0) {
      alert("Alhamdulillah, semua santri sudah mendapatkan nilai.");
      return;
    }

    let text = `📋 *Laporan Santri Belum Tauzi' Fushul *\nTotal: ${belumTauzi.length} santri\n\n`;

    const programsUnik = Array.from(new Set(belumTauzi.map(d => d.program)));

    programsUnik.forEach(prog => {
      text += `*Program: ${prog}*\n`;
      const santriProg = belumTauzi.filter(d => d.program === prog);
      santriProg.forEach((s, idx) => {
        text += `${idx + 1}. ${s.nama}\n`;
      });
      text += `\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      alert("Berhasil disalin! Silakan paste (tempel) di WhatsApp.");
    }).catch(() => {
      alert("Gagal menyalin teks. Silakan coba lagi.");
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-8 bg-dark-800/80 backdrop-blur-md rounded-3xl border border-gold-500/20 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-white border-l-4 border-gold-500 pl-3">Daftar Santri & Pre-Test</h2>
        <div className="flex gap-3">
          <button
            onClick={generateWaReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-dark-900 border border-gold-500/30 hover:bg-dark-700 hover:border-gold-500/60 text-gold-500 rounded-xl font-bold transition-all shadow-sm text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Salin WA Belum Tauzi
          </button>
          <button
            onClick={() => exportExcel("ALL")}
            className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-black rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)] font-extrabold transition-all text-sm"
          >
            Export Semua (Global)
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama santri (Global)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-900 border border-gold-500/20 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all text-sm"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto gap-3 mb-6 pb-2 scrollbar-hide">
        {programs.map((prog) => (
          <button
            key={prog}
            onClick={() => setActiveTab(prog)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-bold transition-all border ${activeTab === prog
                ? "bg-gold-500 text-black border-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "bg-dark-900 text-gray-400 border-dark-700 hover:border-gold-500/40 hover:text-gray-200"
              }`}
          >
            {prog}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-gold-500/20 shadow-inner bg-dark-900">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-dark-900 border-b border-gold-500/20">
            <tr>
              <th className="px-6 py-4 font-bold text-gold-500">NAMA</th>
              <th className="px-6 py-4 font-bold text-gold-500 w-32">NILAI</th>
              <th className="px-6 py-4 font-bold text-gold-500 w-64">KELAS REKOMENDASI</th>
              <th className="px-6 py-4 text-center font-bold text-gold-500 w-32">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-500/5">
            {filteredData.map((item) => (
              <tr key={item.santriId} className="hover:bg-dark-800/60 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-200">{item.nama}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold text-white ${item.gender === 'BANIN' ? 'bg-blue-600' : 'bg-pink-600'}`}>
                      {item.gender}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold text-white ${item.kategori === 'LAMA' ? 'bg-orange-500' : 'bg-green-500'}`}>
                      {item.kategori}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={item.nilaiTauzi ?? ""}
                    onChange={(e) => handleUpdate(item.riwayatId, "nilaiTauzi", e.target.value)}
                    placeholder="Kosong"
                    className="w-full min-w-[100px] px-4 py-2 border border-dark-700 bg-dark-900 rounded-xl focus:outline-none focus:border-gold-500/60 text-white shadow-inner [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-gray-600 text-center font-bold"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={item.kelasRekomendasi || item.program}
                    onChange={(e) => handleUpdate(item.riwayatId, "kelasRekomendasi", e.target.value)}
                    className="w-full min-w-[200px] px-4 py-2 border border-dark-700 bg-dark-900 rounded-xl focus:outline-none focus:border-gold-500/60 text-white shadow-inner font-semibold"
                  >
                    <option value={item.program}>{item.program} (Bawaan)</option>
                    {opsiKelas.map(
                      (opt) =>
                        opt !== item.program && (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        )
                    )}
                  </select>
                </td>
                <td className="px-6 py-4 text-center">
                  {isSaving === item.riwayatId ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                      Menyimpan...
                    </span>
                  ) : item.nilaiTauzi !== null && item.nilaiTauzi !== undefined && item.nilaiTauzi.toString() !== "" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Tersimpan
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-dark-700 text-gray-400 border border-gray-600">
                      Belum
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic font-medium">
                  Tidak ada santri di program ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
