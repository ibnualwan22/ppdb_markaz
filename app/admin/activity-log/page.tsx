"use client";

import { useState, useEffect, useCallback } from "react";
import { Protect } from "@/components/Protect";

interface LogEntry {
  id: string;
  aksi: string;
  modul: string;
  deskripsi: string;
  namaUser: string;
  targetId: string | null;
  createdAt: string;
}

const AKSI_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  CREATE: { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-400", label: "Tambah" },
  UPDATE: { bg: "bg-blue-500/15 border-blue-500/30", text: "text-blue-400", label: "Edit" },
  DELETE: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-400", label: "Hapus" },
  VERIFY: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-400", label: "Verifikasi" },
};

function formatWIB(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterModul, setFilterModul] = useState("");
  const [filterAksi, setFilterAksi] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Filter options from API
  const [userOptions, setUserOptions] = useState<string[]>([]);
  const [modulOptions, setModulOptions] = useState<string[]>([]);

  const fetchLogs = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "50" });
      if (filterModul) params.set("modul", filterModul);
      if (filterAksi) params.set("aksi", filterAksi);
      if (filterUser) params.set("user", filterUser);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

      const res = await fetch(`/api/activity-log?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
        if (data.filters) {
          setUserOptions(data.filters.users || []);
          setModulOptions(data.filters.modules || []);
        }
      }
    } catch { }
    setLoading(false);
  }, [filterModul, filterAksi, filterUser, filterDateFrom, filterDateTo]); // removed 'page' from dependencies to prevent infinite loop on pagination

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setPage(p);
      fetchLogs(p);
    }
  };

  const resetFilters = () => {
    setFilterModul("");
    setFilterAksi("");
    setFilterUser("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilter = filterModul || filterAksi || filterUser || filterDateFrom || filterDateTo;

  return (
    <Protect permission="view_activity_log" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin untuk melihat Log Aktivitas.</div>}>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen">

        {/* HEADER */}
        <div className="mb-8 border-b border-gold-500/10 pb-6">
          <h1 className="text-3xl font-extrabold text-gold-500 flex items-center gap-3">
            <span className="bg-gold-500/10 p-2.5 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            Log Aktivitas
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Audit trail seluruh aksi yang dilakukan di dalam sistem. Data otomatis terhapus setelah 30 hari.</p>
        </div>

        {/* FILTER PANEL */}
        <div className="bg-dark-800 p-5 rounded-2xl shadow-sm border border-gold-500/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter Log
              {hasActiveFilter && (
                <span className="bg-gold-500/20 text-gold-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-gold-500/30">Aktif</span>
              )}
            </label>
            {hasActiveFilter && (
              <button onClick={resetFilters} className="text-xs font-bold text-gray-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Filter User */}
            <div>
              <label className="block text-[11px] text-gray-500 font-bold mb-1.5 uppercase tracking-wider">Pelaku</label>
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="w-full p-2.5 border border-dark-900 rounded-xl outline-none font-bold text-sm shadow-inner focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200"
              >
                <option value="">Semua User</option>
                {userOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Filter Modul */}
            <div>
              <label className="block text-[11px] text-gray-500 font-bold mb-1.5 uppercase tracking-wider">Modul</label>
              <select
                value={filterModul}
                onChange={e => setFilterModul(e.target.value)}
                className="w-full p-2.5 border border-dark-900 rounded-xl outline-none font-bold text-sm shadow-inner focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200"
              >
                <option value="">Semua Modul</option>
                {modulOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Filter Aksi */}
            <div>
              <label className="block text-[11px] text-gray-500 font-bold mb-1.5 uppercase tracking-wider">Jenis Aksi</label>
              <select
                value={filterAksi}
                onChange={e => setFilterAksi(e.target.value)}
                className="w-full p-2.5 border border-dark-900 rounded-xl outline-none font-bold text-sm shadow-inner focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200"
              >
                <option value="">Semua Aksi</option>
                <option value="CREATE">Tambah (CREATE)</option>
                <option value="UPDATE">Edit (UPDATE)</option>
                <option value="DELETE">Hapus (DELETE)</option>
                <option value="VERIFY">Verifikasi (VERIFY)</option>
              </select>
            </div>

            {/* Filter Tanggal Dari */}
            <div>
              <label className="block text-[11px] text-gray-500 font-bold mb-1.5 uppercase tracking-wider">Dari Tanggal</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full p-2.5 border border-dark-900 rounded-xl outline-none font-bold text-sm shadow-inner focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200"
              />
            </div>

            {/* Filter Tanggal Sampai */}
            <div>
              <label className="block text-[11px] text-gray-500 font-bold mb-1.5 uppercase tracking-wider">Sampai Tanggal</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full p-2.5 border border-dark-900 rounded-xl outline-none font-bold text-sm shadow-inner focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200"
              />
            </div>
          </div>

          {hasActiveFilter && (
            <p className="text-xs text-gray-500 mt-3 font-medium">
              Menampilkan <span className="text-gold-400 font-bold">{total}</span> log yang cocok dengan filter.
            </p>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-dark-900 border-b border-gold-500/20 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-gold-600 font-bold text-center w-48">Waktu (WIB)</th>
                  <th className="p-4 text-gold-600 font-bold w-40">Pelaku</th>
                  <th className="p-4 text-gold-600 font-bold text-center w-28">Modul</th>
                  <th className="p-4 text-gold-600 font-bold text-center w-28">Aksi</th>
                  <th className="p-4 text-gold-600 font-bold">Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                      Memuat log aktivitas...
                    </div>
                  </td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-500 italic font-medium">Tidak ada log aktivitas yang ditemukan.</td></tr>
                ) : (
                  logs.map(log => {
                    const badge = AKSI_BADGE[log.aksi] || AKSI_BADGE.UPDATE;
                    return (
                      <tr key={log.id} className="border-b border-gold-500/5 hover:bg-dark-900/50 transition-colors">
                        <td className="p-4 text-center">
                          <span className="bg-dark-900 text-gray-300 border border-gray-700 font-mono text-[12px] px-2.5 py-1.5 rounded-lg inline-block">
                            {formatWIB(log.createdAt)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-bold text-gray-200">{log.namaUser}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-dark-900 text-gray-300 border border-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                            {log.modul}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`${badge.bg} ${badge.text} text-[11px] font-black px-2.5 py-1 rounded-lg border inline-block`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-gray-300 leading-relaxed">{log.deskripsi}</p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gold-500/20 bg-dark-900 flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="text-sm text-gray-400 font-medium">
                Halaman {page} dari {totalPages} — <span className="text-gold-400 font-bold">{total}</span> total log
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-4 py-2 bg-dark-800 text-gold-500 rounded-lg border border-gold-500/20 hover:bg-gold-500/10 disabled:opacity-50 font-bold">Prev</button>
                <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                  {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button key={pageNum} onClick={() => goToPage(pageNum)} className={`w-10 h-10 rounded-lg font-bold border shrink-0 ${page === pageNum ? "bg-gold-500 text-black border-gold-500" : "bg-dark-800 text-gray-400 border-gray-700 hover:border-gold-500/50"}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-4 py-2 bg-dark-800 text-gold-500 rounded-lg border border-gold-500/20 hover:bg-gold-500/10 disabled:opacity-50 font-bold">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Protect>
  );
}
