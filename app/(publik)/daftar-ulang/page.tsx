"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { swalSuccess, swalError } from "@/app/lib/swal";
import { generateRegistrationPdf } from "@/app/lib/generateRegistrationPdf";

export default function DaftarUlangPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);

  // Form Pencarian
  const [identifier, setIdentifier] = useState("");
  const [dob, setDob] = useState("");

  // Data Hasil Pencarian
  const [santriData, setSantriData] = useState<any>(null);
  
  // Pilihan
  const [programId, setProgramId] = useState("");
  const [isBeliAtribut, setIsBeliAtribut] = useState(false);

  // Hasil Akhir
  const [invoice, setInvoice] = useState<any>(null);

  // Captcha
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const refreshCaptcha = () => {
    setCaptchaA(Math.floor(Math.random() * 10) + 1);
    setCaptchaB(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer("");
  };

  useEffect(() => {
    refreshCaptcha();
    fetch("/api/program").then(res => res.json()).then(data => setPrograms(data.filter((p: any) => p.isActive))).catch(() => {});
  }, []);

  const handleCariData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !dob) return swalError("Gagal", "Lengkapi NIK/NIS dan Tanggal Lahir");
    if (dob.length !== 10) return swalError("Format Salah", "Format tanggal lahir harus DD/MM/YYYY lengkap.");

    const dateParts = dob.split("/");
    if (dateParts.length !== 3) return swalError("Format Salah", "Format tanggal lahir harus DD/MM/YYYY lengkap.");
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    if (day < 1 || day > 31) return swalError("Tidak Valid", "Tanggal lahir maksimal 31.");
    if (month < 1 || month > 12) return swalError("Tidak Valid", "Bulan lahir maksimal 12.");
    if (year < 1900 || year > new Date().getFullYear()) return swalError("Tidak Valid", "Tahun lahir tidak valid.");

    setLoading(true);
    try {
      const formattedDob = dob.split('/').reverse().join('-');
      const res = await fetch(`/api/pendaftaran/cek?identifier=${identifier}&dob=${formattedDob}`);
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setSantriData(data.data);
        setStep(2);
      } else {
        swalError("Gagal", data.error || "Data tidak ditemukan");
      }
    } catch (e) {
      setLoading(false);
      swalError("Error", "Gagal menghubungi server");
    }
  };

  const handleRenew = async () => {
    if (!programId) return swalError("Pilih Program", "Anda harus memilih program untuk melanjutkan.");

    // Validasi Captcha
    if (parseInt(captchaAnswer, 10) !== captchaA + captchaB) {
      refreshCaptcha();
      return swalError("Verifikasi Gagal", "Jawaban matematika salah.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pendaftaran/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santriId: santriData.id, programId, isBeliAtribut })
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setInvoice(data.data.transaksi);
        setStep(3);
        try {
          generateRegistrationPdf({
            santri: santriData,
            transaksi: data.data.transaksi,
            program: data.data.program,
            isRenew: true
          });
        } catch(e) {
          console.error("Gagal cetak PDF", e);
        }
      } else {
        swalError("Gagal", data.error || "Terjadi kesalahan");
      }
    } catch (e) {
      setLoading(false);
      swalError("Error", "Gagal menghubungi server");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 8) v = v.substring(0, 8);
    if (v.length >= 5) v = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
    else if (v.length >= 3) v = `${v.substring(0, 2)}/${v.substring(2)}`;
    setDob(v);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    swalSuccess("Tersalin!", "Nomor rekening berhasil disalin");
  };

  return (
    <div className="min-h-screen bg-dark-900 bg-luxury-pattern text-gray-200 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Image src="/images/logo.png" alt="Logo Markaz" width={80} height={80} className="mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold-500 mt-4 tracking-wide">Daftar Ulang Santri</h1>
          <p className="text-gray-400 mt-2">Perpanjangan Program Markaz Arabiyyah</p>
        </div>

        {/* Card Form */}
        <div className="bg-dark-800/80 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-gold-500/20 shadow-2xl relative overflow-hidden">
          
          {/* STEP 1: PENCARIAN */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-white border-b border-gold-500/10 pb-3 mb-6">Verifikasi Data Santri</h2>
              <form onSubmit={handleCariData} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">NIK (16 Digit) / NIS Lama *</label>
                  <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-4 outline-none text-white shadow-inner font-mono text-lg" placeholder="Masukkan NIK atau NIS" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Tanggal Lahir *</label>
                  <input type="text" inputMode="numeric" value={dob} onChange={handleDateChange} required className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-4 outline-none text-white shadow-inner text-lg" placeholder="DD/MM/YYYY" />
                  <p className="text-xs text-gray-500 mt-2 italic">*Tanggal lahir digunakan sebagai PIN keamanan data Anda.</p>
                </div>
                <button type="submit" disabled={loading} className="w-full mt-6 bg-gold-500 hover:bg-gold-400 text-black font-extrabold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-95 disabled:opacity-50">
                  {loading ? "Mencari Data..." : "Temukan Data Saya"}
                </button>
              </form>
              <div className="mt-8 text-center border-t border-dark-900 pt-4">
                <Link href="/pendaftaran" className="text-gray-400 hover:text-gold-500 text-sm font-semibold transition underline underline-offset-4">Bukan Santri Lama? Daftar Baru di sini.</Link>
              </div>
            </div>
          )}

          {/* STEP 2: PILIH PROGRAM */}
          {step === 2 && santriData && (
            <div className="animate-fadeIn space-y-6">
              <button onClick={() => setStep(1)} className="text-gold-500 font-bold mb-2 flex items-center gap-2 hover:text-gold-400 transition">
                <span>&larr;</span> Kembali
              </button>
              
              <div className="bg-dark-900 border border-gold-500/30 p-5 rounded-2xl flex items-center gap-4">
                <div className="bg-gold-500/20 text-gold-500 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                  {santriData.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-xl">{santriData.nama}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-400 font-mono bg-dark-800 px-2 py-0.5 rounded border border-gray-700">{santriData.nis || "Belum ada NIS"}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${santriData.isAktif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {santriData.isAktif ? "AKTIF" : "NON-AKTIF"}
                    </span>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white border-b border-gold-500/10 pb-3 mt-6">Pilih Program Perpanjangan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map(p => {
                  const hargaTampil = isBeliAtribut ? p.harga : p.harga - 100000;
                  return (
                  <div 
                    key={p.id} 
                    onClick={() => setProgramId(p.id)}
                    className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 ${programId === p.id ? 'border-gold-500 bg-gold-500/5 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-dark-900 bg-dark-900 hover:border-gold-500/30'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-extrabold text-lg text-white">{p.nama}</h3>
                      <span className="bg-dark-800 text-gold-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{p.durasiBulan} Bulan</span>
                    </div>
                    <p className="text-2xl font-black text-gold-500 mt-4">Rp {new Intl.NumberFormat('id-ID').format(hargaTampil)}</p>
                    {!isBeliAtribut && (
                      <p className="text-xs text-green-500 font-bold mt-1">Diskon Atribut Santri Lama (-100k)</p>
                    )}
                  </div>
                )})}
              </div>

              <div className="mt-6 bg-dark-900 border border-gold-500/30 p-4 rounded-xl flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="beliAtribut" 
                  checked={isBeliAtribut} 
                  onChange={(e) => setIsBeliAtribut(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-gold-500 cursor-pointer"
                />
                <label htmlFor="beliAtribut" className="cursor-pointer text-gray-300">
                  <span className="block font-bold text-white">Beli Atribut Baru (+ Rp 100.000)</span>
                  <span className="text-sm text-gray-400">Centang ini jika Anda ingin membeli ulang perlengkapan (Buku, Seragam, dll) karena rusak atau hilang. Harga akan kembali normal.</span>
                </label>
              </div>

              {/* CAPTCHA SECTION */}
              <div className="mt-8 bg-dark-900 border border-gold-500/20 p-5 rounded-2xl">
                <label className="block text-sm font-bold text-gray-400 mb-2">Verifikasi Keamanan *</label>
                <div className="flex items-center gap-4">
                  <div className="bg-dark-800 text-white font-mono text-xl font-bold py-3 px-6 rounded-xl border border-dark-700">
                    {captchaA} + {captchaB} = ?
                  </div>
                  <input 
                    type="number" 
                    value={captchaAnswer} 
                    onChange={(e) => setCaptchaAnswer(e.target.value)} 
                    placeholder="Jawaban" 
                    className="w-full max-w-[120px] bg-dark-800 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white font-bold text-center"
                  />
                </div>
              </div>

              <button onClick={handleRenew} disabled={loading} className="w-full mt-8 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-extrabold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95 disabled:opacity-50">
                {loading ? "Memproses..." : "Selesaikan Perpanjangan"}
              </button>
            </div>
          )}

          {/* STEP 3: INVOICE / SUCCESS */}
          {step === 3 && invoice && (
            <div className="text-center animate-fadeIn py-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Tagihan Diterbitkan!</h2>
              <p className="text-gray-400 mb-8">Silakan lakukan pembayaran agar masa aktif/langganan Anda segera diperbarui.</p>

              <div className="bg-dark-900 rounded-2xl p-6 border border-gold-500/20 shadow-inner max-w-sm mx-auto text-left relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gold-500/10 rounded-full blur-xl"></div>
                
                <p className="text-gray-400 text-sm font-bold mb-1">Nomor Kwitansi</p>
                <p className="font-mono text-gold-500 mb-4">{invoice.noKwitansi}</p>

                <p className="text-gray-400 text-sm font-bold mb-1">Total Yang Harus Dibayar</p>
                <p className="text-green-400 text-3xl font-black mt-1 mb-4">Rp {new Intl.NumberFormat('id-ID').format(invoice.totalTagihan)}</p>

                <div className="bg-dark-800 p-4 rounded-xl border border-blue-500/20 mt-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Transfer ke Rekening</p>
                  <p className="text-xl font-black text-white font-mono tracking-widest">0555-01-001108-569</p>
                  <p className="text-sm font-bold text-blue-400 mt-1">BANK BRI a.n Markaz Arabiyah</p>
                  <button 
                    onClick={() => copyToClipboard('055501001108569')}
                    className="mt-3 bg-dark-900 hover:bg-black text-gray-300 px-4 py-2 rounded-lg text-sm font-bold border border-gray-700 hover:border-gold-500 transition-colors flex items-center justify-center gap-2 w-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Salin No. Rekening
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-4 italic">
                  *Pastikan transfer tepat hingga 3 digit terakhir (+{invoice.kodeUnik}) agar otomatis terbaca oleh Admin.
                </p>
              </div>

              <div className="mt-10">
                <Link href="/" className="text-gold-500 font-bold hover:text-gold-400 transition underline underline-offset-4">
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}