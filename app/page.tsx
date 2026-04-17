import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-900 bg-luxury-pattern text-gray-200 font-sans flex flex-col relative overflow-hidden">
      {/* Decorative gradient glowing orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-gold-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <header className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-dark-900/80 backdrop-blur-md border-b border-gold-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            M
          </div>
          <h1 className="text-xl font-bold tracking-widest text-gold-500 uppercase">Markaz<span className="text-gray-200">ID</span></h1>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <Link href="#" className="hover:text-gold-400 transition-colors">Beranda</Link>
          <Link href="#" className="hover:text-gold-400 transition-colors">Fasilitas</Link>
          <Link href="#" className="hover:text-gold-400 transition-colors">Tata Tertib</Link>
          <Link href="#" className="hover:text-gold-400 transition-colors">Kontak Admin</Link>
        </nav>
        <div className="flex gap-4">
          <Link
            href="/admin/dashboard"
            className="px-6 py-2.5 rounded-full bg-dark-800 border border-gold-500/30 text-gold-500 font-bold hover:bg-gold-500/10 transition-all text-sm shadow-sm"
          >
            Login Admin
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 pt-32 pb-20">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/5 backdrop-blur-sm">
          <span className="text-xs font-bold text-gold-400 tracking-widest uppercase">Penerimaan Santri Baru Terpadu</span>
        </div>

        <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white drop-shadow-2xl">
          PPDB <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600">Markaz</span> Arabiyah
        </h2>

        <p className="max-w-2xl text-lg text-gray-400 mb-10 leading-relaxed font-medium">
          Daftarkan putra-putri Anda dan pantau penempatan asrama secara real-time melalui portal ini.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/daftar-ulang"
            className="px-8 py-4 rounded-xl bg-gold-500 text-black font-bold text-lg hover:bg-gold-400 hover:scale-105 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
          >
            Mulai Daftar Ulang
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <Link
            href="/pendaftaran"
            className="px-8 py-4 rounded-xl bg-dark-800 border-2 border-dark-800 hover:border-gold-500/50 text-gray-300 font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            Link Pendaftaran
          </Link>
        </div>
      </main>

      <footer className="w-full p-8 text-center border-t border-gold-500/10 bg-dark-900/50 backdrop-blur-md relative z-10">
        <p className="text-gray-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} PPDB Markaz.
        </p>
      </footer>
    </div>
  );
}
