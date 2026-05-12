"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface SantriResult {
  id: string;
  nama: string;
  nis: string | null;
  kategori: string;
  gender: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  namaOrtu: string | null;
  noWaOrtu: string | null;
  noWaSantri: string | null;
  provinsi: string | null;
  kabupaten: string | null;
  kecamatan: string | null;
  desa: string | null;
  detailAlamat: string | null;
  sakan?: string | null;
  kamar?: string | null;
  lemari?: string | null;
  isLengkap: boolean;
}

export default function LengkapiDataPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SantriResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SantriResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<{ nama: string; nis: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [form, setForm] = useState({
    tempatLahir: "",
    tanggalLahir: "",
    namaOrtu: "",
    noWaOrtu: "",
    noWaSantri: "",
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    desa: "",
    detailAlamat: "",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/publik/santri?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  const handleSelect = (s: SantriResult) => {
    setSelected(s);
    setShowDropdown(false);
    setQuery(s.nama);
    setSuccess(null);

    if (!s.isLengkap) {
      setForm({
        tempatLahir: s.tempatLahir || "",
        tanggalLahir: s.tanggalLahir ? s.tanggalLahir.split("T")[0] : "",
        namaOrtu: s.namaOrtu || "",
        noWaOrtu: s.noWaOrtu || "",
        noWaSantri: s.noWaSantri || "",
        provinsi: s.provinsi || "",
        kabupaten: s.kabupaten || "",
        kecamatan: s.kecamatan || "",
        desa: s.desa || "",
        detailAlamat: s.detailAlamat || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/publik/santri/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal menyimpan data");
        return;
      }

      setSuccess({ nama: data.data.nama, nis: data.data.nis });
      setSelected({ ...selected, isLengkap: true, nis: data.data.nis });
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelected(null);
    setQuery("");
    setSuccess(null);
    setForm({
      tempatLahir: "", tanggalLahir: "", namaOrtu: "", noWaOrtu: "", noWaSantri: "",
      provinsi: "", kabupaten: "", kecamatan: "", desa: "", detailAlamat: "",
    });
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all text-sm";
  const labelCls = "block text-sm font-bold text-gray-400 mb-1.5";
  const readonlyCls = "w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-gray-400 font-medium text-sm cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-luxury-pattern text-gray-200 font-sans selection:bg-gold-500 selection:text-black">
      {/* Background Decor */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 w-full px-4 py-3 md:px-6 md:py-4 flex justify-between items-center z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gold-500/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-wider text-gold-500 uppercase leading-tight">
              Markaz <span className="text-white">Arabiyah</span>
            </h1>
          </div>
        </Link>

      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 md:py-16 relative z-10">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10">
            <span className="text-[10px] font-black text-gold-400 tracking-[0.2em] uppercase">Formulir Publik</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3">Lengkapi Data Diri</h2>
          <p className="text-sm md:text-base text-gray-500 font-medium max-w-md mx-auto">
            Cari nama Anda, lengkapi data, dan NIS akan otomatis ter-generate.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8" ref={dropdownRef}>
          <label className={labelCls}>Cari Nama Santri</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); setSuccess(null); }}
              placeholder="Ketik minimal 2 huruf nama santri..."
              className={`${inputCls} pr-10`}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto">
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all flex items-center justify-between gap-3 border-b border-white/5 last:border-0"
                >
                  <div>
                    <span className="text-white font-bold text-sm">{s.nama}</span>
                    <span className="text-gray-500 text-xs ml-2">
                      ({s.kategori} · {s.gender}
                      {s.sakan && ` · ${s.sakan} / ${s.kamar || "-"} / ${s.lemari || "-"}`})
                    </span>
                  </div>
                  {s.isLengkap ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex-shrink-0">Lengkap</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-wider flex-shrink-0">Belum Lengkap</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {showDropdown && results.length === 0 && !searching && query.length >= 2 && (
            <div className="absolute z-50 w-full mt-2 bg-[#111] border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-gray-500 text-sm font-medium">Nama tidak ditemukan.</p>
            </div>
          )}
        </div>

        {/* SUCCESS STATE */}
        {success && (
          <div className="p-6 md:p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center mb-8 animate-[fadeIn_0.5s_ease]">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-black text-emerald-400 mb-2">Data Berhasil Disimpan!</h3>
            <p className="text-gray-400 font-medium mb-4">Data diri <strong className="text-white">{success.nama}</strong> sudah lengkap.</p>
            <div className="inline-block px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">NIS Anda</span>
              <p className="text-3xl font-black text-gold-500 tracking-wider mt-1">{success.nis}</p>
            </div>
            <button onClick={resetForm} className="mt-6 block mx-auto px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:border-gold-500/30 transition-all">
              Cari Santri Lain
            </button>
          </div>
        )}

        {/* SELECTED: DATA LENGKAP (READ ONLY) */}
        {selected && selected.isLengkap && !success && (
          <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/10 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selected.nama}
                  <span className="text-gray-500 text-xs ml-2 font-normal">
                    ({selected.kategori} · {selected.gender}
                    {selected.sakan && ` · ${selected.sakan} / ${selected.kamar || "-"} / ${selected.lemari || "-"}`})
                  </span>
                </h3>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mt-1">Data sudah lengkap — tidak perlu mengisi lagi</p>
              </div>
            </div>





            <button onClick={resetForm} className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:border-gold-500/30 transition-all">
              Cari Santri Lain
            </button>
          </div>
        )}

        {/* SELECTED: DATA BELUM LENGKAP (EDITABLE FORM) */}
        {selected && !selected.isLengkap && !success && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selected.nama}</h3>
                <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Silakan lengkapi data diri Anda</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelCls}>Tempat Lahir <span className="text-red-400">*</span></label>
                <input type="text" required value={form.tempatLahir} onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })} placeholder="Contoh: Kediri" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tanggal Lahir <span className="text-red-400">*</span></label>
                <input type="date" required value={form.tanggalLahir} onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nama Orang Tua/Wali <span className="text-red-400">*</span></label>
                <input type="text" required value={form.namaOrtu} onChange={(e) => setForm({ ...form, namaOrtu: e.target.value })} placeholder="Nama lengkap" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>No. WA Orang Tua <span className="text-red-400">*</span></label>
                <input type="tel" required value={form.noWaOrtu} onChange={(e) => setForm({ ...form, noWaOrtu: e.target.value })} placeholder="08xxxxxxxxxx" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>No. WA Santri <span className="text-red-400">*</span></label>
                <input type="tel" required value={form.noWaSantri} onChange={(e) => setForm({ ...form, noWaSantri: e.target.value })} placeholder="08xxxxxxxxxx" className={inputCls} />
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 mb-6">
              <h4 className="text-sm font-bold text-gold-500 mb-4 uppercase tracking-wider">Alamat Domisili</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Provinsi <span className="text-red-400">*</span></label>
                  <input type="text" required value={form.provinsi} onChange={(e) => setForm({ ...form, provinsi: e.target.value })} placeholder="Contoh: Jawa Timur" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kabupaten/Kota <span className="text-red-400">*</span></label>
                  <input type="text" required value={form.kabupaten} onChange={(e) => setForm({ ...form, kabupaten: e.target.value })} placeholder="Contoh: Kediri" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kecamatan <span className="text-red-400">*</span></label>
                  <input type="text" required value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} placeholder="Contoh: Pare" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Desa/Kelurahan <span className="text-red-400">*</span></label>
                  <input type="text" required value={form.desa} onChange={(e) => setForm({ ...form, desa: e.target.value })} placeholder="Contoh: Tulungrejo" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Detail Alamat <span className="text-red-400">*</span></label>
                  <textarea required rows={2} value={form.detailAlamat} onChange={(e) => setForm({ ...form, detailAlamat: e.target.value })} placeholder="RT/RW, Nama Jalan, No. Rumah..." className={`${inputCls} resize-none`} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-gold-500 text-black font-black text-lg hover:bg-gold-400 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                "Simpan & Generate NIS"
              )}
            </button>
          </form>
        )}
      </main>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .bg-luxury-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 L40 0 L80 40 L40 80 Z' fill='none' stroke='%23D4AF37' stroke-width='1' stroke-opacity='0.05'/%3E%3C/svg%3E");
          background-size: 80px 80px;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
