"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function SantriLoginPage() {
  const [nis, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username: nis.trim(),
        password: password.trim(),
        loginType: "SANTRI",
        redirect: false,
      });

      if (result?.error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Login",
          text: result.error,
          background: "#1f2937", // dark-800
          color: "#fff",
          confirmButtonColor: "#D4AF37", // gold-500
        });
      } else {
        window.location.href = "/santri/dashboard";
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-dark-900 border border-gold-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.05)] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)] text-gold-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Portal <span className="text-gold-500">Santri</span></h1>
          <p className="text-gray-400 text-sm font-medium">Masuk untuk melihat data diri dan penempatan asrama.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-300">Nomor Induk Santri (NIS)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/70">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input 
                type="text" 
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="Contoh: 12345678" 
                required
                className="w-full bg-dark-950 border border-dark-800 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all font-medium placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-gray-300">Password</label>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/70">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan NIS sebagai password" 
                required
                className="w-full bg-dark-950 border border-dark-800 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all font-medium placeholder:text-gray-600"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
            ) : (
              "Masuk ke Portal"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-dark-800 text-center">
          <Link href="/" className="text-gray-500 hover:text-gold-500 text-sm font-medium transition-colors flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
