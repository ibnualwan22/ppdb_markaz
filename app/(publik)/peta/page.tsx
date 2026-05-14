"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

// @ts-ignore - dynamic import resolves at runtime
const PetaMap = dynamic(() => import("./PetaMap") as any, { ssr: false, loading: () => <div className="w-full h-[70vh] bg-dark-800 rounded-2xl animate-pulse flex items-center justify-center"><span className="text-gray-500 font-bold">Memuat peta...</span></div> }) as any;

type Kategori = "SEMUA" | "BANIN" | "BANAT" | "UMUM";

export interface LokasiSakan {
  id: number;
  nama: string;
  lat: number;
  lng: number;
  kategori: "BANIN" | "BANAT" | "UMUM";
  deskripsi?: string;
}

const LOKASI_DATA: LokasiSakan[] = [
  { id: 1,  nama: "Maktab / Qo'ah Baharun", lat: -7.7532991298009355, lng: 112.18303767163134, kategori: "UMUM", deskripsi: "Gedung utama kegiatan belajar mengajar" },
  { id: 2,  nama: "Al-Habsyi", lat: -7.753409104044285, lng: 112.18327723672631, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 3,  nama: "Al-Hadad", lat: -7.753183864935693, lng: 112.18309216430697, kategori: "BANAT", deskripsi: "Sakan putri" },
  { id: 4,  nama: "Al-Aidit", lat: -7.753005938403868, lng: 112.18358749197417, kategori: "BANAT", deskripsi: "Sakan putri" },
  { id: 5,  nama: "Balfaqih", lat: -7.75263186830388, lng: 112.18359620915209, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 6,  nama: "Al-Jufri", lat: -7.7528427394132065, lng: 112.18234464525383, kategori: "BANAT", deskripsi: "Sakan putri" },
  { id: 7,  nama: "Baalawi", lat: -7.752732445202674, lng: 112.18206971883879, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 8,  nama: "Qo'ah Al-Adni", lat: -7.75350637962075, lng: 112.18342865701378, kategori: "UMUM", deskripsi: "Aula / tempat berkumpul" },
  { id: 9,  nama: "Asy-Syatiri", lat: -7.7539843902514045, lng: 112.18398673180647, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 10, nama: "Al-Maknun", lat: -7.753670118944408, lng: 112.18395588640065, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 11, nama: "Baharun", lat: -7.753666587439677, lng: 112.18370292289845, kategori: "BANAT", deskripsi: "Sakan putri" },
  { id: 12, nama: "Ruwaq Al-Junaid", lat: -7.754106176720971, lng: 112.18361198647617, kategori: "UMUM", deskripsi: "Area bersama" },
  { id: 13, nama: "Bin Syihab", lat: -7.754304840688638, lng: 112.18495252671165, kategori: "BANAT", deskripsi: "Sakan putri" },
  { id: 14, nama: "Bin Smith", lat: -7.754424357149842, lng: 112.18538050525545, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 15, nama: "Hadiqoh", lat: -7.753989826001614, lng: 112.1842673885424, kategori: "UMUM", deskripsi: "Taman / area terbuka" },
  { id: 16, nama: "Al-Athos", lat: -7.754811073749485, lng: 112.184037049368, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 17, nama: "Al-Kaff", lat: -7.754832335181036, lng: 112.18411349232193, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 18, nama: "Alaydrus", lat: -7.752630393913193, lng: 112.18477461552447, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 19, nama: "Jamal Layl", lat: -7.752296181198041, lng: 112.18419457983343, kategori: "BANIN", deskripsi: "Sakan putra" },
  { id: 20, nama: "Maula Kheila", lat: -7.753808390491807, lng: 112.18411784514544, kategori: "BANAT", deskripsi: "Sakan putri" },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PetaLokasiPage() {
  const [filterKategori, setFilterKategori] = useState<Kategori>("SEMUA");
  const [posisiSaya, setPosisiSaya] = useState<LokasiSakan | null>(null);
  const [tujuan, setTujuan] = useState<LokasiSakan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showList, setShowList] = useState(false);

  // GPS State
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);

  // Route info from map
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  useEffect(() => {
    const handler = (e: any) => setRouteInfo(e.detail);
    window.addEventListener("petaRouteUpdate", handler);
    return () => {
      window.removeEventListener("petaRouteUpdate", handler);
      if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
    };
  }, [gpsWatchId]);

  const lokasiFiltered = LOKASI_DATA.filter(l => {
    if (filterKategori !== "SEMUA" && l.kategori !== filterKategori) return false;
    if (searchQuery && !l.nama.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const startGpsTracking = () => {
    if (!navigator.geolocation) { setGpsError("Browser tidak mendukung GPS"); return; }
    setGpsLoading(true);
    setGpsError(null);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        setGpsError(null);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) setGpsError("Akses lokasi ditolak. Izinkan di pengaturan browser.");
        else if (err.code === 2) setGpsError("Lokasi tidak tersedia.");
        else setGpsError("Timeout mendapatkan lokasi.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    setGpsWatchId(id);
  };

  const stopGpsTracking = () => {
    if (gpsWatchId !== null) { navigator.geolocation.clearWatch(gpsWatchId); setGpsWatchId(null); }
    setGpsPosition(null);
    setGpsError(null);
  };

  const clearRoute = () => { setPosisiSaya(null); setTujuan(null); };

  const kategoriColor = (k: string) => {
    if (k === "BANIN") return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    if (k === "BANAT") return "text-pink-400 bg-pink-500/10 border-pink-500/30";
    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  };

  // Find nearest sakan to GPS
  const nearestSakan = gpsPosition ? LOKASI_DATA.reduce((prev, curr) => {
    const dPrev = getDistance(gpsPosition.lat, gpsPosition.lng, prev.lat, prev.lng);
    const dCurr = getDistance(gpsPosition.lat, gpsPosition.lng, curr.lat, curr.lng);
    return dCurr < dPrev ? curr : prev;
  }) : null;

  const startLabel = posisiSaya ? posisiSaya.nama : gpsPosition ? "Lokasi GPS Anda" : null;

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200">
      {/* Header */}
      <header className="bg-dark-950/90 backdrop-blur-xl border-b border-gold-500/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Logo" width={36} height={36} className="drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            <div>
              <h1 className="text-lg font-black text-gold-500 leading-tight">Denah Markaz</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Peta Interaktif Sakan</p>
            </div>
          </Link>
          <Link href="/" className="text-xs text-gray-400 hover:text-gold-500 font-bold transition flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Beranda
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 lg:flex lg:gap-4">
        {/* Sidebar */}
        <div className="lg:w-80 lg:shrink-0 space-y-4 mb-4 lg:mb-0">

          {/* GPS Panel */}
          <div className="bg-dark-800 rounded-2xl p-4 border border-blue-500/20">
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Lacak Lokasi
            </h2>
            {!gpsPosition ? (
              <button onClick={startGpsTracking} disabled={gpsLoading} className="w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 disabled:opacity-50">
                {gpsLoading ? (<><span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span> Mencari lokasi...</>) : "📍 Aktifkan GPS"}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs">
                  <p className="font-bold text-blue-400 mb-1">📍 Lokasi terdeteksi</p>
                  <p className="text-gray-500 font-mono text-[10px]">{gpsPosition.lat.toFixed(6)}, {gpsPosition.lng.toFixed(6)}</p>
                  {nearestSakan && <p className="text-gray-400 mt-1 text-[11px]">Terdekat: <strong className="text-white">{nearestSakan.nama}</strong> ({Math.round(getDistance(gpsPosition.lat, gpsPosition.lng, nearestSakan.lat, nearestSakan.lng))}m)</p>}
                </div>
                <button onClick={stopGpsTracking} className="w-full py-2 text-xs font-bold text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition">Matikan GPS</button>
              </div>
            )}
            {gpsError && <p className="text-red-400 text-xs mt-2 font-medium">{gpsError}</p>}
          </div>

          {/* Route Panel */}
          <div className="bg-dark-800 rounded-2xl p-4 border border-gold-500/10">
            <h2 className="text-sm font-black text-gold-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              Navigasi
            </h2>
            <div className="mb-3">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">📍 Dari</label>
              <div className={`p-2.5 rounded-xl border text-sm font-semibold ${startLabel ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400' : 'bg-dark-900 border-dark-700 text-gray-500 italic'}`}>
                {startLabel || (gpsPosition ? "GPS aktif" : "Klik marker / aktifkan GPS")}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">🏁 Tujuan</label>
              <div className={`p-2.5 rounded-xl border text-sm font-semibold ${tujuan ? 'bg-gold-500/5 border-gold-500/30 text-gold-400' : 'bg-dark-900 border-dark-700 text-gray-500 italic'}`}>
                {tujuan ? tujuan.nama : "Klik marker di peta"}
              </div>
            </div>
            {routeInfo && (
              <div className="bg-dark-900 rounded-xl p-3 border border-gold-500/20 mb-3">
                <div className="flex justify-between">
                  <div><p className="text-[10px] font-bold text-gray-500 uppercase">Jarak</p><p className="text-lg font-black text-white">{routeInfo.distance >= 1000 ? `${(routeInfo.distance / 1000).toFixed(1)} km` : `${routeInfo.distance} m`}</p></div>
                  <div className="text-right"><p className="text-[10px] font-bold text-gray-500 uppercase">Waktu</p><p className="text-lg font-black text-gold-400">~{routeInfo.duration} mnt 🚶</p></div>
                </div>
              </div>
            )}
            {(posisiSaya || tujuan) && (
              <button onClick={clearRoute} className="w-full py-2 text-xs font-bold text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition">Reset Navigasi</button>
            )}
          </div>

          {/* Filter & Search */}
          <div className="bg-dark-800 rounded-2xl p-4 border border-gold-500/10">
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Cari lokasi..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl outline-none text-sm text-white focus:border-gold-500/50 placeholder:text-gray-600" />
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {(["SEMUA", "BANIN", "BANAT", "UMUM"] as Kategori[]).map(k => (
                <button key={k} onClick={() => setFilterKategori(k)} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition ${filterKategori === k ? (k === "BANIN" ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : k === "BANAT" ? "bg-pink-500/20 text-pink-400 border-pink-500/40" : k === "UMUM" ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-gold-500/20 text-gold-400 border-gold-500/40") : "bg-dark-900 text-gray-500 border-dark-700 hover:border-gray-600"}`}>
                  {k === "SEMUA" ? "Semua" : k === "BANIN" ? "🟦 Putra" : k === "BANAT" ? "🟪 Putri" : "🟨 Umum"}
                </button>
              ))}
            </div>
            <button onClick={() => setShowList(!showList)} className="w-full py-2 text-xs font-bold text-gray-400 bg-dark-900 border border-dark-700 rounded-xl hover:text-gold-500 transition lg:hidden">
              {showList ? "Sembunyikan" : `Daftar (${lokasiFiltered.length})`}
            </button>
          </div>

          {/* Location List */}
          <div className={`bg-dark-800 rounded-2xl border border-gold-500/10 overflow-hidden ${showList ? 'block' : 'hidden lg:block'}`}>
            <div className="p-3 bg-dark-900 border-b border-gold-500/10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{lokasiFiltered.length} Lokasi</p>
            </div>
            <div className="max-h-[40vh] overflow-y-auto">
              {lokasiFiltered.map(l => (
                <div key={l.id} className={`p-3 border-b border-dark-700 hover:bg-dark-900/50 transition cursor-pointer ${(posisiSaya?.id === l.id || tujuan?.id === l.id) ? 'bg-gold-500/5' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">{l.nama}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${kategoriColor(l.kategori)}`}>
                          {l.kategori === "BANIN" ? "Putra" : l.kategori === "BANAT" ? "Putri" : "Umum"}
                        </span>
                        {gpsPosition && <span className="text-[9px] text-gray-500">{Math.round(getDistance(gpsPosition.lat, gpsPosition.lng, l.lat, l.lng))}m</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setPosisiSaya(l)} title="Posisi saya" className={`p-1.5 rounded-lg text-[10px] transition ${posisiSaya?.id === l.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-900 text-gray-500 hover:text-emerald-400'}`}>📍</button>
                      <button onClick={() => setTujuan(l)} title="Tujuan" className={`p-1.5 rounded-lg text-[10px] transition ${tujuan?.id === l.id ? 'bg-gold-500/20 text-gold-400' : 'bg-dark-900 text-gray-500 hover:text-gold-400'}`}>🏁</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[70vh]">
          <PetaMap lokasi={lokasiFiltered} posisiSaya={posisiSaya} tujuan={tujuan} gpsPosition={gpsPosition} onSelectPosisi={(l: LokasiSakan) => setPosisiSaya(l)} onSelectTujuan={(l: LokasiSakan) => setTujuan(l)} allLokasi={LOKASI_DATA} />
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-dark-800 rounded-2xl p-4 border border-gold-500/10 flex flex-wrap gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Putra</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-500"></span> Putri</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Umum</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> GPS Anda</div>
        </div>
      </div>
    </div>
  );
}
