"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

interface Program {
  id: string;
  nama: string;
  harga: number;
  durasiBulan: number;
  tanggalMulaiDefault?: string;
  tanggalTutupDefault?: string;
}

interface Stats {
  totalSantriDB: number;
}

interface Pengajar {
  id: string;
  nama: string;
  foto: string | null;
  trackRecord: string[];
}

const Counter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end, duration]);

  return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>;
};

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const domRef = useRef<HTMLDivElement>(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      });
    }, { threshold: 0.1 });

    const current = domRef.current;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pengajars, setPengajars] = useState<Pengajar[]>([]);
  const [activeFlow, setActiveFlow] = useState<"baru" | "lama">("baru");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [targetDufah, setTargetDufah] = useState<any>(null);
  const [categoryModal, setCategoryModal] = useState<{ isOpen: boolean, target: string }>({ isOpen: false, target: '' });

  const navLinks = [
    { href: "#beranda", label: "Beranda" },
    { href: "#alur", label: "Alur" },
    { href: "#program", label: "Program" },
    { href: "#statistik", label: "Statistik" },
    { href: "#lokasi", label: "Lokasi" },
    { href: "/peta", label: "Denah" },
    { href: "#kontak", label: "Kontak" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progRes, statRes, dufahRes, pengajarRes] = await Promise.all([
          fetch("/api/publik/program"),
          fetch("/api/publik/stats"),
          fetch("/api/dufah"),
          fetch("/api/publik/pengajar")
        ]);
        const progData = await progRes.json();
        const statData = await statRes.json();
        setPrograms(progData);
        setStats(statData);
        try { const pengajarData = await pengajarRes.json(); setPengajars(pengajarData); } catch { }

        try {
          const dufahData = await dufahRes.json();
          const now = new Date();
          const target = dufahData.find((df: any) => {
            if (!df.tanggalBuka || !df.tanggalTutup) return false;
            return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
          });
          if (target) {
            target.namaPeriodeLengkap = target.nama;
          }
          setTargetDufah(target || null);
        } catch { }
      } catch (error) {
        console.error("Failed to fetch public data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const flowBaru = [
    { title: "Isi Formulir Online", desc: "Isi data diri, alamat, dan pilihan program di formulir yang telah disediakan." },
    { title: "Pembayaran", desc: "Transfer ke BRI 055501001108569 a.n Markaz Arabiyah beserta kode unik yang tertera." },
    { title: "Verifikasi Pembayaran", desc: "Konfirmasi pembayaran dengan menunjukkan bukti transfer di meja resepsionis." },
    { title: "Penempatan Sakan", desc: "Setelah verifikasi, lanjut ke meja pelayanan asrama untuk penempatan kamar/sakan." },
    { title: "Pengambilan ID Card", desc: "Diarahkan ke meja ID Card untuk mendapatkan akses Digital Card (NIS, Nama, Sakan)." },
    { title: "Pengambilan Atribut", desc: "Ambil Dresscode, Peci/Khimar, Pin, & Totebag. (Malzamah & Kitab Ta'birot menyusul)." },
    { title: "Menuju Sakan", desc: "Pendaftar akan diantarkan dan dibantu dibawakan barangnya sampai ke sakan tujuan." },
  ];

  const flowLama = [
    { title: "Daftar Ulang", desc: "Masuk ke menu daftar ulang dengan mengisi NIS dan verifikasi tanggal lahir." },
    { title: "Pilih Program", desc: "Memilih program yang tersedia dan opsi untuk membeli paket atribut atau tidak." },
    { title: "Pembayaran", desc: "Transfer ke BRI 055501001108569 a.n Markaz Arabiyah beserta kode unik yang tertera." },
    { title: "Verifikasi Pembayaran", desc: "Konfirmasi pembayaran dengan menunjukkan bukti transfer di meja resepsionis." },
    { title: "Verifikasi Sakan", desc: "Lanjut ke meja pelayanan asrama untuk verifikasi sakan yang akan ditempati." },
    { title: "Pengambilan ID Card", desc: "Diarahkan ke meja ID Card untuk akses Digital Card dan penjelasan fungsinya." },
    { title: "Pengambilan Atribut", desc: "Jika membeli paket, ambil Dresscode, Peci, Pin, & Totebag (Malzamah & Kitab menyusul)." },
    { title: "Menuju Sakan", desc: "Pendaftar akan diantarkan dan dibantu dibawakan barangnya sampai ke sakan tujuan." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-luxury-pattern text-gray-200 font-sans flex flex-col relative overflow-hidden selection:bg-gold-500 selection:text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Markaz Arabiyah",
            "image": "https://ppdb.markazarabiyah.site/images/logo.png",
            "@id": "https://ppdb.markazarabiyah.site",
            "url": "https://ppdb.markazarabiyah.site",
            "telephone": "+6281212887788",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Jl. Cemp. No.32, Tegalsari, Tulungrejo, Kec. Pare",
              "addressLocality": "Kabupaten Kediri",
              "addressRegion": "Jawa Timur",
              "postalCode": "64212",
              "addressCountry": "ID"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": -7.7519625,
              "longitude": 112.1801004
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
              ],
              "opens": "08:00",
              "closes": "16:00"
            }
          })
        }}
      />
      {/* Background Decor */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-gold-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="fixed top-0 w-full px-4 py-3 md:px-6 md:py-4 flex justify-between items-center z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gold-500/10 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center group flex-shrink-0">
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-md group-hover:bg-gold-500/40 transition-all"></div>
            <Image src="/images/logo.png" alt="Logo" width={48} height={48} className="relative z-10 object-contain" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold tracking-wider text-gold-500 uppercase leading-tight">
              Markaz <span className="text-white">Arabiyah</span>
            </h1>
            <p className="text-[9px] md:text-[10px] text-gray-400 font-medium tracking-[0.15em] md:tracking-[0.2em] uppercase">Pare Kediri Indonesia</p>
          </div>
        </div>
        <nav className="hidden lg:flex gap-8 text-sm font-semibold text-gray-400">
          {navLinks.map(l => <Link key={l.href} href={l.href} className="hover:text-gold-400 transition-all">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/santri/login" className="hidden md:inline-flex px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 font-bold hover:border-gold-500/50 transition-all text-sm">
            Login
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </header>

      {/* MOBILE SIDEBAR */}
      <div className={`fixed inset-0 z-[200] transition-all duration-300 ${sidebarOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-72 bg-[#0d0d0d] border-l border-white/10 p-6 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-10">
            <span className="text-gold-500 font-bold text-lg">Menu</span>
            <button onClick={() => setSidebarOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks.map(l => <Link key={l.href} href={l.href} onClick={() => setSidebarOpen(false)} className="px-4 py-3 rounded-xl text-gray-300 font-semibold hover:bg-white/5 hover:text-gold-400 transition-all">{l.label}</Link>)}
          </nav>
          <div className="mt-auto flex flex-col gap-3 pt-8 border-t border-white/10">
            <Link href="/santri/login" onClick={() => setSidebarOpen(false)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold text-center hover:border-gold-500/50 transition-all">Login Santri</Link>
            <div onClick={() => { setSidebarOpen(false); setCategoryModal({ isOpen: true, target: '/pendaftaran' }); }} className="cursor-pointer w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-center hover:bg-gold-400 transition-all">Daftar Sekarang</div>
          </div>
        </div>
      </div>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section id="beranda" className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20">


          <FadeIn delay={200}>
            <h2 className="text-3xl sm:text-5xl md:text-8xl font-black mb-6 md:mb-8 tracking-tighter text-white drop-shadow-2xl">
              PPDB <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-600">Markaz</span> Arabiyah
            </h2>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="max-w-3xl text-base sm:text-xl md:text-2xl text-gray-300 mb-4 md:mb-6 leading-relaxed font-bold bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
              Pusat Bahasa Arab & Mediator Studi di Timur Tengah
            </p>
            <p className="max-w-3xl text-sm sm:text-base text-gray-400 mb-8 md:mb-12 leading-relaxed font-medium px-4">
              Markaz Arabiyah adalah lembaga pendidikan bahasa Arab intensif terkemuka di Kampung Inggris Pare, Kediri. Dengan lebih dari 25.000 alumni dan metode akselerasi terbukti, kami menyediakan program kursus bahasa Arab dari nol hingga mahir, fasilitas asrama terpadu, serta bimbingan studi resmi ke Timur Tengah dan Eropa.
            </p>
          </FadeIn>

          <FadeIn delay={600}>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center justify-center w-full max-w-lg mx-auto">
              <div
                onClick={() => setCategoryModal({ isOpen: true, target: '/daftar-ulang' })}
                className="cursor-pointer group w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-gold-500 text-black font-black text-base md:text-xl hover:bg-gold-400 hover:scale-105 transition-all shadow-[0_0_40px_rgba(212,175,55,0.4)] flex items-center justify-center gap-3 active:scale-95"
              >
                Mulai Daftar Ulang
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div
                onClick={() => setCategoryModal({ isOpen: true, target: '/pendaftaran' })}
                className="cursor-pointer w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-white/5 border-2 border-white/10 hover:border-gold-500/50 hover:bg-white/10 text-white font-black text-base md:text-xl transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Link Pendaftaran
              </div>
            </div>

            <div className="mt-6 md:mt-8">
              <Link
                href="https://chat.whatsapp.com/Eei818UmWRh0fq62IwBxh3"
                target="_blank"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#25D366] text-white font-bold hover:brightness-110 hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Join Grup Webinar Beasiswa
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* ALUR PENDAFTARAN */}
        <section id="alur" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h3 className="text-4xl md:text-5xl font-black text-white mb-4">Alur Pendaftaran</h3>
                <div className="w-24 h-1 bg-gold-500 mx-auto mb-8 rounded-full"></div>

                {/* Flow Toggle */}
                <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-8 md:mb-12">
                  <button
                    onClick={() => setActiveFlow("baru")}
                    className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${activeFlow === "baru" ? "bg-gold-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Santri Baru
                  </button>
                  <button
                    onClick={() => setActiveFlow("lama")}
                    className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${activeFlow === "lama" ? "bg-gold-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Santri Pernah Daftar
                  </button>
                </div>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(activeFlow === "baru" ? flowBaru : flowLama).map((step, index) => (
                <FadeIn key={index} delay={index * 100}>
                  <div className="relative group p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-gold-500/30 hover:bg-white/[0.06] transition-all h-full">
                    <div className="absolute -top-4 -left-4 w-10 h-10 rounded-xl bg-gold-500 text-black flex items-center justify-center font-black shadow-lg group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3 mt-2">{step.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h3 className="text-4xl font-black text-white mb-4">Kenapa Memilih Kami?</h3>
                <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FadeIn delay={100}>
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-gold-500/30 transition-all text-center">
                  <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Terpercaya & Legal</h4>
                  <p className="text-sm text-gray-500 font-medium">Lembaga resmi dengan ribuan alumni yang sukses di kancah internasional.</p>
                </div>
              </FadeIn>
              <FadeIn delay={200}>
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-gold-500/30 transition-all text-center">
                  <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Metode Akselerasi</h4>
                  <p className="text-sm text-gray-500 font-medium">Kurikulum intensif yang dirancang untuk penguasaan bahasa dalam waktu singkat.</p>
                </div>
              </FadeIn>
              <FadeIn delay={300}>
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-gold-500/30 transition-all text-center">
                  <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Jaringan Global</h4>
                  <p className="text-sm text-gray-500 font-medium">Akses langsung dan bimbingan menuju universitas ternama di Timur Tengah.</p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ASATIDZAH / PENGAJAR PROFESIONAL */}
        {pengajars.length > 0 && (
          <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <FadeIn>
                <div className="text-center mb-16">
                  <div className="inline-block mb-3 px-4 py-1 rounded-lg bg-gold-500/10 text-gold-400 text-[10px] font-black uppercase tracking-widest border border-gold-500/20">
                    Tenaga Pengajar Profesional
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-white mb-4">Tenaga Penajar <span className="text-gold-500">Profesional</span></h3>
                  <p className="text-gray-400 font-medium max-w-2xl mx-auto">Dibimbing langsung oleh para ustadz berpengalaman dengan rekam jejak akademik dan dakwah di kancah internasional.</p>
                  <div className="w-24 h-1 bg-gold-500 mx-auto mt-8 rounded-full"></div>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="relative group/carousel">
                  {/* Gradient Edges */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none"></div>

                  {/* Scrolling Track */}
                  <div className="overflow-hidden">
                    <div className="flex gap-6 animate-scroll-left group-hover/carousel:[animation-play-state:paused]" style={{ width: 'max-content' }}>
                      {[...pengajars, ...pengajars].map((p, i) => (
                        <div
                          key={`${p.id}-${i}`}
                          className="relative w-[260px] md:w-[300px] shrink-0 rounded-3xl overflow-hidden group/card border border-white/5 hover:border-gold-500/30 transition-all"
                        >
                          {/* Photo Container */}
                          <div className="relative w-full aspect-[3/4] bg-dark-800 overflow-hidden">
                            {p.foto ? (
                              <Image
                                src={p.foto}
                                alt={p.nama}
                                fill
                                className="object-cover object-top group-hover/card:scale-105 transition-transform duration-700"
                                sizes="300px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-dark-900">
                                <svg className="w-24 h-24 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                            {/* Content Over Photo */}
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <h4 className="text-xl font-black text-white mb-2 drop-shadow-lg">{p.nama}</h4>
                              {p.trackRecord.length > 0 && (
                                <ul className="space-y-1.5">
                                  {p.trackRecord.slice(0, 3).map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                                      <span className="text-gold-400 mt-0.5 shrink-0">✦</span>
                                      <span className="line-clamp-1 drop-shadow-lg">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>
        )}

        {/* PILIHAN PROGRAM */}
        <section id="program" className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <FadeIn>
              <div className="text-center mb-16">
                <h3 className="text-4xl md:text-5xl font-black text-white mb-4">Pilihan Program</h3>
                <p className="text-gray-400 font-medium max-w-2xl mx-auto">Tersedia berbagai pilihan program intensif untuk mengakselerasi kemampuan Bahasa Arab Anda.</p>
                <div className="w-24 h-1 bg-gold-500 mx-auto mt-8 rounded-full"></div>
              </div>
            </FadeIn>

            {loading ? (
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[400px] min-w-[300px] md:min-w-0 rounded-3xl bg-white/5 animate-pulse border border-white/10 snap-center"></div>
                ))}
              </div>
            ) : programs.length > 0 ? (
              <>
                {/* Swipe hint for mobile */}
                <div className="flex items-center justify-center gap-2 mb-4 md:hidden">
                  <svg className="w-4 h-4 text-gray-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  <span className="text-xs text-gray-500 font-medium">Geser untuk melihat program lainnya</span>
                  <svg className="w-4 h-4 text-gray-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
                  {programs.map((prog, index) => {
                    // Auto-generate bulan & periode
                    const tgMulai = prog.tanggalMulaiDefault || "10";
                    const tgTutup = prog.tanggalTutupDefault || "06";
                    let displayMulai = tgMulai;
                    let displayTutup = tgTutup;

                    if (targetDufah && targetDufah.tanggalBuka) {
                      if (/^\d+$/.test(tgMulai.trim())) {
                        const d = new Date(targetDufah.tanggalBuka);
                        d.setMonth(d.getMonth() + 1);
                        displayMulai = `${tgMulai.trim()} ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
                      }
                      if (/^\d+$/.test(tgTutup.trim())) {
                        const d = new Date(targetDufah.tanggalBuka);
                        d.setMonth(d.getMonth() + 1 + prog.durasiBulan);
                        displayTutup = `${tgTutup.trim()} ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
                      }
                    }

                    return (
                      <FadeIn key={prog.id} delay={index * 100}>
                        <div className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-gold-500/50 hover:bg-gold-500/[0.02] transition-all overflow-hidden flex flex-col h-full min-w-[300px] md:min-w-0 snap-center">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-3xl group-hover:bg-gold-500/10 transition-all"></div>

                          <div className="flex items-center justify-between mb-6">
                            <span className="px-3 py-1 rounded-lg bg-gold-500/10 text-gold-400 text-[10px] font-black uppercase tracking-widest border border-gold-500/20">
                              {prog.durasiBulan} Bulan
                            </span>
                            {targetDufah && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                                {targetDufah.namaPeriodeLengkap || targetDufah.nama}
                              </span>
                            )}
                          </div>

                          <h4 className="text-2xl font-black text-white mb-4 group-hover:text-gold-400 transition-colors">{prog.nama}</h4>

                          <div className="space-y-3 mb-8 flex-1">
                            <div className="flex items-center gap-3 text-gray-400">
                              <svg className="w-5 h-5 text-gold-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span className="text-sm font-semibold">Mulai: {displayMulai}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                              <svg className="w-5 h-5 text-gold-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="text-sm font-semibold">Tutup: {displayTutup}</span>
                            </div>
                            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                              <div className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Investasi Program</div>
                              <div className="text-3xl font-black text-white">Rp {prog.harga.toLocaleString()}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => setCategoryModal({ isOpen: true, target: '/pendaftaran' })}
                            className="w-full py-4 rounded-2xl bg-gold-500 text-black font-black text-center hover:bg-gold-400 transition-all shadow-lg active:scale-95 cursor-pointer"
                          >
                            Daftar Program
                          </button>
                        </div>
                      </FadeIn>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center p-12 rounded-3xl border border-dashed border-white/20">
                <p className="text-gray-500 font-bold">Belum ada program aktif saat ini.</p>
              </div>
            )}
          </div>
        </section>

        {/* STATISTIK */}
        <section id="statistik" className="py-16 md:py-24 px-4 md:px-6 bg-gold-500/[0.02]">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
              <FadeIn>
                <div className="text-center p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-gold-500/20 transition-all">
                  <div className="text-4xl md:text-5xl font-black text-gold-500 mb-3 md:mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    <Counter end={24869 + (stats?.totalSantriDB || 0)} suffix="+" />
                  </div>
                  <div className="text-lg md:text-xl font-bold text-white mb-2">Total Alumni</div>
                  <p className="text-sm text-gray-500 font-medium">Santri yang telah belajar di Markaz Arabiyah</p>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="text-center p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-gold-500/20 transition-all md:scale-110 shadow-2xl relative z-10 bg-black/40 backdrop-blur-md border-gold-500/30">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold-500 text-black text-[10px] font-black uppercase tracking-[0.2em]">Live Data</div>
                  <div className="text-4xl md:text-5xl font-black text-white mb-3 md:mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <Counter end={stats?.totalSantriDB || 0} />
                  </div>
                  <div className="text-lg md:text-xl font-bold text-gold-400 mb-2">Santri Aktif</div>
                  <p className="text-sm text-gray-500 font-medium">Data real-time santri terdaftar di sistem</p>
                </div>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="text-center p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-gold-500/20 transition-all">
                  <div className="text-5xl font-black text-gold-500 mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    <Counter end={2785} suffix="+" />
                  </div>
                  <div className="text-xl font-bold text-white mb-2">Sukses Studi</div>
                  <p className="text-sm text-gray-500 font-medium">Melanjutkan ke Timur Tengah & Eropa</p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* LOKASI */}
        <section id="lokasi" className="py-16 md:py-24 px-4 md:px-6 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
                <div className="lg:w-1/3 w-full">
                  <div className="inline-block mb-4 px-4 py-1 rounded-lg bg-gold-500/10 text-gold-500 text-[10px] font-black uppercase tracking-widest border border-gold-500/20">Kantor Pusat</div>
                  <h3 className="text-3xl md:text-4xl font-black text-white mb-4 md:mb-6">Lokasi Kami</h3>
                  <div className="p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 mb-6 md:mb-8">
                    <h4 className="text-lg md:text-xl font-bold text-gold-400 mb-2">Kursus Bahasa Arab Markaz Arabiyah</h4>
                    <p className="text-gray-400 leading-relaxed font-medium text-sm">
                      65WM+W7Q, Jl. Cemp. No.32, Tegalsari, Tulungrejo, Kec. Pare, Kabupaten Kediri, Jawa Timur 64212
                    </p>
                  </div>
                  <Link
                    href="https://maps.app.goo.gl/yF7Z6a6yY7zY7zY7z"
                    target="_blank"
                    className="flex items-center gap-3 text-gold-500 font-bold hover:text-gold-400 transition-colors group"
                  >
                    Buka di Google Maps
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </Link>
                </div>
                <div className="lg:w-2/3 w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden border-2 md:border-4 border-white/5 shadow-2xl relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14375.876973449207!2d112.1801004365193!3d-7.75196253909375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e785c4e3e926daf%3A0x3975a8fb3e4c23a8!2sKursus%20Bahasa%20Arab%20Markaz%20Arabiyah!5e0!3m2!1sid!2sid!4v1778524727302!5m2!1sid!2sid"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ / PERTANYAAN POPULER (SEO KEYWORD TARGETS) */}
        <section className="py-24 px-6 bg-white/[0.01] border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <div className="inline-block mb-3 px-4 py-1 rounded-lg bg-gold-500/10 text-gold-400 text-[10px] font-black uppercase tracking-widest border border-gold-500/20">
                  Informasi Populer
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-white mb-4">
                  Pertanyaan Seputar <span className="text-gold-500">Kursus Bahasa Arab</span> di Pare
                </h3>
                <p className="text-gray-400 font-medium max-w-2xl mx-auto text-sm md:text-base">
                  Jawaban cepat untuk pertanyaan yang paling sering diajukan calon santri Markaz Arabiyah Kampung Inggris.
                </p>
                <div className="w-20 h-1 bg-gold-500 mx-auto mt-6 rounded-full"></div>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FadeIn delay={100}>
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-gold-500/30 transition-all h-full flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3 flex items-start gap-3">
                      <span className="text-gold-500 shrink-0">Q:</span>
                      Berapa biaya kursus bahasa Arab di Pare Kampung Inggris?
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium pl-6">
                      Biaya kursus bahasa Arab di Markaz Arabiyah Pare sangat terjangkau, bervariasi mulai dari program intensif bulanan hingga paket eksklusif bimbingan studi ke Timur Tengah. Investasi sudah disesuaikan untuk fasilitas premium dan efisiensi belajar santri.
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-gold-500/30 transition-all h-full flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3 flex items-start gap-3">
                      <span className="text-gold-500 shrink-0">Q:</span>
                      Apakah Markaz Arabiyah Pare menyediakan asrama / sakan?
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium pl-6">
                      Ya, kami menyediakan fasilitas sakan (asrama) terpadu di lingkungan Kampung Inggris Pare Kediri. Lingkungan berbahasa Arab 24 jam didesain khusus agar proses penguasaan bahasa menjadi jauh lebih cepat dan terbiasa dalam percakapan sehari-hari.
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={300}>
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-gold-500/30 transition-all h-full flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3 flex items-start gap-3">
                      <span className="text-gold-500 shrink-0">Q:</span>
                      Bagaimana bimbingan studi ke Timur Tengah (Mesir, Yaman)?
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium pl-6">
                      Sebagai mediator resmi studi Timur Tengah terlengkap, Markaz Arabiyah mendampingi dari tahap bimbingan pemberkasan, pembekalan materi ujian/tahapan seleksi, hingga pemberangkatan resmi menuju universitas tujuan di Mesir maupun negara Timur Tengah dan Eropa.
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-gold-500/30 transition-all h-full flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3 flex items-start gap-3">
                      <span className="text-gold-500 shrink-0">Q:</span>
                      Apakah cocok untuk pemula yang belajar dari nol?
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium pl-6">
                      Tentu saja. Kurikulum metode akselerasi kami dirancang secara sistematis mulai dari dasar (nol) hingga mahir, dibimbing langsung oleh tenaga pengajar profesional dan didukung interaksi intensif bersama penutur asli (native speaker).
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* KONTAK */}
        <section id="kontak" className="py-16 md:py-24 px-4 md:px-6 relative">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-10 md:mb-16">
                <h3 className="text-3xl md:text-5xl font-black text-white mb-4">Butuh Bantuan?</h3>
                <p className="text-gray-400 font-medium">Tim kami siap melayani konsultasi pendaftaran dan informasi studi Anda.</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <FadeIn delay={100}>
                <Link
                  href="https://wa.me/6281212887788?text=Assalamualaikum min,%0ASaya mau menanyakan terkait pendaftaran program offline di markaz arabiyah.%0ASyukron ..."
                  target="_blank"
                  className="group block p-6 md:p-8 rounded-3xl bg-[#25D366]/5 border border-[#25D366]/20 hover:bg-[#25D366]/10 hover:border-[#25D366]/40 transition-all text-center relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#25D366]/10 rounded-full blur-3xl group-hover:bg-[#25D366]/20 transition-all"></div>
                  <div className="w-16 h-16 bg-[#25D366] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Pelayanan Call Center</h4>
                  <p className="text-sm text-gray-500 font-medium mb-4">Tanya Jawab Pendaftaran Offline</p>
                  <span className="text-lg font-black text-[#25D366] group-hover:underline">+62 812-1288-7788</span>
                </Link>
              </FadeIn>

              <FadeIn delay={300}>
                <Link
                  href="https://wa.me/6281212887788?text=Assalamualaikum, Admin"
                  target="_blank"
                  className="group block p-6 md:p-8 rounded-3xl bg-gold-500/5 border border-gold-500/20 hover:bg-gold-500/10 hover:border-gold-500/40 transition-all text-center relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl group-hover:bg-gold-500/20 transition-all"></div>
                  <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Konsultasi Studi</h4>
                  <p className="text-sm text-gray-500 font-medium mb-4">Bimbingan Studi Timur Tengah</p>
                  <span className="text-lg font-black text-gold-500 group-hover:underline">+62 812-1288-7788</span>
                </Link>
              </FadeIn>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL PILIH KATEGORI */}
      <div className={`fixed inset-0 z-[300] transition-all duration-300 ${categoryModal.isOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${categoryModal.isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setCategoryModal({ ...categoryModal, isOpen: false })}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-[#0a0a0a] border border-gold-500/20 rounded-3xl shadow-2xl transition-all duration-300 ${categoryModal.isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-white">Pilih Kategori Program</h3>
            <button onClick={() => setCategoryModal({ ...categoryModal, isOpen: false })} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-4">
            <Link
              href={`${categoryModal.target}?kategori=REGULER`}
              onClick={() => setCategoryModal({ ...categoryModal, isOpen: false })}
              className="block p-5 rounded-2xl border-2 border-white/5 bg-white/[0.02] hover:border-gold-500 hover:bg-gold-500/5 transition-all group"
            >
              <h4 className="text-xl font-bold text-white mb-1 group-hover:text-gold-400">Program Reguler</h4>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">Fokus intensif pembelajaran Bahasa Arab.</p>
            </Link>

            <Link
              href={`${categoryModal.target}?kategori=TUROTS`}
              onClick={() => setCategoryModal({ ...categoryModal, isOpen: false })}
              className="block p-5 rounded-2xl border-2 border-white/5 bg-white/[0.02] hover:border-gold-500 hover:bg-gold-500/5 transition-all group"
            >
              <h4 className="text-xl font-bold text-white mb-1 group-hover:text-gold-400">Program Turats</h4>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">Fokus pembelajaran kutubut turats (Fathul Qorib, Ibnu Aqil, dll).</p>
            </Link>
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#050505] pt-12 md:pt-20 pb-8 md:pb-10 px-4 md:px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-20">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/images/logo.png" alt="Logo" width={36} height={36} className="object-contain" />
                <h4 className="text-xl font-black text-white uppercase tracking-tighter">Markaz Arabiyah</h4>
              </div>
              <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                Lembaga pendidikan Bahasa Arab profesional dengan visi mencetak kader ulama dan intelektual yang ahli di bidang studi Timur Tengah.
              </p>
            </div>

            {/* Social Media Links with Icons */}
            <div>
              <h5 className="text-white font-bold mb-4 md:mb-6 text-sm uppercase tracking-wider">Sosial Media</h5>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li>
                  <Link href="https://instagram.com/ofc_markazarabiyah" target="_blank" className="flex items-center gap-2.5 hover:text-gold-500 transition-colors group">
                    <svg className="w-4 h-4 fill-current flex-shrink-0 text-pink-400 group-hover:text-gold-500 transition-colors" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    Official Markaz Arabiyah
                  </Link>
                </li>
                <li>
                  <Link href="https://www.instagram.com/mediatortimteng" target="_blank" className="flex items-center gap-2.5 hover:text-gold-500 transition-colors group">
                    <svg className="w-4 h-4 fill-current flex-shrink-0 text-pink-400 group-hover:text-gold-500 transition-colors" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    Mediator Timur Tengah
                  </Link>
                </li>
                <li>
                  <Link href="https://www.instagram.com/ofc_markazarabiyahonline" target="_blank" className="flex items-center gap-2.5 hover:text-gold-500 transition-colors group">
                    <svg className="w-4 h-4 fill-current flex-shrink-0 text-pink-400 group-hover:text-gold-500 transition-colors" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    Markaz Online
                  </Link>
                </li>
                <li>
                  <Link href="https://www.tiktok.com/@markazarabiyah" target="_blank" className="flex items-center gap-2.5 hover:text-gold-500 transition-colors group">
                    <svg className="w-4 h-4 fill-current flex-shrink-0 group-hover:text-gold-500 transition-colors" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                    TikTok Markaz Arabiyah
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-white font-bold mb-4 md:mb-6 text-sm uppercase tracking-wider">Pusat Informasi</h5>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><Link href="#alur" className="hover:text-gold-500 transition-colors">Alur Pendaftaran</Link></li>
                <li><Link href="#program" className="hover:text-gold-500 transition-colors">Program Tersedia</Link></li>
                <li><Link href="#lokasi" className="hover:text-gold-500 transition-colors">Lokasi Markaz</Link></li>
                <li><Link href="/santri/login" className="hover:text-gold-500 transition-colors font-bold text-gold-400">Portal Santri Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 md:pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs font-medium text-center md:text-left">
              &copy; {new Date().getFullYear()} Markaz Arabiyah. All rights reserved.
            </p>
            <Link
              href="https://www.instagram.com/aksara.x26?igsh=MXgzZDlyNmtoaHlxdg=="
              target="_blank"
              className="text-gray-600 text-xs font-bold hover:text-gold-500 transition-all flex items-center gap-2 group"
            >
              Develop by <span className="text-gray-400 group-hover:text-gold-400 transition-colors">Aksara x KSU Batch 10</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <Link
        href="https://wa.me/6281212887788"
        target="_blank"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all group"
      >
        <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20"></div>
        <svg className="w-8 h-8 text-white fill-current relative z-10" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
      </Link>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        .bg-luxury-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 L40 0 L80 40 L40 80 Z' fill='none' stroke='%23D4AF37' stroke-width='1' stroke-opacity='0.05'/%3E%3C/svg%3E");
          background-size: 80px 80px;
        }
      `}</style>
    </div>
  );
}
