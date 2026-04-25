"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePusher } from "../../providers/PusherProvider";
import { swalNotif, swalError } from "../../lib/swal";
import { Protect, usePermissions } from "@/components/Protect";
import * as XLSX from "xlsx";

// ── SVG Icons ──────────────────────────────────────────────
const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconCopy = ({ size = "h-3.5 w-3.5" }: { size?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const IconCheck = ({ size = "h-3.5 w-3.5" }: { size?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IconExcel = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 16l-2-3h1.3l1.2 2 1.2-2H11.5l-2 3 2.1 3H10.2l-1.2-2.1-1.2 2.1H6.4l2.1-3zm5 1.5h-2V11h2v6.5z" />
  </svg>
);
const IconWhatsapp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ── Konstanta ──────────────────────────────────────────────
const FILTER_ITEMS = [
  { key: "isDresscodeTaken",     label: "Dresscode" },
  { key: "isToteBagTaken",       label: "Tote Bag" },
  { key: "isPinTaken",           label: "Pin / Dabus" },
  { key: "isSongkokKhimarTaken", label: "Pechi/Khimar" },
  { key: "isMalzamahTaken",      label: "Malzamah" },
  { key: "isTabirotTaken",       label: "Ta'birot" },
];

const LABEL_MAP: Record<string, string> = {
  dresscode: "Dresscode", toteBag: "Tote Bag", pin: "Pin / Dabus",
  songkok: "Pechi/Khimar", malzamah: "Malzamah", tabirot: "Ta'birot",
};

// ── Helper: copy text ──────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    });
  }, []);
  return { copied, copy };
}

// ── Helper: lokasi santri ──────────────────────────────────
function getLokasi(item: any): string {
  if (!item.lemari) return "Belum dapat lemari";
  const { kamar: { sakan, nama: kamarNama }, nomor } = item.lemari;
  return `${sakan.nama} • Kamar ${kamarNama} • Lkr ${nomor}`;
}

