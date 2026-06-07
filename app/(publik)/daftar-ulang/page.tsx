"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { swalSuccess, swalError } from "@/app/lib/swal";
import { generateRegistrationPdf } from "@/app/lib/generateRegistrationPdf";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DaftarUlangPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [targetDufah, setTargetDufah] = useState<any>(null);

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

  // Agreement
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "SANTRI") {
      router.push("/santri/daftar-ulang");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/program").then(res => res.json()).then(data => setPrograms(data.filter((p: any) => p.isActive))).catch(() => { });
    fetch("/api/dufah").then(res => res.json()).then(data => {
      const now = new Date();
      const target = data.find((df: any) => {
        if (!df.tanggalBuka || !df.tanggalTutup) return false;
        return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
      });
      if (target) {
        target.namaPeriodeLengkap = target.nama;
      }
      setTargetDufah(target || null);
    }).catch(() => { });
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
            dufah: data.data.dufah,
            isRenew: true
          });
        } catch (e) {
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
          <p className="text-gray-400 mt-2">Perpanjangan Program Markaz Arabiyah</p>
        </div>

        {/* Card Form */}
        <div className="bg-dark-800/80 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-gold-500/20 shadow-2xl relative">

          {/* STEP 0: PILIH JALUR */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-white border-b border-gold-500/10 pb-3 mb-6">Pilih Jalur Daftar Ulang</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setStep(1.5)}
                  className="cursor-pointer border-2 border-dark-900 bg-dark-900 hover:border-gold-500/50 hover:bg-dark-800 rounded-2xl p-6 transition-all text-center group"
                >
                  <div className="w-16 h-16 bg-gold-500/10 text-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Punya NIS/NIK</h3>
                  <p className="text-sm text-gray-400">Pernah mendaftar via web ini (Duf'ah 89 ke atas).</p>
                </div>

                <Link
                  href="/daftar-ulang/manual"
                  className="cursor-pointer border-2 border-dark-900 bg-dark-900 hover:border-gold-500/50 hover:bg-dark-800 rounded-2xl p-6 transition-all text-center group block"
                >
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Belum Punya NIS</h3>
                  <p className="text-sm text-gray-400">Santri lama sebelum Web dibuat (Sebelum Duf'ah 89).</p>
                </Link>
              </div>
            </div>
          )}

          {/* STEP 1.5: PENCARIAN (Punya NIS) */}
          {step === 1.5 && (
            <div className="animate-fadeIn">
              <button onClick={() => setStep(1)} className="text-gold-500 font-bold mb-4 flex items-center gap-2 hover:text-gold-400 transition">
                <span>&larr;</span> Kembali
              </button>
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

              <h2 className="text-xl font-bold text-white border-b border-gold-500/10 pb-3 mt-6">
                {santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id
                  ? "Klaim Kuota Paket Anda"
                  : "Pilih Program Perpanjangan"}
              </h2>

              {santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id && (
                <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 mb-4 rounded-r-xl">
                  <p className="text-emerald-400 font-bold text-sm">Anda masih memiliki sisa paket aktif (S/d Duf'ah {santriData.batasAktifDufah}). Silakan pilih program yang akan Anda ambil di Periode {targetDufah.namaPeriodeLengkap || targetDufah.nama}.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs
                  .filter(p => {
                    const isKlaim = santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id;
                    if (isKlaim) {
                      const sisaKuota = santriData.batasAktifDufah - targetDufah.id + 1;
                      return p.durasiBulan <= 2 && p.durasiBulan <= sisaKuota;
                    }
                    return true;
                  })
                  .map(p => {
                    const tgMulai = p.tanggalMulaiDefault || "10";
                    const tgTutup = p.tanggalTutupDefault || "06";

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
                        d.setMonth(d.getMonth() + 1 + p.durasiBulan);
                        displayTutup = `${tgTutup.trim()} ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
                      }
                    }

                    const isKlaim = santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id;
                    const hargaTampil = isKlaim ? 0 : (isBeliAtribut ? p.harga : p.harga - 100000);

                    return (
                      <div
                        key={p.id}
                        onClick={() => setProgramId(p.id)}
                        className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 flex flex-col ${programId === p.id ? 'border-gold-500 bg-gold-500/5 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-dark-900 bg-dark-900 hover:border-gold-500/30'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-extrabold text-lg text-white">{p.nama}</h3>
                          <span className="bg-dark-800 text-gold-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{p.durasiBulan} Bulan</span>
                        </div>
                        <div className="mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${targetDufah ? 'bg-dark-800 text-gray-400' : 'bg-red-900/50 text-red-400'}`}>
                            {targetDufah ? `Periode ${targetDufah.namaPeriodeLengkap || targetDufah.nama}` : "Pendaftaran Sedang Ditutup"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 flex-grow">Tgl Program: <strong className="text-gray-300">{displayMulai} - {displayTutup}</strong></p>

                        <div className="mt-4 pt-4 border-t border-dark-800">
                          {isKlaim ? (
                            <p className={`text-sm font-bold inline-block px-3 py-1.5 rounded-lg border transition-colors ${programId === p.id ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-dark-800 text-gray-400 border-dark-700'}`}>✓ Pilih program ini</p>
                          ) : (
                            <p className="text-2xl font-black text-gold-500">Rp {new Intl.NumberFormat('id-ID').format(hargaTampil)}</p>
                          )}

                          {!isBeliAtribut && !isKlaim && (
                            <p className="text-xs text-green-500 font-bold mt-1">Diskon Atribut Santri Lama (-100k)</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* Spacer agar konten tidak tertutup floating bar */}
              {programId && <div className="h-72"></div>}
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

        {/* FLOATING BOTTOM BAR - Di luar card */}
        {step === 2 && santriData && programId && (
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
            <div className="max-w-3xl mx-auto px-4 pb-4">
              <div className="bg-dark-800 border border-gold-500/30 rounded-2xl shadow-[0_-5px_30px_rgba(0,0,0,0.5)] p-4 space-y-3">
                {(() => {
                  const selected = programs.find(p => p.id === programId);
                  const isKlaim = santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id;
                  const hargaTampil = isKlaim ? 0 : (isBeliAtribut ? (selected?.harga || 0) : (selected?.harga || 0) - 100000);
                  return selected ? (
                    <div className="flex justify-between items-center bg-dark-900 rounded-xl px-4 py-2.5 border border-gold-500/10">
                      <div>
                        <p className="text-xs text-gray-400">Program Terpilih</p>
                        <p className="font-bold text-white text-sm">{selected.nama} ({selected.durasiBulan} Bulan)</p>
                      </div>
                      <p className="text-gold-500 font-black text-lg">
                        {isKlaim ? <span className="text-emerald-400">GRATIS</span> : `Rp ${new Intl.NumberFormat('id-ID').format(hargaTampil)}`}
                      </p>
                    </div>
                  ) : null;
                })()}
                {(!santriData.batasAktifDufah || !targetDufah || santriData.batasAktifDufah < targetDufah.id) && (
                  <div className="flex items-start gap-3 px-1">
                    <input type="checkbox" id="beliAtributFloat" checked={isBeliAtribut} onChange={(e) => setIsBeliAtribut(e.target.checked)} className="mt-0.5 w-5 h-5 accent-gold-500 cursor-pointer shrink-0" />
                    <label htmlFor="beliAtributFloat" className="cursor-pointer text-xs text-gray-400 leading-relaxed"><span className="font-bold text-gray-200">Beli Atribut Baru</span> (+Rp 100.000)</label>
                  </div>
                )}
                <div className="flex items-start gap-3 px-1">
                  <input type="checkbox" id="agreement" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="mt-0.5 w-5 h-5 accent-gold-500 cursor-pointer shrink-0" />
                  <label htmlFor="agreement" className="cursor-pointer text-xs text-gray-400 leading-relaxed"><span className="font-bold text-gray-200">Saya setuju</span> untuk tidak merefund atau mengalihkan pembayaran.</label>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(1)} className="px-4 py-3 text-gray-400 hover:text-white transition text-sm font-bold rounded-xl border border-gray-700">← Kembali</button>
                  <button onClick={handleRenew} disabled={loading || !isAgreed} className="flex-1 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-extrabold py-3 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95 disabled:opacity-50 text-sm">
                    {loading ? "Memproses..." : "Selesaikan Perpanjangan →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}