// ── Komponen Kartu Item di Modal ───────────────────────────
function ModalItemCard({ item, copied, copy }: { item: any; copied: string | null; copy: (t: string, id: string) => void }) {
  const lokasi = getLokasi(item);
  const teks = `${item.santri.nama} – ${lokasi}`;
  const isCopied = copied === item.id;

  return (
    <div className="bg-dark-800 border border-dark-700 hover:border-gold-500/30 p-3.5 rounded-xl flex flex-col group">
      {/* Nama */}
      <div className="flex justify-between items-start gap-2">
        <span className="text-sm font-bold text-gray-200 group-hover:text-gold-400 uppercase leading-tight flex-1">{item.santri.nama}</span>
        <button
          onClick={() => copy(teks, item.id)}
          title="Salin nama & lokasi"
          className={`shrink-0 p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${isCopied ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-dark-900 border-gray-700 text-gray-500 hover:border-gold-500/40 hover:text-gold-400"}`}
        >
          {isCopied ? <IconCheck /> : <IconCopy />}
        </button>
      </div>

      {/* Lokasi */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${item.santri.gender === "BANIN" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-pink-500/10 text-pink-400 border border-pink-500/20"}`}>
          {item.santri.gender}
        </span>
        {item.lemari ? (
          <span className="text-[11px] text-gray-400 font-medium">{lokasi}</span>
        ) : (
          <span className="text-[11px] text-red-400 italic">Belum dapat lemari</span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function MimStorePage() {
  const [data, setData]           = useState<any[]>([]);
  const [dufahNama, setDufahNama] = useState("");
  const [loading, setLoading]     = useState(true);
  const [keyword, setKeyword]     = useState("");
  const [filterBelum, setFilterBelum] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { hasAccess }     = usePermissions();
  const canManageMimstore = hasAccess("manage_mimstore");

  // Modal
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const pusher = usePusher();

  // Copy
  const { copied, copy } = useCopy();
  const [copiedAll, setCopiedAll] = useState(false);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!data.length) return null;

    const groupBySize = (items: any[], sizeKey: string) => {
      const grouped = items.reduce((acc, item) => {
        const size = item[sizeKey] || "Belum Diisi";
        if (!acc[size]) acc[size] = [];
        acc[size].push(item);
        return acc;
      }, {} as Record<string, any[]>);
      return Object.keys(grouped).sort().reduce((acc, k) => { acc[k] = grouped[k]; return acc; }, {} as Record<string, any[]>);
    };

    return {
      dresscode: { total: data.filter(d => !d.isDresscodeTaken).length,      grouped: groupBySize(data.filter(d => !d.isDresscodeTaken), "ukuranDresscode") },
      toteBag:   { total: data.filter(d => !d.isToteBagTaken).length,        items: data.filter(d => !d.isToteBagTaken) },
      pin:       { total: data.filter(d => !d.isPinTaken).length,            items: data.filter(d => !d.isPinTaken) },
      songkok:   { total: data.filter(d => !d.isSongkokKhimarTaken).length,  grouped: groupBySize(data.filter(d => !d.isSongkokKhimarTaken), "ukuranSongkok") },
      malzamah:  { total: data.filter(d => !d.isMalzamahTaken).length,       items: data.filter(d => !d.isMalzamahTaken) },
      tabirot:   { total: data.filter(d => !d.isTabirotTaken).length,        items: data.filter(d => !d.isTabirotTaken) },
    };
  }, [data]);

  // ── Fetch ──────────────────────────────────────────────
  const muatData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/mimstore");
      if (res.ok) {
        const result = await res.json();
        setDufahNama(result.dufahNama);
        setData(result.data);
      }
    } catch { }
    if (!isBackground) setLoading(false);
  };

  useEffect(() => { muatData(); }, []);

  useEffect(() => {
    if (!pusher) return;
    const onUpdate = (p: any) => { if (!p.tag || p.tag === "mimstore" || p.tag === "id-card") muatData(true); };
    const ch = pusher.subscribe("ppdb-channel");
    ch.bind("data:update", onUpdate);
    return () => { ch.unbind("data:update", onUpdate); pusher.unsubscribe("ppdb-channel"); };
  }, [pusher]);

  // ── Update ─────────────────────────────────────────────
  const handleUpdate = async (id: string, field: string, value: any) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    try {
      const res = await fetch("/api/mimstore", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value }),
      });
      if (res.ok) swalNotif("Tersimpan", "success");
      else { swalError("Gagal menyimpan data"); muatData(true); }
    } catch { swalError("Terjadi kesalahan jaringan"); muatData(true); }
  };

  // ── Filter & Pagination ────────────────────────────────
  const toggleFilterBelum = (key: string) => {
    setFilterBelum(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    setCurrentPage(1);
  };

  const dataDitampilkan = useMemo(() => data.filter(item => {
    const matchKeyword = item.santri.nama.toLowerCase().includes(keyword.toLowerCase());
    const matchFilter  = filterBelum.length === 0 || filterBelum.every(k => !item[k]);
    return matchKeyword && matchFilter;
  }), [data, keyword, filterBelum]);

  const totalPages  = Math.ceil(dataDitampilkan.length / itemsPerPage);
  const currentData = dataDitampilkan.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const goToPage    = (p: number) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  // ── Export Excel ───────────────────────────────────────
  const exportExcel = () => {
    const rows = dataDitampilkan.map((item, idx) => ({
      "No":             idx + 1,
      "NIS":            item.santri.nis || "-",
      "Nama Santri":    item.santri.nama,
      "Gender":         item.santri.gender,
      "Sakan":          item.lemari?.kamar?.sakan?.nama || "-",
      "Kamar":          item.lemari?.kamar?.nama || "-",
      "Lemari":         item.lemari?.nomor || "-",
      "Dresscode":      item.isDresscodeTaken ? "✓" : "✗",
      "Ukuran DC":      item.ukuranDresscode || "-",
      "Tote Bag":       item.isToteBagTaken ? "✓" : "✗",
      "Pin / Dabus":    item.isPinTaken ? "✓" : "✗",
      "Pechi/Khimar":   item.isSongkokKhimarTaken ? "✓" : "✗",
      "Ukuran Pechi":   item.ukuranSongkok || "-",
      "Malzamah":       item.isMalzamahTaken ? "✓" : "✗",
      "Ta'birot":       item.isTabirotTaken ? "✓" : "✗",
    }));

    const filterLabel = filterBelum.length > 0
      ? `Belum_${filterBelum.map(k => FILTER_ITEMS.find(i => i.key === k)?.label).join("-")}`
      : "Semua";

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mimstore");
    XLSX.writeFile(wb, `MimsStore_${filterLabel}_${dufahNama || "data"}.xlsx`);
  };

  // ── Laporan WA ─────────────────────────────────────────
  // Mapping semua field barang → label nama barang
  const FIELD_TO_LABEL: Record<string, string> = {
    isDresscodeTaken:     "Dresscode",
    isToteBagTaken:       "Tote Bag",
    isPinTaken:           "Pin / Dabus",
    isSongkokKhimarTaken: "Pechi/Khimar",
    isMalzamahTaken:      "Malzamah",
    isTabirotTaken:       "Ta'birot",
  };
  const ALL_ITEM_KEYS = Object.keys(FIELD_TO_LABEL);

  const laporanWA = () => {
    const filterLabel = filterBelum.length > 0
      ? `belum mendapat: *${filterBelum.map(k => FILTER_ITEMS.find(i => i.key === k)?.label).join(", ")}*`
      : "semua santri";

    const baris = dataDitampilkan.map((item, idx) => {
      const lokasi = item.lemari
        ? `${item.lemari.kamar.sakan.nama} \u2013 Kmr ${item.lemari.kamar.nama} \u2013 Lkr ${item.lemari.nomor}`
        : "Belum dapat lemari";

      // Keterangan barang yang belum didapat santri ini
      const belumDapat = ALL_ITEM_KEYS
        .filter(k => !item[k])
        .map(k => `\u2022 Belum mendapatkan ${FIELD_TO_LABEL[k]}`);

      const keterangan = belumDapat.length > 0 ? `\n${belumDapat.join("\n")}` : "";
      return `${idx + 1}. ${item.santri.nama} - ${lokasi}${keterangan}`;
    }).join("\n\n");

    const pesan = `\ud83d\udccb *Laporan Mims Store \u2013 ${dufahNama}*\nFilter: ${filterLabel}\nTotal: ${dataDitampilkan.length} santri\n\n${baris}\n\n_Digenerate otomatis dari sistem PPDB_`;

    const url = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  };

  // ── Copy semua nama di modal ───────────────────────────
  const copyAllModal = (items: any[], catLabel: string) => {
    const judul = `🗒️ Santri yang belum mendapatkan ${catLabel}\nTotal: ${items.length} santri\n`;
    const baris = items.map((item, i) => {
      const lokasi = getLokasi(item);
      return `${i + 1}. ${item.santri.nama} – ${lokasi}`;
    }).join("\n");
    navigator.clipboard.writeText(`${judul}\n${baris}`).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  // ── Ambil item untuk modal ─────────────────────────────
  const getModalItems = (): any[] => {
    if (!stats || !selectedCategory) return [];
    const s = (stats as any)[selectedCategory];
    if (["dresscode", "songkok"].includes(selectedCategory)) {
      return Object.values(s.grouped).flat() as any[];
    }
    return s.items || [];
  };

  // ═════════════════════════════════════════════════════════
  return (
    <Protect permission="view_mimstore" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin untuk melihat Mims Store.</div>}>
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen relative overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="mb-8 border-b border-gold-500/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gold-500">Mims Store</h1>
          <p className="text-gray-400 mt-1 font-medium">Pembagian Atribut untuk Santri Baru ({dufahNama}).</p>
        </div>
        {/* Tombol Export & WA */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-sm"
          >
            <IconExcel /> Export Excel
            {filterBelum.length > 0 && (
              <span className="bg-white/20 text-[10px] font-black px-1.5 py-0.5 rounded-full">Filter aktif</span>
            )}
          </button>
          <button
            onClick={laporanWA}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-green-400 text-white text-sm font-bold rounded-xl shadow-sm"
          >
            <IconWhatsapp /> Laporan WA
            {filterBelum.length > 0 && (
              <span className="bg-white/20 text-[10px] font-black px-1.5 py-0.5 rounded-full">Filter aktif</span>
            )}
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────── */}
      {stats && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: "dresscode", label: "Dresscode",    count: stats.dresscode.total },
              { id: "pin",       label: "Pin / Dabus",  count: stats.pin.total },
              { id: "toteBag",   label: "Tote Bag",     count: stats.toteBag.total },
              { id: "songkok",   label: "Pechi/Khimar", count: stats.songkok.total },
              { id: "malzamah",  label: "Malzamah",     count: stats.malzamah.total },
              { id: "tabirot",   label: "Ta'birot",     count: stats.tabirot.total },
            ].map(cat => (
              <div
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setCopiedAll(false); }}
                className="bg-dark-800 p-4 py-5 rounded-2xl border border-gold-500/20 shadow-sm cursor-pointer hover:bg-gold-500/5 hover:border-gold-500/50 flex flex-col items-center justify-center text-center group"
              >
                <span className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">{cat.label}</span>
                <span className="text-3xl font-black text-gold-500">
                  {cat.count} <span className="text-sm text-gray-500 font-semibold">Santri</span>
                </span>
                <span className="mt-2 text-[10px] text-gray-500 italic opacity-0 group-hover:opacity-100 whitespace-nowrap">Klik untuk lihat detail</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEARCH & FILTER PANEL ──────────────────────────── */}
      <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-gold-500/20 mb-6 flex flex-col gap-5">
        {/* Search */}
        <div className="flex-1 md:max-w-lg">
          <label className="block text-sm font-bold text-gray-300 mb-2">Cari Nama Santri</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><IconSearch /></span>
            <input
              type="text" value={keyword}
              onChange={e => { setKeyword(e.target.value); setCurrentPage(1); }}
              placeholder="Ketik nama santri..."
              className="w-full pl-10 p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 placeholder:text-gray-600 shadow-inner"
            />
          </div>
        </div>

        {/* Filter checkbox */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter Santri Belum Mendapat:
              {filterBelum.length > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-500/30">{filterBelum.length} aktif</span>
              )}
            </label>
            {filterBelum.length > 0 && (
              <button onClick={() => setFilterBelum([])} className="text-xs font-bold text-gray-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_ITEMS.map(item => {
              const isActive = filterBelum.includes(item.key);
              return (
                <button
                  key={item.key} onClick={() => toggleFilterBelum(item.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold shadow-sm select-none ${isActive ? "bg-red-500/20 border-red-500/60 text-red-300" : "bg-dark-900 border-gold-500/20 text-gray-400 hover:border-gold-500/50 hover:text-gray-200"}`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isActive ? "bg-red-500 border-red-400" : "bg-dark-800 border-gray-600"}`}>
                    {isActive && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                  {item.label}
                </button>
              );
            })}
            {/* Pilih semua */}
            <button
              onClick={() => {
                const allKeys = FILTER_ITEMS.map(i => i.key);
                setFilterBelum(allKeys.every(k => filterBelum.includes(k)) ? [] : allKeys);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold shadow-sm select-none ml-1 ${FILTER_ITEMS.every(i => filterBelum.includes(i.key)) ? "bg-orange-500/20 border-orange-500/60 text-orange-300" : "bg-dark-900 border-dashed border-gold-500/30 text-gray-500 hover:border-gold-500/60 hover:text-gray-300"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Pilih Semua
            </button>
          </div>

          {filterBelum.length > 0 && (
            <p className="text-xs text-gray-500 mt-3 font-medium">
              Menampilkan <span className="text-gold-400 font-bold">{dataDitampilkan.length}</span> santri yang belum mendapat:{" "}
              <span className="text-red-400 font-bold">{filterBelum.map(k => FILTER_ITEMS.find(i => i.key === k)?.label).join(", ")}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── TABEL ─────────────────────────────────────────── */}
      <div className="bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-dark-900 border-b border-gold-500/20 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-gold-600 font-bold text-center w-32">NIS</th>
                <th className="p-4 text-gold-600 font-bold min-w-[200px]">Nama Lengkap & Lokasi</th>
                <th className="p-4 text-gold-600 font-bold text-center">Dresscode</th>
                <th className="p-4 text-gold-600 font-bold text-center">Tote Bag</th>
                <th className="p-4 text-gold-600 font-bold text-center">Pin / Dabus</th>
                <th className="p-4 text-gold-600 font-bold text-center">Songkok / Khimar</th>
                <th className="p-4 text-gold-600 font-bold text-center">Malzamah</th>
                <th className="p-4 text-gold-600 font-bold text-center">Ta'birot</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={8} className="p-10 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                    Memuat data...
                  </div>
                </td></tr>
              ) : dataDitampilkan.length === 0 ? (
                <tr><td colSpan={8} className="p-10 text-center text-gray-500 italic font-medium">Data santri tidak ditemukan.</td></tr>
              ) : currentData.map(item => (
                <tr key={item.id} className="border-b border-gold-500/5 hover:bg-dark-900/50">
                  <td className="p-4 text-center">
                    <span className="bg-dark-900 text-gray-300 border border-gray-700 font-black text-sm px-2.5 py-1 rounded-lg">
                      {item.santri.nis || "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-200 text-base">{item.santri.nama}</p>
                    {item.lemari ? (
                      <p className="text-xs text-gray-500 mt-1 uppercase font-medium">
                        {item.lemari.kamar.sakan.nama} • {item.lemari.kamar.nama} • lkr {item.lemari.nomor}
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 mt-1 italic">Belum dapat lemari</p>
                    )}
                  </td>
                  {/* Dresscode */}
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <label className="flex items-center cursor-pointer gap-2 bg-dark-900 px-3 py-1.5 rounded-lg border border-gold-500/20 hover:border-gold-500/50">
                        <input type="checkbox" className={`w-5 h-5 accent-gold-500 ${canManageMimstore ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                          checked={item.isDresscodeTaken} onChange={e => handleUpdate(item.id, "isDresscodeTaken", e.target.checked)} disabled={!canManageMimstore} />
                        <span className="text-xs font-bold text-gray-300">DC</span>
                      </label>
                      <input type="text" placeholder="Ukuran" className="w-full max-w-[80px] p-1.5 text-xs text-center border border-dark-900 rounded-lg bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500 shadow-inner disabled:opacity-80 disabled:cursor-not-allowed"
                        defaultValue={item.ukuranDresscode || ""} disabled={!canManageMimstore}
                        onBlur={e => { if (e.target.value !== item.ukuranDresscode) handleUpdate(item.id, "ukuranDresscode", e.target.value); }} />
                    </div>
                  </td>
                  {/* Tote Bag */}
                  <td className="p-4 text-center">
                    <label className="flex items-center cursor-pointer gap-2 bg-dark-900 px-3 py-1.5 rounded-lg border border-gold-500/20 hover:border-gold-500/50 justify-center">
                      <input type="checkbox" className={`w-5 h-5 accent-gold-500 ${canManageMimstore ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                        checked={item.isToteBagTaken} onChange={e => handleUpdate(item.id, "isToteBagTaken", e.target.checked)} disabled={!canManageMimstore} />
                      <span className="text-xs font-bold text-gray-300">TB</span>
                    </label>
                  </td>
                  {/* Pin */}
                  <td className="p-4 text-center">
                    <label className="flex items-center cursor-pointer gap-2 bg-dark-900 px-3 py-1.5 rounded-lg border border-gold-500/20 hover:border-gold-500/50 justify-center">
                      <input type="checkbox" className={`w-5 h-5 accent-gold-500 ${canManageMimstore ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                        checked={item.isPinTaken} onChange={e => handleUpdate(item.id, "isPinTaken", e.target.checked)} disabled={!canManageMimstore} />
                      <span className="text-xs font-bold text-gray-300">Pin</span>
                    </label>
                  </td>
                  {/* Songkok / Khimar */}
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <label className="flex items-center cursor-pointer gap-2 bg-dark-900 px-3 py-1.5 rounded-lg border border-gold-500/20 hover:border-gold-500/50">
                        <input type="checkbox" className={`w-5 h-5 accent-gold-500 ${canManageMimstore ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                          checked={item.isSongkokKhimarTaken} onChange={e => handleUpdate(item.id, "isSongkokKhimarTaken", e.target.checked)} disabled={!canManageMimstore} />
                        <span className="text-xs font-bold text-gray-300">{item.santri.gender === "BANIN" ? "SK" : "KM"}</span>
                      </label>
                      {item.santri.gender === "BANIN" && (
                        <input type="text" placeholder="Ukuran" className="w-full max-w-[80px] p-1.5 text-xs text-center border border-dark-900 rounded-lg bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500 shadow-inner disabled:opacity-80 disabled:cursor-not-allowed"
                          defaultValue={item.ukuranSongkok || ""} disabled={!canManageMimstore}
                          onBlur={e => { if (e.target.value !== item.ukuranSongkok) handleUpdate(item.id, "ukuranSongkok", e.target.value); }} />
                      )}
                    </div>
                  </td>
                  {/* Malzamah */}
                  <td className="p-4 text-center">
                    <label className="flex items-center cursor-pointer gap-2 bg-dark-900 px-3 py-1.5 rounded-lg border border-gold-500/20 hover:border-gold-500/50 justify-center">
                      <input type="checkbox" className={`w-5 h-5 accent-gold-500 ${canManageMimstore ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                        checked={item.isMalzamahTaken} onChange={e => handleUpdate(item.id, "isMalzamahTaken", e.target.checked)} disabled={!canManageMimstore} />
                      <span className="text-xs font-bold text-gray-300">MZ</span>
                    </label>
                  </td>
                  {/* Ta'birot */}
                  <td className="p-4 text-center">
                    <label className="flex items-center cursor-pointer gap-2 bg-dark-900 px-3 py-1.5 rounded-lg border border-gold-500/20 hover:border-gold-500/50 justify-center">
                      <input type="checkbox" className={`w-5 h-5 accent-gold-500 ${canManageMimstore ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
                        checked={item.isTabirotTaken} onChange={e => handleUpdate(item.id, "isTabirotTaken", e.target.checked)} disabled={!canManageMimstore} />
                      <span className="text-xs font-bold text-gray-300">Tab</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gold-500/20 bg-dark-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-gray-400 font-medium">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-dark-800 text-gold-500 rounded-lg border border-gold-500/20 hover:bg-gold-500/10 disabled:opacity-50 font-bold">Prev</button>
              <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i + 1} onClick={() => goToPage(i + 1)} className={`w-10 h-10 rounded-lg font-bold border shrink-0 ${currentPage === i + 1 ? "bg-gold-500 text-black border-gold-500" : "bg-dark-800 text-gray-400 border-gray-700 hover:border-gold-500/50"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-dark-800 text-gold-500 rounded-lg border border-gold-500/20 hover:bg-gold-500/10 disabled:opacity-50 font-bold">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DETAIL BELUM DAPAT ─────────────────────── */}
      {selectedCategory && stats && (() => {
        const modalItems = getModalItems();
        const catLabel   = LABEL_MAP[selectedCategory] || selectedCategory;
        const isGrouped  = ["dresscode", "songkok"].includes(selectedCategory);
        const grouped    = (stats as any)[selectedCategory].grouped;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-dark-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gold-500/30 flex flex-col max-h-[88vh]">

              {/* Header modal */}
              <div className="p-5 border-b border-gold-500/20 flex justify-between items-center bg-dark-900/80 rounded-t-3xl">
                <div>
                  <h3 className="text-lg font-bold text-gold-500 flex items-center gap-2">
                    <span className="bg-gold-500/10 p-2 rounded-xl text-gold-400"><IconBell /></span>
                    Belum Mendapatkan: {catLabel}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 ml-1">{modalItems.length} santri</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Tombol copy semua */}
                  <button
                    onClick={() => copyAllModal(modalItems, catLabel)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold ${copiedAll ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-dark-800 border-gold-500/20 text-gray-400 hover:text-gold-400 hover:border-gold-500/40"}`}
                  >
                    {copiedAll ? <><IconCheck size="h-3.5 w-3.5" /> Tersalin!</> : <><IconCopy size="h-3.5 w-3.5" /> Salin Semua</>}
                  </button>
                  <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:bg-dark-700 hover:text-white p-2 rounded-xl">
                    <IconX />
                  </button>
                </div>
              </div>

              {/* Body modal */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {modalItems.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-dark-900 border border-dark-700 flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-lg font-bold text-gray-400 mb-1">Sudah Lengkap!</span>
                    <p className="text-sm text-gray-500">Semua santri telah mendapatkan <strong className="text-gray-300">{catLabel}</strong>.</p>
                  </div>
                ) : isGrouped ? (
                  // Grouped by size
                  Object.entries(grouped).map(([size, items]: [string, any]) => (
                    <div key={size} className="bg-dark-900/60 p-4 rounded-2xl border border-gold-500/10">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gold-500/10">
                        <h4 className="font-bold text-gray-200 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gold-500" />
                          {size === "Belum Diisi" ? <span className="text-red-400 italic">Ukuran Belum Diisi</span> : `Ukuran: ${size}`}
                        </h4>
                        <span className="bg-gold-500/10 text-gold-400 text-xs font-bold px-2.5 py-1 rounded-full border border-gold-500/20">{items.length} Santri</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((item: any) => (
                          <ModalItemCard key={item.id} item={item} copied={copied} copy={copy} />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Simple list
                  <div className="bg-dark-900/60 p-4 rounded-2xl border border-gold-500/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {modalItems.map((item: any) => (
                        <ModalItemCard key={item.id} item={item} copied={copied} copy={copy} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer modal */}
              <div className="p-4 border-t border-gold-500/20 bg-dark-900/80 rounded-b-3xl flex justify-end gap-2">
                <button onClick={() => setSelectedCategory(null)} className="px-6 py-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-gray-300 text-sm font-bold rounded-xl">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
    </Protect>
  );
}
